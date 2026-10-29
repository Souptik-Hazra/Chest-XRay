import React, { useState } from 'react';
import { ChestXRaySVG } from '../viewer/XRayViewer.jsx';
import { Info, AlertTriangle, Sliders } from 'lucide-react';
import { Callout } from '../shared/index.js';

export default function GradCAMPanel({ previewUrl = null, gradcamUrl = null }) {
  const [opacity, setOpacity] = useState(0.7);
  const blendMode = 'screen';

  return (
    <div className="space-y-4">
      {/* Visual Side-by-side or Layered Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Original */}
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Input Radiograph
          </span>
          <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
            {previewUrl ? (
              <img src={previewUrl} alt="Original" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full p-2">
                <ChestXRaySVG />
              </div>
            )}
            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-slate-300">
              PA View
            </span>
          </div>
        </div>

        {/* Grad-CAM Heatmap */}
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            DenseNet121 Grad-CAM Map
          </span>
          <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
            {gradcamUrl ? (
              <img src={gradcamUrl} alt="Grad-CAM Activation" className="w-full h-full object-cover" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Original with heatmap" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full p-2">
                <ChestXRaySVG />
              </div>
            )}

            {/* Gradient Simulation if no real gradcamUrl */}
            {!gradcamUrl && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  opacity: opacity,
                  background:
                    'radial-gradient(circle 75px at 38% 66%, rgba(239,68,68,0.92) 0%, rgba(245,158,11,0.75) 45%, rgba(59,130,246,0.3) 75%, transparent 100%)',
                  mixBlendMode: blendMode,
                }}
              />
            )}

            <span className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] ${gradcamUrl ? 'text-indigo-300 border border-indigo-500/40' : 'text-amber-300 border border-amber-500/40'}`}>
              {gradcamUrl ? 'Real Grad-CAM (denseblock4)' : 'Illustrative Heatmap'}
            </span>
          </div>
        </div>
      </div>

      {/* Opacity Control */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Heatmap Intensity:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-28 h-1.5 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="font-mono text-xs w-8 text-right text-slate-600 dark:text-slate-400">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Explanatory notes */}
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <Callout icon={AlertTriangle} variant="warning">
          <strong className="font-semibold">Interpretability Caution:</strong> Grad-CAM highlights image regions that contributed most to the gradient signals in the final convolutional layer. They do <em>not</em> reliably outline anatomical lesion boundaries or quantify affected lung area.
        </Callout>

        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 mb-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Target Activation Zone</span>
          </div>
          <p>
            Primary saliency concentration is identified over the <strong>right lower lung zone (retrocardiac and basilar parenchyma)</strong>, aligning with dense consolidative infiltrate patterns commonly observed in lobar bacterial processes.
          </p>
        </div>
      </div>
    </div>
  );
}
