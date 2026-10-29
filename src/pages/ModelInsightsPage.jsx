import React, { useEffect, useState } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';
import { getModelInsights, getModelStatus } from '../services/analysisService.js';

function RuntimeStatus({ status }) {
  if (!status) return <p className="text-xs text-slate-400">Loading model status…</p>;
  const rows = [
    ['Checkpoint loaded', status.loaded ? 'Yes' : 'No'],
    ['Device', status.device || 'Unavailable'],
    ['Architecture', 'DenseNet121'],
    ['Checkpoint path', status.checkpointPath || 'Unavailable'],
    ...(status.error ? [['Load error', status.error]] : []),
  ];
  return <dl className="grid grid-cols-2 gap-3 text-xs">
    {rows.map(([label,value])=><React.Fragment key={label}><dt className="text-slate-400">{label}</dt><dd className="break-all">{value}</dd></React.Fragment>)}
  </dl>;
}

export default function ModelInsightsPage() {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    getModelStatus().then(setStatus).catch(error => setStatusError(error.message || 'Could not load model status.'));
    getModelInsights().then(setMetrics).catch(error => setMetricsError(error.message || 'Could not load evaluation metrics.'));
  }, []);

  return (
    <PageLayout>
      <PageHeader title="DenseNet121 Evaluation & Metrics" badge="VERIFIED DATA ONLY" subtitle="Metrics are shown only when supplied by a verified backend evaluation artifact." />
      <Card padding="p-4" className="flex-1 min-h-0 overflow-auto space-y-4">
        <section>
          <h3 className="text-sm font-semibold mb-2">Model runtime status</h3>
          {statusError && <p role="alert" className="text-xs text-amber-400 mb-2"><AlertCircle className="inline w-4 h-4 mr-1"/>{statusError}</p>}
          <RuntimeStatus status={status} />
        </section>
        <section className="border-t border-slate-800 pt-4">
          <h3 className="text-sm font-semibold mb-2">Evaluation metrics</h3>
          {metricsError
            ? <p className="text-xs text-slate-400">{metricsError}</p>
            : metrics && Object.keys(metrics).length
              ? <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(metrics,null,2)}</pre>
              : <p className="text-xs text-slate-400">Unavailable. No verified evaluation artifact is exposed by the backend.</p>}
        </section>
        <p className="text-[11px] text-slate-500"><Info className="inline w-3 h-3 mr-1"/>Prediction confidence is a softmax score, not necessarily a calibrated clinical probability.</p>
      </Card>
    </PageLayout>
  );
}
