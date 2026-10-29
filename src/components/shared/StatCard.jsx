import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

const VALUE_COLORS = {
  'text-slate-900 dark:text-white': 'stat-card__value--default',
  'text-indigo-600 dark:text-indigo-400': 'stat-card__value--indigo',
  'text-emerald-600 dark:text-emerald-400': 'stat-card__value--green',
  'text-red-600 dark:text-red-400': 'stat-card__value--red',
};
const SUBTITLE_COLORS = {
  'text-slate-400': 'stat-card__subtitle--muted',
  'text-indigo-500': 'stat-card__subtitle--indigo',
  'text-emerald-500': 'stat-card__subtitle--green',
  'text-red-500': 'stat-card__subtitle--red',
};

export default function StatCard({
  label,
  value,
  subtitle,
  subtitleColor = 'text-slate-400',
  valueColor = 'text-slate-900 dark:text-white',
  className = '',
}) {
  return (
    <div className={cn('stat-card', className)}>
      <span className="stat-card__label">{label}</span>
      <div className={cn('stat-card__value', VALUE_COLORS[valueColor] || VALUE_COLORS['text-slate-900 dark:text-white'])}>{value}</div>
      {subtitle && <span className={cn('stat-card__subtitle', SUBTITLE_COLORS[subtitleColor] || 'stat-card__subtitle--muted')}>{subtitle}</span>}
    </div>
  );
}
