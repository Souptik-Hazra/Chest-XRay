import sys
import unittest
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.quality_ood import check_image_quality, compute_uncertainty_metrics
from app.services.image_assessment_agent import assess_image
from app.services.analysis_graph import build_analysis_graph
from app.services.report import generate_clinical_report
from app.schemas.analysis import ReportSchema


class TestDeterministicServices(unittest.TestCase):
    def test_quality_uses_explicit_heuristic_method(self):
        result = check_image_quality(Image.new("RGB", (128, 128), color=(120, 120, 120)))
        self.assertEqual(result["method"], "basic_pixel_and_geometry_heuristics_not_clinically_validated")
        self.assertIsInstance(result["warnings"], list)

    def test_quality_reports_opencv_statistics_and_dimensions(self):
        result = check_image_quality(Image.new("RGB", (128, 128), color=(120, 120, 120)))
        self.assertEqual(result["meanLuminance"], 120.0)
        self.assertEqual(result["laplacianVariance"], 0.0)
        self.assertFalse(result["isSharp"])
        self.assertEqual(result["width"], 128)
        self.assertEqual(result["height"], 128)
        self.assertEqual(result["dimensionsStatus"], "pass")
        self.assertEqual(result["contrastStatus"], "low")

    def test_quality_flags_dark_bright_and_unusual_aspect_ratio(self):
        dark = check_image_quality(Image.new("RGB", (128, 128), color=(10, 10, 10)))
        bright = check_image_quality(Image.new("RGB", (128, 128), color=(245, 245, 245)))
        wide = check_image_quality(Image.new("RGB", (400, 100), color=(120, 120, 120)))
        self.assertEqual(dark["brightnessStatus"], "dark")
        self.assertEqual(bright["brightnessStatus"], "bright")
        self.assertEqual(wide["aspectRatioStatus"], "review")

    def test_quality_rejects_invalid_image(self):
        with self.assertRaises(ValueError):
            check_image_quality(None)

    def test_assessment_reviews_heuristic_flags(self):
        result = assess_image(Image.new("RGB", (128, 128), color=(120, 120, 120)))
        self.assertEqual(result["decision"], "REVIEW")
        self.assertTrue(result["warnings"])

    def test_assessment_rejects_too_small_image(self):
        result = assess_image(Image.new("RGB", (32, 32), color=(120, 120, 120)))
        self.assertEqual(result["decision"], "REJECT")

    def test_assessment_accepts_unflagged_image(self):
        image = Image.effect_noise((256, 256), 100).convert("RGB")
        result = assess_image(image)
        self.assertEqual(result["decision"], "ACCEPT")

    def test_graph_stops_before_inference_when_rejected(self):
        calls = []
        def assessment(_state):
            return {"assessment_decision": "REJECT", "image_assessment": {"decision": "REJECT"}}
        def inference(_state):
            calls.append("inference")
            return {}
        def unused(_state):
            return {}
        graph = build_analysis_graph(assessment, inference, unused, unused, unused)
        result = graph.invoke({"image": Image.new("RGB", (32, 32))})
        self.assertEqual(result["assessment_decision"], "REJECT")
        self.assertEqual(calls, [])

    def test_graph_continues_for_review_decision(self):
        calls = []
        def assessment(_state):
            return {"assessment_decision": "REVIEW"}
        def inference(_state):
            calls.append("inference")
            return {"multiview_result": {}, "predicted_class": "Normal"}
        def diagnostics(_state):
            return {"findings": {}}
        def gradcam(_state):
            return {"gradcam_available": False}
        def report(_state):
            return {"report": {"summary": "test"}}
        graph = build_analysis_graph(assessment, inference, diagnostics, gradcam, report)
        graph.invoke({"image": Image.new("RGB", (128, 128))})
        self.assertEqual(calls, ["inference"])

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
