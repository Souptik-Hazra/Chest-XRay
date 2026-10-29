# ChestX AI — Node.js Backend Integration Specification

This document provides the exact REST API contract that the ChestX AI frontend expects from your Node.js / Express backend.

---

## 1. Quick Setup Overview

The frontend is already pre-configured to communicate with your Node.js backend:

- **Local Proxy**: In `vite.config.js`, any request starting with `/api` is automatically proxied to `http://localhost:5000`.
- **Environment Variable**: Configured in `.env` as `VITE_API_BASE_URL=/api`.
- **Graceful Fallback**: If the Node.js backend is offline or unreachable, the frontend automatically falls back to simulated inference so development never breaks.

---

## 2. API Endpoints Contract

### 2.1 Health Check
- **Route**: `GET /api/health`
- **Purpose**: Frontend checks if the backend server is online to toggle the header indicator.
- **Response** (`200 OK`):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "model": "DenseNet121-CheX",
  "gpuAvailable": true
}
```

---

### 2.2 Upload & Analyze Radiograph
- **Route**: `POST /api/analyze`
- **Content-Type**: `multipart/form-data`
- **Request Form Fields**:
  - `image` *(File, required)*: Uploaded radiograph (PNG, JPEG, or DICOM).
  - `views` *(string, optional)*: Number of TTA views (default: `5`).
  - `threshold` *(string, optional)*: Classification confidence threshold.

- **Response** (`200 OK`):
```json
{
  "id": "CHX-20261028-101",
  "filename": "patient_cxr_01.png",
  "timestamp": "2026-10-28T14:32:10Z",
  "isDemoData": false,
  "predictedClass": "Bacterial Pneumonia",
  "confidence": 0.842,
  "confidenceLevel": "High",
  "probabilities": [
    { "label": "Normal", "value": 0.082, "color": "#10b981" },
    { "label": "Bacterial Pneumonia", "value": 0.842, "color": "#ef4444" },
    { "label": "Viral Pneumonia", "value": 0.076, "color": "#f59e0b" }
  ],
  "findings": {
    "crossViewAgreement": "High",
    "predictionEntropy": 0.38,
    "confidenceMargin": 0.76,
    "imageQuality": "Good",
    "oodDetected": false,
    "reviewNeeded": false
  },
  "gradcamUrl": "/api/artifacts/gradcam_CHX-20261028-101.png",
  "report": {
    "summary": "Frontal radiograph demonstrates dense alveolar consolidation predominantly within the right lower lobe with prominent air bronchograms, typical of bacterial lobar pneumonia.",
    "gradcamNote": "Gradient-weighted saliency focuses heavily over the right lower lobe consolidation corresponding with the primary prediction.",
    "segmentationNote": "Optional segmentation module omitted.",
    "limitations": "Automated AI research output. Must be reviewed by a certified clinical radiologist before diagnostic intervention."
  }
}
```

---

### 2.3 Historical Analyses List
- **Route**: `GET /api/analyses`
- **Query Parameters**:
  - `page` *(optional, default 1)*
  - `limit` *(optional, default 10)*
  - `query` *(optional search string)*
- **Response** (`200 OK`):
```json
[
  {
    "id": "CHX-20261028-101",
    "date": "2026-10-28T14:32:10Z",
    "filename": "chest_xray_01.png",
    "predictedClass": "Bacterial Pneumonia",
    "confidence": 0.842,
    "status": "Completed",
    "oodFlag": false
  }
]
```

---

### 2.4 Single Analysis Record
- **Route**: `GET /api/analyses/:id`
- **Response** (`200 OK`): Returns the same object format as `POST /api/analyze`.

---

### 2.5 Model Insights & Validation Metrics
- **Route**: `GET /api/model/insights`
- **Response** (`200 OK`):
```json
{
  "overall": { "accuracy": 0.891, "precision": 0.887, "recall": 0.891, "f1": 0.888, "auc": 0.947 },
  "perClass": [
    { "label": "Normal", "precision": 0.934, "recall": 0.921, "f1": 0.927, "auc": 0.971 },
    { "label": "Bacterial Pneumonia", "precision": 0.871, "recall": 0.893, "f1": 0.882, "auc": 0.941 },
    { "label": "Viral Pneumonia", "precision": 0.856, "recall": 0.859, "f1": 0.857, "auc": 0.929 }
  ],
  "multiViewGain": { "singleView": 0.847, "multiView": 0.891, "gain": "+4.4%" }
}
```

---

## 3. Reference Node.js / Express Starter Skeleton

When you create your Node.js backend repository, you can use this minimal Express server layout:

```javascript
// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Inference endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  const file = req.file;
  // TODO: Forward file.path to Python/PyTorch inference service or DenseNet121 model
  // Return JSON conforming to the contract in Section 2.2
});

app.listen(5000, () => {
  console.log('ChestX Node.js backend listening on http://localhost:5000');
});
```
