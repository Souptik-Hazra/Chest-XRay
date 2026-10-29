import { StatCard } from '../shared/index.js';
import { SYNTHETIC_VIEWS } from '../../data/insightsData.js';
import './insights.css';

export default function MultiViewTab() {
  return <div className="insights-tab">
    <div className="multiview-summary">
      <StatCard label="Single-View Baseline" value="79.0%" subtitle="Standard single-forward pass accuracy" valueColor="text-slate-700 dark:text-slate-300"/>
      <StatCard label="5-View Ensemble" value="81.9%" subtitle="+2.9% Empirical Test Gain" valueColor="text-indigo-600 dark:text-indigo-400" subtitleColor="text-indigo-500" className="stat-card--indigo"/>
      <StatCard label="Agreement Stability" value="94.2%" subtitle="Consensus convergence rate" valueColor="text-emerald-600 dark:text-emerald-400" subtitleColor="text-emerald-500" className="stat-card--green"/>
    </div>
    <div className="multiview-specifications"><h4>Synthesized Multi-View Projection Specifications</h4><div className="multiview-specification-grid">
      {SYNTHETIC_VIEWS.map(v=><div key={v.name} className="multiview-specification"><div><div className="multiview-specification__name">{v.name}</div><div className="multiview-specification__description">{v.desc}</div></div><div className="multiview-specification__gain"><span>Ensemble Value:</span><strong>{v.gain}</strong></div></div>)}
      <div className="multiview-consensus"><div><div>Averaged Softmax Consensus</div><p>Per-view probability vectors are averaged to reduce orientation variance and exposure outliers.</p></div><span>Entropy Reduction: -0.18 nats</span></div>
    </div></div>
  </div>;
}
