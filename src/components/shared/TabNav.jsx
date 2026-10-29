import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Reusable tab navigation bar supporting 'pill' and 'underline' visual styles.
 * 
 * @param {Array<{id: string, label: string}>} tabs
 * @param {string} activeTab
 * @param {(tabId: string) => void} onSelectTab
 * @param {'pill' | 'underline'} variant
 */
export default function TabNav({
  tabs = [],
  activeTab,
  onSelectTab,
  variant = 'pill',
  className = '',
}) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex items-center overflow-x-auto no-scrollbar', className)}>
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={cn(
                'px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1e293b] rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center p-1 rounded-lg bg-slate-200 dark:bg-slate-800', className)}>
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTab(t.id)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
