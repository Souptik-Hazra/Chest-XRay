import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.multiview import summarize_view_agreement


class TestViewAgreement(unittest.TestCase):
    def test_high_agreement_uses_majority_class_votes(self):
        result = summarize_view_agreement(
            ["Normal", "Normal", "Normal", "Normal", "Viral Pneumonia"],
            ["Normal", "Bacterial Pneumonia", "Viral Pneumonia"],
        )
        self.assertEqual(result["crossViewAgreement"], "High")
        self.assertEqual(result["classVoteAgreement"], 0.8)
        self.assertEqual(result["classVoteCounts"]["Normal"], 4)

    def test_moderate_agreement(self):
        result = summarize_view_agreement(
            ["Normal", "Normal", "Normal", "Viral Pneumonia", "Bacterial Pneumonia"],
            ["Normal", "Bacterial Pneumonia", "Viral Pneumonia"],
        )
        self.assertEqual(result["crossViewAgreement"], "Moderate")
        self.assertEqual(result["classVoteAgreement"], 0.6)

    def test_low_agreement(self):
        result = summarize_view_agreement(
            ["Normal", "Normal", "Viral Pneumonia", "Viral Pneumonia", "Bacterial Pneumonia"],
            ["Normal", "Bacterial Pneumonia", "Viral Pneumonia"],
        )
        self.assertEqual(result["crossViewAgreement"], "Low (Borderline Disagreement)")
        self.assertEqual(result["classVoteAgreement"], 0.4)

    def test_empty_predictions_are_rejected(self):
        with self.assertRaises(ValueError):
            summarize_view_agreement([], ["Normal"])


if __name__ == "__main__":
    unittest.main()
