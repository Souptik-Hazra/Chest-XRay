"""LangGraph orchestration for real ChestX analysis operations.

The graph uses Python functions for deterministic/model work and LangChain only
for optional grounded language synthesis in report.py. It does not fabricate
outputs when a node fails.
"""
from typing import Any, TypedDict
from langgraph.graph import StateGraph, START, END


class AnalysisState(TypedDict, total=False):
    image: Any
    multiview_result: dict
    predicted_class: str
    confidence: float
    probabilities: list[dict]
    inference_duration: float
    quality: dict
    uncertainty: dict
    findings: dict
    report: dict
    gradcam_url: str | None
    gradcam_image: Any
    gradcam_available: bool
    gradcam_duration: float
    errors: list[str]


def build_analysis_graph(inference_node, diagnostics_node, gradcam_node, report_node):
    """Create a graph with independent diagnostics and Grad-CAM branches."""
    graph = StateGraph(AnalysisState)
    graph.add_node("inference", inference_node)
    graph.add_node("diagnostics", diagnostics_node)
    graph.add_node("gradcam", gradcam_node)
    graph.add_node("report", report_node)
    graph.add_edge(START, "inference")
    graph.add_edge("inference", "diagnostics")
    graph.add_edge("inference", "gradcam")
    graph.add_edge(["diagnostics", "gradcam"], "report")
    graph.add_edge("report", END)
    return graph.compile()

