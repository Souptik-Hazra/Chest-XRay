import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.quality_ood import check_image_quality, compute_uncertainty_metrics
from app.core.config import Settings, settings
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

    def test_graph_continues_for_review_and_accept_decisions(self):
        for decision in ("REVIEW", "ACCEPT"):
            with self.subTest(decision=decision):
                calls = []
                def assessment(_state):
                    return {"image_assessment": {"decision": decision}}
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

    def test_config_rejects_invalid_thresholds(self):
        for value in (-1.0, float("nan"), float("inf")):
            with self.subTest(value=value), self.assertRaises(ValueError):
                Settings(IMAGE_BLUR_VARIANCE_THRESHOLD=value)
        with self.assertRaises(ValueError):
            Settings(IMAGE_LOW_RESOLUTION_WARNING_DIMENSION=0)
        with self.assertRaises(ValueError):
            Settings(IMAGE_DARK_LUMINANCE_THRESHOLD=230, IMAGE_BRIGHT_LUMINANCE_THRESHOLD=220)
        with self.assertRaises(ValueError):
            Settings(IMAGE_BRIGHT_LUMINANCE_THRESHOLD=256)

    def test_environment_threshold_defaults_are_validated(self):
        import os
        from unittest.mock import patch as env_patch
        with env_patch.dict(os.environ, {"IMAGE_BLUR_VARIANCE_THRESHOLD": "nan"}):
            with self.assertRaises(ValueError):
                Settings()

    def test_quality_thresholds_are_read_from_current_settings(self):
        image = Image.effect_noise((128, 128), 100).convert("RGB")
        original = settings.IMAGE_BLUR_VARIANCE_THRESHOLD
        try:
            settings.IMAGE_BLUR_VARIANCE_THRESHOLD = 1e12
            result = check_image_quality(image)
            self.assertFalse(result["isSharp"])
        finally:
            settings.IMAGE_BLUR_VARIANCE_THRESHOLD = original

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


class TestGradCAMRendering(unittest.TestCase):
    def test_colorized_heatmap_matches_source_dimensions_without_compositing(self):
        import numpy as np
        from app.models.gradcam import GradCAM

        heatmap = np.array([[0.0, 0.5], [0.75, 1.0]], dtype=np.float32)
        rendered = GradCAM.colorize_heatmap(heatmap, width=80, height=60)
        self.assertEqual(rendered.shape, (60, 80, 3))
        self.assertEqual(rendered.dtype, np.uint8)
        self.assertTrue(np.isfinite(rendered).all())

    def test_colorized_heatmap_rejects_non_finite_values(self):
        import numpy as np
        from app.models.gradcam import GradCAM

        with self.assertRaises(ValueError):
            GradCAM.colorize_heatmap(np.array([[float("nan")]], dtype=np.float32), 10, 10)


class TestAnalyzeEndpoint(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(routes.router)
        self.client = TestClient(self.app)
        self.original_loaded = routes.model_service.is_loaded
        self.original_model = routes.model_service.model
        routes.model_service.is_loaded = True
        routes.model_service.model = object()

    def tearDown(self):
        routes.model_service.is_loaded = self.original_loaded
        routes.model_service.model = self.original_model
        self.client.close()

    def test_review_assessment_runs_full_analysis_and_returns_warnings(self):
        multiview = {
            "consensusClass": "Normal",
            "consensusConfidence": 0.82,
            "consensusProbabilities": {
                "Bacterial_Pneumonia": 0.08, "Normal": 0.82, "Viral_Pneumonia": 0.10
            },
            "crossViewAgreement": "High",
            "classVoteAgreement": 1.0,
            "classVoteCounts": {"Normal": 5},
            "views": [],
        }
        report = {
            "summary": "Research model output; not a diagnosis.",
            "limitations": "Not for clinical use.",
            "reportSource": "deterministic_grounded",
        }
        segmentation = {"status": "disabled", "message": "Segmentation disabled"}
        with patch.object(routes, "run_multiview_inference", return_value=multiview) as inference, patch.object(routes, "generate_clinical_report", return_value=report), patch.object(routes.lesion_segmentation_service, "segment", return_value=segmentation) as segment:
            response = self.client.post(
                "/analyze", files={"image": ("review.png", self._png_bytes(), "image/png")}
            )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["imageAssessment"]["decision"], "REVIEW")
        self.assertTrue(payload["imageAssessment"]["warnings"])
        self.assertTrue(payload["findings"]["reviewNeeded"])
        self.assertEqual(payload["predictedClass"], "Normal")
        self.assertEqual(payload["report"]["reportSource"], "deterministic_grounded")
        inference.assert_called_once()
        segment.assert_called_once()

    def test_empty_upload_is_rejected_before_analysis_slot(self):
        response = self.client.post("/analyze", files={"image": ("empty.png", b"", "image/png")})
        self.assertEqual(response.status_code, 400)

    def _png_bytes(self):
        import io
        buffer = io.BytesIO()
        # Flat pixels deliberately trigger the blur/contrast review heuristics.
        Image.new("RGB", (128, 128), color=(120, 120, 120)).save(buffer, format="PNG")
        return buffer.getvalue()


if __name__ == "__main__":
    unittest.main()
