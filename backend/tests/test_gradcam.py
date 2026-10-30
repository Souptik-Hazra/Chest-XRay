import sys
import unittest
from pathlib import Path

import numpy as np
import torch
from torch import nn

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.gradcam import GradCAM


class TinyClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Conv2d(1, 4, kernel_size=3, padding=1)
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Linear(4, 3)

    def forward(self, x):
        x = torch.relu(self.features(x))
        x = self.pool(x).flatten(1)
        return self.classifier(x)


class TestGradCAM(unittest.TestCase):
    def test_generates_finite_normalized_heatmap_and_probabilities(self):
        model = TinyClassifier().eval()
        cam = GradCAM(model, target_layer=model.features)
        try:
            heatmap, target_class, probabilities = cam.generate_heatmap(torch.rand(1, 1, 16, 16), 1)
            self.assertEqual(target_class, 1)
            self.assertEqual(heatmap.ndim, 2)
            self.assertTrue(np.isfinite(heatmap).all())
            self.assertGreaterEqual(float(heatmap.min()), 0.0)
            self.assertLessEqual(float(heatmap.max()), 1.0)
            self.assertAlmostEqual(float(probabilities.sum()), 1.0, places=5)
        finally:
            cam.remove_hooks()

    def test_rejects_invalid_target_class(self):
        model = TinyClassifier().eval()
        cam = GradCAM(model, target_layer=model.features)
        try:
            with self.assertRaises(ValueError):
                cam.generate_heatmap(torch.rand(1, 1, 16, 16), 9)
        finally:
            cam.remove_hooks()

    def test_overlay_rejects_invalid_inputs(self):
        with self.assertRaises(ValueError):
            GradCAM.overlay_heatmap(np.zeros((10, 10)), np.zeros((4, 4)))

    def test_overlay_uses_rgb_uint8_and_preserves_zero_alpha(self):
        image = np.full((12, 16, 3), 80, dtype=np.uint8)
        heatmap = np.linspace(0, 1, 49, dtype=np.float32).reshape(7, 7)
        overlay = GradCAM.overlay_heatmap(image, heatmap, alpha=0.0)
        self.assertEqual(overlay.shape, image.shape)
        self.assertEqual(overlay.dtype, np.uint8)
        np.testing.assert_array_equal(overlay, image)

    def test_overlay_rejects_non_uint8_original_image(self):
        with self.assertRaises(ValueError):
            GradCAM.overlay_heatmap(
                np.zeros((10, 10, 3), dtype=np.float32),
                np.zeros((4, 4), dtype=np.float32),
            )


if __name__ == "__main__":
    unittest.main()
