import React from 'react';
import { Plus, Activity, Clock } from 'lucide-react';
import { CLASSES } from '../data/demoData.js';
import { PageLayout, PageHeader, StatCard, Card } from '../components/shared/index.js';
import './pages.css';

export default function OverviewPage({ startNewAnalysis, setActivePage, analysisResult, analysisError = '' }) {
  return (
    <PageLayout>
      <PageHeader title="Clinical Radiograph Analysis" badge="BACKEND-DRIVEN STATUS" subtitle="DenseNet121 inference, uncertainty checks and Grad-CAM when available" className="overview-header">
        <button onClick={startNewAnalysis} className="page-action"><Plus />New Analysis</button>
      </PageHeader>
      {analysisError && <p role="alert" className="page-alert">{analysisError}</p>}
      <div className="overview-grid">
        <div className="overview-column">
          <div className="overview-stats">
            <StatCard label="Validation Accuracy" value="Unavailable" subtitle="Requires verified evaluation output"/>
            <StatCard label="Mean ROC-AUC" value="Unavailable" subtitle="No evaluation artifact loaded"/>
            <StatCard label="OOD Benchmark" value="Unavailable" subtitle="Requires independent testing"/>
          </div>
          <Card className="overview-recent">
            <div className="overview-section-heading"><h3><Clock />Current Session</h3></div>
            {analysisResult ? (
              <div className="overview-current-result">
                <p><strong>Case ID:</strong> {analysisResult.id}</p>
                <p><strong>Image:</strong> {analysisResult.filename}</p>
                <p><strong>Predicted class:</strong> {analysisResult.predictedClass}</p>
                <p><strong>Top-class score:</strong> {(Number(analysisResult.confidence) * 100).toFixed(1)}%</p>
                <button onClick={() => setActivePage('results')} className="page-link">View current result <Activity /></button>
              </div>
            ) : <p className="page-empty">No analysis in this session. Results are not saved after the session ends.</p>}
          </Card>
        </div>
        <div className="overview-column">
          <Card><h3 className="page-card-title">Classifier Output Classes</h3><div className="overview-class-grid">{CLASSES.map(cls=><div key={cls} className="overview-class-item"><span className={`overview-class-dot ${cls === 'Normal' ? 'is-normal' : cls === 'Bacterial Pneumonia' ? 'is-bacterial' : 'is-viral'}`}/><span>{cls}</span></div>)}</div></Card>
          <Card className="overview-workflow"><h3 className="page-card-title">Workflow Execution</h3><p className="page-muted">Execution steps will be displayed from the real workflow event stream.</p></Card>
        </div>
      </div>
    </PageLayout>
  );
}
