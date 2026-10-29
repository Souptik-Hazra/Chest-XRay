import React, { useMemo, useState } from 'react';
import { formatDate } from '../lib/utils.js';
import { Search, ChevronLeft, ChevronRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory.js';
import { PageLayout, PageHeader, Card, ClassBadge } from '../components/shared/index.js';
import './pages.css';

const ROWS_PER_PAGE = 5;
export default function AnalysisHistoryPage({ viewHistoryItem }) {
  const { records, loading, error } = useAnalysisHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return records.filter(row => [row.id, row.filename, row.predictedClass, row.status].some(value => (value || '').toLowerCase().includes(term)));
  }, [records, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const rows = filtered.slice(start, start + ROWS_PER_PAGE);
  return <PageLayout>
    <PageHeader title="Analysis History" badge="DATABASE RECORDS ONLY" subtitle="Persisted analyses returned by the backend" className="history-header">
      <div className="history-search"><Search /><input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(1);}} placeholder="Search ID, filename, class…"/></div>
    </PageHeader>
    <Card padding="card-padding-none" className="history-card">
      <div className="history-table-wrap">
        {loading ? <p className="history-empty">Loading history…</p> : error ? <p role="alert" className="history-empty history-error">{error}</p> : rows.length === 0 ? <div className="history-empty"><Activity />{records.length ? 'No matching records.' : 'No analyses saved yet.'}</div> :
        <table className="history-table"><thead><tr>{['Case ID','Date / Time','Filename','Predicted Class','Score','Uncertainty Flag','Status',''].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td className="page-mono">{row.id}</td><td>{formatDate(row.date || row.timestamp)}</td><td className="page-filename">{row.filename}</td><td><ClassBadge predictedClass={row.predictedClass}/></td><td>{(Number(row.confidence)*100).toFixed(1)}%</td><td>{row.oodFlag ? <span className="history-warning"><AlertTriangle />Heuristic flag</span> : <span className="history-muted">Not flagged</span>}</td><td><span className="history-success"><CheckCircle2 />{row.status || 'Saved'}</span></td><td className="page-align-right"><button onClick={()=>viewHistoryItem(row)} className="page-link">Inspect</button></td></tr>)}</tbody></table>}
      </div>
      <div className="history-pagination"><span>Showing {filtered.length ? start+1 : 0}–{Math.min(start+ROWS_PER_PAGE,filtered.length)} of {filtered.length}</span><div><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={currentPage===1}><ChevronLeft /></button><span>{currentPage} / {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><ChevronRight /></button></div></div>
    </Card>
  </PageLayout>;
}
