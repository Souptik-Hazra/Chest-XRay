import React from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import UploadPanel from '../components/upload/UploadPanel.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';
import './pages.css';

export default function NewAnalysisPage({ uploadedFile, setUploadedFile, filePreviewUrl, isAnalyzing, runAnalysis, isBackendConnected = false, isModelReady = false, analysisError = '' }) {
  return (
    <PageLayout>
      <PageHeader title="Ingestion & Preprocessing Workspace" subtitle="Upload a real chest radiograph for DenseNet121 inference">
        <span className={isBackendConnected ? 'page-status page-status--connected' : 'page-status page-status--disconnected'}>{!isBackendConnected ? 'Backend unavailable' : isModelReady ? 'Model ready' : 'Backend reachable · Model loading'}</span>
      </PageHeader>
      {analysisError && <p role="alert" className="page-alert"><AlertCircle />{analysisError}</p>}
      <div className="new-analysis-grid">
        <UploadPanel uploadedFile={uploadedFile} filePreviewUrl={filePreviewUrl} onFileSelect={setUploadedFile} onFileRemove={() => setUploadedFile(null)} disabled={isAnalyzing}/>
        <ImagePreparationPanel filePreviewUrl={filePreviewUrl}/>
      </div>
      <Card padding="card-padding-md" className="analysis-action-bar">
        <p className="page-muted">{isAnalyzing ? 'Analysis is running. Keep this page open until it finishes.' : !isBackendConnected ? 'Backend unavailable. No simulated prediction will be returned.' : isModelReady ? 'FastAPI backend and DenseNet121 model are ready.' : 'FastAPI is reachable, but DenseNet121 is not ready yet.'}</p>
        <button onClick={() => runAnalysis(uploadedFile)} disabled={!uploadedFile || isAnalyzing || !isModelReady} className="page-action page-action--primary page-action--analyze">
          {isAnalyzing ? <><Loader2 className="spin-icon"/>Running analysis…</> : <><Play/>Analyze Radiograph</>}
        </button>
      </Card>
    </PageLayout>
  );
}
