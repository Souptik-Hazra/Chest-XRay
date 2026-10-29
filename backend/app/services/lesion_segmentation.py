"""Optional pneumonia-opacity segmentation using a pinned pretrained model.

The separate model predicts approximate opacity masks from annotations converted
from bounding boxes. These outputs are research visualizations, not clinical
lesion contours or precise measurements.
"""
import base64
import logging
import threading
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image, ImageOps

from ..core.config import settings

logger = logging.getLogger(__name__)
PREVIEW_MAX_SIZE = (1024, 1024)


def build_segmentation_artifacts(
    image: Image.Image,
    mask_probabilities: np.ndarray,
    threshold: float = 0.5,
) -> dict[str, Any]:
    if not np.isfinite(threshold) or not 0.0 <= threshold <= 1.0:
        raise ValueError("Segmentation threshold must be between 0 and 1.")

    probabilities = np.asarray(mask_probabilities, dtype=np.float32).squeeze()
    if probabilities.ndim != 2 or probabilities.size == 0 or not np.isfinite(probabilities).all():
        raise ValueError("Segmentation model returned an invalid probability map.")
    if probabilities.min() < 0 or probabilities.max() > 1:
        raise ValueError("Segmentation model output must be probabilities in [0, 1].")
    if image.width < 1 or image.height < 1:
        raise ValueError("Input image must have non-zero dimensions.")

    binary = probabilities >= threshold
    area_percent = float(binary.mean() * 100.0)
    # Fixed-threshold coverage exposes masks that are highly threshold-sensitive.
    threshold_area_percent = {
        str(value): round(float((probabilities >= value).mean() * 100.0), 3)
        for value in (0.3, 0.5, 0.7)
    }

    # Bound memory by resizing the model mask directly to the bounded display image.
    preview = image.convert("RGB").copy()
    preview.thumbnail(PREVIEW_MAX_SIZE, Image.Resampling.LANCZOS)
    mask_preview = Image.fromarray(binary.astype(np.uint8) * 255, mode="L")
    mask_preview = mask_preview.resize(preview.size, Image.Resampling.NEAREST)

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

    selected = probabilities[binary]
    return {
        "status": "completed" if binary.any() else "no_region_detected",
        "target": "Pneumonia-related lung opacity",
        "maskUrl": data_url(mask_preview),
        "overlayUrl": data_url(Image.fromarray(overlay_array)),
        "areaPercent": round(area_percent, 3),
        "thresholdAreaPercent": threshold_area_percent,
        "meanMaskScore": round(float(selected.mean()) if selected.size else 0.0, 4),
        "threshold": float(threshold),
        "imageWidth": image.width,
        "imageHeight": image.height,
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
        self._inference_lock = threading.Lock()

    def load(self) -> None:
        if not settings.SEGMENTATION_ENABLED or self.is_loaded:
            return
        try:
            import torch
            from transformers import AutoModel

            self.device = torch.device(
                settings.DEVICE
                if torch.cuda.is_available() and settings.DEVICE != "cpu"
                else "cpu"
            )
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
            logger.info(
                "Loaded optional opacity segmentation model %s at revision %s",
                settings.SEGMENTATION_MODEL_ID,
                settings.SEGMENTATION_MODEL_REVISION,
            )
        except Exception as exc:
            self.model = None
            self.is_loaded = False
            self.load_error = type(exc).__name__
            logger.exception("Optional opacity segmentation model failed to load")

    def segment(self, image: Image.Image) -> dict[str, Any]:
        if not settings.SEGMENTATION_ENABLED:
            return {
                "status": "disabled",
                "message": "Set SEGMENTATION_ENABLED=true to enable opacity segmentation.",
            }
        if not self.is_loaded or self.model is None:
            return {
                "status": "unavailable",
                "message": "The optional segmentation model is not available.",
            }

        try:
            import torch

            image_size = getattr(self.model.config, "img_size", None)
            if not isinstance(image_size, (tuple, list)) or len(image_size) != 2:
                raise ValueError("Segmentation model has an invalid configured input size.")
            height, width = (int(value) for value in image_size)
            if height < 1 or width < 1 or height * width > 4_194_304:
                raise ValueError("Segmentation model input size is outside supported limits.")

            grayscale = ImageOps.grayscale(image).resize(
                (width, height), Image.Resampling.BILINEAR
            )
            pixels = np.asarray(grayscale, dtype=np.float32)
            tensor = torch.from_numpy(pixels).unsqueeze(0).unsqueeze(0).to(self.device)
            # Serialize inference to limit peak memory and avoid concurrent model calls.
            with self._inference_lock, torch.inference_mode():
                output = self.model(tensor)
            mask = output.get("mask") if isinstance(output, dict) else None
            if (
                mask is None
                or not hasattr(mask, "ndim")
                or mask.ndim != 4
                or mask.shape[0] != 1
                or mask.shape[1] != 1
            ):
                raise ValueError("Segmentation model returned an unexpected mask shape.")
            probabilities = mask[0, 0].detach().float().cpu().numpy()
            return build_segmentation_artifacts(image, probabilities)
        except Exception:
            logger.exception("Opacity segmentation inference failed")
            return {
                "status": "unavailable",
                "message": "Segmentation inference failed; see backend logs.",
            }


lesion_segmentation_service = LesionSegmentationService()
