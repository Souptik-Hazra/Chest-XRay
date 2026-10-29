import React from 'react';
import { PREPARATION_VIEWS } from '../../data/preparationViews.js';
import { Info } from 'lucide-react';
import { Callout } from '../shared/index.js';

export default function MultiViewPanel({ analysisResult = null, previewUrl = null }) {
  const result = analysisResult || {};
  const views = Array.isArray(result.multiview) ? result.multiview : [];
  if (!views.length) return <p className="text-xs text-slate-500">Per-view inference results are unavailable for this analysis.</p>;
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Transformed-input sensitivity check</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">The same DenseNet121 checkpoint processes transformed versions of this image. This is not an independent ensemble or a validated accuracy improvement.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {views.map((view) => {
          const metadata = PREPARATION_VIEWS.find((item) => item.id === view.id);
          return (
            <div key={view.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">{metadata?.name || view.name || view.id}</span>
                <span className="font-mono text-slate-500">{typeof view.confidence === 'number' ? (view.confidence * 100).toFixed(1) + '%' : 'Unavailable'}</span>
              </div>
              {previewUrl && <img src={previewUrl} alt="Uploaded radiograph" className="w-full aspect-[4/3] object-contain bg-black rounded mb-2" />}
              <p className="text-[10px] text-slate-500">Predicted class: {view.predictedClass || 'Unavailable'}</p>
              <p className="text-[10px] text-slate-500">Input variant: {view.name || view.id}</p>
            </div>
          );
        })}
      </div>
      <Callout icon={Info} variant="info">
        Aggregate output: <strong>{result.predictedClass || 'Unavailable'}</strong>
        {typeof result.confidence === 'number' ? ' (' + (result.confidence * 100).toFixed(1) + '% softmax score)' : ''}. Agreement across transformed inputs is a sensitivity diagnostic, not a clinical reliability guarantee.
      </Callout>
    </div>
  );
}
