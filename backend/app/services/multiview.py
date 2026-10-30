import numpy as np
import base64
from io import BytesIO
from PIL import Image
import cv2
from typing import List, Dict, Any, Tuple
from ..models.densenet import model_service


def generate_multi_views(img_pil: Image.Image) -> List[Tuple[str, str, Image.Image]]:
    """Create deterministic perturbations for sensitivity analysis, not independent models."""
    if not isinstance(img_pil, Image.Image) or img_pil.width < 1 or img_pil.height < 1:
        raise ValueError("Multi-view inference requires a valid, non-empty PIL image.")

    image = cv2.cvtColor(np.asarray(img_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
    height, width = image.shape[:2]
    views = [("original", "Original View", img_pil.copy())]

    resized = cv2.resize(image, (224, 224), interpolation=cv2.INTER_LINEAR)
    resized = cv2.resize(resized, (width, height), interpolation=cv2.INTER_LINEAR)
    views.append(("resized", "Resize Sensitivity", Image.fromarray(cv2.cvtColor(resized, cv2.COLOR_BGR2RGB))))

    gray_mean = cv2.mean(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))[0]
    contrast = cv2.addWeighted(image, 1.35, np.full_like(image, gray_mean), -0.35, 0)
    views.append(("contrast", "Contrast Sensitivity", Image.fromarray(cv2.cvtColor(contrast, cv2.COLOR_BGR2RGB))))

    crop_width = max(1, int(width * 0.88))
    crop_height = max(1, int(height * 0.88))
    cropped = cv2.getRectSubPix(
        image, (crop_width, crop_height), (width / 2.0, height / 2.0)
    )
    cropped = cv2.resize(cropped, (width, height), interpolation=cv2.INTER_LINEAR)
    views.append(("cropped", "Center-Crop Sensitivity", Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB))))

    rotation = cv2.getRotationMatrix2D((width / 2.0, height / 2.0), 3, 1.0)
    augmented = cv2.warpAffine(
        image, rotation, (width, height), flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0)
    )
    augmented = cv2.convertScaleAbs(augmented, alpha=1.05, beta=0)
    views.append(("augmented", "Mild Rotation/Brightness Sensitivity", Image.fromarray(cv2.cvtColor(augmented, cv2.COLOR_BGR2RGB))))

    return views


def summarize_view_agreement(
    predicted_classes: List[str], display_classes: List[str]
) -> Dict[str, Any]:
    """Summarize class-vote consistency across transformed views, not model correctness."""
    if not display_classes or len(set(display_classes)) != len(display_classes):
        raise ValueError("Display classes must be non-empty and unique.")
    if not predicted_classes:
        raise ValueError("At least one view prediction is required.")
    unknown = set(predicted_classes) - set(display_classes)
    if unknown:
        raise ValueError(f"View predictions contain unknown classes: {sorted(unknown)}")

    counts = {
        label: sum(prediction == label for prediction in predicted_classes)
        for label in display_classes
    }
    agreement_fraction = max(counts.values()) / len(predicted_classes)
    if agreement_fraction >= 0.8:
        agreement = "High"
    elif agreement_fraction >= 0.6:
        agreement = "Moderate"
    else:
        agreement = "Low (Borderline Disagreement)"

    return {
        "crossViewAgreement": agreement,
        "classVoteAgreement": round(agreement_fraction, 4),
        "classVoteCounts": counts,
    }


def _validate_probabilities(probabilities: Any, class_count: int) -> np.ndarray:
    """Validate one classifier probability vector before aggregation."""
    values = np.asarray(probabilities, dtype=np.float64)
    if values.shape != (class_count,):
        raise ValueError(
            f"Model returned probability shape {values.shape}; expected ({class_count},)."
        )
    if not np.isfinite(values).all() or np.any(values < 0.0) or np.any(values > 1.0):
        raise ValueError("Model returned non-finite or out-of-range probabilities.")
    if not np.isclose(float(values.sum()), 1.0, atol=1e-3):
        raise ValueError("Model probabilities must sum to 1.")
    return values


def run_multiview_inference(img_pil: Image.Image, cancel_event=None) -> Dict[str, Any]:
    """Run one classifier on deterministic input perturbations and report sensitivity."""
    views = generate_multi_views(img_pil)
    display_classes = list(model_service.display_classes)
    if not display_classes or len(set(display_classes)) != len(display_classes):
        raise ValueError("Model display classes must be non-empty and unique.")

    view_results = []
    all_probs = []

    for view_id, view_name, view_image in views:
        if cancel_event is not None and cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        tensor = model_service.preprocess_transform(view_image).unsqueeze(0)
        pred_idx, raw_probs = model_service.predict(tensor)
        if cancel_event is not None and cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        probabilities = _validate_probabilities(raw_probs, len(display_classes))
        if not isinstance(pred_idx, (int, np.integer)) or not 0 <= int(pred_idx) < len(display_classes):
            raise ValueError("Model returned an invalid predicted class index.")

        probability_class_idx = int(np.argmax(probabilities))
        if int(pred_idx) != probability_class_idx:
            raise ValueError("Predicted class index does not match the maximum probability.")

        all_probs.append(probabilities)
        predicted_class = display_classes[int(pred_idx)]

        preview_buffer = BytesIO()
        view_image.convert("RGB").save(
            preview_buffer, format="JPEG", quality=72, optimize=True
        )
        preview_url = "data:image/jpeg;base64," + base64.b64encode(
            preview_buffer.getvalue()
        ).decode("ascii")

        view_results.append({
            "id": view_id,
            "previewUrl": preview_url,
            "name": view_name,
            "predictedClass": predicted_class,
            "confidence": float(probabilities[int(pred_idx)]),
            "probabilities": {
                display_classes[i]: float(probabilities[i])
                for i in range(len(display_classes))
            },
        })

    probs_matrix = np.stack(all_probs, axis=0)
    mean_probs = np.mean(probs_matrix, axis=0)
    consensus_idx = int(np.argmax(mean_probs))
    vote_summary = summarize_view_agreement(
        [view["predictedClass"] for view in view_results], display_classes
    )

    return {
        "views": view_results,
        "consensusClass": display_classes[consensus_idx],
        "consensusConfidence": float(mean_probs[consensus_idx]),
        "consensusProbabilities": {
            display_classes[i]: float(mean_probs[i])
            for i in range(len(display_classes))
        },
        **vote_summary,
        "analysisMethod": "single_model_transformed_input_sensitivity",
        "independentModels": 1,
        "viewCount": len(view_results),
    }
