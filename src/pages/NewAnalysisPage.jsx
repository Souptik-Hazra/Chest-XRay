import React, { useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import UploadPanel from '../components/upload/UploadPanel.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';

export default function NewAnalysisPage({
  uploadedFile, setUploadedFile, filePreviewUrl, isAnalyzing, runAnalysis,
  isBackendConnected = false, analysisError = '',
}) {
  const [selectedView, setSelectedView] = useState('original');

  return (
    <PageLayout>
      <PageHeader title="Ingestion & Preprocessing Workspace" subtitle="Upload a real chest radiograph for DenseNet121 inference">
        <span className={isBackendConnected ? 'text-xs text-emerald-400' : 'text-xs text-amber-400'}>
          {isBackendConnected ? 'Backend reachable' : 'Backend unavailable'}
        </span>
      </PageHeader>
      {analysisError && <p role="alert" className="text-xs text-amber-400 mb-2"><AlertCircle className="inline w-3 h-3 mr-1"/>{analysisError}</p>}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden mb-3">
        <UploadPanel uploadedFile={uploadedFile} filePreviewUrl={filePreviewUrl} onFileSelect={setUploadedFile} onFileRemove={() => setUploadedFile(null)} />
        <ImagePreparationPanel filePreviewUrl={filePreviewUrl} selectedViewId={selectedView} onSelectView={view => setSelectedView(view.id)} />
      </div>
      <Card padding="p-3" className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{isBackendConnected ? 'FastAPI / PyTorch backend is reachable.' : 'Backend unavailable. No simulated prediction will be returned.'}</p>
        <button onClick={() => runAnalysis(uploadedFile)} disabled={!uploadedFile || isAnalyzing || !isBackendConnected} className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 text-white disabled:opacity-40 flex items-center justify-center gap-2">
          {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin"/>Running analysis…</> : <><Play className="w-4 h-4"/>Analyze Radiograph</>}
        </button>
      </Card>
    </PageLayout>
  );
}
