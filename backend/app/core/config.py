import os
from pathlib import Path
from pydantic import BaseModel, Field
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(REPO_ROOT / ".env")
DEFAULT_MODEL_DIR = REPO_ROOT / "Pneumonia"


class Settings(BaseModel):
    PROJECT_NAME: str = "ChestX AI - Multi-Agent Chest X-Ray Analysis System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    MODEL_DIR: str = os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR))
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(Path(os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR))) / "models" / "densenet121_pneumonia.pth"))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    DEVICE: str = os.getenv("MODEL_DEVICE", "cpu")
    SEGMENTATION_ENABLED: bool = os.getenv("SEGMENTATION_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
    SEGMENTATION_MODEL_ID: str = os.getenv("SEGMENTATION_MODEL_ID", "ianpan/pneumonia-cxr")
    SEGMENTATION_MODEL_REVISION: str = os.getenv("SEGMENTATION_MODEL_REVISION", "1ab2c07")

    # Screening thresholds are configurable heuristics, not clinical cut-offs.
    IMAGE_BLUR_VARIANCE_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("IMAGE_BLUR_VARIANCE_THRESHOLD", "60.0")))
    IMAGE_DARK_LUMINANCE_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("IMAGE_DARK_LUMINANCE_THRESHOLD", "35.0")))
    IMAGE_BRIGHT_LUMINANCE_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("IMAGE_BRIGHT_LUMINANCE_THRESHOLD", "220.0")))
    IMAGE_LOW_CONTRAST_STD_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("IMAGE_LOW_CONTRAST_STD_THRESHOLD", "25.0")))
    IMAGE_LOW_RESOLUTION_WARNING_DIMENSION: int = Field(default_factory=lambda: int(os.getenv("IMAGE_LOW_RESOLUTION_WARNING_DIMENSION", "64")))


settings = Settings()
