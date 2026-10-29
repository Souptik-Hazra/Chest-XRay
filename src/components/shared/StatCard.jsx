import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Reusable stat/metric display card.
 * Replaces the repeated pattern of label + value + subtitle in OverviewPage and ModelInsightsPage.
 */
export default function StatCard({
  label,
  value,
  subtitle,
  subtitleColor = 'text-slate-400',
  valueColor = 'text-slate-900 dark:text-white',
  className = '',
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800',
        className
      )}
    >
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
        {label}
      </span>
      <div className={cn('text-lg font-bold mt-0.5', valueColor)}>
        {value}
      </div>
      {subtitle && (
        <span className={cn('text-[10px] font-medium', subtitleColor)}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
