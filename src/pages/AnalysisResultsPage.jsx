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

const RESULT_TABS = [
  { id: 'summary', label: 'Summary', Component: FindingsPanel },
  { id: 'multiview', label: 'Multi-View', Component: MultiViewPanel },
  { id: 'gradcam', label: 'Grad-CAM', Component: GradCAMPanel },
  { id: 'segmentation', label: 'Segmentation', Component: SegmentationPanel },
  { id: 'report', label: 'AI Report', Component: AIReportPanel },
];

function EmptyResults({ message, onNewAnalysis }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
      <Activity className="w-10 h-10 text-slate-500 mb-4" />
      <h3 className="text-lg font-bold mb-2">No completed analysis available</h3>
      <p className="text-xs text-slate-400 max-w-md mb-4">{message}</p>
      <button onClick={onNewAnalysis} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-2">
        <Plus className="w-4 h-4" />Upload X-ray
      </button>
    </div>
  );
}

export default function AnalysisResultsPage({
  analysisResult, startNewAnalysis, filePreviewUrl, activeResultTab, setActiveResultTab, analysisError = '',
}) {
  const [selectedView, setSelectedView] = useState(PREPARATION_VIEWS[0]);
  if (!analysisResult) {
    return <EmptyResults
      message={analysisError || 'Run an analysis using a real image or select a saved database record.'}
      onNewAnalysis={startNewAnalysis}
    />;
  }

  const previewUrl = analysisResult.previewUrl || filePreviewUrl;
  const activeTab = RESULT_TABS.find(tab => tab.id === activeResultTab) || RESULT_TABS[0];
  const ActivePanel = activeTab.Component;
  const panelProps = {
    analysisResult,
    previewUrl,
    confidence: analysisResult.confidence,
    gradcamUrl: analysisResult.gradcamUrl,
  };

  return (
    <PageLayout className="p-4 lg:p-4">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        <div className="lg:col-span-7 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 relative">
            <XRayViewer
              imageUrl={previewUrl}
              gradcamUrl={analysisResult.gradcamUrl}
              title={`Case: ${analysisResult.id} • ${analysisResult.filename}`}
              isGradcamActive={activeResultTab === 'gradcam'}
              activeView={selectedView}
            />
          </div>
          <div className="h-[130px] flex-shrink-0">
            <ImagePreparationPanel
              filePreviewUrl={previewUrl}
              isCompact
              selectedViewId={selectedView?.id || 'original'}
              onSelectView={setSelectedView}
            />
          </div>
        </div>
        <Card padding="p-0" className="lg:col-span-5 flex flex-col h-full overflow-hidden min-h-0">
          <div className="px-2 pt-2 bg-slate-900/60 border-b border-slate-800 flex-shrink-0">
            <TabNav tabs={RESULT_TABS.map(({id,label})=>({id,label}))} activeTab={activeTab.id} onSelectTab={setActiveResultTab} variant="underline" />
          </div>
          <div className="flex-1 p-3.5 overflow-y-auto min-h-0">
            {activeTab.id === 'gradcam'
              ? <ActivePanel previewUrl={previewUrl} gradcamUrl={analysisResult.gradcamUrl} />
              : activeTab.id === 'segmentation'
                ? <ActivePanel />
                : <ActivePanel {...panelProps} />}
          </div>
          <div className="px-3.5 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Model: DenseNet121</span><span>Research prototype</span>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
