import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Sliders, Layers, Columns2 } from 'lucide-react';
import './viewer.css';

export default function ViewerControls({ zoom, onZoomIn, onZoomOut, onReset, onFit, isFullscreen, onToggleFullscreen, isCompareMode, onToggleCompare, showOverlay, onToggleOverlay, overlayOpacity, onChangeOpacity, canCompare = true, canOverlay = true }) {
  return <div className="viewer-controls">
    <div className="viewer-control-group">
      <button onClick={onZoomOut} disabled={zoom<=.5} title="Zoom Out" className="viewer-icon-button"><ZoomOut/></button><span className="viewer-zoom">{Math.round(zoom*100)}%</span><button onClick={onZoomIn} disabled={zoom>=3} title="Zoom In" className="viewer-icon-button"><ZoomIn/></button><span className="viewer-separator"/><button onClick={onFit} title="Fit to Container" className="viewer-fit-button">Fit</button><button onClick={onReset} title="Reset Zoom & Position" className="viewer-icon-button"><RotateCcw/></button>
    </div>
    <div className="viewer-control-group">
      <button onClick={onToggleCompare} disabled={!canCompare} title={canCompare ? "Toggle Side-by-Side Comparison" : "Select a transformed view to compare"} className={`viewer-mode-button ${isCompareMode?'viewer-mode-button--compare':''}`}><Columns2/><span>Compare</span></button>
      <button onClick={onToggleOverlay} disabled={!canOverlay} title={canOverlay ? "Toggle Grad-CAM Overlay" : "Grad-CAM is available on the original image only"} className={`viewer-mode-button ${showOverlay?'viewer-mode-button--overlay':''}`}><Layers/><span>Grad-CAM</span></button>
      {canOverlay && showOverlay && <div className="viewer-opacity"><Sliders/><input type="range" min="0.1" max="1.0" step="0.05" value={overlayOpacity} onChange={e=>onChangeOpacity(parseFloat(e.target.value))} title={`Overlay Opacity: ${Math.round(overlayOpacity*100)}%`}/></div>}
      <span className="viewer-separator"/><button onClick={onToggleFullscreen} title={isFullscreen?'Exit Fullscreen':'Fullscreen'} className="viewer-icon-button">{isFullscreen?<Minimize2/>:<Maximize2/>}</button>
    </div>
  </div>;
}
