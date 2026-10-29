import React, { useState } from 'react';
import XRayViewer from '../components/viewer/XRayViewer.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { PREPARATION_VIEWS } from '../data/preparationViews.js';
import FindingsPanel from '../components/results/FindingsPanel.jsx';
import GradCAMPanel from '../components/results/GradCAMPanel.jsx';
import SegmentationPanel from '../components/results/SegmentationPanel.jsx';
import AIReportPanel from '../components/results/AIReportPanel.jsx';
import MultiViewPanel from '../components/results/MultiViewPanel.jsx';
import {
  Activity,
  Sparkles,
  Plus,
} from 'lucide-react';
import { PageLayout, Card, TabNav } from '../components/shared/index.js';

export default function AnalysisResultsPage({
  analysisResult,
  loadDemoResult,
  startNewAnalysis,
  filePreviewUrl,
  activeResultTab,
  setActiveResultTab,
}) {
  const [selectedViewObj, setSelectedViewObj] = useState(PREPARATION_VIEWS[0]);

  // If no analysis result loaded, render empty state
  if (!analysisResult) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          No Radiograph Analysis Active
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          Upload a chest radiograph to start real-time multi-agent inference or inspect a recently evaluated patient case.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDemoResult}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Active Inferred Case (DenseNet121)</span>
          </button>
          <button
            onClick={startNewAnalysis}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New X-Ray</span>
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'multiview', label: 'Multi-View' },
    { id: 'gradcam', label: 'Grad-CAM' },
    { id: 'segmentation', label: 'Segmentation' },
    { id: 'report', label: 'AI Report' },
  ];

  const preview = analysisResult.previewUrl || filePreviewUrl;

  const renderTabContent = () => {
    switch (activeResultTab) {
      case 'summary':
        return <FindingsPanel analysisResult={analysisResult} />;
      case 'multiview':
        return <MultiViewPanel analysisResult={analysisResult} previewUrl={preview} confidence={analysisResult.confidence} />;
      case 'gradcam':
        return <GradCAMPanel previewUrl={preview} gradcamUrl={analysisResult.gradcamUrl} />;
      case 'segmentation':
        return <SegmentationPanel />;
      case 'report':
        return <AIReportPanel analysisResult={analysisResult} />;
      default:
        return <FindingsPanel analysisResult={analysisResult} />;
    }
  };

  return (
    <PageLayout className="p-4 lg:p-4">
      {/* 2-Column Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        {/* Left Column (~58% / 7 cols): XRayViewer + Preprocessing Bar */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 min-h-0 overflow-hidden">
          {/* Main DICOM / X-Ray Viewer */}
          <div className="flex-1 min-h-0 relative">
            <XRayViewer
              imageUrl={preview}
              gradcamUrl={analysisResult.gradcamUrl}
              title={`Case: ${analysisResult.id} • ${analysisResult.filename}`}
              isGradcamActive={activeResultTab === 'gradcam'}
              activeView={selectedViewObj}
            />
          </div>

          {/* Compact View Selector Thumbnails */}
          <div className="h-[130px] flex-shrink-0">
            <ImagePreparationPanel
              filePreviewUrl={preview}
              isCompact={true}
              selectedViewId={selectedViewObj?.id || 'original'}
              onSelectView={(v) => setSelectedViewObj(v)}
            />
          </div>
        </div>

        {/* Right Column (~42% / 5 cols): Findings & Analytical Tabs */}
        <Card padding="p-0" className="lg:col-span-5 flex flex-col h-full overflow-hidden min-h-0">
          {/* Tab Navigation Header */}
          <div className="px-2 pt-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <TabNav
              tabs={tabs}
              activeTab={activeResultTab}
              onSelectTab={setActiveResultTab}
              variant="underline"
            />
          </div>

          {/* Scrollable Tab Panel Content */}
          <div className="flex-1 p-3.5 overflow-y-auto overflow-x-hidden panel-scroll min-h-0">
            {renderTabContent()}
          </div>

          {/* Quick Footer */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-shrink-0">
            <span>Model: DenseNet121-CheX</span>
            <span className="font-medium text-slate-400">Multi-Agent Analysis System</span>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
