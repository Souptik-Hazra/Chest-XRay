const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${path} failed (${response.status}): ${detail || response.statusText}`);
  }
  return response.json();
}

export async function checkBackendHealth() {
  try { const health = await requestJson('/health'); return { online: health.modelLoaded === true, apiOnline: true, ...health }; }
  catch (error) { return { online: false, apiOnline: false, error: error.message }; }
}

export async function analyzeImage(file) {
  if (!(file instanceof File) || !file.size || !['image/png', 'image/jpeg'].includes(file.type)) {
    throw new Error('Choose a non-empty PNG or JPEG image before analysis.');
  }
  const body = new FormData();
  body.append('image', file);
  return normalizeAnalysisResult(await requestJson('/analyze', { method: 'POST', headers: {}, body }));
}

function normalizeAnalysisResult(data) {
  const required = ['id', 'filename', 'timestamp', 'predictedClass', 'confidence', 'probabilities', 'findings', 'report'];
  const missing = required.filter(key => data?.[key] == null);
  if (missing.length) throw new Error(`Malformed analysis response; missing: ${missing.join(', ')}`);
  if (!Array.isArray(data.probabilities) || data.probabilities.length !== 3 || data.probabilities.some(p => typeof p.value !== 'number' || !Number.isFinite(p.value))) {
    throw new Error('Malformed analysis response: expected three numeric class probabilities.');
  }
  if (!Number.isFinite(Number(data.confidence)) || !data.findings || !data.report?.summary) {
    throw new Error('Malformed analysis response: confidence, findings, or report is invalid.');
  }
  return { ...data, confidence: Number(data.confidence), multiview: data.multiview ?? null, gradcamUrl: data.gradcamUrl ?? null };
}
