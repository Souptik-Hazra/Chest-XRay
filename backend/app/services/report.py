from pathlib import Path
from typing import Any, Dict, List
import base64
from io import BytesIO
import os

from dotenv import load_dotenv

# Support both the repository-root .env and backend/.env, with backend settings
# taking precedence. Real secrets must never be committed.
_BACKEND_DIR = Path(__file__).resolve().parents[2]
_REPO_DIR = _BACKEND_DIR.parent
load_dotenv(_REPO_DIR / ".env")
load_dotenv(_BACKEND_DIR / ".env", override=True)


def _grounded_summary(predicted_class: str, confidence: float, probabilities: List[Dict[str, Any]], findings: Dict[str, Any]) -> str:
    distribution = ", ".join(
        f"{item['label']}: {float(item['value']) * 100:.1f}%"
        for item in probabilities
    )
    return (
        f"DenseNet121 classified this image as {predicted_class} with a model score of "
        f"{confidence * 100:.1f}%. Class scores: {distribution}. "
        f"Cross-view agreement: {findings.get('crossViewAgreement', 'unavailable')}; "
        f"image quality heuristic: {findings.get('imageQuality', 'unavailable')}; "
        f"uncertainty flag: {findings.get('oodDetected', 'unavailable')}. "
        "This is a summary of model outputs, not an independently verified radiology finding."
    )


def _gemini_summary(
    predicted_class: str,
    confidence: float,
    probabilities: List[Dict[str, Any]],
    findings: Dict[str, Any],
    case_id: str,
    filename: str,
    original_image: Any = None,
    gradcam_image: Any = None,
) -> str | None:
    """Generate an evidence-bounded report from metrics and optional X-ray/Grad-CAM images."""
    if not (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")):
        return None

    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("CHESTX_REPORT_MODEL", "gemini-3.5-flash-lite")
        system_prompt = (
            "You write cautious, evidence-bounded research reports for chest X-ray machine-learning experiments. "
            "You may inspect the supplied X-ray and Grad-CAM overlay for a technical description, but you are not a "
            "radiologist and must not provide a diagnosis, treatment advice, or definitive clinical interpretation. "
            "Do not infer a disease from the heatmap. Describe the Grad-CAM only as a model-saliency visualization; "
            "it is not a lesion segmentation or proof of pathology. Separate image observations from DenseNet121's "
            "predicted label and numeric metrics. Never change the supplied predicted class or treat softmax scores "
            "as calibrated clinical probabilities. If the images are missing, unclear, or unsuitable, say so. "
            "Use these Markdown headings on separate lines: Model output, Image and saliency review, Supporting metrics, "
            "Interpretation and limitations, Review note. Use concise paragraphs and bullet lists."
        )
        prompt_text = (
            "Create a report for this analysis record.\n"
            f"Case ID: {case_id}\nInput filename: {filename}\n"
            "Classifier: DenseNet121 with multi-view mean-probability aggregation\n"
            f"Predicted class: {predicted_class}\nTop class score: {confidence:.4f} ({confidence * 100:.1f}%)\n"
            "Class scores: " + ", ".join(
                f"{item['label']}: {float(item['value']):.4f} ({float(item['value']) * 100:.1f}%)"
                for item in probabilities
            ) + "\n"
            f"Cross-view agreement: {findings.get('crossViewAgreement', 'unavailable')}\n"
            f"Prediction entropy: {findings.get('predictionEntropy', 'unavailable')}\n"
            f"Confidence margin: {findings.get('confidenceMargin', 'unavailable')}\n"
            f"Image quality heuristic: {findings.get('imageQuality', 'unavailable')}\n"
            f"Uncertainty/OOD heuristic flag: {findings.get('oodDetected', 'unavailable')}\n"
            f"Grad-CAM artifact available: {findings.get('gradcamAvailable', False)}\n"
            f"Review heuristic: {findings.get('reviewNeeded', 'unavailable')}\n"
            "Two image attachments may follow: the original radiograph and the Grad-CAM overlay. "
            "Discuss only cautious technical observations supported by the images."
        )
        message_content = [{"type": "text", "text": prompt_text}]
        if original_image is not None:
            image_buffer = BytesIO()
            original_image.convert("RGB").save(image_buffer, format="JPEG", quality=88)
            image_data = base64.b64encode(image_buffer.getvalue()).decode("ascii")
            message_content.append({
                "type": "image_url",
                "image_url": f"data:image/jpeg;base64,{image_data}",
            })
            message_content.append({"type": "text", "text": "Image 1: original uploaded chest radiograph."})
        if gradcam_image is not None:
            gradcam_buffer = BytesIO()
            gradcam_image.convert("RGB").save(gradcam_buffer, format="PNG")
            image_data = base64.b64encode(gradcam_buffer.getvalue()).decode("ascii")
            message_content.append({
                "type": "image_url",
                "image_url": f"data:image/png;base64,{image_data}",
            })
            message_content.append({"type": "text", "text": "Image 2: Grad-CAM saliency overlay for the model prediction."})

        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.2,
            max_retries=1,
            timeout=45,
        )
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=message_content),
        ])
        content = response.content
        if isinstance(content, list):
            content = "\n".join(
                block.get("text", "") for block in content if isinstance(block, dict)
            )
        text = str(content).strip()
        return text or None
    except Exception:
        # An LLM outage must not fabricate a report or fail valid model inference.
        return None


def generate_clinical_report(
    predicted_class: str,
    confidence: float,
    probabilities: List[Dict[str, Any]],
    findings: Dict[str, Any],
    case_id: str,
    filename: str,
    original_image: Any = None,
    gradcam_image: Any = None,
) -> Dict[str, str]:
    summary = _gemini_summary(
        predicted_class, confidence, probabilities, findings, case_id, filename,
        original_image=original_image, gradcam_image=gradcam_image,
    )
    report_source = "gemini" if summary else "deterministic_grounded"
    if not summary:
        summary = _grounded_summary(predicted_class, confidence, probabilities, findings)

    review_needed = findings.get("reviewNeeded")
    review_rec = (
        "The configured uncertainty heuristics flagged this case for review. This is not a validated clinical triage decision."
        if review_needed else
        "Qualified review is required; the model score alone does not establish clinical safety."
    )
    return {
        "summary": summary,
        "gradcamNote": (
            "Grad-CAM is an approximate map of regions influencing the selected model score. "
            "It does not confirm pathology or delineate lesions."
            if findings.get("gradcamAvailable") else
            "Grad-CAM output is unavailable for this analysis."
        ),
        "segmentationNote": "Opacity segmentation was not performed; affected lung area is not estimated.",
        "limitations": (
            "Research prototype only. DenseNet121 class scores are not calibrated clinical probabilities. "
            "The system does not independently establish radiographic findings and must not be used for diagnosis or treatment."
        ),
        "reviewRecommendation": review_rec,
        "reportSource": report_source,
        "reportModel": os.getenv("CHESTX_REPORT_MODEL", "gemini-3.5-flash-lite") if summary and report_source == "gemini" else "deterministic",
    }
