import { useState, useEffect, useRef } from 'react';
import { analyzeImage, checkBackendHealth, fetchModelInfo, fetchPreprocessingPreviews } from '../services/analysisService.js';

export function useAppState() {
  const [activePage, setActivePage] = useState('new-analysis');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [preprocessingViews, setPreprocessingViews] = useState([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const previewControllerRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState('summary');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const analysisControllerRef = useRef(null);

  useEffect(() => {
    let active = true;
    const refreshHealth = () => {
      checkBackendHealth().then((health) => {
        if (active) {
          setIsBackendConnected(Boolean(health.apiOnline));
          setIsModelReady(Boolean(health.modelReady));
        }
      });
      fetchModelInfo().then((info) => {
        if (active) setModelInfo(info);
      });
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
    previewControllerRef.current?.abort();
  }, []);

  const handleSetActivePage = (page) => {
    if (!analysisControllerRef.current) setActivePage(page);
  };

  const cancelAnalysis = () => {
    analysisControllerRef.current?.abort();
    analysisControllerRef.current = null;
    setIsAnalyzing(false);
  };

  const startNewAnalysis = () => {
    cancelAnalysis();
    previewControllerRef.current?.abort();
    previewControllerRef.current = null;
    setIsLoadingPreviews(false);
    setPreprocessingViews([]);
    setActivePage('new-analysis');
    setAnalysisResult(null);
    setAnalysisError('');
    setUploadedFile(null);
    setFilePreviewUrl(null);
  };

  const handleSetUploadedFile = (file) => {
    if (analysisControllerRef.current) cancelAnalysis();
    previewControllerRef.current?.abort();
    previewControllerRef.current = null;
    setUploadedFile(file);
    setFilePreviewUrl(file ? URL.createObjectURL(file) : null);
    setPreprocessingViews([]);
    setIsLoadingPreviews(Boolean(file));
    setAnalysisResult(null);
    setAnalysisError('');
    if (file) {
      const controller = new AbortController();
      previewControllerRef.current = controller;
      fetchPreprocessingPreviews(file, { signal: controller.signal })
        .then(views => {
          if (previewControllerRef.current === controller && !controller.signal.aborted) {
            setPreprocessingViews(views);
          }
        })
        .catch(error => {
          if (!controller.signal.aborted && previewControllerRef.current === controller) {
            setAnalysisError(error.message || 'Could not generate preprocessing previews.');
          }
        })
        .finally(() => {
          if (previewControllerRef.current === controller) {
            previewControllerRef.current = null;
            setIsLoadingPreviews(false);
          }
        });
    }
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
    preprocessingViews, isLoadingPreviews,
    isAnalyzing, analysisError, activeResultTab, setActiveResultTab,
    isBackendConnected, isModelReady, modelInfo, startNewAnalysis, runAnalysis,
  };
}
