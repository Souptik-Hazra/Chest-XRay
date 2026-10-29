import os
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ChestX AI - Multi-Agent Chest X-Ray Analysis System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Read-only model source directory
    MODEL_DIR: str = os.getenv(
        "MODEL_DIR",
        r"C:\Users\User\Downloads\Chest XRay\Pneumonia"
    )
    
    # Checkpoint path inside read-only model dir
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        r"C:\Users\User\Downloads\Chest XRay\Pneumonia\models\densenet121_pneumonia.pth"
    )
    
    # Storage for runtime uploads and outputs (separate from read-only Pneumonia dir)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    GRADCAM_DIR: Path = STORAGE_DIR / "artifacts"
    DB_PATH: Path = STORAGE_DIR / "chestx_analyses.db"
    
    # Server settings
    HOST: str = os.getenv("API_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # CORS
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    
    # Model device
    DEVICE: str = os.getenv("MODEL_DEVICE", "cpu")

settings = Settings()

# Ensure runtime directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.GRADCAM_DIR.mkdir(parents=True, exist_ok=True)
