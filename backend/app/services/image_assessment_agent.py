"""Deterministic wrapper for non-clinical image screening heuristics."""
from typing import Any, Dict

from .quality_ood import check_image_quality


def assess_image(img_pil) -> Dict[str, Any]:
    """Flag heuristic concerns; never infer clinical or anatomical suitability."""
    quality = check_image_quality(img_pil)
    warnings = list(quality["warnings"])
    decision = "REVIEW" if warnings else "ACCEPT"

    return {
        "agent": "image_assessment",
        "status": "completed",
        "decision": decision,
        "decisionScope": "no_configured_pixel_or_geometry_heuristics_flagged"
        if decision == "ACCEPT"
        else "pixel_or_geometry_heuristics_flagged_for_human_review",
        "quality": quality,
        "warnings": warnings,
        "reason": (
            "No configured pixel or geometry heuristics were flagged; this does not "
            "establish that the image is a chest radiograph or diagnostically suitable."
            if decision == "ACCEPT"
            else "One or more pixel or geometry heuristics were flagged; visually review the image."
        ),
        "limitations": (
            "This assessment does not identify chest radiographs, verify lung visibility, "
            "positioning, cropping, projection, or diagnostic suitability. It is not a "
            "clinically validated radiograph quality assessment."
        ),
    }
