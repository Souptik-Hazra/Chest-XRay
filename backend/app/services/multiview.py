import torch
import numpy as np
from PIL import Image, ImageEnhance, ImageOps
from torchvision import transforms
from typing import List, Dict, Any, Tuple
from ..models.densenet import model_service, LABEL_MAPPING

def generate_multi_views(img_pil: Image.Image) -> List[Tuple[str, str, Image.Image]]:
    """
    Synthesizes 5 clinically safe views of the input radiograph for multi-view ensemble inference.
    """
    views = []
    
    # 1. Original View
    views.append(("original", "Original PA View", img_pil.copy()))
    
    # 2. Resized (Bilinear interpolation standard)
    resized = img_pil.resize((224, 224), Image.Resampling.BILINEAR).resize(img_pil.size, Image.Resampling.NEAREST)
    views.append(("resized", "Resized (Bilinear Standard)", resized))
    
    # 3. Contrast Enhanced (CLAHE-like dynamic range normalization)
    enhancer = ImageEnhance.Contrast(img_pil)
    contrast_img = enhancer.enhance(1.35)
    views.append(("contrast", "Contrast / CLAHE Normalized", contrast_img))
    
    # 4. Center Cropped (focused lung field)
    w, h = img_pil.size
    crop_w, crop_h = int(w * 0.88), int(h * 0.88)
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    cropped = img_pil.crop((left, top, left + crop_w, top + crop_h)).resize((w, h))
    views.append(("cropped", "Parenchyma Center Crop", cropped))
    
    # 5. Mild Test-Time Augmentation (TTA - mild rotation + subtle brightness shift)
    augmented = img_pil.rotate(3, resample=Image.Resampling.BILINEAR)
    b_enhancer = ImageEnhance.Brightness(augmented)
    augmented = b_enhancer.enhance(1.05)
    views.append(("augmented", "Test-Time Augmentation (TTA)", augmented))
    
    return views

def run_multiview_inference(img_pil: Image.Image) -> Dict[str, Any]:
    """
    Executes DenseNet121 inference across all 5 synthesized views,
    computing aggregated consensus probabilities and cross-view agreement.
    """
    views = generate_multi_views(img_pil)
    view_results = []
    all_probs = []
    
    display_classes = model_service.display_classes

    for view_id, view_name, v_img in views:
        tensor = model_service.preprocess_transform(v_img).unsqueeze(0)
        pred_idx, probs = model_service.predict(tensor)
        
        all_probs.append(probs)
        pred_class = display_classes[pred_idx]
        
        view_results.append({
            "id": view_id,
            "name": view_name,
            "predictedClass": pred_class,
            "confidence": float(probs[pred_idx]),
            "probabilities": {
                display_classes[i]: float(probs[i]) for i in range(len(display_classes))
            }
        })

    # Compute consensus (mean probabilities across 5 views)
    probs_matrix = np.array(all_probs)  # shape (5, 3)
    mean_probs = np.mean(probs_matrix, axis=0)  # shape (3,)
    std_probs = np.std(probs_matrix, axis=0)    # variance per class
    
    consensus_idx = int(np.argmax(mean_probs))
    consensus_class = display_classes[consensus_idx]
    consensus_confidence = float(mean_probs[consensus_idx])
    
    # Cross-view agreement metric
    # Higher agreement when variance across view predictions is low
    avg_std = float(np.mean(std_probs))
    if avg_std < 0.05:
        agreement = "High"
    elif avg_std < 0.12:
        agreement = "Moderate"
    else:
        agreement = "Low (Borderline Disagreement)"

    return {
        "views": view_results,
        "consensusClass": consensus_class,
        "consensusConfidence": consensus_confidence,
        "consensusProbabilities": {
            display_classes[i]: float(mean_probs[i]) for i in range(len(display_classes))
        },
        "meanProbabilitiesList": [
            {
                "label": display_classes[i],
                "value": float(round(mean_probs[i], 3)),
                "variance": float(round(std_probs[i], 4))
            }
            for i in range(len(display_classes))
        ],
        "crossViewAgreement": agreement,
        "crossViewStdDev": round(avg_std, 4)
    }
