import React from 'react';
import { AlertCircle } from 'lucide-react';
import { StatCard, Callout } from '../shared/index.js';
import { OOD_COHORTS } from '../../data/insightsData.js';

export default function OODTab() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0 mb-4">
        <StatCard
          label="Macro OOD AUROC"
          value="0.941"
          subtitle="Area Under ROC (Held-out Non-Chest Scans)"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="FPR95 Metric"
          value="0.089 (8.9%)"
          subtitle="False positive rate at 95% True Detection"
        />
        <StatCard
          label="Dual-Gate Safeguards"
          value="2 Gates"
          subtitle="Laplacian Var + Shannon Entropy"
          valueColor="text-indigo-600 dark:text-indigo-400"
          subtitleColor="text-indigo-500"
        />
      </div>

      {/* OOD Cohort Evaluation Table */}
      <div className="flex-1 overflow-y-auto panel-scroll rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900/80 space-y-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Out-of-Distribution Cohort Rejection Benchmarks
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                <th className="pb-2">Evaluation Dataset Cohort</th>
                <th className="pb-2">AUROC</th>
                <th className="pb-2">Mean Shannon Entropy</th>
                <th className="pb-2">OOD Rejection Rate</th>
                <th className="pb-2 text-right">Gate Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
              {OOD_COHORTS.map((c) => (
                <tr key={c.cohort} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{c.cohort}</td>
                  <td className="py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{c.auroc.toFixed(3)}</td>
                  <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300">{c.meanEntropy}</td>
                  <td className="py-2.5 font-mono text-slate-700 dark:text-slate-200 font-semibold">{c.rejection}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'Accepted'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : c.status === 'Flagged'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout icon={AlertCircle} variant="warning">
          <strong>Fail-Safe Triage Logic:</strong> If an uploaded radiograph exhibits a Laplacian blur variance under 100 or a predictive entropy exceeding 0.85 nats, the system flags the study for mandatory manual radiologist acquisition audit.
        </Callout>
      </div>
    </div>
  );
}
