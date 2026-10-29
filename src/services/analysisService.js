const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${path} failed (${response.status}): ${detail || response.statusText}`);
  }
  return response.json();
}

export async function checkBackendHealth() {
  try { return { online: true, ...await requestJson('/health') }; }
  catch (error) { return { online: false, error: error.message }; }
}

export const getModelStatus = () => requestJson('/model/status');

export async function analyzeImage(file) {
  if (!(file instanceof File) || !file.size || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a non-empty PNG, JPEG, or WebP image before analysis.');
  }
  const body = new FormData();
  body.append('image', file);
  return normalizeAnalysisResult(await requestJson('/analyze', { method: 'POST', headers: {}, body }));
}

export async function getAnalysisHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return requestJson(`/history${query ? `?${query}` : ''}`);
}

export async function getAnalysisById(id) {
  if (!id) throw new Error('An analysis ID is required.');
  return requestJson(`/analysis/${encodeURIComponent(id)}`);
}

export async function getModelInsights() {
  const data = await requestJson('/model/info');
  if (!data.isLoaded) throw new Error(data.loadError || 'The DenseNet121 checkpoint is not loaded.');
  return data.metrics ?? null;
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
