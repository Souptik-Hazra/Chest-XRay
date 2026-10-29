import React, { useState, useEffect } from 'react';
import UploadPanel from '../components/upload/UploadPanel.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { Play, Loader2 } from 'lucide-react';
import { fetchSampleImages, fetchSampleFile } from '../services/analysisService.js';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';

export default function NewAnalysisPage({
  uploadedFile,
  setUploadedFile,
  filePreviewUrl,
  isAnalyzing,
  runDemoAnalysis,
  runAnalysis,
  isBackendConnected = false,
}) {
  const [selectedView, setSelectedView] = useState('original');
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    fetchSampleImages().then((data) => {
      if (data && data.length > 0) setSamples(data);
    });
  }, []);

  const handleLoadSample = async () => {
    if (samples.length > 0) {
      // Pick a random verified sample from the test set
      const sample = samples[Math.floor(Math.random() * samples.length)];
      try {
        const file = await fetchSampleFile(sample);
        setUploadedFile(file);
        return;
      } catch (err) {
        console.warn('Failed to fetch real sample from API, using fallback:', err);
      }
    }
    // Fallback if backend offline
    const sample = new File(['sample radiograph data'], 'sample_patient_cxr.png', {
      type: 'image/png',
    });
    setUploadedFile(sample);
  };

  const handleStartAnalysis = () => {
    if (runAnalysis) {
      runAnalysis(uploadedFile);
    } else if (runDemoAnalysis) {
      runDemoAnalysis(uploadedFile);
    }
  };

  return (
    <PageLayout>
      {/* Page Header */}
      <PageHeader
        title="Ingestion & Preprocessing Workspace"
        subtitle="Stage 1 & 2: Ingest PA/AP chest radiograph and synthesize multi-view inputs for model execution"
      >
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          DenseNet121 Inference Ready
        </span>
      </PageHeader>

      {/* Two-Column Side-by-Side Panels (No scroll) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden mb-3">
        {/* Left: Upload Ingestion */}
        <div className="h-full min-h-0">
          <UploadPanel
            uploadedFile={uploadedFile}
            filePreviewUrl={filePreviewUrl}
            onFileSelect={(file) => setUploadedFile(file)}
            onFileRemove={() => setUploadedFile(null)}
            onLoadSample={handleLoadSample}
          />
        </div>

        {/* Right: Multi-view Preparation */}
        <div className="h-full min-h-0">
          <ImagePreparationPanel
            filePreviewUrl={filePreviewUrl}
            selectedViewId={selectedView}
            onSelectView={(v) => setSelectedView(v.id)}
          />
        </div>
      </div>

      {/* Bottom Action Footer */}
      <Card padding="p-3" className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={isBackendConnected ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>⚡</span>
          <span>
            {isBackendConnected ? (
              <span className="text-emerald-400 font-semibold">Live Mode: DenseNet121 PyTorch Backend Online</span>
            ) : (
              <span><strong>Standalone Mode</strong> — simulates DenseNet121 multi-view inference</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!uploadedFile && (
            <button
              onClick={handleLoadSample}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Load verified test radiograph
            </button>
          )}

          <button
            onClick={handleStartAnalysis}
            disabled={!uploadedFile || isAnalyzing}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              uploadedFile && !isAnalyzing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running Multi-Agent Inference (DenseNet121)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Analyze Radiograph</span>
              </>
            )}
          </button>
        </div>
      </Card>
    </PageLayout>
  );
}
