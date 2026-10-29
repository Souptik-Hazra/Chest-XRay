import React, { useEffect, useState } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';
import { getModelInsights, getModelStatus } from '../services/analysisService.js';

export default function ModelInsightsPage() {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([getModelStatus(), getModelInsights()])
      .then(([model, result]) => { setStatus(model); setMetrics(result); })
      .catch(err => { setError(err.message || 'Could not load model information.'); });
  }, []);
  return <PageLayout>
    <PageHeader title="DenseNet121 Evaluation & Metrics" badge="VERIFIED DATA ONLY" subtitle="Metrics are shown only when supplied by a verified backend evaluation artifact."/>
    <Card padding="p-4" className="flex-1 min-h-0 overflow-auto space-y-4">
      {error && <p role="alert" className="text-xs text-amber-400"><AlertCircle className="inline w-4 h-4 mr-1"/>{error}</p>}
      <section><h3 className="text-sm font-semibold mb-2">Model runtime status</h3>{status ? <dl className="grid grid-cols-2 gap-3 text-xs"><dt className="text-slate-400">Checkpoint loaded</dt><dd>{status.loaded ? 'Yes' : 'No'}</dd><dt className="text-slate-400">Device</dt><dd>{status.device || 'Unavailable'}</dd><dt className="text-slate-400">Architecture</dt><dd>DenseNet121</dd><dt className="text-slate-400">Checkpoint path</dt><dd className="break-all">{status.checkpointPath || 'Unavailable'}</dd>{status.error && <><dt className="text-slate-400">Load error</dt><dd className="text-amber-400 break-all">{status.error}</dd></>}</dl> : <p className="text-xs text-slate-400">Loading model status…</p>}</section>
      <section className="border-t border-slate-800 pt-4"><h3 className="text-sm font-semibold mb-2">Evaluation metrics</h3>{metrics && Object.keys(metrics).length ? <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(metrics,null,2)}</pre> : <p className="text-xs text-slate-400">Unavailable. No verified evaluation artifact is currently exposed by the backend. Accuracy, calibration, multi-view gain and OOD benchmarks will not be fabricated.</p>}</section>
      <p className="text-[11px] text-slate-500"><Info className="inline w-3 h-3 mr-1"/>Prediction confidence is a softmax score and should not be interpreted as a calibrated clinical probability.</p>
    </Card>
  </PageLayout>;
}
