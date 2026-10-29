import React, { useState, useEffect } from 'react';
import { demoHistory } from '../data/demoData.js';
import { formatDate } from '../lib/utils.js';
import { Search, ChevronLeft, ChevronRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAnalysisHistory } from '../services/analysisService.js';
import { PageLayout, PageHeader, Card, ClassBadge } from '../components/shared/index.js';

export default function AnalysisHistoryPage({ viewHistoryItem }) {
  const [historyRecords, setHistoryRecords] = useState(demoHistory);
  const [isLiveDatabase, setIsLiveDatabase] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    getAnalysisHistory().then((data) => {
      if (data && data.length > 0) {
        setHistoryRecords(data);
        setIsLiveDatabase(true);
      }
    }).catch(() => {});
  }, []);

  const filteredHistory = historyRecords.filter((row) => {
    const term = searchTerm.toLowerCase();
    return (
      (row.id || '').toLowerCase().includes(term) ||
      (row.filename || '').toLowerCase().includes(term) ||
      (row.predictedClass || '').toLowerCase().includes(term) ||
      (row.status || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredHistory.slice(startIndex, startIndex + rowsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <PageLayout>
      {/* Top Header */}
      <PageHeader
        title="Clinical Radiograph Archives"
        badge={isLiveDatabase ? 'SQLite Database (Live Archive)' : 'DEMO DATA'}
        badgeVariant={isLiveDatabase ? 'emerald' : 'amber'}
        subtitle="Audit trail of multi-agent inference records with out-of-distribution tracking"
        className="mb-4"
      >
        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, file, class..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </PageHeader>

      {/* Table Container */}
      <Card padding="p-0" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto panel-scroll min-h-0">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No matching records found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching with a different term.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 z-10">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Predicted Class</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">OOD Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {currentRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {row.id}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]">
                      {row.filename}
                    </td>
                    <td className="py-3 px-4">
                      <ClassBadge predictedClass={row.predictedClass} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {(row.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      {row.oodFlag ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>Flagged OOD</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Normal</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{row.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => viewHistoryItem(row)}
                        className="px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <div>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredHistory.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-700 dark:text-slate-200">{Math.min(startIndex + rowsPerPage, filteredHistory.length)}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-200">{filteredHistory.length}</strong> cases
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-semibold px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
