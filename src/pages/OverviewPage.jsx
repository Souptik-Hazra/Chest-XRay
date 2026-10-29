import React from 'react';
import { Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { CLASSES, CLASS_COLORS } from '../data/demoData.js';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory.js';
import { PageLayout, PageHeader, StatCard, Card, ClassBadge } from '../components/shared/index.js';
import './pages.css';

export default function OverviewPage({ startNewAnalysis, viewHistoryItem, setActivePage, analysisError = '' }) {
  const { records, loading, error } = useAnalysisHistory(4);
  return (
    <PageLayout>
      <PageHeader title="Clinical Radiograph Analysis" badge="BACKEND-DRIVEN STATUS" subtitle="DenseNet121 inference, uncertainty checks and Grad-CAM when available" className="overview-header">
        <button onClick={startNewAnalysis} className="page-action"><Plus />New Analysis</button>
      </PageHeader>
      {(analysisError || error) && <p role="alert" className="page-alert"><AlertCircle />{analysisError || error}</p>}
      <div className="overview-grid">
        <div className="overview-column">
          <div className="overview-stats">
            <StatCard label="Validation Accuracy" value="Unavailable" subtitle="Requires verified evaluation output"/>
            <StatCard label="Mean ROC-AUC" value="Unavailable" subtitle="No evaluation artifact loaded"/>
            <StatCard label="OOD Benchmark" value="Unavailable" subtitle="Requires independent testing"/>
          </div>
          <Card className="overview-recent">
            <div className="overview-section-heading"><h3><Clock />Recent Real Analyses</h3><button onClick={()=>setActivePage('history')} className="page-link">Full History <ArrowRight /></button></div>
            <div className="overview-table-wrap">
              {loading ? <p className="page-empty">Loading history…</p> : records.length === 0 ? <p className="page-empty">No saved analyses yet.</p> : <table className="page-table"><thead><tr><th>Case ID</th><th>Radiograph</th><th>Prediction</th><th>Score</th><th/></tr></thead><tbody>{records.map(row=><tr key={row.id}><td className="page-mono">{row.id}</td><td className="page-filename">{row.filename}</td><td><ClassBadge predictedClass={row.predictedClass}/></td><td>{(Number(row.confidence)*100).toFixed(1)}%</td><td className="page-align-right"><button onClick={()=>viewHistoryItem(row)} className="page-link">View</button></td></tr>)}</tbody></table>}
            </div>
          </Card>
        </div>
        <div className="overview-column">
          <Card><h3 className="page-card-title">Classifier Output Classes</h3><div className="overview-class-grid">{CLASSES.map(cls=><div key={cls} className="overview-class-item"><span className="overview-class-dot" style={{'--class-color':CLASS_COLORS[cls]}}/><span>{cls}</span></div>)}</div></Card>
          <Card className="overview-workflow"><h3 className="page-card-title">Workflow Execution</h3><p className="page-muted">Execution steps will be displayed from the real workflow event stream.</p></Card>
        </div>
      </div>
    </PageLayout>
  );
}
