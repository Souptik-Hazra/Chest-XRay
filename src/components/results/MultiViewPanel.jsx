import React from 'react';
import { PREPARATION_VIEWS } from '../../data/preparationViews.js';
import { Info } from 'lucide-react';
import { Callout } from '../shared/index.js';
import './results.css';

export default function MultiViewPanel({ analysisResult = null, previewUrl = null }) {
  const result = analysisResult || {};
  const views = Array.isArray(result.multiview) ? result.multiview : [];
  if (!views.length) return <p className="results-muted">Per-view inference results are unavailable for this analysis.</p>;
  return <div className="multiview-panel">
    <div><h4>Transformed-input sensitivity check</h4><p>The same DenseNet121 checkpoint processes transformed versions of this image. This is not an independent ensemble or a validated accuracy improvement.</p></div>
    <div className="multiview-grid">{views.map(view => {
      const metadata = PREPARATION_VIEWS.find(item => item.id === view.id);
      return <div key={view.id} className="multiview-card">
        <div className="multiview-card__heading"><span>{metadata?.name || view.name || view.id}</span><span>{typeof view.confidence === 'number' ? (view.confidence * 100).toFixed(1) + '%' : 'Unavailable'}</span></div>
        {(view.previewUrl || previewUrl) && <img src={view.previewUrl || previewUrl} alt={`${view.name || view.id} inference input preview`}/>}
        <p>Predicted class: {view.predictedClass || 'Unavailable'}</p><p>Inference input: {view.name || view.id}</p>
      </div>;
    })}</div>
    <Callout icon={Info} variant="info">Aggregate output: <strong>{result.predictedClass || 'Unavailable'}</strong>{typeof result.confidence === 'number' ? ' (' + (result.confidence * 100).toFixed(1) + '% softmax score)' : ''}. Agreement across transformed inputs is a sensitivity diagnostic, not a clinical reliability guarantee.</Callout>
  </div>;
}
