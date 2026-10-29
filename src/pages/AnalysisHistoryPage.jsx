import React, { useState, useEffect } from 'react';
import { formatDate } from '../lib/utils.js';
import { Search, ChevronLeft, ChevronRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAnalysisHistory } from '../services/analysisService.js';
import { PageLayout, PageHeader, Card, ClassBadge } from '../components/shared/index.js';

export default function AnalysisHistoryPage({ viewHistoryItem }) {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    getAnalysisHistory()
      .then(data => { setHistoryRecords(Array.isArray(data) ? data : []); setLoadError(''); })
      .catch(error => { setHistoryRecords([]); setLoadError(error.message || 'History API unavailable.'); })
      .finally(() => setLoading(false));
  }, []);

  const filteredHistory = historyRecords.filter(row => {
    const term = searchTerm.toLowerCase();
    return [row.id, row.filename, row.predictedClass, row.status].some(value => (value || '').toLowerCase().includes(term));
  });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / rowsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * rowsPerPage;
  const currentRows = filteredHistory.slice(startIndex, startIndex + rowsPerPage);

  return <PageLayout>
    <PageHeader title="Clinical Radiograph Archives" badge="DATABASE RECORDS ONLY" subtitle="Persisted analyses returned by the FastAPI backend" className="mb-4">
      <div className="relative w-full sm:w-64"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Search by ID, file, class…" value={searchTerm} onChange={e => {setSearchTerm(e.target.value);setCurrentPage(1);}} className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs" /></div>
    </PageHeader>
    <Card padding="p-0" className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? <p className="p-8 text-center text-xs text-slate-400">Loading real database history…</p> :
        loadError ? <p role="alert" className="p-8 text-center text-xs text-amber-400">Could not load history: {loadError}</p> :
        currentRows.length === 0 ? <div className="p-8 text-center text-xs text-slate-400"><Activity className="w-8 h-8 mx-auto mb-2 opacity-50"/><p>{historyRecords.length ? 'No matching records found.' : 'No analyses have been saved yet.'}</p></div> :
        <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-900 text-[10px] uppercase text-slate-400"><tr>{['Case ID','Date / Time','Filename','Predicted Class','Score','Uncertainty Flag','Status',''].map(h=><th key={h} className="py-3 px-4">{h}</th>)}</tr></thead><tbody>{currentRows.map(row=><tr key={row.id} className="border-b border-slate-800"><td className="py-3 px-4 font-mono">{row.id}</td><td className="py-3 px-4">{formatDate(row.date || row.timestamp)}</td><td className="py-3 px-4 truncate max-w-[150px]">{row.filename}</td><td className="py-3 px-4"><ClassBadge predictedClass={row.predictedClass}/></td><td className="py-3 px-4">{(Number(row.confidence)*100).toFixed(1)}%</td><td className="py-3 px-4">{row.oodFlag ? <span className="text-amber-400"><AlertTriangle className="inline w-3 h-3 mr-1"/>Heuristic flag</span> : <span className="text-slate-500">Not flagged</span>}</td><td className="py-3 px-4"><span className="text-emerald-400"><CheckCircle2 className="inline w-3 h-3 mr-1"/>{row.status || 'Saved'}</span></td><td className="py-3 px-4 text-right"><button onClick={()=>viewHistoryItem(row)} className="text-indigo-400">Inspect</button></td></tr>)}</tbody></table>}
      </div>
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400"><span>Showing {filteredHistory.length ? startIndex+1 : 0}–{Math.min(startIndex+rowsPerPage,filteredHistory.length)} of {filteredHistory.length}</span><div className="flex items-center gap-2"><button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPageSafe===1} className="disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><span>{currentPageSafe} / {totalPages}</span><button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPageSafe===totalPages} className="disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>
    </Card>
  </PageLayout>;
}
