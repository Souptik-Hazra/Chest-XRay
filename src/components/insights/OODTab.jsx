import React from 'react';
import { AlertCircle } from 'lucide-react';
import { StatCard, Callout } from '../shared/index.js';
import { OOD_COHORTS } from '../../data/insightsData.js';
import './insights.css';

export default function OODTab() {
  return <div className="insights-tab">
    <div className="ood-summary">
      <StatCard label="Macro OOD AUROC" value="0.941" subtitle="Area Under ROC (Held-out Non-Chest Scans)" valueColor="text-emerald-600 dark:text-emerald-400"/>
      <StatCard label="FPR95 Metric" value="0.089 (8.9%)" subtitle="False positive rate at 95% True Detection"/>
      <StatCard label="Dual-Gate Safeguards" value="2 Gates" subtitle="Laplacian Var + Shannon Entropy" valueColor="text-indigo-600 dark:text-indigo-400" subtitleColor="text-indigo-500"/>
    </div>
    <div className="ood-content"><h4>Out-of-Distribution Cohort Rejection Benchmarks</h4><div className="ood-table-wrap"><table className="ood-table"><thead><tr><th>Evaluation Dataset Cohort</th><th>AUROC</th><th>Mean Shannon Entropy</th><th>OOD Rejection Rate</th><th>Gate Result</th></tr></thead><tbody>
      {OOD_COHORTS.map(c=><tr key={c.cohort}><td>{c.cohort}</td><td className="ood-auroc">{c.auroc.toFixed(3)}</td><td>{c.meanEntropy}</td><td>{c.rejection}</td><td><span className={`ood-status ood-status--${c.status.toLowerCase()}`}>{c.status}</span></td></tr>)}
    </tbody></table></div><Callout icon={AlertCircle} variant="warning"><strong>Fail-Safe Triage Logic:</strong> If an uploaded radiograph exhibits a Laplacian blur variance under 100 or a predictive entropy exceeding 0.85 nats, the system flags the study for mandatory manual radiologist acquisition audit.</Callout></div>
  </div>;
}
