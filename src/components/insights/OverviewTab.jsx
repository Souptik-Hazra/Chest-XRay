import React from 'react';
import { Layers, CheckCircle2, Target } from 'lucide-react';
import { StatCard, Callout } from '../shared/index.js';
import { demoMetrics } from '../../data/demoData.js';
import { ARCHITECTURE_SPECS, TEST_COHORTS } from '../../data/insightsData.js';

export default function OverviewTab() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top Summary Metrics Cards */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0 mb-4">
        <StatCard
          label="Accuracy"
          value={`${(demoMetrics.overall.accuracy * 100).toFixed(1)}%`}
          subtitle="Validation Cohort"
          subtitleColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Precision"
          value={`${(demoMetrics.overall.precision * 100).toFixed(1)}%`}
          subtitle="Macro Average"
        />
        <StatCard
          label="Recall"
          value={`${(demoMetrics.overall.recall * 100).toFixed(1)}%`}
          subtitle="Sensitivity"
        />
        <StatCard
          label="F1 Score"
          value={`${(demoMetrics.overall.f1 * 100).toFixed(1)}%`}
          subtitle="Harmonic Mean"
          valueColor="text-indigo-600 dark:text-indigo-400"
          subtitleColor="text-indigo-500"
        />
        <StatCard
          label="Macro AUC"
          value={demoMetrics.overall.auc.toFixed(3)}
          subtitle="ROC Discriminability"
          valueColor="text-emerald-600 dark:text-emerald-400"
          subtitleColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Main Split: Architecture Overview & Dataset Distribution */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column (7 cols): Architecture Specs */}
        <div className="lg:col-span-7 flex flex-col min-h-0 p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>DenseNet121 Architecture & Parameter Configuration</span>
          </h4>

          <div className="space-y-2 text-xs overflow-y-auto panel-scroll pr-1">
            {ARCHITECTURE_SPECS.map((spec) => (
              <div
                key={spec.title}
                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{spec.title}</div>
                  <div className="text-[10px] text-slate-400">{spec.desc}</div>
                </div>
                <span className={`font-mono text-[11px] font-semibold ${spec.badgeColor}`}>
                  {spec.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Test Split Cohort Distribution */}
        <div className="lg:col-span-5 flex flex-col min-h-0 p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>Held-out Test Cohort (587 Scans)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Independent evaluation split unexposed during model training and hyperparameter tuning.
            </p>

            <div className="space-y-2 text-xs">
              {TEST_COHORTS.map((cohort) => (
                <div
                  key={cohort.label}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cohort.color}`} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cohort.label}</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{cohort.count}</div>
                </div>
              ))}
            </div>
          </div>

          <Callout icon={CheckCircle2} variant="success" className="mt-2">
            <strong>Zero Leakage Guarantee:</strong> Patient IDs between train and test cohorts are mutually exclusive, ensuring true cross-subject generalizability.
          </Callout>
        </div>
      </div>
    </div>
  );
}
