import React, { useState, useRef } from 'react';
import ViewerControls from './ViewerControls.jsx';
import './viewer.css';

export default function XRayViewer({ imageUrl = null, gradcamUrl = null, title = 'Frontal PA Chest Radiograph', isGradcamActive = false, showHeatmapAlways = false, activeView = null }) {
  const [zoom, setZoom] = useState(1);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(isGradcamActive || showHeatmapAlways);
  const [prevGradcamActive, setPrevGradcamActive] = useState(isGradcamActive);
  if (prevGradcamActive !== isGradcamActive) {
    setPrevGradcamActive(isGradcamActive);
    if (isGradcamActive) setShowOverlay(true);
  }
  const [overlayOpacity, setOverlayOpacity] = useState(.65);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    else document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
  };
  const renderImage = (src, badge, overlay = false) => <div className="xray-image-stage">
    <div className="xray-image-transform" style={{transform:`scale(${zoom})`}}>
      {src ? <img src={src} alt="Chest X-Ray" className="xray-image"/> : <div className="xray-image-empty">Upload a radiograph to view it</div>}
      {overlay && showOverlay && gradcamUrl && <img src={gradcamUrl} alt="Grad-CAM Overlay" className="xray-heatmap" style={{opacity:overlayOpacity}}/>}
    </div>
    {overlay && showOverlay && gradcamUrl && <div className="xray-heatmap-label"><span/>Grad-CAM saliency (approximate)</div>}
    <div className="xray-view-badge">{badge}</div>
  </div>;
  return <div ref={containerRef} className="xray-viewer">
    <ViewerControls zoom={zoom} onZoomIn={() => setZoom(value => Math.min(3, +(value + .25).toFixed(2)))} onZoomOut={() => setZoom(value => Math.max(.5, +(value - .25).toFixed(2)))} onReset={() => setZoom(1)} onFit={() => setZoom(1)} isFullscreen={isFullscreen} onToggleFullscreen={handleToggleFullscreen} isCompareMode={isCompareMode} onToggleCompare={() => setIsCompareMode(value => !value)} showOverlay={showOverlay} onToggleOverlay={() => setShowOverlay(value => !value)} overlayOpacity={overlayOpacity} onChangeOpacity={setOverlayOpacity}/>
    <div className="xray-view-area">{isCompareMode ? <div className="xray-compare-grid"><div>{renderImage(activeView?.originalUrl || imageUrl, 'Original PA View')}</div><div>{renderImage(imageUrl, activeView?.name || 'Selected transformed view', true)}</div></div> : renderImage(imageUrl, activeView?.name || title, true)}</div>
  </div>;
}
