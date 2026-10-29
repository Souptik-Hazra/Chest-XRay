import React, { useState } from 'react';
import { Layers, AlertCircle, ScanSearch } from 'lucide-react';
import { Callout } from '../shared/index.js';
import './results.css';

export default function SegmentationPanel({ analysisResult = null }) {
  const [showMask, setShowMask] = useState(false);
  const segmentation = analysisResult?.segmentation;
  const available = segmentation?.status === 'completed' || segmentation?.status === 'no_region_detected';

  if (!available) {
    const disabled = segmentation?.status === 'disabled';
    return <div className="segmentation-panel">
      <div className="segmentation-notice">
        <div className="segmentation-icon"><Layers /></div>
        <h4>{disabled ? 'Opacity Segmentation Disabled' : 'Opacity Segmentation Unavailable'}</h4>
        <p>{segmentation?.message || 'Enable and load the optional pretrained segmentation model to generate an opacity mask.'}</p>
        <span>Module Status: {disabled ? 'Disabled by configuration' : 'Unavailable'}</span>
      </div>
      <Callout icon={AlertCircle} variant="info">
        <strong>Segmentation is different from Grad-CAM.</strong>
        Grad-CAM highlights features influencing the classifier. This optional model predicts a separate binary opacity mask. Neither output is a verified clinical lesion contour.
      </Callout>
    </div>;
  }

  return <div className="segmentation-panel">
    <div className="segmentation-heading">
      <div><ScanSearch /><div><h4>Pneumonia-related opacity mask</h4><p>Separate pretrained segmentation model · {segmentation.modelId}</p></div></div>
      <button type="button" className="segmentation-toggle" onClick={() => setShowMask(value => !value)}>{showMask ? 'Show overlay' : 'Show mask'}</button>
    </div>
    <div className="segmentation-image-wrap">
      <img src={showMask ? segmentation.maskUrl : segmentation.overlayUrl} alt={showMask ? 'Predicted binary opacity mask' : 'Chest X-ray with predicted opacity regions overlaid'} />
    </div>
    <div className="segmentation-metrics">
      <div><span>Predicted mask area</span><strong>{segmentation.areaPercent}%</strong></div>
      <div><span>Mean score in mask</span><strong>{(segmentation.meanMaskScore * 100).toFixed(1)}%</strong></div>
      <div><span>Threshold</span><strong>{segmentation.threshold}</strong></div>
    </div>
    {segmentation.thresholdAreaPercent && <div className="segmentation-threshold-check">
      <span>Mask area at alternate thresholds</span>
      <div>
        <span>0.3: {segmentation.thresholdAreaPercent["0.3"]}%</span>
        <span>0.5: {segmentation.thresholdAreaPercent["0.5"]}%</span>
        <span>0.7: {segmentation.thresholdAreaPercent["0.7"]}%</span>
      </div>
      <small>Large changes indicate threshold sensitivity, not segmentation accuracy.</small>
    </div>}
    <Callout icon={AlertCircle} variant="warning">
      <strong>Research limitation.</strong> {segmentation.limitations} The mask area is the percentage of the full image covered by the predicted mask, not a lung-area ratio. A blank mask does not rule out disease.
    </Callout>
  </div>;
}
