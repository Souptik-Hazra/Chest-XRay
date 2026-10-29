import React from 'react';
import { CLASS_BG } from '../../data/demoData.js';
import { cn } from '../../lib/utils.js';

/**
 * Reusable badge for displaying predicted class with appropriate color coding.
 * Replaces the repeated class badge rendering in OverviewPage, AnalysisHistoryPage, etc.
 */
export default function ClassBadge({ predictedClass, className = '' }) {
  const bgStyle = CLASS_BG[predictedClass] || 'bg-slate-100 text-slate-700';
  return (
    <span
      className={cn(
        'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border',
        bgStyle,
        className
      )}
    >
      {predictedClass}
    </span>
  );
}
