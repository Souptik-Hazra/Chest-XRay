import { StatCard } from '../shared/index.js';
import { SYNTHETIC_VIEWS } from '../../data/insightsData.js';

export default function MultiViewTab() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top Comparison Cards */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0 mb-3">
        <StatCard
          label="Single-View Baseline"
          value="79.0%"
          subtitle="Standard single-forward pass accuracy"
          valueColor="text-slate-700 dark:text-slate-300"
        />
        <StatCard
          label="5-View Ensemble"
          value="81.9%"
          subtitle="+2.9% Empirical Test Gain"
          valueColor="text-indigo-600 dark:text-indigo-400"
          subtitleColor="text-indigo-500"
          className="bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60"
        />
        <StatCard
          label="Agreement Stability"
          value="94.2%"
          subtitle="Consensus convergence rate"
          valueColor="text-emerald-600 dark:text-emerald-400"
          subtitleColor="text-emerald-500"
          className="bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60"
        />
      </div>

      {/* 5 Synthetic Views Pipeline Cards */}
      <div className="flex-1 overflow-y-auto panel-scroll space-y-2 pr-1">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Synthesized Multi-View Projection Specifications
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SYNTHETIC_VIEWS.map((v) => (
            <div
              key={v.name}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">{v.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">{v.desc}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Ensemble Value:</span>
                <span className="font-mono font-bold text-emerald-500">{v.gain}</span>
              </div>
            </div>
          ))}
          <div className="p-3 rounded-xl bg-indigo-600 text-white flex flex-col justify-between shadow-md">
            <div>
              <div className="font-bold text-xs">Averaged Softmax Consensus</div>
              <div className="text-[11px] text-indigo-100 mt-1">
                Per-view probability vectors are averaged to reduce orientation variance and exposure outliers.
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-indigo-200">
              Entropy Reduction: -0.18 nats
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
