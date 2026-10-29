import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List

def check_image_quality(img_pil: Image.Image) -> Dict[str, Any]:
    """
    Computes objective radiograph quality metrics:
    - Laplacian variance for sharpness/blur detection
    - Mean and standard deviation of luminance for exposure check
    - Dynamic range and clipping
    """
    img_gray = np.array(img_pil.convert("L"))
    
    # 1. Blur check via Laplacian variance
    laplacian_var = float(cv2.Laplacian(img_gray, cv2.CV_64F).var())
    is_sharp = laplacian_var > 60.0
    
    # 2. Exposure check via mean luminance
    mean_lum = float(np.mean(img_gray))
    std_lum = float(np.std(img_gray))
    
    if mean_lum < 35.0:
        exposure = "Under-exposed (Dark)"
    elif mean_lum > 220.0:
        exposure = "Over-exposed (Washed out)"
    elif std_lum < 25.0:
        exposure = "Low Contrast"
    else:
        exposure = "Adequate Contrast"

    quality_rating = "Good" if (is_sharp and exposure == "Adequate Contrast") else "Suboptimal"

    return {
        "rating": quality_rating,
        "isSharp": is_sharp,
        "laplacianVariance": round(laplacian_var, 1),
        "meanLuminance": round(mean_lum, 1),
        "exposureStatus": exposure,
        "warnings": [] if quality_rating == "Good" else [f"Radiograph quality: {exposure}, blur score: {round(laplacian_var, 1)}"]
    }

def compute_uncertainty_metrics(probs: List[float], cross_view_agreement: str) -> Dict[str, Any]:
    """
    Computes rigorous uncertainty and calibration diagnostics:
    - Shannon entropy across the 3 classes: H(p) = -sum(p * ln(p))
    - Margin of confidence: top-1 prob minus runner-up prob
    - OOD novelty flag based on high predictive entropy and low top confidence
    """
    probs_np = np.array(probs, dtype=np.float64)
    # Clip for numerical stability
    probs_safe = np.clip(probs_np, 1e-12, 1.0)
    
    # Shannon entropy
    entropy = float(-np.sum(probs_safe * np.log(probs_safe)))
    
    # Confidence margin
    sorted_probs = np.sort(probs_np)[::-1]
    top1 = float(sorted_probs[0])
    top2 = float(sorted_probs[1]) if len(sorted_probs) > 1 else 0.0
    margin = float(top1 - top2)

    # Out-of-Distribution (OOD) heuristic:
    # High entropy (> 0.95 nats for 3 classes) and low top confidence (< 0.50) indicates non-conforming input
    ood_detected = bool(entropy > 0.95 or top1 < 0.48 or cross_view_agreement == "Low (Borderline Disagreement)")

    # Clinical radiologist review triage recommendation
    review_needed = bool(ood_detected or entropy > 0.70 or margin < 0.25)

    return {
        "predictionEntropy": round(entropy, 3),
        "confidenceMargin": round(margin, 3),
        "oodDetected": ood_detected,
        "oodStatus": "Atypical / Out-Of-Distribution" if ood_detected else "Clean (In-Distribution)",
        "reviewNeeded": review_needed,
        "triageRecommendation": "Priority Review" if review_needed else "Standard Routine"
    }
