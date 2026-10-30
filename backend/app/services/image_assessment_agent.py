"""Deterministic orchestration wrapper for existing image-quality heuristics."""
from typing import Any, Dict

from .quality_ood import check_image_quality


def assess_image(img_pil) -> Dict[str, Any]:
    """Assess technical image suitability without making a diagnostic claim."""
    quality = check_image_quality(img_pil)
    warnings = list(quality["warnings"])

    if quality["dimensionsStatus"] == "too_small":
        decision = "REJECT"
        reason = "Image dimensions are too small for reliable downstream processing."
    elif warnings:
        decision = "REVIEW"
        reason = "One or more image-quality heuristics require visual review."
    else:
        decision = "ACCEPT"
        reason = "No configured image-quality heuristics were flagged."

    return {
        "agent": "image_assessment",
        "status": "completed",
        "decision": decision,
        "quality": quality,
        "warnings": warnings,
        "reason": reason,
        "limitations": (
            "Pixel and geometry heuristics only; this is not a clinically validated "
            "radiograph quality, positioning, or diagnostic assessment."
        ),
    }
