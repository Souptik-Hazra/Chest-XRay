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
  const handleZoomIn = () => setZoom(z => Math.min(3, +(z + .25).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(.5, +(z - .25).toFixed(2)));
  const handleReset = () => setZoom(1);
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    else document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
  };
  const renderImageContent = (withOverlay = false, customBadge = null, applyView = true) => {
    const isShowingHeatmap = withOverlay || showOverlay;
    const hasFilter = applyView && activeView?.filter && activeView.filter !== 'none';
    const isScale = Boolean(hasFilter && activeView.filter.includes('scale'));
    const isAugmented = Boolean(applyView && activeView?.id === 'augmented');
    const filterStyle = hasFilter && !isScale ? activeView.filter : undefined;
    const viewScale = isScale ? 1.25 : 1;
    const rotationTransform = isAugmented ? 'rotate(3deg)' : '';
    return <div className="xray-image-stage">
      <div className="xray-image-transform" style={{transform:`scale(${zoom * viewScale}) ${rotationTransform}`}}>
        {imageUrl ? <img src={imageUrl} alt="Chest X-Ray" style={{filter:filterStyle}} className="xray-image"/> : <div className="xray-image-empty">Upload a radiograph to view it</div>}
        {isShowingHeatmap && gradcamUrl ? <img src={gradcamUrl} alt="Grad-CAM Overlay" className="xray-heatmap" style={{opacity:overlayOpacity}}/> : null}
      </div>
      {isShowingHeatmap && gradcamUrl && <div className="xray-heatmap-label"><span/>Grad-CAM saliency (approximate)</div>}
      {customBadge ? <div className="xray-view-badge">{customBadge}</div> : activeView && activeView.id !== 'original' ? <div className="xray-view-badge xray-view-badge--active"><span/> <span>View: {activeView.name}</span><small>({activeView.desc})</small></div> : title ? <div className="xray-view-badge xray-view-badge--title">{title}</div> : null}
    </div>;
  };
  return <div ref={containerRef} className="xray-viewer">
    <ViewerControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} onFit={handleReset} isFullscreen={isFullscreen} onToggleFullscreen={handleToggleFullscreen} isCompareMode={isCompareMode} onToggleCompare={() => setIsCompareMode(v => !v)} showOverlay={showOverlay} onToggleOverlay={() => setShowOverlay(v => !v)} overlayOpacity={overlayOpacity} onChangeOpacity={setOverlayOpacity}/>
    <div className="xray-view-area">{isCompareMode ? <div className="xray-compare-grid"><div>{renderImageContent(false,'Original PA View',false)}</div><div>{renderImageContent(showOverlay,activeView && activeView.id !== 'original' ? `Transformed: ${activeView.name}` : (gradcamUrl ? 'Grad-CAM Saliency Overlay' : 'Transformed View'),true)}</div></div> : renderImageContent(false,null,true)}</div>
  </div>;
}
