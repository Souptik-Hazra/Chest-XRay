import io
import time
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
from PIL import Image
import numpy as np

from ..core.config import settings
from ..core.database import save_analysis, get_all_analyses, get_analysis_by_id
from ..models.densenet import model_service, CLASS_COLORS
from ..models.gradcam import GradCAM
from ..services.multiview import run_multiview_inference
from ..services.quality_ood import check_image_quality, compute_uncertainty_metrics
from ..services.report import generate_clinical_report
from ..services.analysis_graph import build_analysis_graph
from ..services.workflow_stream import workflow_hub, event_generator
from ..schemas.analysis import AnalysisResponse, ModelInfoResponse, HealthResponse

router = APIRouter()

# These are reported only as historical baseline values supplied with the project.
# Do not interpret them as proof of multi-view gains or current-run performance.
BASELINE_METRICS = None


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy" if model_service.is_loaded else "degraded",
                          version=settings.VERSION, modelLoaded=model_service.is_loaded,
                          device=str(model_service.device))


@router.get("/model/status")
async def model_status():
    return {"loaded": model_service.is_loaded, "device": str(model_service.device),
            "classes": model_service.display_classes, "checkpointPath": model_service.checkpoint_path,
            "error": model_service.load_error}


@router.get("/model/info", response_model=ModelInfoResponse)
async def model_info():
    return ModelInfoResponse(
        architecture="DenseNet121 with custom 3-class classifier head",
        classes=model_service.display_classes, device=str(model_service.device),
        checkpointPath=model_service.checkpoint_path, isLoaded=model_service.is_loaded,
        loadError=model_service.load_error, metrics=BASELINE_METRICS or {}
    )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_radiograph(image: UploadFile = File(...)):
    if not model_service.is_loaded or model_service.model is None:
        raise HTTPException(status_code=503, detail=f"DenseNet121 checkpoint is not loaded: {model_service.load_error}")

    filename = Path(image.filename or "radiograph").name
    if not filename:
        filename = "radiograph"
    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 20MB limit.")
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Upload is not a valid supported image.") from exc

    analysis_id = f"CHX-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    save_path = settings.UPLOAD_DIR / f"{analysis_id}_{filename}"
    img.save(save_path)

    def inference_node(state):
        started = time.perf_counter()
        result = run_multiview_inference(state["image"])
        return {
            "multiview_result": result,
            "predicted_class": result["consensusClass"],
            "confidence": result["consensusConfidence"],
            "probabilities": [
                {"label": label, "value": float(value), "color": CLASS_COLORS.get(label, "#6366f1")}
                for label, value in result["consensusProbabilities"].items()
            ],
            "inference_duration": round(time.perf_counter() - started, 3),
        }

    def diagnostics_node(state):
        quality = check_image_quality(state["image"])
        result = state["multiview_result"]
        probs = [result["consensusProbabilities"].get(c, 0.0) for c in model_service.display_classes]
        uncertainty = compute_uncertainty_metrics(probs, result["crossViewAgreement"])
        findings = {
            "crossViewAgreement": result["crossViewAgreement"],
            "predictionEntropy": uncertainty["predictionEntropy"],
            "confidenceMargin": uncertainty["confidenceMargin"],
            "imageQuality": quality["rating"],
            "oodDetected": uncertainty["oodDetected"],
            "reviewNeeded": uncertainty["reviewNeeded"],
            "laplacianVariance": quality["laplacianVariance"],
            "meanLuminance": quality["meanLuminance"],
            "oodMethod": "uncertainty_heuristic_not_validated_ood_detector",
        }
        return {"quality": quality, "uncertainty": uncertainty, "findings": findings}

    def gradcam_node(state):
        started = time.perf_counter()
        tensor = model_service.preprocess_transform(state["image"]).unsqueeze(0).to(model_service.device)
        cam = GradCAM(model_service.model)
        try:
            heatmap, pred_idx, _ = cam.generate_heatmap(tensor)
        finally:
            cam.remove_hooks()
        if not np.isfinite(heatmap).all() or float(np.max(heatmap)) <= 0:
            return {"gradcam_url": None, "gradcam_available": False,
                    "gradcam_duration": round(time.perf_counter() - started, 3)}
        overlay = GradCAM.overlay_heatmap(np.array(state["image"].resize((224, 224))), heatmap, alpha=0.45)
        artifact = f"gradcam_{analysis_id}.png"
        Image.fromarray(overlay).save(settings.GRADCAM_DIR / artifact)
        return {"gradcam_url": f"/api/artifacts/{artifact}", "gradcam_available": True,
                "gradcam_duration": round(time.perf_counter() - started, 3)}

    def report_node(state):
        findings = {**state["findings"], "gradcamAvailable": state.get("gradcam_available", False)}
        report = generate_clinical_report(
            predicted_class=state["predicted_class"], confidence=state["confidence"],
            probabilities=state["probabilities"], findings=findings,
            case_id=analysis_id, filename=filename
        )
        return {"findings": findings, "report": report}

    graph = build_analysis_graph(inference_node, diagnostics_node, gradcam_node, report_node)
    try:
        result = graph.invoke({"image": img})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis workflow failed: {type(exc).__name__}: {exc}") from exc

    confidence = float(result["confidence"])
    confidence_level = "High" if confidence >= 0.70 else "Moderate"
    record = {
        "id": analysis_id, "filename": filename, "timestamp": datetime.utcnow().isoformat() + "Z",
        "isDemoData": False, "predictedClass": result["predicted_class"],
        "confidence": round(confidence, 4), "confidenceLevel": confidence_level,
        "probabilities": [{"label": p["label"], "value": round(p["value"], 6), "color": p["color"]}
                          for p in result["probabilities"]],
        "findings": result["findings"], "multiview": result["multiview_result"]["views"],
        "report": result["report"], "gradcamUrl": result.get("gradcam_url"), "status": "completed",
    }
    save_analysis({
        "id": record["id"], "filename": record["filename"], "timestamp": record["timestamp"],
        "predicted_class": record["predictedClass"], "confidence": record["confidence"],
        "confidence_level": record["confidenceLevel"], "probabilities": record["probabilities"],
        "findings": record["findings"], "multiview": record["multiview"],
        "report": record["report"], "gradcam_url": record["gradcamUrl"], "status": "completed",
    })
    return record


@router.get("/analysis/{analysis_id}/events")
async def stream_workflow_events(analysis_id: str):
    return StreamingResponse(event_generator(analysis_id), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "Connection": "keep-alive",
                                      "X-Accel-Buffering": "no"})


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    record = get_analysis_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return record


@router.get("/history")
async def get_history(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    return get_all_analyses(limit=limit, offset=offset)


@router.get("/artifacts/{filename}")
async def get_artifact(filename: str):
    # Prevent path traversal and only serve generated artifact files.
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid artifact name.")
    path = settings.GRADCAM_DIR / safe_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return FileResponse(str(path), media_type="image/png")


@router.get("/samples")
async def list_sample_images():
    test_dir = Path(settings.MODEL_DIR) / "data" / "processed" / "test"
    samples = []
    if test_dir.exists():
        for category in ["Normal", "Bacterial_Pneumonia", "Viral_Pneumonia"]:
            folder = test_dir / category
            if folder.is_dir():
                for item in sorted(folder.iterdir()):
                    if item.is_file() and item.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                        samples.append({"category": category, "displayCategory": category.replace("_", " "),
                                        "filename": item.name, "url": f"/api/samples/{category}/{item.name}"})
    return samples


@router.get("/samples/{category}/{filename}")
async def get_sample_image(category: str, filename: str):
    if category not in {"Normal", "Bacterial_Pneumonia", "Viral_Pneumonia"}:
        raise HTTPException(status_code=404, detail="Sample category not found.")
    test_dir = (Path(settings.MODEL_DIR) / "data" / "processed" / "test").resolve()
    path = (test_dir / category / filename).resolve()
    if not path.is_relative_to(test_dir) or not path.is_file():
        raise HTTPException(status_code=404, detail="Sample not found.")
    media_type = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return FileResponse(str(path), media_type=media_type)
