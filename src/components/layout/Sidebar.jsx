import { Plus, Activity } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import './layout.css';

export default function Sidebar({ activePage, setActivePage, isAnalyzing = false }) {
  const navItems = [
    { id: 'new-analysis', label: 'New Analysis', icon: Plus, badge: 'Upload' },
    { id: 'results', label: 'Analysis Results', icon: Activity },
  ];

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__nav panel-scroll">
        <div className="app-sidebar__label">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => setActivePage(item.id)} disabled={isAnalyzing}
              className={cn('app-sidebar__item', isActive && 'app-sidebar__item--active')}>
              <div className="app-sidebar__item-label">
                <Icon className={cn('app-sidebar__icon', isActive && 'app-sidebar__icon--active')}/>
                <span className="app-sidebar__item-text">{item.label}</span>
              </div>
              {item.badge && !isActive && <span className="app-sidebar__badge">{item.badge}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
