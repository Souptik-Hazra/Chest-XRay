import React from 'react';
import ProbabilityBars from './ProbabilityBars.jsx';
import { Clock, Check } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';
import { ClassBadge } from '../shared/index.js';
import './results.css';

export default function FindingsPanel({ analysisResult, modelInfo = null }) {
  if (!analysisResult) return null;
  const { id, timestamp, predictedClass, confidence, probabilities = [], findings = {} } = analysisResult;
  const architecture = modelInfo?.architecture || 'Classifier';
  return <div className="findings-panel">
    <div className="findings-header"><div>
      <div className="findings-status-row"><span className="findings-check"><Check/></span><span className="findings-status">Analysis Complete</span>
        {analysisResult?.isDemoData ? <span className="findings-record-badge">Sample Record</span> : <span className="findings-inference-badge"><span/>{architecture} Inference</span>}
      </div>
      <div className="findings-class-row"><h3>{predictedClass}</h3><ClassBadge predictedClass={predictedClass} className="class-badge--compact"/><span>{(confidence*100).toFixed(1)}%</span></div>
    </div><div className="findings-metadata"><div>{id}</div><span><Clock/>{formatDate(timestamp)}</span></div></div>
    <section className="findings-probability"><h4>Class Probabilities ({architecture})</h4><ProbabilityBars probabilities={probabilities} predictedClass={predictedClass}/></section>
    <section><h4 className="findings-section-title">Model Diagnostic Indices</h4><div className="findings-grid">
      <div className="findings-metric"><span>View Agreement</span><strong className="findings-positive">{findings.crossViewAgreement ?? 'Unavailable'}</strong></div>
      <div className="findings-metric"><span>Entropy</span><strong className="findings-mono">{findings.predictionEntropy ?? 'Unavailable'}</strong></div>
      <div className="findings-metric"><span>Confidence Margin</span><strong className="findings-mono">+{typeof findings.confidenceMargin==='number' ? `${(findings.confidenceMargin*100).toFixed(0)}%` : 'Unavailable'}</strong></div>
      <div className="findings-metric"><span>Image Quality</span><strong className="findings-positive">{findings.imageQuality ?? 'Unavailable'}</strong></div>
      <div className="findings-metric"><span>Uncertainty Heuristic</span><strong className={findings.oodDetected?'findings-warning':'findings-default'}>{typeof findings.oodDetected==='boolean' ? (findings.oodDetected?'Flag raised':'No flag') : 'Unavailable'}</strong></div>
      <div className="findings-metric"><span>Review Status</span><strong className={findings.reviewNeeded?'findings-warning':'findings-default'}>{typeof findings.reviewNeeded==='boolean' ? (findings.reviewNeeded?'Review suggested':'No heuristic flag') : 'Unavailable'}</strong></div>
    </div></section>
    {(analysisResult.imageAssessment?.warnings?.length > 0 || findings.imageQualityWarnings?.length > 0) && <section className="findings-assessment" aria-live="polite">
      <h4 className="findings-section-title">Image assessment warnings</h4>
      <p>Automated pixel and geometry checks only. These checks do not confirm that the upload is a chest X-ray or that it is diagnostically suitable.</p>
      <ul>{[...new Set([...(analysisResult.imageAssessment?.warnings || []), ...(findings.imageQualityWarnings || [])])].map((warning, index) => <li key={index}>{warning}</li>)}</ul>
    </section>}
    {analysisResult.imageAssessment?.decision === 'REVIEW' && <p className="findings-warning" role="status">Human review suggested by image-quality heuristics. This is not a diagnostic conclusion.</p>}
  </div>;
}
