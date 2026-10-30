"""LangGraph orchestration for deterministic ChestX analysis operations."""
from typing import Any, TypedDict
from langgraph.graph import StateGraph, START, END


class AnalysisState(TypedDict, total=False):
    image: Any
    image_assessment: dict
    multiview_result: dict
    predicted_class: str
    confidence: float
    probabilities: list[dict]
    quality: dict
    uncertainty: dict
    findings: dict
    report: dict
    gradcam_url: str | None
    gradcam_image: Any
    gradcam_available: bool



def build_analysis_graph(
    image_assessment_node, inference_node, diagnostics_node, gradcam_node, report_node
):
    """Run advisory image screening before inference, then diagnostics and Grad-CAM."""
    graph = StateGraph(AnalysisState)
    graph.add_node("image_assessment", image_assessment_node)
    graph.add_node("inference", inference_node)
    graph.add_node("diagnostics", diagnostics_node)
    graph.add_node("gradcam", gradcam_node)
    graph.add_node("report", report_node)

    graph.add_edge(START, "image_assessment")
    # Pixel/geometry checks are advisory only; both ACCEPT and REVIEW proceed.
    graph.add_edge("image_assessment", "inference")
    graph.add_edge("inference", "diagnostics")
    graph.add_edge("inference", "gradcam")
    graph.add_edge(["diagnostics", "gradcam"], "report")
    graph.add_edge("report", END)
    return graph.compile()
