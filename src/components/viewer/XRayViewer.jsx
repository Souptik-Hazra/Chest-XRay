import React, { useState, useRef } from 'react';
import ViewerControls from './ViewerControls.jsx';

export default function XRayViewer({
  imageUrl = null,
  gradcamUrl = null,
  title = "Frontal PA Chest Radiograph",
  isGradcamActive = false,
  showHeatmapAlways = false,
  activeView = null,
}) {
  const [zoom, setZoom] = useState(1.0);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(isGradcamActive || showHeatmapAlways);
  const [prevGradcamActive, setPrevGradcamActive] = useState(isGradcamActive);
  if (prevGradcamActive !== isGradcamActive) {
    setPrevGradcamActive(isGradcamActive);
    if (isGradcamActive) {
      setShowOverlay(true);
    }
  }
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const handleZoomIn = () => setZoom((z) => Math.min(3.0, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleReset = () => setZoom(1.0);
  const handleFit = () => setZoom(1.0);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const renderImageContent = (withOverlay = false, customBadge = null, applyView = true) => {
    const isShowingHeatmap = withOverlay || showOverlay;

    // View specific filter and scaling
    const hasFilter = applyView && activeView && activeView.filter && activeView.filter !== 'none';
    const isScale = Boolean(hasFilter && activeView.filter.includes('scale'));
    const isAugmented = Boolean(applyView && activeView && activeView.id === 'augmented');

    const filterStyle = hasFilter && !isScale ? activeView.filter : undefined;
    const viewScale = isScale ? 1.25 : 1.0;
    const rotationTransform = isAugmented ? 'rotate(3deg)' : '';

    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
        <div
          className="relative transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `scale(${zoom * viewScale}) ${rotationTransform}`,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Chest X-Ray"
              style={{ filter: filterStyle }}
              className="max-h-[380px] w-auto object-contain rounded shadow-2xl pointer-events-none transition-all duration-200"
            />
          ) : (
            <div className="w-[380px] h-[380px] flex items-center justify-center rounded border border-slate-800 text-sm text-slate-500">Upload a radiograph to view it</div>
          )}

          {/* Real Grad-CAM Artifact Image from PyTorch Backend */}
          {isShowingHeatmap && gradcamUrl ? (
            <img
              src={gradcamUrl}
              alt="Grad-CAM Overlay"
              className="absolute inset-0 max-h-[380px] w-auto mx-auto object-contain pointer-events-none transition-opacity duration-200"
              style={{ opacity: overlayOpacity }}
            />
          ) : null}
        </div>

        {/* Informative Heatmap tag when active */}
        {isShowingHeatmap && gradcamUrl && (
          <div className="absolute bottom-2.5 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur border border-indigo-500/40 text-[10px] text-indigo-300 flex items-center gap-1.5 shadow-md z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Grad-CAM saliency (approximate)</span>
          </div>
        )}

        {/* View Indicator Badge */}
        {customBadge ? (
          <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur border border-slate-700 text-[11px] text-slate-300 font-medium z-10">
            {customBadge}
          </div>
        ) : activeView && activeView.id !== 'original' ? (
          <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur border border-indigo-500/60 text-[11px] text-indigo-300 font-semibold z-10 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>View: {activeView.name}</span>
            <span className="text-[10px] text-slate-400 font-normal">({activeView.desc})</span>
          </div>
        ) : title ? (
          <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur border border-slate-800 text-[11px] text-slate-400 font-medium z-10">
            {title}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-md min-h-0"
    >
      {/* Top Toolbar */}
      <ViewerControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onFit={handleFit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isCompareMode={isCompareMode}
        onToggleCompare={() => setIsCompareMode((v) => !v)}
        showOverlay={showOverlay}
        onToggleOverlay={() => setShowOverlay((v) => !v)}
        overlayOpacity={overlayOpacity}
        onChangeOpacity={setOverlayOpacity}
      />

      {/* Main View Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden flex">
        {isCompareMode ? (
          <div className="w-full h-full grid grid-cols-2 divide-x divide-slate-800">
            {/* Left: Original PA Projection */}
            <div className="relative w-full h-full">
              {renderImageContent(false, "Original PA View", false)}
            </div>
            {/* Right: Active Transformed View or Grad-CAM */}
            <div className="relative w-full h-full">
              {renderImageContent(
                showOverlay,
                activeView && activeView.id !== 'original'
                  ? `Transformed: ${activeView.name}`
                  : (gradcamUrl ? "Grad-CAM Saliency Overlay" : "Transformed View"),
                true
              )}
            </div>
          </div>
        ) : (
          renderImageContent(false, null, true)
        )}
      </div>
    </div>
  );
}
