import React, { useState } from 'react';
import XRayViewer from '../components/viewer/XRayViewer.jsx';
import ImagePreparationPanel from '../components/upload/ImagePreparationPanel.jsx';
import { PREPARATION_VIEWS } from '../data/preparationViews.js';
import FindingsPanel from '../components/results/FindingsPanel.jsx';
import GradCAMPanel from '../components/results/GradCAMPanel.jsx';
import SegmentationPanel from '../components/results/SegmentationPanel.jsx';
import AIReportPanel from '../components/results/AIReportPanel.jsx';
import MultiViewPanel from '../components/results/MultiViewPanel.jsx';
import { Activity, Plus } from 'lucide-react';
import { PageLayout, Card, TabNav } from '../components/shared/index.js';

export default function AnalysisResultsPage({ analysisResult, startNewAnalysis, filePreviewUrl, activeResultTab, setActiveResultTab, analysisError = '' }) {
  const [selectedViewObj, setSelectedViewObj] = useState(PREPARATION_VIEWS[0]);
  if (!analysisResult) return <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
    <Activity className="w-10 h-10 text-slate-500 mb-4"/>
    <h3 className="text-lg font-bold mb-2">No completed analysis available</h3>
    <p className="text-xs text-slate-400 max-w-md mb-4">{analysisError || 'Run an analysis using a real image or select a saved database record.'}</p>
    <button onClick={startNewAnalysis} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-2"><Plus className="w-4 h-4"/>Upload X-ray</button>
  </div>;

  const tabs = [{id:'summary',label:'Summary'},{id:'multiview',label:'Multi-View'},{id:'gradcam',label:'Grad-CAM'},{id:'segmentation',label:'Segmentation'},{id:'report',label:'AI Report'}];
  const preview = analysisResult.previewUrl || filePreviewUrl;
  const renderTabContent = () => {
    switch(activeResultTab) {
      case 'multiview': return <MultiViewPanel analysisResult={analysisResult} previewUrl={preview} confidence={analysisResult.confidence}/>;
      case 'gradcam': return <GradCAMPanel previewUrl={preview} gradcamUrl={analysisResult.gradcamUrl}/>;
      case 'segmentation': return <SegmentationPanel/>;
      case 'report': return <AIReportPanel analysisResult={analysisResult}/>;
      default: return <FindingsPanel analysisResult={analysisResult}/>;
    }
  };
  return <PageLayout className="p-4 lg:p-4"><div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
    <div className="lg:col-span-7 flex flex-col gap-2.5 min-h-0 overflow-hidden"><div className="flex-1 min-h-0 relative"><XRayViewer imageUrl={preview} gradcamUrl={analysisResult.gradcamUrl} title={`Case: ${analysisResult.id} • ${analysisResult.filename}`} isGradcamActive={activeResultTab==='gradcam'} activeView={selectedViewObj}/></div><div className="h-[130px] flex-shrink-0"><ImagePreparationPanel filePreviewUrl={preview} isCompact selectedViewId={selectedViewObj?.id || 'original'} onSelectView={setSelectedViewObj}/></div></div>
    <Card padding="p-0" className="lg:col-span-5 flex flex-col h-full overflow-hidden min-h-0"><div className="px-2 pt-2 bg-slate-900/60 border-b border-slate-800 flex-shrink-0"><TabNav tabs={tabs} activeTab={activeResultTab} onSelectTab={setActiveResultTab} variant="underline"/></div><div className="flex-1 p-3.5 overflow-y-auto min-h-0">{renderTabContent()}</div><div className="px-3.5 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500"><span>Model: DenseNet121</span><span>Research prototype</span></div></Card>
  </div></PageLayout>;
}
