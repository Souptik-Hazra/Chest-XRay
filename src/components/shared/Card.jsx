import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Shared card container used across the app for panels, sections, etc.
 * Replaces repeated `rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm` pattern.
 */
export default function Card({ children, className = '', padding = 'p-3.5', ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm',
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
