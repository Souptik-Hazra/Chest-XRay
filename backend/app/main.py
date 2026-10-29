from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .models.densenet import model_service
from .api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model once; the API remains available in degraded mode if the checkpoint is absent.
    model_service.load()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-Agent AI System for Chest X-Ray Analysis using fine-tuned DenseNet121",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(
        origin.strip().rstrip("/")
        for origin in [
            settings.FRONTEND_ORIGIN,
            *settings.CORS_ORIGINS.split(","),
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
        if origin and origin.strip()
    )),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "modelStatus": f"{settings.API_V1_STR}/model/status"
    }
