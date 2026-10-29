"""Optional pneumonia-opacity segmentation using a pinned pretrained model.

The model is separate from the project's DenseNet121 classifier. Its masks are
approximate research outputs trained from converted bounding-box annotations.
"""
import base64
from io import BytesIO
import logging
from typing import Any

import numpy as np
from PIL import Image, ImageOps

from ..core.config import settings

logger = logging.getLogger(__name__)


def build_segmentation_artifacts(
    image: Image.Image,
    mask_probabilities: np.ndarray,
    threshold: float = 0.5,
) -> dict[str, Any]:
    """Convert a probability map into a binary mask and a red overlay."""
    probabilities = np.asarray(mask_probabilities, dtype=np.float32).squeeze()
    if probabilities.ndim != 2 or not np.isfinite(probabilities).all():
        raise ValueError("Segmentation model returned an invalid probability map.")

    binary = probabilities >= threshold
    area_percent = float(binary.mean() * 100.0)
    width, height = image.size
    mask_image = Image.fromarray((binary.astype(np.uint8) * 255), mode="L")
    mask_image = mask_image.resize((width, height), Image.Resampling.NEAREST)

    # Bound response image size while preserving the original image's aspect ratio.
    preview = image.convert("RGB").copy()
    preview.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    mask_preview = mask_image.resize(preview.size, Image.Resampling.NEAREST)
    mask_array = np.asarray(mask_preview) > 0
    original_array = np.asarray(preview).copy()
    overlay_array = original_array.copy()
    red = np.array([255, 48, 48], dtype=np.uint8)
    overlay_array[mask_array] = (
        original_array[mask_array].astype(np.float32) * 0.45
        + red.astype(np.float32) * 0.55
    ).astype(np.uint8)

    def data_url(output: Image.Image) -> str:
        buffer = BytesIO()
        output.save(buffer, format="PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")

    positive_probabilities = probabilities[binary]
    mean_mask_score = float(positive_probabilities.mean()) if positive_probabilities.size else 0.0
    return {
        "status": "completed" if binary.any() else "no_region_detected",
        "target": "Pneumonia-related lung opacity",
        "maskUrl": data_url(mask_preview),
        "overlayUrl": data_url(Image.fromarray(overlay_array)),
        "areaPercent": round(area_percent, 3),
        "meanMaskScore": round(mean_mask_score, 4),
        "threshold": threshold,
        "imageWidth": width,
        "imageHeight": height,
        "modelId": settings.SEGMENTATION_MODEL_ID,
        "limitations": (
            "Approximate binary opacity mask from a separate pretrained model. "
            "Not a verified lesion contour, lung-area ratio, or clinical finding."
        ),
    }


class LesionSegmentationService:
    def __init__(self):
        self.model = None
        self.device = None
        self.is_loaded = False
        self.load_error: str | None = None

    def load(self) -> None:
        if not settings.SEGMENTATION_ENABLED:
            return
        if self.is_loaded and self.model is not None:
            return
        try:
            import torch
            from transformers import AutoModel

            self.device = torch.device(
                settings.DEVICE
                if torch.cuda.is_available() and settings.DEVICE != "cpu"
                else "cpu"
            )
            # The model's custom code is pinned to a reviewed repository revision.
            self.model = AutoModel.from_pretrained(
                settings.SEGMENTATION_MODEL_ID,
                revision=settings.SEGMENTATION_MODEL_REVISION,
                trust_remote_code=True,
                use_safetensors=True,
            )
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            self.load_error = None
            logger.info("Loaded optional opacity segmentation model %s", settings.SEGMENTATION_MODEL_ID)
        except Exception as exc:
            self.model = None
            self.is_loaded = False
            self.load_error = type(exc).__name__
            logger.exception("Optional opacity segmentation model failed to load")

    def segment(self, image: Image.Image) -> dict[str, Any]:
        if not settings.SEGMENTATION_ENABLED:
            return {"status": "disabled", "message": "Set SEGMENTATION_ENABLED=true to enable opacity segmentation."}
        if not self.is_loaded or self.model is None:
            return {"status": "unavailable", "message": "The optional segmentation model is not available."}

        try:
            import torch

            size = getattr(self.model.config, "img_size", (512, 512))
            height, width = int(size[0]), int(size[1])
            grayscale = ImageOps.grayscale(image).resize(
                (width, height), Image.Resampling.BILINEAR
            )
            pixels = np.asarray(grayscale, dtype=np.float32)
            tensor = torch.from_numpy(pixels).unsqueeze(0).unsqueeze(0).to(self.device)
            with torch.inference_mode():
                output = self.model(tensor)
            mask = output.get("mask") if isinstance(output, dict) else None
            if mask is None or mask.ndim != 4 or mask.shape[0] != 1:
                raise ValueError("Segmentation model returned an unexpected mask shape.")
            probabilities = mask[0, 0].detach().float().cpu().numpy()
            return build_segmentation_artifacts(image, probabilities)
        except Exception:
            logger.exception("Opacity segmentation inference failed")
            return {"status": "unavailable", "message": "Segmentation inference failed; see backend logs."}


lesion_segmentation_service = LesionSegmentationService()
