import os
import threading
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from typing import Tuple, List, Optional
from ..core.config import settings

# Display names mapped from trained checkpoint classes
LABEL_MAPPING = {
    "Bacterial_Pneumonia": "Bacterial Pneumonia",
    "Normal": "Normal",
    "Viral_Pneumonia": "Viral Pneumonia"
}

CLASS_COLORS = {
    "Normal": "#10b981",
    "Bacterial Pneumonia": "#ef4444",
    "Viral Pneumonia": "#f59e0b"
}

def build_densenet121(num_classes: int = 3) -> nn.Module:
    """
    Constructs DenseNet121 matching the training architecture in Pneumonia/src/model.py.
    Crucial fix: sets inplace=False on all ReLU layers for PyTorch Grad-CAM hook compatibility.
    """
    model = models.densenet121(weights=None)
    
    # Disable inplace ReLUs for Grad-CAM backward hook safety
    for m in model.modules():
        if isinstance(m, nn.ReLU):
            m.inplace = False

    num_ftrs = model.classifier.in_features  # 1024
    model.classifier = nn.Sequential(
        nn.Linear(num_ftrs, 256),
        nn.ReLU(inplace=False),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    return model

class ModelService:
    _instance: Optional['ModelService'] = None

    def __init__(self):
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() and settings.DEVICE != "cpu" else "cpu")
        self.model: Optional[nn.Module] = None
        self.analysis_lock = threading.RLock()
        self.raw_classes: List[str] = ["Bacterial_Pneumonia", "Normal", "Viral_Pneumonia"]
        self.display_classes: List[str] = [LABEL_MAPPING.get(c, c) for c in self.raw_classes]
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.checkpoint_path: str = settings.MODEL_PATH
        
        # Standard input transform (224x224, ImageNet statistics)
        self.preprocess_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    @classmethod
    def get_instance(cls) -> 'ModelService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load(self):
        """Loads trained weights from the configured checkpoint once."""
        if self.is_loaded and self.model is not None:
            return
        try:
            if not os.path.exists(self.checkpoint_path):
                raise FileNotFoundError(f"Model checkpoint not found at: {self.checkpoint_path}")

            self.model = build_densenet121(num_classes=3)
            
            # Load in read-only mode
            checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
            
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                self.model.load_state_dict(checkpoint["model_state_dict"])
                if "class_names" in checkpoint:
                    self.raw_classes = checkpoint["class_names"]
                    self.display_classes = [LABEL_MAPPING.get(c, c) for c in self.raw_classes]
            else:
                self.model.load_state_dict(checkpoint)

            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            self.load_error = None
            print(f"[ModelService] Loaded DenseNet121 from {self.checkpoint_path} onto {self.device}")
            print(f"[ModelService] Classes: {self.raw_classes} -> {self.display_classes}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[ModelService] ERROR loading checkpoint: {e}")

    def predict(self, input_tensor: torch.Tensor) -> Tuple[int, List[float]]:
        """
        Runs evaluation-mode forward pass without gradient tracking.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError(f"Model not loaded: {self.load_error}")

        with torch.no_grad():
            tensor = input_tensor.to(self.device)
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy().tolist()
            pred_idx = int(torch.argmax(logits, dim=1).item())
            return pred_idx, probs

model_service = ModelService.get_instance()
