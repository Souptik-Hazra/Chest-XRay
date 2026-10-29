# ChestX AI — Current System Architecture

## 1. Project scope

ChestX AI is a research prototype that accepts a single frontal chest radiograph and runs a fine-tuned DenseNet121 classifier. The output includes class scores, transformed-input sensitivity diagnostics, basic image-quality heuristics, Grad-CAM saliency when available, and a cautious text report.

**This is not a medical device.** Outputs must not be used independently for diagnosis, triage, or treatment decisions. Softmax scores are not calibrated clinical probabilities, heuristic flags are not validated clinical quality/OOD measurements, and Grad-CAM is not lesion segmentation.

The model checkpoint and related assets under the local `Pneumonia/` directory are external/local assets and are intentionally not tracked by Git. Do not modify that directory as part of frontend/backend cleanup.

## 2. Current request flow

```text
Browser (React + Vite)
  |
  | POST /api/analyze (multipart field: image)
  v
FastAPI API
  |
  v
LangGraph analysis workflow
  |
  +--> Inference node
  |      DenseNet121 on five deterministic input variants
  |      Mean class-score aggregation and cross-view agreement
  |
  +--> Diagnostics node
  |      Pixel-level image-quality heuristics
  |      Softmax entropy, margin and uncertainty heuristic flag
  |
  +--> Grad-CAM node
  |      Saliency overlay encoded in memory as a data URL
  |
  +--> Report node
         Optional Gemini report using metrics and image inputs
         Deterministic evidence-bounded fallback if report generation fails
  |
  v
JSON response returned to the active browser session
```

Diagnostics and Grad-CAM are separate graph branches after inference; the report node runs after both branches complete.

## 3. Frontend

- React application built with Vite.
- Vite proxies `/api` requests to FastAPI at `http://127.0.0.1:8000`.
- Main views: Overview, New Analysis, and Analysis Results.
- Results include classifier findings, transformed-input sensitivity, Grad-CAM, a segmentation-unavailable notice, and the generated report.
- The frontend does not synthesize a prediction when the backend is unavailable.
- Uploaded images are previewed in the browser. The browser session holds the current result; results are not persisted as saved history.

## 4. Backend and current API

The FastAPI application is started with `python backend/run.py` and defaults to `http://127.0.0.1:8000`. Interactive API documentation is available at `/docs`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Basic application information and endpoint links |
| GET | `/api/health` | Model-loaded status and device |
| GET | `/api/model/status` | Model loading state and checkpoint path |
| GET | `/api/model/info` | Model architecture metadata and available baseline metrics |
| POST | `/api/analyze` | Run analysis on an uploaded image |
| GET | `/api/analysis/{analysis_id}/events` | Server-Sent Events for workflow progress, if a client subscribes |

There are no current API endpoints for database-backed history, fetching an individual persisted analysis, saved artifact files, sample-image browsing, or model-insights dashboards.

### Analysis request

- Content type: `multipart/form-data`
- Required field: `image`
- Accepted formats in the backend: formats supported by Pillow that pass image verification; the frontend currently allows PNG and JPEG.
- Maximum request image size: 20 MiB.

The response includes a case ID, timestamp, predicted class, class scores, heuristic findings, per-view inference results, report fields, and a Grad-CAM data URL when available.

## 5. Model and preprocessing

- Backbone: fine-tuned DenseNet121 with a three-class output.
- Display classes: Normal, Bacterial Pneumonia, Viral Pneumonia.
- The classifier runs on five deterministic variants: original, resized, contrast-adjusted, center-cropped, and mildly rotated/brightened.
- The per-view probabilities are averaged to form the aggregate score.
- Agreement is a descriptive measure of variation across transformed inputs. It is not an independent ensemble or proof of improved accuracy.
- The current image-quality checks use Laplacian variance and pixel intensity heuristics.
- Entropy and confidence margin describe the model scores; the OOD flag is a heuristic, not a validated OOD detector.
- Grad-CAM visualizes regions influencing a model score. It does not establish pathology or delineate a lesion.

The preparation-view labels in the UI are visual previews. They should not be treated as an exact reproduction of every backend tensor transformation.

## 6. Report generation and privacy

If `GOOGLE_API_KEY` or `GEMINI_API_KEY` is configured, the report service attempts to use the configured Gemini model (environment variable `CHESTX_REPORT_MODEL`). When that call fails or no key is configured, it returns a deterministic summary of the model outputs.

When Gemini reporting is enabled, the original radiograph and Grad-CAM overlay may be sent to Google's Gemini API. Obtain any required consent and follow applicable privacy and data-handling requirements before using sensitive images.

The application does not persist uploaded radiographs, Grad-CAM images, or analysis records to a local database or storage directory. The response is returned to the active browser session and is not available as saved history after a refresh or restart. The SSE workflow hub temporarily retains events in process memory; its lifecycle and retention should be maintained carefully.

## 7. Configuration

Relevant environment variables:

- `MODEL_DIR`: directory containing the local model assets.
- `MODEL_PATH`: optional explicit checkpoint path.
- `MODEL_DEVICE`: inference device (defaults to CPU).
- `API_HOST`, `API_PORT`: backend bind address and port.
- `FRONTEND_ORIGIN`: configured frontend origin.
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`: optional Gemini credentials.
- `CHESTX_REPORT_MODEL`: optional Gemini model override.
- `VITE_API_BASE_URL`: frontend API base path (defaults to `/api`).

Keep credentials in an untracked local `.env` file. Never commit secrets.

## 8. Running checks

From the repository root:

```bash
npm install
npm run build
npm run lint
python -m unittest discover -s backend/tests
```

Run model-checkpoint integration tests separately on a machine where the local model assets are available. Unit tests should not require the private checkpoint.

## 9. Known boundaries

- No saved analysis history or SQLite-backed records.
- No active segmentation model; the UI only explains that segmentation was not performed.
- No validated clinical calibration, OOD detection, or triage system.
- No claim that transformed-input aggregation improves clinical accuracy.
- Workflow SSE exists in the backend; verify client subscription and cleanup before relying on it for a live progress UI.
