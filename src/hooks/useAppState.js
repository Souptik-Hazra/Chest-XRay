import { useState, useEffect } from 'react';
import { analyzeImage, checkBackendHealth, getAnalysisById } from '../services/analysisService.js';

export function useAppState() {
  const [activePage, setActivePage] = useState('overview');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState('summary');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    checkBackendHealth().then((health) => setIsBackendConnected(Boolean(health.online)));
  }, []);

  const loadDemoResult = async () => {
    setAnalysisError('Demo results were removed. Run a real analysis or select a record from the database history.');
    setActivePage('results');
  };

  const startNewAnalysis = () => {
    setActivePage('new-analysis');
    setAnalysisResult(null);
    setAnalysisError('');
    setUploadedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
  };

  const handleSetUploadedFile = (file) => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setUploadedFile(file);
    setFilePreviewUrl(file ? URL.createObjectURL(file) : null);
    setAnalysisError('');
  };

  const runAnalysis = async (file) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeImage(file);
      setAnalysisResult({ ...result, previewUrl: file ? URL.createObjectURL(file) : null });
      setActivePage('results');
    } catch (err) {
      setAnalysisError(err.message || 'Analysis failed. Check the backend and try again.');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const viewHistoryItem = async (item) => {
    try {
      const record = await getAnalysisById(item.id);
      setAnalysisResult(record);
      setAnalysisError('');
      setActivePage('results');
    } catch (err) {
      setAnalysisError(err.message || 'Could not load this analysis record.');
    }
  };

  return {
    activePage, setActivePage, analysisResult, setAnalysisResult,
    uploadedFile, setUploadedFile: handleSetUploadedFile, filePreviewUrl,
    isAnalyzing, analysisError, activeResultTab, setActiveResultTab,
    isBackendConnected, loadDemoResult, startNewAnalysis,
    runDemoAnalysis: runAnalysis, runAnalysis, viewHistoryItem,
  };
}
