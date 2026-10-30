import cv2
import numpy as np
from PIL import Image
from typing import Any, Dict, List


# These are screening heuristics, not validated radiology quality thresholds.
MIN_IMAGE_DIMENSION = 64
BLUR_VARIANCE_THRESHOLD = 60.0
DARK_LUMINANCE_THRESHOLD = 35.0
BRIGHT_LUMINANCE_THRESHOLD = 220.0
LOW_CONTRAST_STD_THRESHOLD = 25.0


def check_image_quality(img_pil: Image.Image) -> Dict[str, Any]:
    """Return deterministic pixel and geometry measurements for review."""
    if not isinstance(img_pil, Image.Image) or img_pil.width < 1 or img_pil.height < 1:
        raise ValueError("Image quality assessment requires a valid, non-empty image.")

    width, height = img_pil.size
    img_rgb = np.asarray(img_pil.convert("RGB"))
    img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)

    laplacian = cv2.Laplacian(img_gray, cv2.CV_64F)
    _, laplacian_std = cv2.meanStdDev(laplacian)
    laplacian_var = float(laplacian_std[0, 0] ** 2)
    mean_values, std_values = cv2.meanStdDev(img_gray)
    mean_lum = float(mean_values[0, 0])
    std_lum = float(std_values[0, 0])

    is_sharp = laplacian_var > BLUR_VARIANCE_THRESHOLD
    if mean_lum < DARK_LUMINANCE_THRESHOLD:
        brightness_status = "dark"
        exposure = "Dark intensity"
    elif mean_lum > BRIGHT_LUMINANCE_THRESHOLD:
        brightness_status = "bright"
        exposure = "Bright intensity"
    else:
        brightness_status = "pass"
        exposure = "Intensity range not flagged"

    contrast_status = "low" if std_lum < LOW_CONTRAST_STD_THRESHOLD else "pass"
    if contrast_status == "low":
        exposure = "Low intensity contrast"

    aspect_ratio = float(width / height)
    dimensions_status = "pass" if min(width, height) >= MIN_IMAGE_DIMENSION else "too_small"
    aspect_ratio_status = "review" if aspect_ratio < 0.4 or aspect_ratio > 2.5 else "pass"

    warnings = []
    if not is_sharp:
        warnings.append("Low Laplacian-variance heuristic; visually inspect the image.")
    if brightness_status != "pass":
        warnings.append(f"Brightness heuristic flagged the image as {brightness_status}.")
    if contrast_status == "low":
        warnings.append("Low grayscale intensity contrast heuristic.")
    if dimensions_status != "pass":
        warnings.append(
            f"Image dimensions {width}x{height} are below the minimum "
            f"{MIN_IMAGE_DIMENSION}-pixel screening threshold."
        )
    if aspect_ratio_status == "review":
        warnings.append("Unusual image aspect ratio; visually inspect positioning and cropping.")

    return {
        "rating": "Heuristic flags present" if warnings else "No heuristic flags",
        "isSharp": is_sharp,
        "sharpnessStatus": "pass" if is_sharp else "review",
        "laplacianVariance": round(laplacian_var, 1),
        "meanLuminance": round(mean_lum, 1),
        "brightnessStatus": brightness_status,
        "contrastStd": round(std_lum, 1),
        "contrastStatus": contrast_status,
        "exposureStatus": exposure,
        "width": width,
        "height": height,
        "aspectRatio": round(aspect_ratio, 3),
        "dimensionsStatus": dimensions_status,
        "aspectRatioStatus": aspect_ratio_status,
        "warnings": warnings,
        "method": "basic_pixel_and_geometry_heuristics_not_clinically_validated",
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
