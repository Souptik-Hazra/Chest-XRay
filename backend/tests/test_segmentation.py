import sys
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.lesion_segmentation import build_segmentation_artifacts


class TestSegmentationArtifacts(unittest.TestCase):
    def test_binary_mask_and_overlay_are_returned(self):
        image = Image.new("RGB", (64, 48), color=(30, 30, 30))
        probabilities = np.zeros((16, 16), dtype=np.float32)
        probabilities[4:8, 4:8] = 0.9

        result = build_segmentation_artifacts(image, probabilities)

        self.assertEqual(result["status"], "completed")
        self.assertIn("base64,", result["maskUrl"])
        self.assertIn("base64,", result["overlayUrl"])
        self.assertAlmostEqual(result["areaPercent"], 6.25, places=2)
        self.assertEqual((result["imageWidth"], result["imageHeight"]), (64, 48))

    def test_empty_mask_is_not_reported_as_a_detected_region(self):
        result = build_segmentation_artifacts(
            Image.new("RGB", (32, 32)), np.zeros((8, 8), dtype=np.float32)
        )
        self.assertEqual(result["status"], "no_region_detected")
        self.assertEqual(result["areaPercent"], 0.0)
        self.assertEqual(result["meanMaskScore"], 0.0)

    def test_invalid_probability_values_are_rejected(self):
        with self.assertRaises(ValueError):
            build_segmentation_artifacts(
                Image.new("RGB", (16, 16)), np.full((8, 8), 2.0, dtype=np.float32)
            )

    def test_non_finite_mask_is_rejected(self):
        probabilities = np.zeros((8, 8), dtype=np.float32)
        probabilities[0, 0] = np.nan
        with self.assertRaises(ValueError):
            build_segmentation_artifacts(Image.new("RGB", (16, 16)), probabilities)

    def test_threshold_outside_probability_range_is_rejected(self):
        with self.assertRaises(ValueError):
            build_segmentation_artifacts(
                Image.new("RGB", (16, 16)), np.zeros((8, 8), dtype=np.float32), threshold=1.1
            )

    def test_empty_mask_array_is_rejected(self):
        with self.assertRaises(ValueError):
            build_segmentation_artifacts(Image.new("RGB", (16, 16)), np.empty((0, 0), dtype=np.float32))

    def test_multichannel_mask_is_rejected(self):
        with self.assertRaises(ValueError):
            build_segmentation_artifacts(
                Image.new("RGB", (16, 16)), np.zeros((1, 8, 8), dtype=np.float32)
            )


if __name__ == "__main__":
    unittest.main()
