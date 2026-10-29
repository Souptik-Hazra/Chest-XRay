import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Reusable callout/alert box with icon.
 * Replaces repeated info/warning/success notice patterns across panels.
 * 
 * @param {'info' | 'warning' | 'success' | 'error' | 'blue'} variant
 */
const VARIANT_STYLES = {
  info: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200',
  warning: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200',
  success: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200',
  error: 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200',
  blue: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200',
};

export default function Callout({ icon: Icon, variant = 'info', children, className = '' }) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.info;

  return (
    <div className={cn('p-2.5 rounded-lg border text-[11px] flex items-start gap-2', variantClass, className)}>
      {Icon && <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" />}
      <span>{children}</span>
    </div>
  );
}
