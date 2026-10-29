from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ProbabilityItem(BaseModel):
    label: str
    value: float
    color: Optional[str] = None
    variance: Optional[float] = None

class FindingsSchema(BaseModel):
    crossViewAgreement: str = "High"
    predictionEntropy: float = 0.0
    confidenceMargin: float = 0.0
    imageQuality: str = "Good"
    oodDetected: bool = False
    reviewNeeded: bool = False
    laplacianVariance: Optional[float] = None
    meanLuminance: Optional[float] = None

class ReportSchema(BaseModel):
    summary: str
    gradcamNote: Optional[str] = None
    segmentationNote: Optional[str] = None
    limitations: Optional[str] = None
    reviewRecommendation: Optional[str] = None
    reportSource: Optional[str] = None
    reportModel: Optional[str] = None

class AnalysisResponse(BaseModel):
    id: str
    filename: str
    timestamp: str
    isDemoData: bool = False
    predictedClass: str
    confidence: float
    confidenceLevel: str
    probabilities: List[ProbabilityItem]
    findings: FindingsSchema
    multiview: Optional[List[Dict[str, Any]]] = None
    report: ReportSchema
    gradcamUrl: Optional[str] = None
    status: str = "completed"

class ModelInfoResponse(BaseModel):
    architecture: str = "DenseNet121"
    classes: List[str]
    device: str
    checkpointPath: str
    isLoaded: bool
    loadError: Optional[str] = None
    metrics: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    version: str
    modelLoaded: bool
    device: str
