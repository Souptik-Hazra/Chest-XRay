# ChestX AI

ChestX AI is a research prototype that uses a fine-tuned DenseNet121 model to classify uploaded frontal chest radiographs as **Normal**, **Bacterial Pneumonia**, or **Viral Pneumonia**. It is not a medical device and must not be used independently for diagnosis, triage, or treatment decisions.

## Requirements

- Node.js and npm compatible with the Vite version in `package.json`
- Python with versions of PyTorch and torchvision compatible with the local environment
- The existing checkpoint and matching assets in local `Pneumonia/`; model weights are intentionally not included in this repository

The `Pneumonia/` directory contains local model assets. Keep it untouched during routine code cleanup and do not commit its contents.

## Start the backend

From the repository root:

```bash
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
# source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python backend/run.py
```

The API defaults to `http://127.0.0.1:8000`; interactive API documentation is available at `http://127.0.0.1:8000/docs`.

Configuration variables include:

- `MODEL_DIR`: local directory containing model assets (defaults to repository-root `Pneumonia/`)
- `MODEL_PATH`: optional checkpoint path override
- `MODEL_DEVICE`: inference device (defaults to CPU)
- `API_HOST` and `API_PORT`: backend bind address and port
- `FRONTEND_ORIGIN`: frontend origin for CORS configuration
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`: optional Gemini report generation credentials
- `CHESTX_REPORT_MODEL`: optional Gemini model override

Keep real credentials in a local untracked `.env` file. Never commit API keys.

## Start the frontend

From the repository root:

```bash
npm install
npm run dev
```

Vite serves the frontend on port `5173` and proxies `/api` requests to FastAPI. Set `VITE_API_BASE_URL` if a different API base path is needed.

## Deploy the frontend and backend

### Netlify (frontend)

- Connect this repository to Netlify.
- Build command: `npm run build`
- Publish directory: `dist`
- Set the build environment variable `VITE_API_BASE_URL` to `https://YOUR-RENDER-SERVICE.onrender.com/api`.
- The root `netlify.toml` provides the SPA fallback for client-side routes.

### Render (backend)

Create a Python web service for this repository with:

- Build command: `pip install -r backend/requirements.txt`
- Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health-check path: `/api/health`
- Environment: `PYTHON_VERSION=3.11.9`, `MODEL_DEVICE=cpu`, `FRONTEND_ORIGIN=https://YOUR-SITE.netlify.app`
- Optional `CORS_ORIGINS`: comma-separated additional Netlify production/preview origins.

**Model checkpoint requirement:** `Pneumonia/` and model weights are excluded from Git. The Render service will start in degraded mode until the checkpoint is made available to it and `MODEL_PATH` points to that file. Do not commit the checkpoint or API keys. For production inference, provision the checkpoint using a private artifact store or an appropriate persistent disk and confirm `/api/model/status` reports `loaded: true`. A healthy HTTP response alone does not mean the model is ready.

**Resource note:** PyTorch and torchvision make the backend substantially heavier than the static frontend. Select a Render instance with sufficient RAM for loading DenseNet121 and handling concurrent uploads. Free instances may sleep and have cold-start delays.

## Current API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Basic application information |
| `GET` | `/api/health` | Model-loaded status and device |
| `GET` | `/api/model/status` | Model loading state and checkpoint path |
| `GET` | `/api/model/info` | Architecture metadata and available baseline metrics |
| `POST` | `/api/analyze` | Run analysis on an uploaded image |


The current implementation does **not** provide database-backed history, persisted analysis retrieval, saved artifact routes, sample-image endpoints, model-insights dashboard API, or workflow SSE streaming. The frontend does not return simulated predictions if the backend is unavailable.

## Analysis workflow

The FastAPI endpoint runs a LangGraph workflow:

1. DenseNet121 inference on five deterministic input variants.
2. Aggregation of class scores and calculation of cross-view agreement.
3. Image-quality and uncertainty heuristics.
4. Grad-CAM saliency generation in memory when available.
5. Optional Gemini report generation, with a deterministic evidence-bounded fallback.

The output is returned to the active browser session. Uploaded radiographs, Grad-CAM images, and analysis records are not saved to a local database or storage folder, and results are not available as saved history after refresh or restart. Workflow progress streaming is not enabled; the analysis request returns the completed result.

## Checks

From the repository root:

```bash
npm run build
npm run lint
python -m unittest discover -s backend/tests
```

Unit tests should not require private checkpoint files. Run model-checkpoint integration tests separately on a machine where the local model assets are available.

## Limitations and data handling

- Softmax values are model scores, not calibrated clinical probabilities.
- Image-quality and uncertainty outputs are heuristics, not validated clinical quality, OOD, or triage systems.
- Transformed-input agreement uses the same checkpoint; it is not an independent ensemble or proof of improved accuracy.
- Grad-CAM is an approximate saliency visualization, not lesion segmentation or proof of pathology.
- No active segmentation model is included in the current workflow.
- If Gemini reporting is enabled, the original radiograph and Grad-CAM overlay may be sent to Google's Gemini API. Follow applicable consent, privacy, and data-handling requirements before processing sensitive images.
- This research prototype must not be used as a standalone diagnostic or treatment tool.
