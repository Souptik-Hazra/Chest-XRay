import React from 'react';
import { Layers, CheckCircle2, Target } from 'lucide-react';
import { StatCard, Callout } from '../shared/index.js';
import './insights.css';
import { demoMetrics } from '../../data/demoData.js';
import { ARCHITECTURE_SPECS, TEST_COHORTS } from '../../data/insightsData.js';

export default function OverviewTab() {
  return <div className="insights-tab">
    <div className="insights-overview-metrics">
      <StatCard label="Accuracy" value={`${(demoMetrics.overall.accuracy*100).toFixed(1)}%`} subtitle="Validation Cohort" subtitleColor="text-emerald-600 dark:text-emerald-400"/>
      <StatCard label="Precision" value={`${(demoMetrics.overall.precision*100).toFixed(1)}%`} subtitle="Macro Average"/>
      <StatCard label="Recall" value={`${(demoMetrics.overall.recall*100).toFixed(1)}%`} subtitle="Sensitivity"/>
      <StatCard label="F1 Score" value={`${(demoMetrics.overall.f1*100).toFixed(1)}%`} subtitle="Harmonic Mean" valueColor="text-indigo-600 dark:text-indigo-400" subtitleColor="text-indigo-500"/>
      <StatCard label="Macro AUC" value={demoMetrics.overall.auc.toFixed(3)} subtitle="ROC Discriminability" valueColor="text-emerald-600 dark:text-emerald-400" subtitleColor="text-emerald-600 dark:text-emerald-400"/>
    </div>
    <div className="insights-overview-main">
      <section className="insights-overview-panel">
        <h4><Layers/>DenseNet121 Architecture &amp; Parameter Configuration</h4>
        <div className="insights-architecture-list">{ARCHITECTURE_SPECS.map(spec=><div key={spec.title} className="insights-architecture-row"><div><div className="insights-architecture-title">{spec.title}</div><div className="insights-architecture-description">{spec.desc}</div></div><span className={`insights-architecture-badge ${spec.badgeColor==='text-indigo-400'?'is-indigo':spec.badgeColor==='text-emerald-400'?'is-green':'is-muted'}`}>{spec.badge}</span></div>)}</div>
      </section>
      <section className="insights-overview-panel insights-cohort-panel">
        <div><h4><Target/>Held-out Test Cohort (587 Scans)</h4><p>Independent evaluation split unexposed during model training and hyperparameter tuning.</p>
          <div className="insights-cohort-list">{TEST_COHORTS.map(cohort=><div key={cohort.label} className="insights-cohort-row"><div><span className={`insights-cohort-dot ${cohort.color==='bg-emerald-500'?'is-green':cohort.color==='bg-red-500'?'is-red':'is-amber'}`}/><span>{cohort.label}</span></div><strong>{cohort.count}</strong></div>)}</div>
        </div>
        <Callout icon={CheckCircle2} variant="success" className="insights-cohort-callout"><strong>Zero Leakage Guarantee:</strong> Patient IDs between train and test cohorts are mutually exclusive, ensuring true cross-subject generalizability.</Callout>
      </section>
    </div>
  </div>;
}
