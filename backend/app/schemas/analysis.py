from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class ProbabilityItem(BaseModel):
    label: str
    value: float
    color: Optional[str] = None
    variance: Optional[float] = None


class FindingsSchema(BaseModel):
    crossViewAgreement: str = "High"
    classVoteAgreement: Optional[float] = None
    classVoteCounts: Optional[Dict[str, int]] = None
    predictionEntropy: float = 0.0
    confidenceMargin: float = 0.0
    imageQuality: str = "Good"
    imageQualityWarnings: List[str] = []
    imageAssessmentDecision: Optional[str] = None
    oodDetected: bool = False
    reviewNeeded: bool = False
    laplacianVariance: Optional[float] = None
    meanLuminance: Optional[float] = None


class ImageQualitySchema(BaseModel):
    rating: str
    isSharp: bool
    sharpnessStatus: str
    laplacianVariance: float
    meanLuminance: float
    brightnessStatus: str
    contrastStd: float
    contrastStatus: str
    exposureStatus: str
    width: int
    height: int
    aspectRatio: float
    dimensionsStatus: str
    aspectRatioStatus: str
    warnings: List[str]
    method: str


class ImageAssessmentSchema(BaseModel):
    agent: str
    status: str
    decision: str
    quality: ImageQualitySchema
    warnings: List[str]
    reason: str
    limitations: str


class ReportSchema(BaseModel):
    summary: str
    gradcamNote: Optional[str] = None
    segmentationNote: Optional[str] = None
    limitations: Optional[str] = None
    reviewRecommendation: Optional[str] = None
    reportSource: Optional[str] = None
    reportModel: Optional[str] = None


class SegmentationSchema(BaseModel):
    status: str
    target: Optional[str] = None
    maskUrl: Optional[str] = None
    overlayUrl: Optional[str] = None
    areaPercent: Optional[float] = None
    thresholdAreaPercent: Optional[Dict[str, float]] = None
    meanMaskScore: Optional[float] = None
    threshold: Optional[float] = None
    imageWidth: Optional[int] = None
    imageHeight: Optional[int] = None
    modelId: Optional[str] = None
    limitations: Optional[str] = None
    message: Optional[str] = None


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
    imageAssessment: ImageAssessmentSchema
    multiview: Optional[List[Dict[str, Any]]] = None
    report: ReportSchema
    gradcamUrl: Optional[str] = None
    segmentation: Optional[SegmentationSchema] = None
    status: str = "completed"


class ModelInfoResponse(BaseModel):
    architecture: str = "DenseNet121"
    classes: List[str]
    device: str
    isLoaded: bool
    loadError: Optional[str] = None
    metrics: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    version: str
    modelLoaded: bool
    device: str
