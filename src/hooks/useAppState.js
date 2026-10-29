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
  const resultPreviewRef = useRef(null);

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

  const startNewAnalysis = () => {
    if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
    resultPreviewRef.current = null;
    setActivePage('new-analysis');
    setAnalysisResult(null);
    setAnalysisError('');
    setUploadedFile(null);
    setFilePreviewUrl(null);
  };

  const handleSetUploadedFile = (file) => {
    setUploadedFile(file);
    setFilePreviewUrl(file ? URL.createObjectURL(file) : null);
    setAnalysisError('');
  };

  const runAnalysis = async (file) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeImage(file);
      if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
      resultPreviewRef.current = file ? URL.createObjectURL(file) : null;
      setAnalysisResult({ ...result, previewUrl: resultPreviewRef.current });
      setActivePage('results');
    } catch (err) {
      setAnalysisError(err.message || 'Analysis failed. Check the backend and try again.');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => () => {
    if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  return {
    activePage, setActivePage, analysisResult, setAnalysisResult,
    uploadedFile, setUploadedFile: handleSetUploadedFile, filePreviewUrl,
    isAnalyzing, analysisError, activeResultTab, setActiveResultTab,
    isBackendConnected, startNewAnalysis, runAnalysis,
  };
}
