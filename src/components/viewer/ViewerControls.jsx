import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Layers,
  Columns2,
} from 'lucide-react';

export default function ViewerControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  isFullscreen,
  onToggleFullscreen,
  isCompareMode,
  onToggleCompare,
  showOverlay,
  onToggleOverlay,
  overlayOpacity,
  onChangeOpacity,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur text-white border-b border-slate-800 text-xs select-none">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          <ZoomOut className="w-4 h-4 text-slate-300" />
        </button>

        <span className="font-mono text-[11px] min-w-[42px] text-center text-slate-300">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          disabled={zoom >= 3.0}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-slate-800 active:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          <ZoomIn className="w-4 h-4 text-slate-300" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          onClick={onFit}
          title="Fit to Container"
          className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
        >
          Fit
        </button>

        <button
          onClick={onReset}
          title="Reset Zoom & Position"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode Controls */}
      <div className="flex items-center gap-2">
        {/* Compare Toggle */}
        <button
          onClick={onToggleCompare}
          title="Toggle Side-by-Side Comparison"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            isCompareMode
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>Compare</span>
        </button>

        {/* Heatmap Overlay Toggle */}
        <button
          onClick={onToggleOverlay}
          title="Toggle Grad-CAM Overlay"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            showOverlay
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grad-CAM</span>
        </button>

        {/* Opacity Slider (visible when overlay or compare mode active) */}
        {(showOverlay || isCompareMode) && (
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-700">
            <Sliders className="w-3 h-3 text-slate-400" />
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title={`Overlay Opacity: ${Math.round(overlayOpacity * 100)}%`}
            />
          </div>
        )}

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
