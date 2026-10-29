import React, { useState } from 'react';
import { Info, AlertTriangle, Sliders } from 'lucide-react';
import { Callout } from '../shared/index.js';

export default function GradCAMPanel({ previewUrl = null, gradcamUrl = null }) {
  const [opacity, setOpacity] = useState(0.7);
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div><span className="text-[11px] font-semibold block mb-1">Input Radiograph</span><div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">{previewUrl ? <img src={previewUrl} alt="Input radiograph" className="w-full h-full object-contain"/> : <p className="text-xs text-slate-500 p-3">Original image unavailable.</p>}</div></div>
      <div><span className="text-[11px] font-semibold block mb-1">Generated Grad-CAM</span><div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">{gradcamUrl ? <img src={gradcamUrl} alt="Model-generated Grad-CAM overlay" style={{opacity}} className="w-full h-full object-contain"/> : <p className="text-xs text-amber-400 p-3 text-center">No real Grad-CAM artifact was returned. No heatmap is shown.</p>}{gradcamUrl && <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-indigo-300">Generated artifact</span>}</div></div>
    </div>
    {gradcamUrl && <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between text-xs"><div className="flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-400"/><span>Heatmap opacity</span></div><div className="flex items-center gap-2"><input aria-label="Heatmap opacity" type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/><span>{Math.round(opacity*100)}%</span></div></div>}
    <Callout icon={AlertTriangle} variant="warning"><strong>Interpretation limits:</strong> Grad-CAM approximates regions that influence a selected model score. It does not prove disease, identify a specific lesion, or measure affected lung area.</Callout>
    <Callout icon={Info} variant="info">No anatomical location or lesion description is inferred from the heatmap by this panel.</Callout>
  </div>;
}
