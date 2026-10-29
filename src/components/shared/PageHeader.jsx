import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Shared page header with title, optional badge, and subtitle.
 * Replaces the duplicated page header pattern in every page component.
 */
export default function PageHeader({
  title,
  badge,
  badgeVariant = 'emerald',
  subtitle,
  children,
  className = '',
}) {
  const badgeStyles = {
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
    indigo: 'bg-indigo-950/60 text-indigo-300 border-indigo-800',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  };

  return (
    <div className={cn('flex items-center justify-between flex-shrink-0 mb-3', className)}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {badge && (
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded border',
                badgeStyles[badgeVariant] || badgeStyles.emerald
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}
