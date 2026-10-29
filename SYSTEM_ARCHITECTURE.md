# ChestX AI — Multi-Agent Chest X-Ray Analysis System
## MCA Dissertation Project Technical Documentation

---

## 1. System Overview & Architecture

ChestX AI is a full-stack clinical decision support web application for chest radiograph analysis. It integrates a fine-tuned **DenseNet121** deep learning model with multi-view test-time augmentation (TTA), gradient-weighted class activation mapping (Grad-CAM), mathematical uncertainty estimation (Shannon entropy & confidence margin), objective image quality checks, and evidence-grounded clinical report synthesis.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLINICAL RADIOGRAPH INPUT (PA / AP)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────▼─────────────────┐
                  │ Stage 1: Validation & Quality Gate │
                  │  (Laplacian Blur & Exposure Check)│
                  └─────────────────┬─────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │ Stage 2: Multi-View Synthesis (5 TTA Views)   │
            │ [Original, Bilinear, CLAHE, Crop, Augmented]  │
            └───────────────────────┬───────────────────────┘
                                    │
            ┌───────────────────────▼───────────────────────┐
            │ Stage 3: Multi-View DenseNet121 Inference     │
            │  (Evaluation mode, torch.no_grad, 224x224)    │
            └───────────────────────┬───────────────────────┘
                                    │
            ┌───────────────────────▼───────────────────────┐
            │ Stage 4: Probability Consensus & Uncertainty  │
            │  (Shannon Entropy & Cross-View Agreement)     │
            └───────┬───────────────────────────────┬───────┘
                    │                               │
        ┌───────────▼───────────┐       ┌───────────▼───────────┐
        │ Stage 5: Grad-CAM XAI │       │ Stage 6: Calibration  │
        │ (denseblock4 saliency)│       │  & OOD Anomaly Check  │
        └───────────┬───────────┘       └───────────┬───────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────▼───────────────────────┐
            │ Stage 7: Evidence-Grounded Report Synthesis   │
            │      (Findings, Limitations, Triage)          │
            └───────────────────────┬───────────────────────┘
                                    │
            ┌───────────────────────▼───────────────────────┐
            │ Storage: SQLite Metadata & Artifacts Cache    │
            └───────────────────────────────────────────────┘
```

---

## 2. Model & Checkpoint Specifications

- **Original Source**: `C:\Users\User\Downloads\Chest XRay\Pneumonia` (Preserved **100% untouched** in read-only mode).
- **Weights File**: `models/densenet121_pneumonia.pth` (29.4 MB).
- **Framework**: PyTorch (`torch>=2.0.0`, `torchvision>=0.15.0`).
- **Base Backbone**: DenseNet121 pre-trained on ImageNet.
- **Classifier Head Architecture**:
  ```python
  num_ftrs = model.classifier.in_features  # 1024
  model.classifier = nn.Sequential(
      nn.Linear(num_ftrs, 256),
      nn.ReLU(inplace=False),  # Inplace disabled for Grad-CAM hook safety
      nn.Dropout(0.3),
      nn.Linear(256, 3)        # 3 target classes
  )
  ```
- **Class Mapping**:
  - `0`: **Bacterial Pneumonia** (`Bacterial_Pneumonia`)
  - `1`: **Normal** (`Normal`)
  - `2`: **Viral Pneumonia** (`Viral_Pneumonia`)
- **Input Preprocessing**:
  - Dimensions: $224 \times 224 \times 3$ (RGB)
  - Normalization: ImageNet Mean `[0.485, 0.456, 0.406]`, Std `[0.229, 0.224, 0.225]`
- **Target Conv Layer for Grad-CAM**: `model.features.denseblock4`

---

## 3. Empirical Test Set Evaluation Metrics

Evaluated on **587 held-out stratified test radiographs**:

| Category | Precision | Recall (Sensitivity) | F1-Score | Support |
|---|---|---|---|---|
| **Normal** | 85.0% | **96.0%** | 91.0% | 159 |
| **Bacterial Pneumonia** | **87.0%** | 74.0% | 80.0% | 278 |
| **Viral Pneumonia** | 62.0% | 69.0% | 65.0% | 150 |
| **Overall Weighted** | **80.0%** | **79.0%** | **79.0%** | **587** |

- **Validation Accuracy**: `81.88%`
- **Normal Class Specificity**: `96% Recall` with zero false positives misclassified as Bacterial Pneumonia.

---

## 4. Backend Endpoints (FastAPI)

Running at `http://127.0.0.1:8000`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & model status |
| `GET` | `/api/model/status` | Model loading telemetry & active device |
| `GET` | `/api/model/info` | Architecture metadata & empirical benchmarks |
| `POST` | `/api/analyze` | Full multi-agent pipeline on uploaded radiograph |
| `GET` | `/api/analysis/{id}` | Retrieves persisted analysis by ID |
| `GET` | `/api/analysis/{id}/events` | Real-time SSE streaming for workflow progress |
| `GET` | `/api/history` | Historical analyses paginated from SQLite |
| `GET` | `/api/samples` | Verified test set sample radiographs for 1-click testing |
| `GET` | `/api/samples/{cat}/{file}` | Streams raw sample test image |
| `GET` | `/api/artifacts/{filename}` | Serves generated Grad-CAM heatmap overlays |

---

## 5. How to Run the System

### Starting the Backend
```bash
python backend/run.py
```
*(Runs on `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`)*

### Starting the Frontend
```bash
npm run dev
```
*(Runs on `http://localhost:5173/` with automated reverse-proxy to FastAPI)*

### Running Backend Verification Tests
```bash
python -m unittest backend/tests/test_backend.py
```
*(Executes 6 unit tests validating checkpoint loading, inference, Grad-CAM, multi-view, and reporting)*
