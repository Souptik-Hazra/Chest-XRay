import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { Card } from '../shared/index.js';
import { PREPARATION_VIEWS } from '../../data/preparationViews.js';

export default function ImagePreparationPanel({
  filePreviewUrl = null,
  selectedViewId,
  onSelectView = () => {},
  isCompact = false,
}) {
  const [internalView, setInternalView] = useState('original');
  const currentView = selectedViewId ?? internalView;

  const handleSelect = (view) => {
    setInternalView(view.id);
    onSelectView(view);
  };

  const activeView = PREPARATION_VIEWS.find((view) => view.id === currentView) || PREPARATION_VIEWS[0];

  const renderPreview = (view, thumbnail = false) => (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        filter: view.filter !== 'none' && !view.filter.includes('scale') ? view.filter : undefined,
        transform: view.filter.includes('scale') ? (thumbnail ? 'scale(1.2)' : 'scale(1.25)') : undefined,
      }}
    >
      {filePreviewUrl ? (
        <img
          src={filePreviewUrl}
          alt={thumbnail ? view.name : 'Prepared radiograph'}
          className={thumbnail ? 'w-full h-full object-cover' : 'max-h-full max-w-full object-contain'}
        />
      ) : (
        <div className="p-3 text-center text-xs text-slate-500">
          Upload a radiograph to preview preprocessing
        </div>
      )}
    </div>
  );

  return (
    <Card
      padding={isCompact ? 'p-2.5 gap-2' : 'p-4 gap-3'}
      className="flex flex-col h-full min-h-0"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Image Preprocessing Views</span>
          </h3>
          {!isCompact && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preview the selected image transform. These views are not an independent model ensemble.
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800">
          Input sensitivity
        </span>
      </div>

      {!isCompact && (
        <div className="flex-1 min-h-[160px] max-h-[220px] bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
          {renderPreview(activeView)}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-slate-700 text-[11px] text-slate-200">
            {activeView.name} — {activeView.desc}
          </div>
        </div>
      )}

      <div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
          <span>Available preprocessing views</span>
          <span className="text-[10px] text-indigo-500">Select a view to preview</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PREPARATION_VIEWS.map((view) => {
            const isSelected = currentView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => handleSelect(view)}
                className={`flex flex-col items-center p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <div className="w-full h-12 bg-slate-950 rounded overflow-hidden flex items-center justify-center mb-1 relative border border-slate-800">
                  {renderPreview(view, true)}
                </div>
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate w-full text-center">
                  {view.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!isCompact && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center italic">
          These are visual previews of input transforms. They do not demonstrate model accuracy or guarantee a clinical benefit.
        </div>
      )}
    </Card>
  );
}
