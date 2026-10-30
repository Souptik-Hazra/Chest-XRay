import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List


def check_image_quality(img_pil: Image.Image) -> Dict[str, Any]:
    """Return basic pixel heuristics, not a clinically validated quality assessment."""
    if not isinstance(img_pil, Image.Image) or img_pil.width < 1 or img_pil.height < 1:
        raise ValueError("Image quality assessment requires a valid, non-empty image.")

    img_rgb = cv2.cvtColor(np.asarray(img_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
    img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(img_gray, cv2.CV_64F)
    laplacian_mean, laplacian_std = cv2.meanStdDev(laplacian)
    laplacian_var = float(laplacian_std[0, 0] ** 2)
    is_sharp = laplacian_var > 60.0
    mean_values, std_values = cv2.meanStdDev(img_gray)
    mean_lum = float(mean_values[0, 0])
    std_lum = float(std_values[0, 0])
    if mean_lum < 35.0:
        exposure = "Dark intensity"
    elif mean_lum > 220.0:
        exposure = "Bright intensity"
    elif std_lum < 25.0:
        exposure = "Low intensity contrast"
    else:
        exposure = "Intensity range not flagged"
    warnings = []
    if not is_sharp:
        warnings.append("Low Laplacian-variance heuristic; visually inspect the image.")
    if exposure != "Intensity range not flagged":
        warnings.append(f"Image intensity heuristic: {exposure}.")
    return {
        "rating": "Heuristic flags present" if warnings else "No heuristic flags",
        "isSharp": is_sharp,
        "laplacianVariance": round(laplacian_var, 1),
        "meanLuminance": round(mean_lum, 1),
        "exposureStatus": exposure,
        "warnings": warnings,
        "method": "basic_pixel_heuristics_not_clinically_validated",
    }


def compute_uncertainty_metrics(probs: List[float], cross_view_agreement: str) -> Dict[str, Any]:
    """Calculate descriptive softmax entropy/margin; these are not validated OOD metrics."""
    values = np.asarray(probs, dtype=np.float64)
    if values.size == 0 or not np.isfinite(values).all() or np.any(values < 0):
        raise ValueError("Probabilities must be a non-empty finite non-negative list.")
    total = float(values.sum())
    if total <= 0:
        raise ValueError("Probability sum must be positive.")
    values = values / total
    safe = np.clip(values, 1e-12, 1.0)
    entropy = float(-np.sum(safe * np.log(safe)))
    sorted_probs = np.sort(values)[::-1]
    margin = float(sorted_probs[0] - (sorted_probs[1] if len(sorted_probs) > 1 else 0.0))
    flag = bool(entropy > 0.95 or sorted_probs[0] < 0.48 or cross_view_agreement == "Low (Borderline Disagreement)")
    review_needed = bool(flag or entropy > 0.70 or margin < 0.25)
    return {
        "predictionEntropy": round(entropy, 3),
        "confidenceMargin": round(margin, 3),
        "oodDetected": flag,
        "oodStatus": "Heuristic flag raised" if flag else "No heuristic flag",
        "reviewNeeded": review_needed,
        "triageRecommendation": "Manual review suggested by heuristic" if review_needed else "No uncertainty heuristic flag",
        "method": "softmax_uncertainty_heuristic_not_validated_ood_detector",
    }
