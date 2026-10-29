from pathlib import Path
from typing import Any, Dict, List
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
) -> str | None:
    """Generate an evidence-bounded narrative with LangChain and Gemini Flash-Lite."""
    if not (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")):
        return None

    try:
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("CHESTX_REPORT_MODEL", "gemini-3.5-flash-lite")
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You write clear, cautious research reports about machine-learning outputs for chest X-ray research. "
                "You are NOT a radiologist and have not seen the radiograph. Never diagnose, describe visual findings, "
                "infer a disease beyond repeating the classifier's label, recommend treatment, or claim Grad-CAM proves "
                "pathology. Use only the supplied metadata. Distinguish model scores from calibrated clinical probabilities. "
                "Mention missing metrics as unavailable. Produce a useful report with these headings: Model output, "
                "Supporting metrics, Interpretation and limitations, Review note. Keep it concise and factual. "
                "Do not change or reinterpret the predicted class."
            ),
            (
                "human",
                "Create a report for this analysis record.\n"
                "Case ID: {case_id}\nInput filename: {filename}\n"
                "Classifier: DenseNet121 with multi-view mean-probability aggregation\n"
                "Predicted class: {predicted_class}\nTop class score (0-1): {confidence}\n"
                "Class scores (0-1): {probabilities}\n"
                "Cross-view agreement: {agreement}\nPrediction entropy: {entropy}\n"
                "Confidence margin: {margin}\nImage quality heuristic: {quality}\n"
                "Uncertainty/OOD heuristic flag: {ood}\n"
                "Grad-CAM artifact available: {gradcam}\nReview heuristic: {review}\n"
            ),
        ])
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.2,
            max_retries=1,
            timeout=25,
        )
        response = (prompt | llm).invoke({
            "case_id": case_id,
            "filename": filename,
            "predicted_class": predicted_class,
            "confidence": f"{confidence:.4f} ({confidence * 100:.1f}%)",
            "probabilities": ", ".join(
                f"{item['label']}: {float(item['value']):.4f} ({float(item['value']) * 100:.1f}%)"
                for item in probabilities
            ),
            "agreement": findings.get("crossViewAgreement", "unavailable"),
            "entropy": findings.get("predictionEntropy", "unavailable"),
            "margin": findings.get("confidenceMargin", "unavailable"),
            "quality": findings.get("imageQuality", "unavailable"),
            "ood": findings.get("oodDetected", "unavailable"),
            "gradcam": findings.get("gradcamAvailable", False),
            "review": findings.get("reviewNeeded", "unavailable"),
        })
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
    filename: str
) -> Dict[str, str]:
    summary = _gemini_summary(
        predicted_class, confidence, probabilities, findings, case_id, filename
    )
    report_source = "gemini_flash_lite" if summary else "deterministic_grounded"
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
        "reportModel": os.getenv("CHESTX_REPORT_MODEL", "gemini-3.5-flash-lite") if summary and report_source == "gemini_flash_lite" else "deterministic",
    }
