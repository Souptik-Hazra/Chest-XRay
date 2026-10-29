import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

export default function TabNav({ tabs = [], activeTab, onSelectTab, variant = 'pill', className = '' }) {
  const underline = variant === 'underline';
  return (
    <div className={cn(underline ? 'tab-nav tab-nav--underline' : 'tab-nav tab-nav--pill', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={cn('tab-nav__item', activeTab === tab.id && 'tab-nav__item--active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
