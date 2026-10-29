import os
import time
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from PIL import Image

from ..core.config import settings
from ..core.database import save_analysis, get_all_analyses, get_analysis_by_id
from ..models.densenet import model_service, CLASS_COLORS
from ..models.gradcam import GradCAM
from ..services.multiview import run_multiview_inference
from ..services.quality_ood import check_image_quality, compute_uncertainty_metrics
from ..services.report import generate_clinical_report
from ..services.workflow_stream import workflow_hub, event_generator
from ..schemas.analysis import AnalysisResponse, ModelInfoResponse, HealthResponse

router = APIRouter()

# Evaluation metrics measured on test set from Pneumonia/README.md
REAL_TEST_METRICS = {
    "validationAccuracy": 0.8188,
    "testAccuracy": 0.7900,
    "weightedPrecision": 0.8000,
    "testSampleCount": 587,
    "perClass": [
        {"label": "Normal", "precision": 0.85, "recall": 0.96, "f1": 0.91, "support": 159},
        {"label": "Bacterial Pneumonia", "precision": 0.87, "recall": 0.74, "f1": 0.80, "support": 278},
        {"label": "Viral Pneumonia", "precision": 0.62, "recall": 0.69, "f1": 0.65, "support": 150}
    ],
    "confusionMatrix": [
        [207, 12, 59],
        [0, 153, 6],
        [32, 14, 104]
    ]
}

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        modelLoaded=model_service.is_loaded,
        device=str(model_service.device)
    )

@router.get("/model/status")
async def model_status():
    return {
        "loaded": model_service.is_loaded,
        "device": str(model_service.device),
        "classes": model_service.display_classes,
        "checkpointPath": model_service.checkpoint_path,
        "error": model_service.load_error
    }

@router.get("/model/info", response_model=ModelInfoResponse)
async def model_info():
    return ModelInfoResponse(
        architecture="DenseNet121 with custom 3-class classifier head",
        classes=model_service.display_classes,
        device=str(model_service.device),
        checkpointPath=model_service.checkpoint_path,
        isLoaded=model_service.is_loaded,
        loadError=model_service.load_error,
        metrics=REAL_TEST_METRICS
    )

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_radiograph(
    image: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Full Multi-Agent Chest X-Ray Analysis Pipeline:
    1. Validate format & dimensions
    2. Multi-view synthesis & DenseNet121 inference
    3. Consensus aggregation & cross-view agreement
    4. Grad-CAM saliency explainability
    5. Radiograph quality checks & Shannon entropy uncertainty
    6. Evidence-grounded clinical report generation
    """
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"DenseNet121 model is not loaded: {model_service.load_error}"
        )

    # 1. Validation
    start_total = time.time()
    analysis_id = f"CHX-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    filename = image.filename or "radiograph.png"
    
    # Read image bytes
    try:
        contents = await image.read()
        if len(contents) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 20MB limit.")
            
        import io
        img_pil = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Emit stage 1: Validation
    t1 = time.time()
    quality = check_image_quality(img_pil)
    dur_val = f"{time.time() - t1:.2f}s"
    await workflow_hub.emit(analysis_id, "validation", "completed", dur_val, "Image validated and preprocessed")

    # Save original locally
    save_path = settings.UPLOAD_DIR / f"{analysis_id}_{filename}"
    img_pil.save(save_path)

    # Emit stage 2: Multi-View Inference
    await workflow_hub.emit(analysis_id, "inference", "running", "", "Running DenseNet121 on 5 synthesized views")
    t2 = time.time()
    multiview_res = run_multiview_inference(img_pil)
    dur_inf = f"{time.time() - t2:.2f}s"
    await workflow_hub.emit(analysis_id, "inference", "completed", dur_inf, f"5 views processed, consensus: {multiview_res['consensusClass']}")

    # Emit stage 3: Consensus & Uncertainty
    t3 = time.time()
    predicted_class = multiview_res["consensusClass"]
    confidence = multiview_res["consensusConfidence"]
    
    raw_probs_list = [multiview_res["consensusProbabilities"].get(c, 0.0) for c in model_service.display_classes]
    uncertainty = compute_uncertainty_metrics(raw_probs_list, multiview_res["crossViewAgreement"])
    dur_cons = f"{time.time() - t3:.2f}s"
    await workflow_hub.emit(analysis_id, "consensus", "completed", dur_cons, f"Agreement: {multiview_res['crossViewAgreement']}")

    # Emit stage 4: Parallel branches (Grad-CAM, Segmentation, OOD)
    await workflow_hub.emit(analysis_id, "gradcam", "running", "", "Extracting feature gradients from denseblock4")
    await workflow_hub.emit(analysis_id, "ood", "running", "", "Evaluating quality & OOD status")
    await workflow_hub.emit(analysis_id, "segmentation", "skipped", "—", "Opacity segmentation skipped (optional)")

    # Real Grad-CAM execution
    t4 = time.time()
    input_tensor = model_service.preprocess_transform(img_pil).unsqueeze(0).to(model_service.device)
    gradcam = GradCAM(model_service.model)
    heatmap, pred_idx, _ = gradcam.generate_heatmap(input_tensor)
    
    # Overlay on original radiograph
    import numpy as np
    img_np = np.array(img_pil.resize((224, 224)))
    overlay_np = GradCAM.overlay_heatmap(img_np, heatmap, alpha=0.45)
    
    # Save Grad-CAM artifact
    gradcam_filename = f"gradcam_{analysis_id}.png"
    gradcam_filepath = settings.GRADCAM_DIR / gradcam_filename
    Image.fromarray(overlay_np).save(gradcam_filepath)
    gradcam_url = f"/api/artifacts/{gradcam_filename}"
    dur_cam = f"{time.time() - t4:.2f}s"
    
    await workflow_hub.emit(analysis_id, "gradcam", "completed", dur_cam, f"Heatmap generated for {predicted_class}")
    await workflow_hub.emit(analysis_id, "ood", "completed", f"{quality['laplacianVariance']:.0f} blur", f"Quality: {quality['rating']}")

    # Probability list for frontend
    probabilities = [
        {
            "label": c,
            "value": round(multiview_res["consensusProbabilities"].get(c, 0.0), 3),
            "color": CLASS_COLORS.get(c, "#6366f1")
        }
        for c in model_service.display_classes
    ]

    findings_data = {
        "crossViewAgreement": multiview_res["crossViewAgreement"],
        "predictionEntropy": uncertainty["predictionEntropy"],
        "confidenceMargin": uncertainty["confidenceMargin"],
        "imageQuality": quality["rating"],
        "oodDetected": uncertainty["oodDetected"],
        "reviewNeeded": uncertainty["reviewNeeded"],
        "laplacianVariance": quality["laplacianVariance"],
        "meanLuminance": quality["meanLuminance"]
    }

    # Emit stage 5: Report generation
    t5 = time.time()
    report_data = generate_clinical_report(
        predicted_class=predicted_class,
        confidence=confidence,
        probabilities=probabilities,
        findings=findings_data,
        case_id=analysis_id,
        filename=filename
    )
    dur_rep = f"{time.time() - t5:.2f}s"
    await workflow_hub.emit(analysis_id, "report", "completed", dur_rep, "Evidence-grounded report synthesized")

    confidence_level = "Very High" if confidence > 0.88 else "High" if confidence > 0.70 else "Moderate"

    response_record = {
        "id": analysis_id,
        "filename": filename,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "isDemoData": False,
        "predictedClass": predicted_class,
        "confidence": round(confidence, 3),
        "confidenceLevel": confidence_level,
        "probabilities": probabilities,
        "findings": findings_data,
        "multiview": multiview_res["views"],
        "report": report_data,
        "gradcamUrl": gradcam_url,
        "status": "completed"
    }

    # Save to SQLite in background
    db_record = {
        "id": analysis_id,
        "filename": filename,
        "timestamp": response_record["timestamp"],
        "predicted_class": predicted_class,
        "confidence": confidence,
        "confidence_level": confidence_level,
        "probabilities": probabilities,
        "findings": findings_data,
        "multiview": multiview_res["views"],
        "report": report_data,
        "gradcam_url": gradcam_url,
        "status": "completed"
    }
    background_tasks.add_task(save_analysis, db_record)

    return response_record

@router.get("/analysis/{analysis_id}/events")
async def stream_workflow_events(analysis_id: str):
    """Server-Sent Events endpoint for real-time DAG node orchestration."""
    return StreamingResponse(
        event_generator(analysis_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    record = get_analysis_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return record

@router.get("/history")
async def get_history(limit: int = 20, offset: int = 0):
    return get_all_analyses(limit=limit, offset=offset)

@router.get("/artifacts/{filename}")
async def get_artifact(filename: str):
    file_path = settings.GRADCAM_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return FileResponse(str(file_path), media_type="image/png")

@router.get("/samples")
async def list_sample_images():
    """
    Returns verified sample chest X-rays from the original test directory
    so the user can run instant 1-click tests with zero file upload hassle.
    """
    test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
    samples = []
    
    if test_dir.exists():
        for category in ["Normal", "Bacterial_Pneumonia", "Viral_Pneumonia"]:
            cat_dir = test_dir / category
            if cat_dir.exists():
                files = [f.name for f in cat_dir.iterdir() if f.suffix.lower() in [".jpg", ".jpeg", ".png"]][:5]
                for fn in files:
                    samples.append({
                        "category": category,
                        "displayCategory": category.replace("_", " "),
                        "filename": fn,
                        "url": f"/api/samples/{category}/{fn}"
                    })
    return samples

@router.get("/samples/{category}/{filename}")
async def get_sample_image(category: str, filename: str):
    test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
    file_path = test_dir / category / filename
    
    # Path traversal protection
    try:
        resolved = file_path.resolve()
        if not str(resolved).startswith(str(test_dir.resolve())):
            raise HTTPException(status_code=403, detail="Forbidden")
    except Exception:
        raise HTTPException(status_code=403, detail="Forbidden")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample not found.")
    
    media_type = "image/png" if file_path.suffix.lower() == ".png" else "image/jpeg"
    return FileResponse(str(file_path), media_type=media_type)
