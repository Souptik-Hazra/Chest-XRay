import React, { useState } from 'react';
import { ChestXRaySVG } from '../viewer/XRayViewer.jsx';
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

  const handleSelect = (v) => {
    setInternalView(v.id);
    onSelectView(v);
  };

  const activeViewObj = PREPARATION_VIEWS.find((v) => v.id === currentView) || PREPARATION_VIEWS[0];

  return (
    <Card
      padding={isCompact ? 'p-2.5 gap-2' : 'p-4 gap-3'}
      className="flex flex-col h-full min-h-0"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Multi-View Preprocessing Pipeline</span>
          </h3>
          {!isCompact && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5 synthetic inputs synthesized for DenseNet121 ensemble consensus
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800">
          5-View Consensus Pipeline
        </span>
      </div>

      {/* Main Preview Box (if not compact) */}
      {!isCompact && (
        <div className="flex-1 min-h-[160px] max-h-[220px] bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{
              filter: activeViewObj.filter !== 'none' && !activeViewObj.filter.includes('scale') ? activeViewObj.filter : undefined,
              transform: activeViewObj.filter.includes('scale') ? 'scale(1.25)' : undefined,
            }}
          >
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt="Prepared View"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="w-[180px] h-[180px]">
                <ChestXRaySVG />
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-slate-700 text-[11px] text-slate-200">
            {activeViewObj.name} — {activeViewObj.desc}
          </div>
        </div>
      )}

      {/* 5 View Thumbnails */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
          <span>Synthesized Pipeline Views</span>
          <span className="text-[10px] text-indigo-500">Click view to preview</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PREPARATION_VIEWS.map((v) => {
            const isSelected = currentView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelect(v)}
                className={`flex flex-col items-center p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <div className="w-full h-12 bg-slate-950 rounded overflow-hidden flex items-center justify-center mb-1 relative border border-slate-800">
                  <div
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    style={{
                      filter: v.filter !== 'none' && !v.filter.includes('scale') ? v.filter : undefined,
                      transform: v.filter.includes('scale') ? 'scale(1.2)' : undefined,
                    }}
                  >
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt={v.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="scale-50">
                        <ChestXRaySVG />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate w-full text-center">
                  {v.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!isCompact && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center italic">
          Preprocessing transforms simulate Test-Time Augmentation (TTA) and CLAHE normalization executed by the pipeline worker.
        </div>
      )}
    </Card>
  );
}
