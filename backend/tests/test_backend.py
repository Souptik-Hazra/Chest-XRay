import os
import sys
import unittest
from pathlib import Path
from PIL import Image
import torch

# Ensure backend root is on path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.models.densenet import model_service, build_densenet121
from app.models.gradcam import GradCAM
from app.services.multiview import run_multiview_inference
from app.services.quality_ood import check_image_quality, compute_uncertainty_metrics
from app.services.report import generate_clinical_report

class TestBackendInference(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Eagerly load model
        model_service.load()

    def test_01_model_loaded(self):
        self.assertTrue(model_service.is_loaded, f"Model failed to load: {model_service.load_error}")
        self.assertIsNotNone(model_service.model)
        self.assertEqual(len(model_service.display_classes), 3)
        self.assertIn("Normal", model_service.display_classes)
        self.assertIn("Bacterial Pneumonia", model_service.display_classes)
        self.assertIn("Viral Pneumonia", model_service.display_classes)

    def test_02_real_image_inference(self):
        # Find any test image in Pneumonia dataset (read-only)
        test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
        sample_images = list(test_dir.rglob("*.jpeg")) + list(test_dir.rglob("*.jpg"))
        self.assertGreater(len(sample_images), 0, "No test images found in dataset directory")
        
        test_img_path = sample_images[0]
        img = Image.open(test_img_path).convert("RGB")
        tensor = model_service.preprocess_transform(img).unsqueeze(0)
        
        pred_idx, probs = model_service.predict(tensor)
        self.assertIn(pred_idx, [0, 1, 2])
        self.assertEqual(len(probs), 3)
        self.assertAlmostEqual(sum(probs), 1.0, places=4)
        print(f"\n[Test 2 Passed] Image: {test_img_path.name} -> Predicted: {model_service.display_classes[pred_idx]} ({probs[pred_idx]*100:.1f}%)")

    def test_03_gradcam_generation(self):
        test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
        sample_images = list(test_dir.rglob("*.jpeg"))
        self.assertGreater(len(sample_images), 0)
        
        img = Image.open(sample_images[0]).convert("RGB")
        tensor = model_service.preprocess_transform(img).unsqueeze(0).to(model_service.device)
        
        gradcam = GradCAM(model_service.model)
        heatmap, pred_idx, probs = gradcam.generate_heatmap(tensor)
        
        self.assertEqual(heatmap.shape, (7, 7))
        self.assertGreaterEqual(float(heatmap.max()), 0.0)
        self.assertLessEqual(float(heatmap.max()), 1.0)
        print(f"[Test 3 Passed] Grad-CAM heatmap generated with shape {heatmap.shape}, max={heatmap.max():.2f}")

    def test_04_multiview_inference(self):
        test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
        sample_images = list(test_dir.rglob("*.jpeg"))
        img = Image.open(sample_images[0]).convert("RGB")
        
        res = run_multiview_inference(img)
        self.assertEqual(len(res["views"]), 5)
        self.assertIn(res["consensusClass"], model_service.display_classes)
        self.assertIn(res["crossViewAgreement"], ["High", "Moderate", "Low (Borderline Disagreement)"])
        print(f"[Test 4 Passed] Multi-view consensus: {res['consensusClass']} with {res['crossViewAgreement']} agreement")

    def test_05_quality_and_uncertainty(self):
        test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
        sample_images = list(test_dir.rglob("*.jpeg"))
        img = Image.open(sample_images[0]).convert("RGB")
        
        quality = check_image_quality(img)
        self.assertIn(quality["rating"], ["Good", "Suboptimal"])
        
        uncertainty = compute_uncertainty_metrics([0.1, 0.8, 0.1], "High")
        self.assertGreater(uncertainty["confidenceMargin"], 0.0)
        self.assertGreaterEqual(uncertainty["predictionEntropy"], 0.0)
        print(f"[Test 5 Passed] Quality: {quality['rating']}, Entropy: {uncertainty['predictionEntropy']}")

    def test_06_report_synthesis(self):
        report = generate_clinical_report(
            predicted_class="Bacterial Pneumonia",
            confidence=0.88,
            probabilities=[{"label": "Bacterial Pneumonia", "value": 0.88}],
            findings={"crossViewAgreement": "High", "predictionEntropy": 0.35, "imageQuality": "Good"},
            case_id="CHX-TEST-001",
            filename="test.png"
        )
        self.assertIn("summary", report)
        self.assertIn("limitations", report)
        self.assertIn("Bacterial", report["summary"])
        print(f"[Test 6 Passed] Report generated: {report['summary'][:75]}...")

if __name__ == "__main__":
    unittest.main()
