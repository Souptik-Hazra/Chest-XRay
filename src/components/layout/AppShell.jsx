import React from 'react';
import TopHeader from './TopHeader.jsx';
import Sidebar from './Sidebar.jsx';

import OverviewPage from '../../pages/OverviewPage.jsx';
import NewAnalysisPage from '../../pages/NewAnalysisPage.jsx';
import AnalysisResultsPage from '../../pages/AnalysisResultsPage.jsx';
import AnalysisHistoryPage from '../../pages/AnalysisHistoryPage.jsx';
import ModelInsightsPage from '../../pages/ModelInsightsPage.jsx';

export default function AppShell(props) {
  const { activePage } = props;

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage {...props} />;
      case 'new-analysis':
        return <NewAnalysisPage {...props} />;
      case 'results':
        return <AnalysisResultsPage {...props} />;
      case 'history':
        return <AnalysisHistoryPage {...props} />;
      case 'insights':
        return <ModelInsightsPage {...props} />;
      default:
        return <OverviewPage {...props} />;
    }
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-[#0b1120] text-slate-100 grid"
      style={{
        gridTemplateRows: 'var(--header-height) 1fr',
        gridTemplateColumns: 'var(--sidebar-width) 1fr',
      }}
    >
      {/* Header spans row 1, cols 1-3 */}
      <div className="col-span-2 row-start-1 row-end-2">
        <TopHeader {...props} />
      </div>

      {/* Sidebar in col 1, row 2 */}
      <div className="col-start-1 col-end-2 row-start-2 row-end-3 overflow-hidden">
        <Sidebar {...props} />
      </div>

      {/* Main content in col 2, row 2 - No body scroll, full container height */}
      <main className="col-start-2 col-end-3 row-start-2 row-end-3 overflow-hidden relative flex flex-col min-h-0 min-w-0 bg-[#0f172a]">
        {renderActivePage()}
      </main>
    </div>
  );
}
