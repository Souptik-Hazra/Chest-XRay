from typing import Any, Dict, List
import os


def _grounded_summary(predicted_class: str, confidence: float, probabilities: List[Dict[str, Any]]) -> str:
    distribution = ", ".join(
        f"{item['label']}: {float(item['value']) * 100:.1f}%"
        for item in probabilities
    )
    return (
        f"DenseNet121 classified this image as {predicted_class} with a model score of "
        f"{confidence * 100:.1f}%. Model probability distribution: {distribution}. "
        "This is a model classification, not an independently verified radiology finding."
    )


def _llm_summary(predicted_class: str, confidence: float, probabilities: List[Dict[str, Any]], findings: Dict[str, Any]) -> str | None:
    """Optional LangChain synthesis. No key means no network call and deterministic output."""
    if not os.getenv("OPENAI_API_KEY"):
        return None
    try:
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_openai import ChatOpenAI

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You write concise research-prototype summaries of machine-learning outputs. "
             "Never diagnose, invent image findings, claim Grad-CAM proves pathology, or give treatment advice. "
             "Use only the supplied values and explicitly call them model outputs."),
            ("human",
             "Predicted class: {predicted_class}\nConfidence: {confidence}\nProbabilities: {probabilities}\n"
             "Quality: {quality}\nEntropy: {entropy}\nAgreement: {agreement}\n"
             "Write a 2-3 sentence evidence-bounded summary.")
        ])
        chain = prompt | ChatOpenAI(model=os.getenv("CHESTX_REPORT_MODEL", "gpt-4o-mini"), temperature=0)
        response = chain.invoke({
            "predicted_class": predicted_class,
            "confidence": f"{confidence:.4f}",
            "probabilities": probabilities,
            "quality": findings.get("imageQuality", "not available"),
            "entropy": findings.get("predictionEntropy", "not available"),
            "agreement": findings.get("crossViewAgreement", "not available"),
        })
        content = str(response.content).strip()
        return content or None
    except Exception:
        # LLM failures must not convert valid model inference into fake content.
        return None


def generate_clinical_report(
    predicted_class: str,
    confidence: float,
    probabilities: List[Dict[str, Any]],
    findings: Dict[str, Any],
    case_id: str,
    filename: str
) -> Dict[str, str]:
    summary = _llm_summary(predicted_class, confidence, probabilities, findings)
    if not summary:
        summary = _grounded_summary(predicted_class, confidence, probabilities)

    review_needed = findings.get("reviewNeeded")
    review_rec = (
        "Review is flagged by the configured uncertainty heuristics. This flag is not a validated clinical triage decision."
        if review_needed else
        "This research output requires qualified review; the model score alone does not establish clinical safety."
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
            "Research prototype only. DenseNet121 class probabilities are not calibrated clinical probabilities. "
            "The system does not independently establish radiographic findings and must not be used for diagnosis or treatment."
        ),
        "reviewRecommendation": review_rec,
        "reportSource": "langchain" if os.getenv("OPENAI_API_KEY") and summary else "deterministic_grounded",
    }
