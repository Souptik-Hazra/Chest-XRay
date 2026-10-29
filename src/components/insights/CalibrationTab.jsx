import { CheckCircle2 } from 'lucide-react';
import { StatCard, Callout } from '../shared/index.js';
import { CALIBRATION_BINS } from '../../data/insightsData.js';

export default function CalibrationTab() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0 mb-4">
        <StatCard
          label="Expected Calibration Error"
          value="0.043 (4.3%)"
          subtitle="ECE (Lower is better)"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Maximum Calibration Error"
          value="0.089 (8.9%)"
          subtitle="MCE across any bin"
        />
        <StatCard
          label="Brier Score"
          value="0.118"
          subtitle="Mean squared probability error"
          valueColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Temperature Scaling (τ)"
          value="1.14"
          subtitle="Post-hoc calibrated"
          subtitleColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Reliability Diagram Table & Progress Bars */}
      <div className="flex-1 overflow-y-auto panel-scroll rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900/80 space-y-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Reliability Diagram (Predicted Confidence vs. Observed Clinical Accuracy)
        </h4>

        <div className="space-y-2">
          {CALIBRATION_BINS.map((b) => (
            <div
              key={b.bin}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-12 gap-3 items-center text-xs"
            >
              <div className="col-span-3 font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                {b.bin} ({b.count} cases)
              </div>
              <div className="col-span-6">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Empirical Accuracy: {(b.empirical * 100).toFixed(1)}%</span>
                  <span>Expected: {(b.expected * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${b.empirical * 100}%` }}
                  />
                </div>
              </div>
              <div className="col-span-3 text-right font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Δ {Math.abs((b.empirical - b.expected) * 100).toFixed(1)}% error
              </div>
            </div>
          ))}
        </div>

        <Callout icon={CheckCircle2} variant="success">
          <strong>Clinical Safety Significance:</strong> Well-calibrated probabilities ensure that when the DenseNet121 model outputs an 85% confidence score, the patient genuinely presents with that pathology approximately 85 out of 100 times.
        </Callout>
      </div>
    </div>
  );
}