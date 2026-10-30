import { useState, useEffect, useRef } from 'react';
import { analyzeImage, checkBackendHealth } from '../services/analysisService.js';

export function useAppState() {
  const [activePage, setActivePage] = useState('new-analysis');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState('summary');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const analysisControllerRef = useRef(null);

  useEffect(() => {
    let active = true;
    const refreshHealth = async () => {
      const health = await checkBackendHealth();
      if (active) setIsBackendConnected(Boolean(health.online));
    };
    refreshHealth();
    const intervalId = window.setInterval(refreshHealth, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => () => {
    analysisControllerRef.current?.abort();
  }, []);

  const handleSetActivePage = (page) => {\n    if (!analysisControllerRef.current) setActivePage(page);\n  };\n\n  const cancelAnalysis = () => {
    analysisControllerRef.current?.abort();
    analysisControllerRef.current = null;
    setIsAnalyzing(false);
  };

  const startNewAnalysis = () => {
    cancelAnalysis();
    setActivePage('new-analysis');
    setAnalysisResult(null);
    setAnalysisError('');
    setUploadedFile(null);
    setFilePreviewUrl(null);
  };

  const handleSetUploadedFile = (file) => {
    if (analysisControllerRef.current) cancelAnalysis();
    setUploadedFile(file);
    setFilePreviewUrl(file ? URL.createObjectURL(file) : null);
    setAnalysisResult(null);
    setAnalysisError('');
  };

  const runAnalysis = async (file) => {
    if (!file || analysisControllerRef.current) return;
    const controller = new AbortController();
    analysisControllerRef.current = controller;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeImage(file, { signal: controller.signal });
      if (analysisControllerRef.current !== controller || controller.signal.aborted) return;
      setAnalysisResult({ ...result, previewUrl: filePreviewUrl });
      setActivePage('results');
    } catch (err) {
      if (controller.signal.aborted || analysisControllerRef.current !== controller) return;
      setAnalysisError(err.message || 'Analysis failed. Check the backend and try again.');
      setAnalysisResult(null);
    } finally {
      if (analysisControllerRef.current === controller) {
        analysisControllerRef.current = null;
        setIsAnalyzing(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  return {
    activePage, setActivePage: handleSetActivePage, analysisResult,
    uploadedFile, setUploadedFile: handleSetUploadedFile, filePreviewUrl,
    isAnalyzing, analysisError, activeResultTab, setActiveResultTab,
    isBackendConnected, startNewAnalysis, runAnalysis,
  };
}
