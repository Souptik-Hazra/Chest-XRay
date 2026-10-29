import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { Callout } from '../shared/index.js';

export default function SegmentationPanel() {
  return (
    <div className="space-y-4">
      {/* Elegantly styled Not Available Notice */}
      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center flex flex-col items-center justify-center py-6">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Opacity Segmentation Module Not Active
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          Automated pixel-level lung lesion contouring is an optional research plugin currently excluded from this multi-agent execution pipeline.
        </p>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          Module Status: Skipped (Optional)
        </span>
      </div>

      {/* Explanation Cards */}
      <Callout icon={AlertCircle} variant="blue" className="p-3.5 rounded-xl">
        <strong className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Why Segmentation Differs from Grad-CAM</strong>
        <p className="text-[11px] text-blue-800 dark:text-blue-200/90 leading-relaxed">
          While <strong>Grad-CAM</strong> indicates neural network attention (which features the classification head relied upon), it does not produce segmented anatomical masks or calculate lesion volume percentage. A dedicated UNet or Mask R-CNN module is required for clinical contouring.
        </p>
      </Callout>

      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
        <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Future Roadmap Integration:
        </h5>
        <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>UNet++ Bilateral Lung Field Masking (anatomical volume reference)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Consolidation & Ground-Glass Opacity Area Ratio Metric (%)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Confidence-weighted boundary delineation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
