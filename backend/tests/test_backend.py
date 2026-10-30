import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.quality_ood import check_image_quality, compute_uncertainty_metrics
from app.services.image_assessment_agent import assess_image
from app.services.analysis_graph import build_analysis_graph
from app.services.report import generate_clinical_report
from app.schemas.analysis import ReportSchema, AnalysisResponse
from app.api import routes


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

    def test_brightness_and_contrast_are_independent(self):
        dark_low_contrast = check_image_quality(Image.new("RGB", (128, 128), color=(10, 10, 10)))
        self.assertEqual(dark_low_contrast["brightnessStatus"], "dark")
        self.assertEqual(dark_low_contrast["contrastStatus"], "low")
        self.assertEqual(dark_low_contrast["exposureStatus"], "dark")

    def test_quality_flags_dark_bright_and_unusual_aspect_ratio(self):
        dark = check_image_quality(Image.new("RGB", (128, 128), color=(10, 10, 10)))
        bright = check_image_quality(Image.new("RGB", (128, 128), color=(245, 245, 245)))
        wide = check_image_quality(Image.new("RGB", (400, 100), color=(120, 120, 120)))
        self.assertEqual(dark["brightnessStatus"], "dark")
        self.assertEqual(bright["brightnessStatus"], "bright")
        self.assertEqual(wide["aspectRatioStatus"], "review")

    def test_small_image_is_reviewed_not_rejected(self):
        image = Image.new("RGB", (32, 32), color=(120, 120, 120))
        quality = check_image_quality(image)
        assessment = assess_image(image)
        self.assertEqual(quality["dimensionsStatus"], "low_resolution_warning")
        self.assertEqual(assessment["decision"], "REVIEW")

    def test_quality_rejects_invalid_image(self):
        with self.assertRaises(ValueError):
            check_image_quality(None)

    def test_assessment_accept_only_means_no_configured_heuristics_flagged(self):
        image = Image.effect_noise((256, 256), 100).convert("RGB")
        result = assess_image(image)
        self.assertEqual(result["decision"], "ACCEPT")
        self.assertEqual(result["decisionScope"], "no_configured_pixel_or_geometry_heuristics_flagged")
        self.assertIn("does not establish", result["reason"])
        self.assertIn("does not identify chest radiographs", result["limitations"])

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

    def test_analysis_response_schema_accepts_assessment_and_review_warnings(self):
        image = Image.new("RGB", (128, 128), color=(120, 120, 120))
        assessment = assess_image(image)
        payload = {
            "id": "test-case", "filename": "cxr.png", "timestamp": "2026-10-31T10:00:00Z",
            "predictedClass": "Normal", "confidence": 0.8, "confidenceLevel": "Moderate",
            "probabilities": [{"label": "Normal", "value": 0.8}],
            "findings": {
                "imageQualityWarnings": assessment["warnings"],
                "imageAssessmentDecision": assessment["decision"],
                "reviewNeeded": assessment["decision"] == "REVIEW",
            },
            "imageAssessment": assessment,
            "report": {"summary": "Research output; not a diagnosis."},
        }
        parsed = AnalysisResponse.model_validate(payload)
        self.assertEqual(parsed.imageAssessment.decision, "REVIEW")
        self.assertTrue(parsed.findings.imageQualityWarnings)
        self.assertTrue(parsed.findings.reviewNeeded)

    def test_report_source_metadata_is_preserved_by_schema(self):
        report = ReportSchema(summary="Test summary", reportSource="gemini", reportModel="configured-model")
        data = report.model_dump()
        self.assertEqual(data["reportSource"], "gemini")
        self.assertEqual(data["reportModel"], "configured-model")


class TestAnalyzeEndpoint(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(routes.router)
        self.client = TestClient(self.app)
        self.model_loaded = routes.model_service.is_loaded
        self.model = routes.model_service.model
        routes.model_service.is_loaded = True
        routes.model_service.model = object()

    def tearDown(self):
        routes.model_service.is_loaded = self.model_loaded
        routes.model_service.model = self.model
        self.client.close()

    def test_rejected_assessment_returns_422_and_skips_segmentation(self):
        assessment = {
            "agent": "image_assessment", "status": "completed", "decision": "REVIEW",
            "decisionScope": "pixel_or_geometry_heuristics_flagged_for_human_review",
            "quality": {
                "rating": "flags", "isSharp": False, "sharpnessStatus": "review",
                "laplacianVariance": 0.0, "meanLuminance": 100.0,
                "brightnessStatus": "pass", "contrastStd": 10.0, "contrastStatus": "low",
                "exposureStatus": "pass", "width": 128, "height": 128, "aspectRatio": 1.0,
                "dimensionsStatus": "pass", "aspectRatioStatus": "pass", "warnings": [],
                "method": "basic_pixel_and_geometry_heuristics_not_clinically_validated",
                "decisionScope": "pixel_and_geometry_heuristics_only",
            },
            "warnings": [], "reason": "review", "limitations": "heuristic only",
        }
        class FakeGraph:
            def invoke(self, _state):
                return {"image_assessment": {**assessment, "decision": "REJECT"}}
        with patch.object(routes, "build_analysis_graph", return_value=FakeGraph()), \
             patch.object(routes.lesion_segmentation_service, "segment") as segment:
            response = self.client.post(
                "/analyze", files={"image": ("small.png", self._png_bytes(), "image/png")}
            )
        self.assertEqual(response.status_code, 422)
        self.assertIn("imageAssessment", response.json()["detail"])
        segment.assert_not_called()

    def _png_bytes(self):
        import io
        buffer = io.BytesIO()
        Image.new("RGB", (32, 32), color=(120, 120, 120)).save(buffer, format="PNG")
        return buffer.getvalue()


if __name__ == "__main__":
    unittest.main()
