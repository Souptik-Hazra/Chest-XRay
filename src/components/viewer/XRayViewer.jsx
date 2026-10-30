import React, { useState, useRef, useEffect } from 'react';
import ViewerControls from './ViewerControls.jsx';
import './viewer.css';

export default function XRayViewer({ imageUrl = null, gradcamUrl = null, title = 'Frontal PA Chest Radiograph', isGradcamActive = false, showHeatmapAlways = false, activeView = null, canCompare = true, onCompareStart = null }) {
  const [zoom, setZoom] = useState(1);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(isGradcamActive || showHeatmapAlways);
  const [prevGradcamActive, setPrevGradcamActive] = useState(isGradcamActive);
  if (prevGradcamActive !== isGradcamActive) {
    setPrevGradcamActive(isGradcamActive);
    if (isGradcamActive) setShowOverlay(true);
  }
  useEffect(() => {
    if (!canCompare) setIsCompareMode(false);
    if (!gradcamUrl) setShowOverlay(false);
  }, [canCompare, gradcamUrl]);
  const [overlayOpacity, setOverlayOpacity] = useState(.65);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };
  const renderImage = (src, badge, overlay = false) => <div className="xray-image-stage">
    <div className="xray-image-transform" style={{transform:`scale(${zoom})`}}>
      {src ? <img src={src} alt="Chest X-Ray" className="xray-image"/> : <div className="xray-image-empty">Upload a radiograph to view it</div>}
      {overlay && showOverlay && gradcamUrl && <img src={gradcamUrl} alt="Grad-CAM heatmap" className="xray-heatmap" style={{opacity:overlayOpacity}}/>}
    </div>
    {overlay && showOverlay && gradcamUrl && <div className="xray-heatmap-label"><span/>Grad-CAM saliency (approximate)</div>}
    <div className="xray-view-badge">{badge}</div>
  </div>;
  return <div ref={containerRef} className="xray-viewer">
    <ViewerControls zoom={zoom} onZoomIn={() => setZoom(value => Math.min(3, +(value + .25).toFixed(2)))} onZoomOut={() => setZoom(value => Math.max(.5, +(value - .25).toFixed(2)))} onReset={() => setZoom(1)} onFit={() => setZoom(1)} isFullscreen={isFullscreen} onToggleFullscreen={handleToggleFullscreen} isCompareMode={isCompareMode && canCompare} onToggleCompare={() => { if (!isCompareMode) onCompareStart?.(); setIsCompareMode(value => !value); }} showOverlay={showOverlay && Boolean(gradcamUrl)} onToggleOverlay={() => setShowOverlay(value => !value)} overlayOpacity={overlayOpacity} onChangeOpacity={setOverlayOpacity} canCompare={canCompare} canOverlay={Boolean(gradcamUrl)}/>
    <div className="xray-view-area">{isCompareMode && canCompare ? <div className="xray-compare-grid"><div>{renderImage(activeView?.originalUrl || imageUrl, 'Original PA View')}</div><div>{renderImage(imageUrl, activeView?.name || 'Selected transformed view', true)}</div></div> : renderImage(imageUrl, activeView?.name || title, true)}</div>
  </div>;
}
