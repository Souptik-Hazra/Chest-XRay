import React, { useState, useRef } from 'react';
import ViewerControls from './ViewerControls.jsx';

export function ChestXRaySVG({ className = "w-full h-full" }) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="500" height="500" fill="#0b0f19" />
      {/* Background Soft Lung Glow */}
      <ellipse cx="180" cy="240" rx="90" ry="140" fill="#1e293b" opacity="0.6" />
      <ellipse cx="320" cy="250" rx="90" ry="135" fill="#1e293b" opacity="0.6" />

      {/* Spine / Column */}
      <path
        d="M250 50 L250 450"
        stroke="#475569"
        strokeWidth="16"
        strokeDasharray="8 4"
        opacity="0.75"
      />

      {/* Clavicles */}
      <path
        d="M130 110 Q210 120 250 140 Q290 120 370 110"
        stroke="#64748b"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Rib Cages Left */}
      <path d="M245 160 Q170 170 140 200" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M245 190 Q160 205 130 240" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M245 220 Q150 240 125 280" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M245 250 Q150 275 130 320" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M245 280 Q160 310 140 360" stroke="#334155" strokeWidth="8" strokeLinecap="round" />

      {/* Rib Cages Right */}
      <path d="M255 160 Q330 170 360 200" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M255 190 Q340 205 370 240" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M255 220 Q350 240 375 280" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M255 250 Q350 275 370 320" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
      <path d="M255 280 Q340 310 360 360" stroke="#334155" strokeWidth="8" strokeLinecap="round" />

      {/* Heart Contour (Cardiac silhouette) */}
      <path
        d="M245 230 C220 230 190 260 200 320 C205 350 240 370 270 370 C290 370 295 340 295 320 C295 270 270 230 245 230 Z"
        fill="#1e293b"
        stroke="#475569"
        strokeWidth="4"
        opacity="0.9"
      />

      {/* Diaphragm Left & Right */}
      <path
        d="M100 390 Q170 340 230 370"
        stroke="#475569"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M270 370 Q330 340 400 390"
        stroke="#475569"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />

      {/* Subtle Bronchial Vascular markings */}
      <circle cx="210" cy="220" r="15" fill="#334155" opacity="0.4" />
      <circle cx="290" cy="225" r="14" fill="#334155" opacity="0.4" />

      {/* Orientation Anatomical Markers */}
      <text x="30" y="50" fill="#94a3b8" fontSize="22" fontWeight="bold" fontFamily="sans-serif">R</text>
      <text x="450" y="50" fill="#94a3b8" fontSize="22" fontWeight="bold" fontFamily="sans-serif">L</text>
      <text x="30" y="470" fill="#64748b" fontSize="12" fontFamily="sans-serif">PA ERECT CHEST</text>
      <text x="350" y="470" fill="#64748b" fontSize="12" fontFamily="sans-serif">120kV 3.2mAs</text>
    </svg>
  );
}

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
            <div
              style={{ filter: filterStyle }}
              className="w-[380px] h-[380px] rounded overflow-hidden shadow-2xl border border-slate-800 transition-all duration-200"
            >
              <ChestXRaySVG />
            </div>
          )}

          {/* Real Grad-CAM Artifact Image from PyTorch Backend */}
          {isShowingHeatmap && gradcamUrl ? (
            <img
              src={gradcamUrl}
              alt="Grad-CAM Overlay"
              className="absolute inset-0 max-h-[380px] w-auto mx-auto object-contain pointer-events-none transition-opacity duration-200"
              style={{ opacity: overlayOpacity }}
            />
          ) : isShowingHeatmap ? (
            <>
              {/* Fallback CSS gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: overlayOpacity,
                  background:
                    'radial-gradient(circle 95px at 38% 66%, rgba(239,68,68,0.92) 0%, rgba(245,158,11,0.75) 45%, rgba(59,130,246,0.3) 72%, transparent 95%)',
                  mixBlendMode: 'screen',
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: overlayOpacity * 0.7,
                  background:
                    'radial-gradient(circle 55px at 62% 52%, rgba(245,158,11,0.8) 0%, rgba(59,130,246,0.25) 60%, transparent 90%)',
                  mixBlendMode: 'screen',
                }}
              />
            </>
          ) : null}
        </div>

        {/* Informative Heatmap tag when active */}
        {isShowingHeatmap && (
          <div className="absolute bottom-2.5 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur border border-indigo-500/40 text-[10px] text-indigo-300 flex items-center gap-1.5 shadow-md z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>{gradcamUrl ? 'Grad-CAM Saliency (features.denseblock4)' : 'Activation Heatmap'}</span>
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
