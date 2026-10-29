import React from 'react';
import {
  LayoutDashboard,
  Plus,
  Activity,
  Clock,
  BarChart2,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export default function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'new-analysis', label: 'New Analysis', icon: Plus, badge: 'Upload' },
    { id: 'results', label: 'Analysis Results', icon: Activity },
    { id: 'history', label: 'Analysis History', icon: Clock },
    { id: 'insights', label: 'Model Insights', icon: BarChart2 },
  ];

  return (
    <aside className="w-[216px] min-w-[216px] h-full bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 select-none z-20">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 overflow-y-auto panel-scroll">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 text-left cursor-pointer',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
