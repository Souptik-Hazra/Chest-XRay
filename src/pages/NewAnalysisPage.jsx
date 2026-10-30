import React, { useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import UploadPanel from '../components/upload/UploadPanel.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';
import './pages.css';

export default function NewAnalysisPage({ uploadedFile, setUploadedFile, filePreviewUrl, isAnalyzing, runAnalysis, isBackendConnected = false, analysisError = '' }) {
  const [selectedView, setSelectedView] = useState('original');
  return (
    <PageLayout>
      <PageHeader title="Ingestion & Preprocessing Workspace" subtitle="Upload a real chest radiograph for DenseNet121 inference">
        <span className={isBackendConnected ? 'page-status page-status--connected' : 'page-status page-status--disconnected'}>{isBackendConnected ? 'Backend reachable' : 'Backend unavailable'}</span>
      </PageHeader>
      {analysisError && <p role="alert" className="page-alert"><AlertCircle />{analysisError}</p>}
      <div className="new-analysis-grid">
        <UploadPanel uploadedFile={uploadedFile} filePreviewUrl={filePreviewUrl} onFileSelect={setUploadedFile} onFileRemove={() => setUploadedFile(null)} />
        <ImagePreparationPanel filePreviewUrl={filePreviewUrl} selectedViewId={selectedView} onSelectView={setSelectedView} />
      </div>
      <Card padding="card-padding-md" className="analysis-action-bar">
        <p className="page-muted">{isBackendConnected ? 'FastAPI / PyTorch backend is reachable.' : 'Backend unavailable. No simulated prediction will be returned.'}</p>
        <button onClick={() => runAnalysis(uploadedFile)} disabled={!uploadedFile || isAnalyzing || !isBackendConnected} className="page-action page-action--primary page-action--analyze">
          {isAnalyzing ? <><Loader2 className="spin-icon"/>Running analysis…</> : <><Play />Analyze Radiograph</>}
        </button>
      </Card>
    </PageLayout>
  );
}
