import React, { useState } from 'react';
import { Info, AlertTriangle, Sliders } from 'lucide-react';
import { Callout } from '../shared/index.js';
import './results.css';

export default function GradCAMPanel({ previewUrl = null, gradcamUrl = null }) {
  const [opacity, setOpacity] = useState(0.7);
  return <div className="gradcam-panel">
    <div className="gradcam-grid">
      <div><span className="gradcam-label">Input Radiograph</span><div className="gradcam-image">{previewUrl ? <img src={previewUrl} alt="Input radiograph"/> : <p>Original image unavailable.</p>}</div></div>
      <div><span className="gradcam-label">Generated Grad-CAM</span><div className="gradcam-image gradcam-image--overlay">{gradcamUrl ? <img src={gradcamUrl} alt="Model-generated Grad-CAM overlay" style={{opacity}}/> : <p className="gradcam-missing">No real Grad-CAM artifact was returned. No heatmap is shown.</p>}{gradcamUrl && <span className="gradcam-artifact">Generated artifact</span>}</div></div>
    </div>
    {gradcamUrl && <div className="gradcam-slider"><div><Sliders/><span>Heatmap opacity</span></div><div><input aria-label="Heatmap opacity" type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/><span>{Math.round(opacity*100)}%</span></div></div>}
    <Callout icon={AlertTriangle} variant="warning"><strong>Interpretation limits:</strong> Grad-CAM approximates regions that influence a selected model score. It does not prove disease, identify a specific lesion, or measure affected lung area.</Callout>
    <Callout icon={Info} variant="info">No anatomical location or lesion description is inferred from the heatmap by this panel.</Callout>
  </div>;
}
