import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Shared full-page layout wrapper used by every page.
 * Replaces the repeated `h-full w-full p-4 lg:p-6 overflow-hidden flex flex-col justify-between select-none` pattern.
 */
export default function PageLayout({ children, className = '' }) {
  return (
    <div
      className={cn(
        'h-full w-full p-4 lg:p-6 overflow-hidden flex flex-col justify-between select-none',
        className
      )}
    >
      {children}
    </div>
  );
}
