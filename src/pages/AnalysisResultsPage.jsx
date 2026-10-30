import React, { useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import XRayViewer from '../components/viewer/XRayViewer.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { PREPARATION_VIEWS } from '../data/preparationViews.js';
import FindingsPanel from '../components/results/FindingsPanel.jsx';
import GradCAMPanel from '../components/results/GradCAMPanel.jsx';
import SegmentationPanel from '../components/results/SegmentationPanel.jsx';
import AIReportPanel from '../components/results/AIReportPanel.jsx';
import MultiViewPanel from '../components/results/MultiViewPanel.jsx';
import { PageLayout, Card, TabNav } from '../components/shared/index.js';
import './pages.css';

const RESULT_TABS = [
  { id: 'summary', label: 'Summary', Component: FindingsPanel },
  { id: 'multiview', label: 'Multi-View', Component: MultiViewPanel },
  { id: 'gradcam', label: 'Grad-CAM', Component: GradCAMPanel },
  { id: 'segmentation', label: 'Segmentation', Component: SegmentationPanel },
  { id: 'report', label: 'AI Report', Component: AIReportPanel },
];

function EmptyResults({ message, onNewAnalysis }) {
  return <div className="results-empty"><Activity /><h3>No completed analysis available</h3><p>{message}</p><button onClick={onNewAnalysis} className="page-action"><Plus />Upload X-ray</button></div>;
}

export default function AnalysisResultsPage({ analysisResult, startNewAnalysis, filePreviewUrl, activeResultTab, setActiveResultTab, analysisError = '' }) {
  const [selectedViewId, setSelectedViewId] = useState('original');
  if (!analysisResult) return <EmptyResults message={analysisError || 'Upload a chest X-ray and run an analysis to see results.'} onNewAnalysis={startNewAnalysis} />;
  const previewUrl = analysisResult.previewUrl || filePreviewUrl;
  const selectedView = analysisResult.multiview?.find(view => view.id === selectedViewId);
  const activeTab = RESULT_TABS.find(tab => tab.id === activeResultTab) || RESULT_TABS[0];
  const ActivePanel = activeTab.Component;
  const panelProps = { analysisResult, previewUrl, confidence: analysisResult.confidence, gradcamUrl: analysisResult.gradcamUrl };
  return <PageLayout className="results-page">
    <div className="results-grid">
      <div className="results-viewer-column">
        <div className="results-viewer"><XRayViewer imageUrl={selectedView?.previewUrl || previewUrl} gradcamUrl={analysisResult.gradcamUrl} title={`Case: ${analysisResult.id} • ${analysisResult.filename}`} isGradcamActive={activeResultTab === 'gradcam'} activeView={{name:selectedView?.name || 'Original PA View', originalUrl:previewUrl}} /></div>
        <div className="results-preparation"><ImagePreparationPanel filePreviewUrl={previewUrl} isCompact selectedViewId={selectedViewId} onSelectView={setSelectedViewId} actualViews={analysisResult.multiview || []} /></div>
      </div>
      <Card padding="card-padding-none" className="results-detail-card">
        <div className="results-tabs"><TabNav tabs={RESULT_TABS.map(({id,label})=>({id,label}))} activeTab={activeTab.id} onSelectTab={setActiveResultTab} variant="underline" /></div>
        <div className="results-panel">{activeTab.id === 'gradcam' ? <ActivePanel previewUrl={previewUrl} gradcamUrl={analysisResult.gradcamUrl} /> : activeTab.id === 'segmentation' ? <ActivePanel analysisResult={analysisResult} /> : <ActivePanel {...panelProps} />}</div>
        <div className="results-footer"><span>Model: DenseNet121</span><span>Research prototype</span></div>
      </Card>
    </div>
  </PageLayout>;
}
