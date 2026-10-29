import React from 'react';
import { cn } from '../../lib/utils.js';

export function LungIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v7" />
      <path d="M12 11l-3 3c-2 2-3 4-3 6.5 0 1.5 1 2.5 3 2.5 2 0 3-1 3-3V11" />
      <path d="M12 11l3 3c2 2 3 4 3 6.5 0 1.5-1 2.5-3 2.5-2 0-3-1-3-3V11" />
      <path d="M9 3h6" />
    </svg>
  );
}

export default function TopHeader({ isBackendConnected = false }) {
  return (
    <header className="h-[56px] bg-[#0f172a] text-white px-4 border-b border-slate-800 flex items-center justify-between select-none z-30 flex-shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 min-w-[216px]">
        <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm">
          <LungIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white">ChestX AI</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-900/70 text-indigo-300 border border-indigo-700/50">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Multi-Agent Analysis Platform</p>
        </div>
      </div>

      {/* Center: Title & Prototype Badge */}
      <div className="hidden md:flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-200 tracking-wide">
          Multi-Agent AI for Chest X-Ray Analysis
        </h1>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Research Prototype
        </span>
      </div>

      {/* Right: Clean, Minimal System Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs shadow-sm">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isBackendConnected
                ? 'bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse'
                : 'bg-emerald-500'
            )}
          />
          <span className="text-slate-300 font-medium text-[11px]">
            {isBackendConnected ? 'DenseNet121 AI Engine: Connected' : 'DenseNet121 AI Engine: Ready'}
          </span>
        </div>
      </div>
    </header>
  );
}
