import React, { useState, useEffect } from 'react';
import UploadPanel from '../components/upload/UploadPanel.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { fetchSampleImages, fetchSampleFile } from '../services/analysisService.js';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';

export default function NewAnalysisPage({ uploadedFile, setUploadedFile, filePreviewUrl, isAnalyzing, runAnalysis, isBackendConnected = false, analysisError = '' }) {
  const [selectedView, setSelectedView] = useState('original');
  const [samples, setSamples] = useState([]);
  const [sampleError, setSampleError] = useState('');
  useEffect(() => { fetchSampleImages().then(setSamples).catch(err => setSampleError(err.message)); }, []);

  const handleLoadSample = async () => {
    setSampleError('');
    try {
      if (!samples.length) throw new Error('No sample radiographs are available. Check that the backend and dataset path are configured.');
      const file = await fetchSampleFile(samples[Math.floor(Math.random() * samples.length)]);
      setUploadedFile(file);
    } catch (err) {
      setSampleError(err.message || 'Could not load a real sample image.');
    }
  };

  return <PageLayout>
    <PageHeader title="Ingestion & Preprocessing Workspace" subtitle="Upload a real chest radiograph for DenseNet121 inference">
      <span className={isBackendConnected ? 'text-xs text-emerald-400' : 'text-xs text-amber-400'}>{isBackendConnected ? 'Backend reachable' : 'Backend unavailable'}</span>
    </PageHeader>
    {(analysisError || sampleError) && <p role="alert" className="text-xs text-amber-400 mb-2"><AlertCircle className="inline w-3 h-3 mr-1"/>{analysisError || sampleError}</p>}
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden mb-3">
      <div className="h-full min-h-0"><UploadPanel uploadedFile={uploadedFile} filePreviewUrl={filePreviewUrl} onFileSelect={setUploadedFile} onFileRemove={() => setUploadedFile(null)} onLoadSample={handleLoadSample}/></div>
      <div className="h-full min-h-0"><ImagePreparationPanel filePreviewUrl={filePreviewUrl} selectedViewId={selectedView} onSelectView={v => setSelectedView(v.id)}/></div>
    </div>
    <Card padding="p-3" className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-400">{isBackendConnected ? 'Real FastAPI / PyTorch backend status reported online.' : 'Backend is unavailable. Analysis will fail visibly; no simulated prediction is returned.'}</p>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {!uploadedFile && <button onClick={handleLoadSample} className="text-xs text-indigo-400 hover:underline">Load real test radiograph</button>}
        <button onClick={() => runAnalysis(uploadedFile)} disabled={!uploadedFile || isAnalyzing || !isBackendConnected} className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 text-white disabled:opacity-40 flex items-center justify-center gap-2">
          {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin"/><span>Running actual analysis…</span></> : <><Play className="w-4 h-4"/><span>Analyze Radiograph</span></>}
        </button>
      </div>
    </Card>
  </PageLayout>;
}
