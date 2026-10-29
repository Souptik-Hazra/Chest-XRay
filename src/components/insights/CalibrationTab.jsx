import { CheckCircle2 } from 'lucide-react';
import { StatCard, Callout } from '../shared/index.js';
import { CALIBRATION_BINS } from '../../data/insightsData.js';
import './insights.css';

export default function CalibrationTab() {
  return <div className="insights-tab">
    <div className="calibration-summary">
      <StatCard label="Expected Calibration Error" value="0.043 (4.3%)" subtitle="ECE (Lower is better)" valueColor="text-emerald-600 dark:text-emerald-400"/>
      <StatCard label="Maximum Calibration Error" value="0.089 (8.9%)" subtitle="MCE across any bin"/>
      <StatCard label="Brier Score" value="0.118" subtitle="Mean squared probability error" valueColor="text-indigo-600 dark:text-indigo-400"/>
      <StatCard label="Temperature Scaling (τ)" value="1.14" subtitle="Post-hoc calibrated" subtitleColor="text-emerald-600 dark:text-emerald-400"/>
    </div>
    <div className="calibration-content"><h4>Reliability Diagram (Predicted Confidence vs. Observed Clinical Accuracy)</h4><div className="calibration-bins">
      {CALIBRATION_BINS.map(b=><div key={b.bin} className="calibration-bin"><div className="calibration-bin-label">{b.bin} ({b.count} cases)</div><div><div className="calibration-bar-labels"><span>Empirical Accuracy: {(b.empirical*100).toFixed(1)}%</span><span>Expected: {(b.expected*100).toFixed(0)}%</span></div><div className="calibration-track"><div className="calibration-fill" style={{width:`${b.empirical*100}%`}}/></div></div><div className="calibration-error">Δ {Math.abs((b.empirical-b.expected)*100).toFixed(1)}% error</div></div>)}
    </div><Callout icon={CheckCircle2} variant="success"><strong>Clinical Safety Significance:</strong> Well-calibrated probabilities ensure that when the DenseNet121 model outputs an 85% confidence score, the patient genuinely presents with that pathology approximately 85 out of 100 times.</Callout></div>
  </div>;
}
