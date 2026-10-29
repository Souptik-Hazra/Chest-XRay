import base64
import io
import logging
import time
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np

from ..core.config import settings
from ..models.densenet import model_service, CLASS_COLORS
from ..models.gradcam import GradCAM
from ..services.multiview import run_multiview_inference
from ..services.quality_ood import check_image_quality, compute_uncertainty_metrics
from ..services.report import generate_clinical_report
from ..services.analysis_graph import build_analysis_graph
from ..services.workflow_stream import workflow_hub, event_generator
from ..schemas.analysis import AnalysisResponse, ModelInfoResponse, HealthResponse

router = APIRouter()
logger = logging.getLogger(__name__)

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

    def inference_node(state):
        started = time.perf_counter()
        workflow_hub.emit_nowait(analysis_id, "inference", "started", summary="Running DenseNet121 on transformed inputs.")
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
        workflow_hub.emit_nowait(analysis_id, "inference", "completed", summary="Transformed-input inference completed.")
        workflow_hub.emit_nowait(analysis_id, "diagnostics", "started", summary="Computing image and uncertainty heuristics.")
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
        workflow_hub.emit_nowait(analysis_id, "diagnostics", "completed", summary="Heuristic diagnostics completed.")
        return {"quality": quality, "uncertainty": uncertainty, "findings": findings}

    def gradcam_node(state):
        started = time.perf_counter()
        workflow_hub.emit_nowait(analysis_id, "gradcam", "started", summary="Generating Grad-CAM saliency map.")
        tensor = model_service.preprocess_transform(state["image"]).unsqueeze(0).to(model_service.device)
        cam = GradCAM(model_service.model)
        try:
            heatmap, pred_idx, _ = cam.generate_heatmap(tensor)
        finally:
            cam.remove_hooks()
        if not np.isfinite(heatmap).all() or float(np.max(heatmap)) <= 0:
            workflow_hub.emit_nowait(analysis_id, "gradcam", "completed", summary="Grad-CAM was unavailable for this input.")
            return {"gradcam_url": None, "gradcam_available": False,
                    "gradcam_duration": round(time.perf_counter() - started, 3)}
        overlay = Image.fromarray(
            GradCAM.overlay_heatmap(np.array(state["image"].resize((224, 224))), heatmap, alpha=0.45)
        )
        buffer = io.BytesIO()
        overlay.save(buffer, format="PNG")
        overlay_data = base64.b64encode(buffer.getvalue()).decode("ascii")
        duration = round(time.perf_counter() - started, 3)
        workflow_hub.emit_nowait(analysis_id, "gradcam", "completed", duration=duration, summary="Grad-CAM generated in memory.")
        return {
            "gradcam_url": f"data:image/png;base64,{overlay_data}",
            "gradcam_image": overlay,
            "gradcam_available": True,
            "gradcam_duration": duration,
        }

    def report_node(state):
        workflow_hub.emit_nowait(analysis_id, "report", "started", summary="Preparing evidence-bounded report.")
        findings = {**state["findings"], "gradcamAvailable": state.get("gradcam_available", False)}
        report = generate_clinical_report(
            predicted_class=state["predicted_class"], confidence=state["confidence"],
            probabilities=state["probabilities"], findings=findings,
            case_id=analysis_id, filename=filename,
            original_image=state["image"],
            gradcam_image=state.get("gradcam_image"),
        )
        workflow_hub.emit_nowait(analysis_id, "report", "completed", summary="Report generation completed.")
        return {"findings": findings, "report": report}

    graph = build_analysis_graph(inference_node, diagnostics_node, gradcam_node, report_node)
    try:
        result = graph.invoke({"image": img})
    except Exception as exc:
        logger.exception("Analysis workflow failed for %s", analysis_id)
        workflow_hub.emit_nowait(analysis_id, "report", "failed", summary="Analysis workflow failed.")
        raise HTTPException(status_code=500, detail="Analysis workflow failed. Check server logs for details.") from exc

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
    return record


@router.get("/analysis/{analysis_id}/events")
async def stream_workflow_events(analysis_id: str):
    return StreamingResponse(event_generator(analysis_id), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "Connection": "keep-alive",
                                      "X-Accel-Buffering": "no"})


