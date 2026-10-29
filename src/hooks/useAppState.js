import { useState, useEffect } from 'react';
import { demoAnalysisResult } from '../data/demoData.js';
import { analyzeImage, checkBackendHealth, getAnalysisById, getAnalysisHistory } from '../services/analysisService.js';

export function useAppState() {
  const [activePage, setActivePage] = useState('overview');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('summary');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth()
      .then((health) => setIsBackendConnected(Boolean(health.online)))
      .catch(() => setIsBackendConnected(false));
  }, []);

  const loadDemoResult = async () => {
    try {
      const history = await getAnalysisHistory();
      if (history && history.length > 0) {
        const fullRecord = await getAnalysisById(history[0].id);
        if (fullRecord) {
          setAnalysisResult(fullRecord);
          setActivePage('results');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load latest real result, falling back:', e);
    }
    setAnalysisResult(demoAnalysisResult);
    setActivePage('results');
  };

  const startNewAnalysis = () => {
    setActivePage('new-analysis');
    setAnalysisResult(null);
    setUploadedFile(null);
    setFilePreviewUrl(null);
  };

  const handleSetUploadedFile = (file) => {
    setUploadedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  /**
   * Dispatches analysis through the Node.js API service layer.
   * If the backend is running, calls POST /api/analyze with multipart image.
   * If backend is not yet started, gracefully falls back to simulated inference.
   */
  const runAnalysis = async (file) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(file);
      setAnalysisResult({
        ...result,
        previewUrl: file ? filePreviewUrl : null,
      });
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
      setActivePage('results');
    }
  };

  const viewHistoryItem = async (item) => {
    try {
      const realRecord = await getAnalysisById(item.id);
      if (realRecord) {
        setAnalysisResult(realRecord);
        setActivePage('results');
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch full record from backend, using fallback:', err);
    }
    setAnalysisResult({
      ...demoAnalysisResult,
      id: item.id,
      filename: item.filename,
      timestamp: item.date,
      predictedClass: item.predictedClass,
      confidence: item.confidence,
      confidenceLevel: item.confidence > 0.85 ? 'Very High' : 'High',
      probabilities: [
        { label: 'Normal', value: item.predictedClass === 'Normal' ? item.confidence : (1 - item.confidence) * 0.4, color: '#10b981' },
        { label: 'Bacterial Pneumonia', value: item.predictedClass === 'Bacterial Pneumonia' ? item.confidence : (1 - item.confidence) * 0.5, color: '#ef4444' },
        { label: 'Viral Pneumonia', value: item.predictedClass === 'Viral Pneumonia' ? item.confidence : (1 - item.confidence) * 0.5, color: '#f59e0b' },
      ],
      findings: {
        ...demoAnalysisResult.findings,
        oodDetected: Boolean(item.oodFlag),
      },
    });
    setActivePage('results');
  };

  return {
    activePage,
    setActivePage,
    analysisResult,
    setAnalysisResult,
    uploadedFile,
    setUploadedFile: handleSetUploadedFile,
    filePreviewUrl,
    isAnalyzing,
    activeResultTab,
    setActiveResultTab,
    isBackendConnected,
    loadDemoResult,
    startNewAnalysis,
    runDemoAnalysis: runAnalysis,
    runAnalysis,
    viewHistoryItem,
  };
}
