import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.multiview import (
    generate_multi_views,
    summarize_view_agreement,
    _validate_probabilities,
    run_multiview_inference,
)


class TestViewAgreement(unittest.TestCase):
    CLASSES = ["Normal", "Bacterial Pneumonia", "Viral Pneumonia"]

    def test_high_agreement_uses_majority_class_votes(self):
        result = summarize_view_agreement(
            ["Normal", "Normal", "Normal", "Normal", "Viral Pneumonia"],
            self.CLASSES,
        )
        self.assertEqual(result["crossViewAgreement"], "High")
        self.assertEqual(result["classVoteAgreement"], 0.8)
        self.assertEqual(result["classVoteCounts"]["Normal"], 4)

    def test_moderate_agreement(self):
        result = summarize_view_agreement(
            ["Normal", "Normal", "Normal", "Viral Pneumonia", "Bacterial Pneumonia"],
            self.CLASSES,
        )
        self.assertEqual(result["crossViewAgreement"], "Moderate")
        self.assertEqual(result["classVoteAgreement"], 0.6)

    def test_low_agreement(self):
        result = summarize_view_agreement(
            ["Normal", "Normal", "Viral Pneumonia", "Viral Pneumonia", "Bacterial Pneumonia"],
            self.CLASSES,
        )
        self.assertEqual(result["crossViewAgreement"], "Low (Borderline Disagreement)")
        self.assertEqual(result["classVoteAgreement"], 0.4)

    def test_empty_predictions_are_rejected(self):
        with self.assertRaises(ValueError):
            summarize_view_agreement([], self.CLASSES)

    def test_unknown_predicted_class_is_rejected(self):
        with self.assertRaises(ValueError):
            summarize_view_agreement(["Unknown"], self.CLASSES)

    def test_empty_or_duplicate_class_list_is_rejected(self):
        with self.assertRaises(ValueError):
            summarize_view_agreement(["Normal"], [])
        with self.assertRaises(ValueError):
            summarize_view_agreement(["Normal"], ["Normal", "Normal"])


class TestMultiViewInputs(unittest.TestCase):
    def test_generates_five_same_size_views_with_unique_ids(self):
        image = Image.new("RGB", (320, 240), color=(120, 120, 120))
        views = generate_multi_views(image)
        self.assertEqual(len(views), 5)
        self.assertEqual(len({view[0] for view in views}), 5)
        self.assertTrue(all(view[2].size == image.size for view in views))
        self.assertEqual(views[0][0], "original")

    def test_rejects_invalid_image(self):
        with self.assertRaises(ValueError):
            generate_multi_views(None)


class TestProbabilityValidation(unittest.TestCase):
    def test_valid_probabilities_are_preserved(self):
        result = _validate_probabilities([0.2, 0.3, 0.5], 3)
        np.testing.assert_allclose(result, [0.2, 0.3, 0.5])

    def test_rejects_wrong_shape(self):
        with self.assertRaises(ValueError):
            _validate_probabilities([[0.2, 0.3, 0.5]], 3)

    def test_rejects_non_finite_values(self):
        with self.assertRaises(ValueError):
            _validate_probabilities([0.2, np.nan, 0.8], 3)

    def test_rejects_out_of_range_values(self):
        with self.assertRaises(ValueError):
            _validate_probabilities([-0.1, 0.3, 0.8], 3)
        with self.assertRaises(ValueError):
            _validate_probabilities([0.2, 0.3, 1.2], 3)

    def test_rejects_probabilities_that_do_not_sum_to_one(self):
        with self.assertRaises(ValueError):
            _validate_probabilities([0.2, 0.3, 0.4], 3)


class TestMultiViewInference(unittest.TestCase):
    @patch("app.services.multiview.model_service")
    def test_reports_one_model_and_validated_view_agreement(self, model):
        model.display_classes = ["Normal", "Bacterial Pneumonia", "Viral Pneumonia"]
        model.preprocess_transform.side_effect = lambda image: __import__("torch").zeros(3, 224, 224)
        model.predict.side_effect = [
            (0, [0.8, 0.1, 0.1]),
            (0, [0.7, 0.2, 0.1]),
            (1, [0.2, 0.7, 0.1]),
            (0, [0.6, 0.3, 0.1]),
            (0, [0.75, 0.15, 0.1]),
        ]
        result = run_multiview_inference(Image.new("RGB", (64, 64), color="gray"))
        self.assertEqual(result["viewCount"], 5)
        self.assertEqual(result["independentModels"], 1)
        self.assertEqual(result["analysisMethod"], "single_model_transformed_input_sensitivity")
        self.assertEqual(result["classVoteAgreement"], 0.8)
        self.assertEqual(result["consensusClass"], "Normal")
        self.assertAlmostEqual(sum(result["consensusProbabilities"].values()), 1.0, places=6)

    @patch("app.services.multiview.model_service")
    def test_rejects_invalid_model_probabilities(self, model):
        model.display_classes = self.CLASSES
        model.preprocess_transform.side_effect = lambda image: __import__("torch").zeros(3, 224, 224)
        model.predict.return_value = (0, [0.2, 0.2, 0.2])
        with self.assertRaises(ValueError):
            run_multiview_inference(Image.new("RGB", (64, 64), color="gray"))

    CLASSES = ["Normal", "Bacterial Pneumonia", "Viral Pneumonia"]


if __name__ == "__main__":
    unittest.main()
