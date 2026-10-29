import React from 'react';
import { Info } from 'lucide-react';
import MetricsChart from '../charts/MetricsChart.jsx';
import { Callout } from '../shared/index.js';
import './insights.css';
import { CONFUSION_MATRIX } from '../../data/insightsData.js';

export default function ClassificationTab() {
  return <div className="insights-tab">
    <div className="classification-layout">
      <section className="classification-chart-column">
        <div className="classification-heading"><h4>Per-Class Diagnostic Performance (Precision, Recall, F1)</h4><span>587 held-out test scans</span></div>
        <div className="classification-chart"><MetricsChart/></div>
      </section>
      <section className="classification-matrix-column">
        <h4>Empirical Confusion Matrix Breakdown</h4>
        <div className="classification-matrix-content"><div className="classification-table-wrap"><table className="classification-table"><thead><tr><th>True Class</th><th className="is-green">Normal</th><th className="is-red">Bacterial</th><th className="is-amber">Viral</th><th>Recall</th></tr></thead><tbody>
          {CONFUSION_MATRIX.map(row=><tr key={row.actual}><td className={`classification-actual ${row.highlightCol==='normal'?'is-green':row.highlightCol==='bacterial'?'is-red':'is-amber'}`}>{row.actual}</td>
          {['normal','bacterial','viral'].map(col=><td key={col} className={`classification-number ${row.highlightCol===col?`is-highlight is-${col}`:'is-neutral'}`}>{row[col]}</td>)}
          <td className={`classification-recall ${row.highlightCol==='normal'?'is-green':row.highlightCol==='bacterial'?'is-red':'is-amber'}`}>{row.recall}</td></tr>)}
        </tbody></table></div>
        <Callout icon={Info} variant="info"><strong>Clinical Specificity Analysis:</strong> Normal radiographs achieve <strong>96.2% specificity</strong> (only 6 false positives out of 159). The primary misclassifications occur between bacterial and viral pneumonia due to shared diffuse interstitial infiltrates.</Callout></div>
      </section>
    </div>
  </div>;
}
