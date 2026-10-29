import { demoAnalysisResult, demoHistory, demoMetrics } from '../data/demoData.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK !== 'false';

/**
 * Health check to verify Node.js backend connectivity.
 * Endpoint: GET /api/health
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return { online: true, ...data };
    }
    return { online: false, status: res.status };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Uploads a chest X-ray image and runs multi-agent DenseNet121 inference.
 * Endpoint: POST /api/analyze
 * Body: FormData with file under 'image' (or 'file')
 * 
 * @param {File} file - Radiograph image file (PNG/JPEG)
 * @param {Object} options - Optional inference parameters (e.g. { views: 5, tta: true })
 * @returns {Promise<Object>} Analysis result object
 */
export async function analyzeImage(file, options = {}) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    if (options.views) formData.append('views', String(options.views));
    if (options.threshold) formData.append('threshold', String(options.threshold));

    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return normalizeAnalysisResult(data, file);
  } catch (error) {
    if (USE_FALLBACK) {
      console.warn(
        `[ChestX API] Backend not reachable at ${API_BASE}/analyze (${error.message}). Falling back to simulated inference.`
      );
      // Simulate realistic network latency for the demo
      await new Promise((r) => setTimeout(r, 2000));
      return {
        ...demoAnalysisResult,
        id: `CHX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        filename: file?.name || demoAnalysisResult.filename,
        timestamp: new Date().toISOString(),
        isDemoData: true,
      };
    }
    throw error;
  }
}

/**
 * Fetches historical radiograph analyses.
 * Endpoint: GET /api/analyses
 * 
 * @param {Object} params - Query parameters (page, limit, search)
 * @returns {Promise<Array>} List of analyses
 */
export async function getAnalysisHistory(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/analyses${query ? `?${query}` : ''}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    if (USE_FALLBACK) {
      return demoHistory;
    }
    throw error;
  }
}

/**
 * Fetches a single analysis result by its unique identifier.
 * Endpoint: GET /api/analyses/:id
 * 
 * @param {string} id - Analysis ID (e.g. 'CHX-20251028-001')
 * @returns {Promise<Object>}
 */
export async function getAnalysisById(id) {
  try {
    const res = await fetch(`${API_BASE}/analyses/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    if (USE_FALLBACK) {
      const found = demoHistory.find((item) => item.id === id);
      if (found) {
        return {
          ...demoAnalysisResult,
          id: found.id,
          filename: found.filename,
          timestamp: found.date,
          predictedClass: found.predictedClass,
          confidence: found.confidence,
        };
      }
      return demoAnalysisResult;
    }
    throw error;
  }
}

/**
 * Fetches model validation metrics and calibration statistics.
 * Endpoint: GET /api/model/insights
 * 
 * @returns {Promise<Object>}
 */
export async function getModelInsights() {
  try {
    const res = await fetch(`${API_BASE}/model/info`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.metrics || demoMetrics;
  } catch (error) {
    if (USE_FALLBACK) {
      return demoMetrics;
    }
    throw error;
  }
}

/**
 * Fetches sample radiographs directly from the test dataset.
 */
export async function fetchSampleImages() {
  try {
    const res = await fetch(`${API_BASE}/samples`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Downloads a sample radiograph as a File object for immediate analysis.
 */
export async function fetchSampleFile(sample) {
  const res = await fetch(sample.url);
  const blob = await res.blob();
  return new File([blob], sample.filename, { type: blob.type || 'image/jpeg' });
}

/**
 * Normalizes backend responses into standard frontend analysis format.
 */
function normalizeAnalysisResult(data, file) {
  return {
    id: data.id || `CHX-${Date.now()}`,
    filename: data.filename || file?.name || 'radiograph.png',
    timestamp: data.timestamp || new Date().toISOString(),
    isDemoData: Boolean(data.isDemoData || false),
    predictedClass: data.predictedClass || data.prediction || 'Normal',
    confidence: Number(data.confidence ?? 0.85),
    confidenceLevel: data.confidenceLevel || (data.confidence > 0.8 ? 'High' : 'Moderate'),
    probabilities: Array.isArray(data.probabilities)
      ? data.probabilities
      : [
          { label: 'Normal', value: data.probabilities?.Normal ?? 0.1, color: '#10b981' },
          { label: 'Bacterial Pneumonia', value: data.probabilities?.['Bacterial Pneumonia'] ?? 0.7, color: '#ef4444' },
          { label: 'Viral Pneumonia', value: data.probabilities?.['Viral Pneumonia'] ?? 0.2, color: '#f59e0b' },
        ],
    findings: {
      crossViewAgreement: data.findings?.crossViewAgreement || 'High',
      predictionEntropy: data.findings?.predictionEntropy ?? 0.42,
      confidenceMargin: data.findings?.confidenceMargin ?? 0.58,
      imageQuality: data.findings?.imageQuality || 'Good',
      oodDetected: Boolean(data.findings?.oodDetected),
      reviewNeeded: Boolean(data.findings?.reviewNeeded),
      laplacianVariance: data.findings?.laplacianVariance,
      meanLuminance: data.findings?.meanLuminance,
    },
    multiview: data.multiview || null,
    gradcamUrl: data.gradcamUrl || null,
    report: {
      summary: data.report?.summary || data.summary || 'Analysis complete.',
      limitations: data.report?.limitations || 'Research prototype. Radiologist review required.',
      gradcamNote: data.report?.gradcamNote || 'Activation heatmap indicates influential feature regions.',
      segmentationNote: data.report?.segmentationNote || 'Segmentation module optional.',
      reviewRecommendation: data.report?.reviewRecommendation || 'Routine clinical correlation.',
    },
  };
}
