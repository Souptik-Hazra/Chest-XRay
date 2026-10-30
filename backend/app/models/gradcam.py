import torch
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Tuple, Optional


class GradCAM:
    def __init__(self, model, target_layer=None):
        self.model = model
        self.model.eval()

        if target_layer is None:
            # denseblock4 is the final dense block in DenseNet121 features
            self.target_layer = self.model.features.denseblock4
        else:
            self.target_layer = target_layer

        self.gradients = None
        self.activations = None
        self.hooks = []

        # Register forward and backward hooks
        h1 = self.target_layer.register_forward_hook(self._save_activation)
        h2 = self.target_layer.register_full_backward_hook(self._save_gradient)
        self.hooks.extend([h1, h2])

    def _save_activation(self, module, input, output):
        self.activations = output

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(self, input_tensor: torch.Tensor, target_class: Optional[int] = None) -> Tuple[np.ndarray, int, np.ndarray]:
        """
        Generates Grad-CAM heatmap for the specified target class (or top predicted class).
        """
        self.gradients = None
        self.activations = None
        self.model.zero_grad()
        output = self.model(input_tensor)
        if output.ndim != 2 or output.shape[0] != 1 or output.shape[1] < 1:
            raise ValueError("Grad-CAM expects model logits with shape [1, num_classes].")

        if target_class is None:
            target_class = int(torch.argmax(output, dim=1).item())
        if not isinstance(target_class, int) or target_class < 0 or target_class >= output.shape[1]:
            raise ValueError("Grad-CAM target class is outside the model output range.")

        score = output[0, target_class]
        score.backward()
        probs = F.softmax(output, dim=1)[0].detach().cpu().numpy()

        if self.gradients is None or self.activations is None:
            return np.zeros((7, 7), dtype=np.float32), target_class, probs

        gradients = self.gradients[0].detach().cpu().numpy()
        activations = self.activations[0].detach().cpu().numpy()
        weights = np.mean(gradients, axis=(1, 2))
        cam = np.sum(activations * weights[:, None, None], axis=0)
        cam = np.maximum(cam, 0)

        max_val = float(np.max(cam)) if cam.size else 0.0
        if not np.isfinite(cam).all() or not np.isfinite(max_val) or max_val <= 0:
            cam = np.zeros_like(cam, dtype=np.float32)
        else:
            cam = (cam / max_val).astype(np.float32)

        return cam, target_class, probs

    @staticmethod
    def overlay_heatmap(original_img_np: np.ndarray, heatmap: np.ndarray, alpha: float = 0.45) -> np.ndarray:
        """
        Overlays JET colormap heatmap onto the original image.
        """
        if original_img_np.ndim != 3 or original_img_np.shape[2] != 3:
            raise ValueError("Expected an RGB image with shape [height, width, 3].")
        if heatmap.ndim != 2 or heatmap.size == 0 or not np.isfinite(heatmap).all():
            raise ValueError("Expected a finite, non-empty 2D heatmap.")
        if not 0.0 <= alpha <= 1.0:
            raise ValueError("Overlay alpha must be between 0 and 1.")
        h, w = original_img_np.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_uint8 = np.uint8(255 * np.clip(heatmap_resized, 0.0, 1.0))

        colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        colormap = cv2.cvtColor(colormap, cv2.COLOR_BGR2RGB)

        overlay = cv2.addWeighted(original_img_np, 1 - alpha, colormap, alpha, 0)
        return overlay

    def remove_hooks(self):
        for h in self.hooks:
            h.remove()
        self.hooks.clear()
