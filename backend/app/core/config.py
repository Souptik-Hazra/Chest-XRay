import os
from pathlib import Path
from pydantic import BaseModel

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL_DIR = REPO_ROOT / "Pneumonia"


class Settings(BaseModel):
    PROJECT_NAME: str = "ChestX AI - Multi-Agent Chest X-Ray Analysis System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    MODEL_DIR: str = os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR))
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(Path(os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR))) / "models" / "densenet121_pneumonia.pth"))
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = Path(os.getenv("CHESTX_STORAGE_DIR", str(BASE_DIR / "storage")))
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    GRADCAM_DIR: Path = STORAGE_DIR / "artifacts"
    DB_PATH: Path = Path(os.getenv("CHESTX_DB_PATH", str(STORAGE_DIR / "chestx_analyses.db")))
    HOST: str = os.getenv("API_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("API_PORT", "8000"))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    DEVICE: str = os.getenv("MODEL_DEVICE", "cpu")


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.GRADCAM_DIR.mkdir(parents=True, exist_ok=True)
