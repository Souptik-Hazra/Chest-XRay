import React from 'react';
import TopHeader from './TopHeader.jsx';
import Sidebar from './Sidebar.jsx';
import OverviewPage from '../../pages/OverviewPage.jsx';
import NewAnalysisPage from '../../pages/NewAnalysisPage.jsx';
import AnalysisResultsPage from '../../pages/AnalysisResultsPage.jsx';
import './layout.css';

export default function AppShell(props) {
  const { activePage } = props;
  const renderActivePage = () => {
    switch (activePage) {
      case 'overview': return <OverviewPage {...props} />;
      case 'new-analysis': return <NewAnalysisPage {...props} />;
      case 'results': return <AnalysisResultsPage {...props} />;
      default: return <OverviewPage {...props} />;
    }
  };
  return (
    <div className="app-shell">
      <div className="app-shell__header"><TopHeader {...props} /></div>
      <div className="app-shell__sidebar"><Sidebar {...props} /></div>
      <main className="app-shell__main">{renderActivePage()}</main>
    </div>
  );
}
