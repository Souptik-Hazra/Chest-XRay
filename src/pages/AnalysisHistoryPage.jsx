import React, { useMemo, useState } from 'react';
import { formatDate } from '../lib/utils.js';
import { Search, ChevronLeft, ChevronRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory.js';
import { PageLayout, PageHeader, Card, ClassBadge } from '../components/shared/index.js';

const ROWS_PER_PAGE = 5;

export default function AnalysisHistoryPage({ viewHistoryItem }) {
  const { records, loading, error } = useAnalysisHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return records.filter(row => [row.id, row.filename, row.predictedClass, row.status]
      .some(value => (value || '').toLowerCase().includes(term)));
  }, [records, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const rows = filtered.slice(start, start + ROWS_PER_PAGE);

  return <PageLayout>
    <PageHeader title="Analysis History" badge="DATABASE RECORDS ONLY" subtitle="Persisted analyses returned by the backend" className="mb-4">
      <div className="relative w-full sm:w-64"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/><input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(1);}} placeholder="Search ID, filename, class…" className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs"/></div>
    </PageHeader>
    <Card padding="p-0" className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? <p className="p-8 text-center text-xs text-slate-400">Loading history…</p> :
         error ? <p role="alert" className="p-8 text-center text-xs text-amber-400">{error}</p> :
         rows.length === 0 ? <div className="p-8 text-center text-xs text-slate-400"><Activity className="w-8 h-8 mx-auto mb-2 opacity-50"/>{records.length ? 'No matching records.' : 'No analyses saved yet.'}</div> :
         <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-900 text-[10px] uppercase text-slate-400"><tr>{['Case ID','Date / Time','Filename','Predicted Class','Score','Uncertainty Flag','Status',''].map(label=><th key={label} className="py-3 px-4">{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b border-slate-800"><td className="py-3 px-4 font-mono">{row.id}</td><td className="py-3 px-4">{formatDate(row.date || row.timestamp)}</td><td className="py-3 px-4 truncate max-w-[150px]">{row.filename}</td><td className="py-3 px-4"><ClassBadge predictedClass={row.predictedClass}/></td><td className="py-3 px-4">{(Number(row.confidence)*100).toFixed(1)}%</td><td className="py-3 px-4">{row.oodFlag ? <span className="text-amber-400"><AlertTriangle className="inline w-3 h-3 mr-1"/>Heuristic flag</span> : <span className="text-slate-500">Not flagged</span>}</td><td className="py-3 px-4"><span className="text-emerald-400"><CheckCircle2 className="inline w-3 h-3 mr-1"/>{row.status || 'Saved'}</span></td><td className="py-3 px-4 text-right"><button onClick={()=>viewHistoryItem(row)} className="text-indigo-400">Inspect</button></td></tr>)}</tbody></table>}
      </div>
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400"><span>Showing {filtered.length ? start+1 : 0}–{Math.min(start+ROWS_PER_PAGE,filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><span>{currentPage} / {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>
    </Card>
  </PageLayout>;
}
