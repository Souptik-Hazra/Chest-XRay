import React, { useEffect, useState } from 'react';
import { CLASS_COLORS } from '../../data/demoData.js';
import { cn } from '../../lib/utils.js';

export default function ProbabilityBars({
  probabilities = [],
  predictedClass = '',
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-2.5">
      {probabilities.map((item) => {
        const isPredicted = item.label === predictedClass;
        const color = CLASS_COLORS[item.label] || '#6366f1';
        const percent = Math.round(item.value * 1000) / 10;

        return (
          <div key={item.label} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span
                className={cn(
                  'flex items-center gap-1.5',
                  isPredicted
                    ? 'font-bold text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 font-medium'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{item.label}</span>
                {isPredicted && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                    Predicted
                  </span>
                )}
              </span>

              <span
                className={cn(
                  'font-mono text-xs',
                  isPredicted
                    ? 'font-bold text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {percent.toFixed(1)}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: mounted ? `${item.value * 100}%` : '0%',
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
