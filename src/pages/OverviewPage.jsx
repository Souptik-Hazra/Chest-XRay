import React from 'react';
import { Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { CLASSES, CLASS_COLORS } from '../data/demoData.js';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory.js';
import { PageLayout, PageHeader, StatCard, Card, ClassBadge } from '../components/shared/index.js';

export default function OverviewPage({ startNewAnalysis, viewHistoryItem, setActivePage, analysisError = '' }) {
  const { records, loading, error } = useAnalysisHistory(4);

  return (
    <PageLayout>
      <PageHeader title="Clinical Radiograph Analysis" badge="BACKEND-DRIVEN STATUS" subtitle="DenseNet121 inference, uncertainty checks and Grad-CAM when available" className="mb-4">
        <button onClick={startNewAnalysis} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4"/>New Analysis</button>
      </PageHeader>
      {(analysisError || error) && <p role="alert" className="text-xs text-amber-400 mb-2"><AlertCircle className="inline w-3 h-3 mr-1"/>{analysisError || error}</p>}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="grid grid-cols-3 gap-2.5 flex-shrink-0">
            <StatCard label="Validation Accuracy" value="Unavailable" subtitle="Requires verified evaluation output"/>
            <StatCard label="Mean ROC-AUC" value="Unavailable" subtitle="No evaluation artifact loaded"/>
            <StatCard label="OOD Benchmark" value="Unavailable" subtitle="Requires independent testing"/>
          </div>
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2.5"><h3 className="text-xs font-semibold flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/>Recent Real Analyses</h3><button onClick={()=>setActivePage('history')} className="text-[11px] text-indigo-400 flex items-center gap-1">Full History <ArrowRight className="w-3 h-3"/></button></div>
            <div className="flex-1 overflow-auto min-h-0">
              {loading ? <p className="p-4 text-xs text-slate-400">Loading history…</p> : records.length === 0 ? <p className="p-4 text-xs text-slate-400">No saved analyses yet.</p> : <table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase"><th className="pb-2">Case ID</th><th className="pb-2">Radiograph</th><th className="pb-2">Prediction</th><th className="pb-2">Score</th><th/></tr></thead><tbody>{records.map(row=><tr key={row.id} className="border-b border-slate-800"><td className="py-2 font-mono">{row.id}</td><td className="py-2 truncate max-w-[140px]">{row.filename}</td><td className="py-2"><ClassBadge predictedClass={row.predictedClass}/></td><td className="py-2">{(Number(row.confidence)*100).toFixed(1)}%</td><td className="py-2 text-right"><button onClick={()=>viewHistoryItem(row)} className="text-indigo-400">View</button></td></tr>)}</tbody></table>}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-hidden">
          <Card><h3 className="text-xs font-semibold mb-2.5">Classifier Output Classes</h3><div className="grid grid-cols-3 gap-2">{CLASSES.map(cls=><div key={cls} className="p-2 rounded-lg border border-slate-700"><span className="block w-2 h-2 rounded-full mb-2" style={{backgroundColor:CLASS_COLORS[cls]}}/><span className="text-[11px] font-semibold">{cls}</span></div>)}</div></Card>
          <Card className="flex-1 min-h-0"><h3 className="text-xs font-semibold mb-2">Workflow Execution</h3><p className="text-xs text-slate-400 leading-relaxed">Execution steps will be displayed from the real workflow event stream.</p></Card>
        </div>
      </div>
    </PageLayout>
  );
}
