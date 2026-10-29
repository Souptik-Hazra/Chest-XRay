import React, { useEffect, useState } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { PageLayout, PageHeader, Card } from '../components/shared/index.js';
import { getModelInsights, getModelStatus } from '../services/analysisService.js';
import './pages.css';

function RuntimeStatus({ status }) {
  if (!status) return <p className="insights-muted">Loading model status…</p>;
  const rows = [
    ['Checkpoint loaded', status.loaded ? 'Yes' : 'No'],
    ['Device', status.device || 'Unavailable'],
    ['Architecture', 'DenseNet121'],
    ['Checkpoint path', status.checkpointPath || 'Unavailable'],
    ...(status.error ? [['Load error', status.error]] : []),
  ];
  return <dl className="insights-runtime-grid">
    {rows.map(([label,value])=><React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}
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
      <Card padding="card-padding-lg" className="insights-card">
        <section>
          <h3 className="insights-heading">Model runtime status</h3>
          {statusError && <p role="alert" className="insights-alert"><AlertCircle className="insights-inline-alert-icon"/>{statusError}</p>}
          <RuntimeStatus status={status} />
        </section>
        <section className="insights-metrics-section">
          <h3 className="insights-heading">Evaluation metrics</h3>
          {metricsError
            ? <p className="insights-muted">{metricsError}</p>
            : metrics && Object.keys(metrics).length
              ? <pre className="insights-json">{JSON.stringify(metrics,null,2)}</pre>
              : <p className="insights-muted">Unavailable. No verified evaluation artifact is exposed by the backend.</p>}
        </section>
        <p className="insights-footnote"><Info className="insights-inline-info-icon"/>Prediction confidence is a softmax score, not necessarily a calibrated clinical probability.</p>
      </Card>
    </PageLayout>
  );
}
