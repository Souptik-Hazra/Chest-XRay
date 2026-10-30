import sys
import unittest
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.quality_ood import check_image_quality, compute_uncertainty_metrics
from app.services.report import generate_clinical_report, segmentation_note_for_result
from app.schemas.analysis import ReportSchema


class TestDeterministicServices(unittest.TestCase):
    def test_segmentation_note_matches_actual_status(self):
        self.assertIn("disabled", segmentation_note_for_result({"status": "disabled"}))
        self.assertIn("approximate mask", segmentation_note_for_result({"status": "completed"}))
        self.assertIn("does not rule out disease", segmentation_note_for_result({"status": "no_region_detected"}))
        self.assertIn("unavailable", segmentation_note_for_result({"status": "unavailable"}))

    def test_quality_uses_explicit_heuristic_method(self):
        result = check_image_quality(Image.new("RGB", (128, 128), color=(120, 120, 120)))
        self.assertEqual(result["method"], "basic_pixel_heuristics_not_clinically_validated")
        self.assertIsInstance(result["warnings"], list)

    def test_uncertainty_normalizes_probabilities(self):
        result = compute_uncertainty_metrics([1, 8, 1], "High")
        self.assertAlmostEqual(result["confidenceMargin"], 0.7, places=3)
        self.assertEqual(result["method"], "softmax_uncertainty_heuristic_not_validated_ood_detector")

    def test_invalid_probabilities_raise(self):
        with self.assertRaises(ValueError):
            compute_uncertainty_metrics([0, 0, 0], "High")

    def test_report_has_grounded_fallback_without_key(self):
        import os
        previous = {key: os.environ.pop(key, None) for key in ("GOOGLE_API_KEY", "GEMINI_API_KEY")}
        try:
            report = generate_clinical_report(
                predicted_class="Normal", confidence=0.8,
                probabilities=[{"label": "Normal", "value": 0.8}],
                findings={"reviewNeeded": False}, case_id="test", filename="test.png")
            self.assertEqual(report["reportSource"], "deterministic_grounded")
            self.assertIn("not an independently verified radiology finding", report["summary"])
            self.assertIn("not be used for diagnosis or treatment", report["limitations"])
        finally:
            for key, value in previous.items():
                if value is not None:
                    os.environ[key] = value

    def test_report_source_metadata_is_preserved_by_schema(self):
        report = ReportSchema(
            summary="Test summary",
            reportSource="gemini",
            reportModel="configured-model",
        )
        data = report.model_dump()
        self.assertEqual(data["reportSource"], "gemini")
        self.assertEqual(data["reportModel"], "configured-model")

if __name__ == "__main__":
    unittest.main()
