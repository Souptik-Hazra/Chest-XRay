import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List


def check_image_quality(img_pil: Image.Image) -> Dict[str, Any]:
    """Return basic pixel heuristics, not a clinically validated quality assessment."""
    img_gray = np.asarray(img_pil.convert("L"))
    laplacian_var = float(cv2.Laplacian(img_gray, cv2.CV_64F).var())
    is_sharp = laplacian_var > 60.0
    mean_lum = float(np.mean(img_gray))
    std_lum = float(np.std(img_gray))
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
