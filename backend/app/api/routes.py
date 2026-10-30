import asyncio
import base64
import threading
import io
import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from PIL import Image
import numpy as np

from ..core.config import settings
from ..models.densenet import model_service, CLASS_COLORS
from ..models.gradcam import GradCAM
from ..services.multiview import generate_multi_views, run_multiview_inference
from ..services.quality_ood import compute_uncertainty_metrics
from ..services.image_assessment_agent import assess_image
from ..services.report import generate_clinical_report
from ..services.analysis_graph import build_analysis_graph
from ..services.lesion_segmentation import lesion_segmentation_service
from ..schemas.analysis import AnalysisResponse, ModelInfoResponse, HealthResponse

router = APIRouter()
logger = logging.getLogger(__name__)
_analysis_slots = threading.BoundedSemaphore(value=1)


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
        isLoaded=model_service.is_loaded,
        loadError=model_service.load_error, metrics={}
    )


@router.post("/previews")
async def preprocessing_previews(image: UploadFile = File(...)):
    contents = await image.read(20 * 1024 * 1024 + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 20 MiB limit.")
    try:
        probe = Image.open(io.BytesIO(contents))
        if probe.format not in {"PNG", "JPEG"}:
            raise HTTPException(status_code=415, detail="Only PNG and JPEG images are supported.")
        probe.verify()
        with Image.open(io.BytesIO(contents)) as source:
            if source.width * source.height > 40_000_000:
                raise HTTPException(status_code=413, detail="Image dimensions exceed the 40-megapixel limit.")
            img = source.convert("RGB")
        previews = []
        for view_id, view_name, view_image in generate_multi_views(img):
            buffer = io.BytesIO()
            view_image.convert("RGB").save(buffer, format="JPEG", quality=72, optimize=True)
            previews.append({
                "id": view_id,
                "name": view_name,
                "previewUrl": "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("ascii"),
            })
        return {"views": previews}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Upload is not a valid supported image.") from exc


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_radiograph(request: Request, image: UploadFile = File(...)):
    if not model_service.is_loaded or model_service.model is None:
        raise HTTPException(status_code=503, detail=f"DenseNet121 checkpoint is not loaded: {model_service.load_error}")

    filename = Path(image.filename or "radiograph").name or "radiograph"
    max_upload_bytes = 20 * 1024 * 1024
    contents = await image.read(max_upload_bytes + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    if len(contents) > max_upload_bytes:
        raise HTTPException(status_code=413, detail="File size exceeds 20 MiB limit.")
    try:
        probe = Image.open(io.BytesIO(contents))
        if probe.format not in {"PNG", "JPEG"}:
            raise HTTPException(status_code=415, detail="Only PNG and JPEG images are supported.")
        probe.verify()
        with Image.open(io.BytesIO(contents)) as dimensions:
            if dimensions.width * dimensions.height > 40_000_000:
                raise HTTPException(status_code=413, detail="Image dimensions exceed the 40-megapixel limit.")
            img = dimensions.convert("RGB")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Upload is not a valid supported image.") from exc

    analysis_id = f"CHX-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    if not _analysis_slots.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail="Another analysis is already running. Please try again shortly.",
            headers={"Retry-After": "5"},
        )

    cancel_event = threading.Event()

    async def watch_disconnect():
        while not cancel_event.is_set():
            if await request.is_disconnected():
                cancel_event.set()
                return
            await asyncio.sleep(0.25)

    disconnect_task = asyncio.create_task(watch_disconnect())

    def image_assessment_node(state):
        if cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        assessment = assess_image(state["image"])
        return {"image_assessment": assessment}

    def inference_node(state):
        if cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        result = run_multiview_inference(state["image"], cancel_event=cancel_event)
        return {
            "multiview_result": result,
            "predicted_class": result["consensusClass"],
            "confidence": result["consensusConfidence"],
            "probabilities": [
                {"label": label, "value": float(value), "color": CLASS_COLORS.get(label, "#6366f1")}
                for label, value in result["consensusProbabilities"].items()
            ],
        }

    def diagnostics_node(state):
        if cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        result = state["multiview_result"]
        probs = [result["consensusProbabilities"].get(c, 0.0) for c in model_service.display_classes]
        uncertainty = compute_uncertainty_metrics(probs, result["crossViewAgreement"])
        assessment = state["image_assessment"]
        quality = assessment["quality"]
        findings = {
            "crossViewAgreement": result["crossViewAgreement"],
            "classVoteAgreement": result["classVoteAgreement"],
            "classVoteCounts": result["classVoteCounts"],
            "predictionEntropy": uncertainty["predictionEntropy"],
            "confidenceMargin": uncertainty["confidenceMargin"],
            "imageQuality": quality["rating"],
            "imageQualityWarnings": assessment["warnings"],
            "imageAssessmentDecision": assessment["decision"],
            "oodDetected": uncertainty["oodDetected"],
            "reviewNeeded": bool(uncertainty["reviewNeeded"] or assessment["decision"] == "REVIEW"),
            "laplacianVariance": quality["laplacianVariance"],
            "meanLuminance": quality["meanLuminance"],
        }
        return {"uncertainty": uncertainty, "findings": findings}

    def gradcam_node(state):
        if cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        cam = None
        try:
            tensor = model_service.preprocess_transform(state["image"]).unsqueeze(0).to(model_service.device)
            target_idx = model_service.display_classes.index(state["predicted_class"])
            cam = GradCAM(model_service.model)
            heatmap, _, _ = cam.generate_heatmap(tensor, target_class=target_idx)
            if cancel_event.is_set():
                raise InterruptedError("Analysis client disconnected.")
            if not np.isfinite(heatmap).all() or float(np.max(heatmap)) <= 0:
                return {"gradcam_url": None, "gradcam_available": False}
            overlay = Image.fromarray(
                GradCAM.overlay_heatmap(np.array(state["image"].convert("RGB")), heatmap, alpha=0.45)
            )
            buffer = io.BytesIO()
            overlay.save(buffer, format="PNG")
            overlay_data = base64.b64encode(buffer.getvalue()).decode("ascii")
            return {
                "gradcam_url": f"data:image/png;base64,{overlay_data}",
                "gradcam_image": overlay,
                "gradcam_available": True,
            }
        except InterruptedError:
            raise
        except Exception:
            logger.exception("Grad-CAM generation failed for this analysis")
            return {"gradcam_url": None, "gradcam_available": False}
        finally:
            if cam is not None:
                cam.remove_hooks()

    def report_node(state):
        if cancel_event.is_set():
            raise InterruptedError("Analysis client disconnected.")
        findings = {
            **state["findings"],
            "gradcamAvailable": state.get("gradcam_available", False),
        }
        report = generate_clinical_report(
            predicted_class=state["predicted_class"], confidence=state["confidence"],
            probabilities=state["probabilities"], findings=findings,
            case_id=analysis_id, filename=filename,
            original_image=state["image"],
            gradcam_image=state.get("gradcam_image"),
        )
        return {"findings": findings, "report": report}

    try:
        graph = build_analysis_graph(
            image_assessment_node, inference_node, diagnostics_node, gradcam_node, report_node
        )

        def run_analysis():
            with model_service.analysis_lock:
                if cancel_event.is_set():
                    raise InterruptedError("Analysis client disconnected.")
                return graph.invoke({"image": img})

        result = await run_in_threadpool(run_analysis)
        if cancel_event.is_set():
            raise HTTPException(status_code=499, detail="Analysis was cancelled.")

        segmentation = await run_in_threadpool(lesion_segmentation_service.segment, img)
        if cancel_event.is_set():
            raise HTTPException(status_code=499, detail="Analysis was cancelled.")
    except InterruptedError as exc:
        raise HTTPException(status_code=499, detail="Analysis was cancelled.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Analysis workflow failed for %s", analysis_id)
        raise HTTPException(status_code=500, detail="Analysis workflow failed. Check server logs for details.") from exc
    finally:
        cancel_event.set()
        disconnect_task.cancel()
        await asyncio.gather(disconnect_task, return_exceptions=True)
        _analysis_slots.release()

    result["report"]["segmentationNote"] = (
        segmentation.get("limitations") or segmentation.get("message")
    )

    confidence = float(result["confidence"])
    confidence_level = "High" if confidence >= 0.70 else "Moderate"
    record = {
        "id": analysis_id, "filename": filename, "timestamp": datetime.utcnow().isoformat() + "Z",
        "isDemoData": False, "predictedClass": result["predicted_class"],
        "confidence": round(confidence, 4), "confidenceLevel": confidence_level,
        "probabilities": [{"label": p["label"], "value": round(p["value"], 6), "color": p["color"]}
                          for p in result["probabilities"]],
        "findings": result["findings"], "imageAssessment": result["image_assessment"],
        "multiview": result["multiview_result"]["views"],
        "report": result["report"], "gradcamUrl": result.get("gradcam_url"),
        "segmentation": segmentation, "status": "completed",
    }
    return record
