import base64
import io
import torch
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
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
        self.model.zero_grad()
        output = self.model(input_tensor)

        if target_class is None:
            target_class = int(torch.argmax(output, dim=1).item())

        score = output[0, target_class]
        score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            return np.zeros((7, 7), dtype=np.float32), target_class, F.softmax(output, dim=1)[0].detach().cpu().numpy()

        gradients = self.gradients[0].cpu().data.numpy()
        activations = self.activations[0].cpu().data.numpy()

        # Channel-wise mean gradient weighting
        weights = np.mean(gradients, axis=(1, 2))

        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0)
        max_val = np.max(cam)
        if max_val > 0:
            cam = cam / max_val

        probs = F.softmax(output, dim=1)[0].detach().cpu().numpy()
        return cam, target_class, probs

    @staticmethod
    def overlay_heatmap(original_img_np: np.ndarray, heatmap: np.ndarray, alpha: float = 0.45) -> np.ndarray:
        """
        Overlays JET colormap heatmap onto the original image.
        """
        h, w = original_img_np.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        colormap = cv2.cvtColor(colormap, cv2.COLOR_BGR2RGB)

        overlay = cv2.addWeighted(original_img_np, 1 - alpha, colormap, alpha, 0)
        return overlay

    @staticmethod
    def to_base64_data_uri(img_rgb_np: np.ndarray) -> str:
        """Encodes an RGB numpy image as a base64 PNG data URI."""
        pil_img = Image.fromarray(img_rgb_np)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"

    def remove_hooks(self):
        for h in self.hooks:
            h.remove()
        self.hooks.clear()
