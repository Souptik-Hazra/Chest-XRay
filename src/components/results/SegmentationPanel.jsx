import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { Callout } from '../shared/index.js';
import './results.css';

export default function SegmentationPanel() {
  return <div className="segmentation-panel">
    <div className="segmentation-notice"><div className="segmentation-icon"><Layers/></div><h4>Opacity Segmentation Module Not Active</h4><p>Automated pixel-level lung lesion contouring is an optional research plugin currently excluded from this multi-agent execution pipeline.</p><span>Module Status: Skipped (Optional)</span></div>
    <Callout icon={AlertCircle} variant="blue" className="segmentation-callout"><strong>Why Segmentation Differs from Grad-CAM</strong><p>While <strong>Grad-CAM</strong> indicates neural network attention (which features the classification head relied upon), it does not produce segmented anatomical masks or calculate lesion volume percentage. A dedicated UNet or Mask R-CNN module is required for clinical contouring.</p></Callout>
    <div className="segmentation-roadmap"><h5>Future Roadmap Integration:</h5><ul><li><span/>UNet++ Bilateral Lung Field Masking (anatomical volume reference)</li><li><span/>Consolidation & Ground-Glass Opacity Area Ratio Metric (%)</li><li><span/>Confidence-weighted boundary delineation</li></ul></div>
  </div>;
}
