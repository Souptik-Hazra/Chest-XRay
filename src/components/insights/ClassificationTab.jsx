import React from 'react';
import { Info } from 'lucide-react';
import MetricsChart from '../charts/MetricsChart.jsx';
import { Callout } from '../shared/index.js';
import './insights.css';
import { CONFUSION_MATRIX } from '../../data/insightsData.js';

export default function ClassificationTab() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column (7 cols): Recharts Bar Chart */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Per-Class Diagnostic Performance (Precision, Recall, F1)
            </h4>
            <span className="text-[11px] text-slate-400">587 held-out test scans</span>
          </div>
          <div className="flex-1 min-h-0 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
            <MetricsChart />
          </div>
        </div>

        {/* Right Column (5 cols): Confusion Matrix & Specificity Table */}
        <div className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex-shrink-0">
            Empirical Confusion Matrix Breakdown
          </h4>

          <div className="flex-1 overflow-y-auto panel-scroll rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                    <th className="pb-2">True Class</th>
                    <th className="pb-2 text-center text-emerald-500">Normal</th>
                    <th className="pb-2 text-center text-red-500">Bacterial</th>
                    <th className="pb-2 text-center text-amber-500">Viral</th>
                    <th className="pb-2 text-right">Recall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
                  {CONFUSION_MATRIX.map((row) => (
                    <tr key={row.actual}>
                      <td className={`py-2 font-semibold ${row.color}`}>{row.actual}</td>
                      <td className={`py-2 text-center font-mono ${row.highlightCol === 'normal' ? 'font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded' : 'text-slate-400'}`}>
                        {row.normal}
                      </td>
                      <td className={`py-2 text-center font-mono ${row.highlightCol === 'bacterial' ? 'font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded' : 'text-slate-400'}`}>
                        {row.bacterial}
                      </td>
                      <td className={`py-2 text-center font-mono ${row.highlightCol === 'viral' ? 'font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 rounded' : 'text-slate-400'}`}>
                        {row.viral}
                      </td>
                      <td className={`py-2 text-right font-mono font-bold ${row.recallColor}`}>
                        {row.recall}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Callout icon={Info} variant="info">
              <strong>Clinical Specificity Analysis:</strong> Normal radiographs achieve <strong>96.2% specificity</strong> (only 6 false positives out of 159). The primary misclassifications occur between bacterial and viral pneumonia due to shared diffuse interstitial infiltrates.
            </Callout>
          </div>
        </div>
      </div>
    </div>
  );
}