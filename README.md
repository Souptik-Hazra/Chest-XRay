# ChestX AI

Research prototype using a fine-tuned DenseNet121 checkpoint to classify uploaded chest radiographs as **Normal**, **Bacterial Pneumonia**, or **Viral Pneumonia**. It is not a medical device and must not be used for diagnosis, triage, or treatment decisions.

## Requirements

- Node.js compatible with the Vite version in `package.json`
- Python and PyTorch/torchvision versions compatible with backend requirements
- Existing checkpoint and matching files in local `Pneumonia/`; weights are intentionally not included in this repository

## Backend

From the repository root:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/run.py
```

Set `MODEL_DIR` if `Pneumonia/` is not at the repository root. Set `MODEL_PATH` to override the checkpoint. Optional variables: `MODEL_DEVICE`, `CHESTX_STORAGE_DIR`, `CHESTX_DB_PATH`, `FRONTEND_ORIGIN`, `OPENAI_API_KEY`, and `CHESTX_REPORT_MODEL`. Keep secrets in a local untracked `.env` file.

API defaults to `http://127.0.0.1:8000`; docs are at `/docs`.

## Frontend

```bash
npm install
npm run dev
```

Vite proxies `/api` to FastAPI. Set `VITE_API_BASE_URL` for a different API origin.

## Checks

```bash
npm run build
npm run lint
python -m unittest discover -s backend/tests
```

Unit tests should not require private checkpoint files. Run separate checkpoint integration tests on a machine with the local model available.

## Limitations and data handling

- Softmax values are model scores, not calibrated clinical probabilities.
- Quality and uncertainty outputs are heuristics, not validated clinical quality, OOD, or triage systems.
- Transformed-input agreement uses the same checkpoint and is not an independent ensemble or proven accuracy gain.
- Grad-CAM is an approximate saliency map, not lesion segmentation or proof of pathology.
- Uploaded radiographs and metadata may be sensitive. Runtime data is ignored for future Git commits; set access, retention, and deletion policies before using real patient data.
