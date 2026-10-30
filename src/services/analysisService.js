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

export async function fetchModelInfo() {
  try {
    const info = await requestJson('/model/info');
    if (!info || typeof info.architecture !== 'string' || !Array.isArray(info.classes) ||
        typeof info.device !== 'string' || typeof info.isLoaded !== 'boolean') {
      throw new Error('Malformed model metadata response.');
    }
    return info;
  } catch {
    return null;
  }
}

export async function checkBackendHealth() {
  try { const health = await requestJson('/health'); return { ...health, apiOnline: true, modelReady: health.modelLoaded === true }; }
  catch (error) { return { apiOnline: false, modelReady: false, error: error.message }; }
}

export async function analyzeImage(file, options = {}) {
  if (!(file instanceof File) || !file.size || !['image/png', 'image/jpeg'].includes(file.type)) {
    throw new Error('Choose a non-empty PNG or JPEG image before analysis.');
  }
  const body = new FormData();
  body.append('image', file);
  return normalizeAnalysisResult(await requestJson('/analyze', { method: 'POST', headers: {}, body, signal: options.signal }));
}

function normalizeAnalysisResult(data) {
  const required = ['id', 'filename', 'timestamp', 'predictedClass', 'confidence', 'probabilities', 'findings', 'report'];
  const missing = required.filter(key => data?.[key] == null);
  if (missing.length) throw new Error(`Malformed analysis response; missing: ${missing.join(', ')}`);
  if (!Array.isArray(data.probabilities) || data.probabilities.length !== 3 ||
      data.probabilities.some(p => !p || typeof p.label !== 'string' ||
        typeof p.value !== 'number' || !Number.isFinite(p.value) || p.value < 0 || p.value > 1) ||
      new Set(data.probabilities.map(p => p.label)).size !== 3) {
    throw new Error('Malformed analysis response: expected three unique classes with probabilities in [0, 1].');
  }
  const probabilityTotal = data.probabilities.reduce((sum, item) => sum + item.value, 0);
  const predictedProbability = data.probabilities.find(item => item.label === data.predictedClass);
  const highestProbability = Math.max(...data.probabilities.map(item => item.value));
  if (Math.abs(probabilityTotal - 1) > 0.02 || !predictedProbability ||
      highestProbability - predictedProbability.value > 0.00001) {
    throw new Error('Malformed analysis response: class probabilities do not match the predicted class.');
  }
  if (!Number.isFinite(Number(data.confidence)) || Number(data.confidence) < 0 ||
      Number(data.confidence) > 1 || !data.findings || !data.report?.summary) {
    throw new Error('Malformed analysis response: confidence, findings, or report is invalid.');
  }
  return { ...data, confidence: Number(data.confidence), multiview: data.multiview ?? null, gradcamUrl: data.gradcamUrl ?? null };
}
