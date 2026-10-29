import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

const VALUE_COLORS = {
  default: 'stat-card__value--default',
  white: 'stat-card__value--white',
  slate: 'stat-card__value--slate',
};
const SUBTITLE_COLORS = {
  default: 'stat-card__subtitle--default',
  muted: 'stat-card__subtitle--muted',
  green: 'stat-card__subtitle--green',
  red: 'stat-card__subtitle--red',
};

export default function StatCard({ label, value, subtitle, subtitleColor = 'text-slate-400', valueColor = 'text-slate-900 dark:text-white', className = '' }) {
  const valueClass = valueColor.includes('white') ? VALUE_COLORS.white : VALUE_COLORS.default;
  const subtitleClass = subtitleColor.includes('emerald') || subtitleColor.includes('green')
    ? SUBTITLE_COLORS.green
    : subtitleColor.includes('red') ? SUBTITLE_COLORS.red : SUBTITLE_COLORS.muted;
  return (
    <div className={cn('stat-card', className)}>
      <span className="stat-card__label">{label}</span>
      <div className={cn('stat-card__value', valueClass)}>{value}</div>
      {subtitle && <span className={cn('stat-card__subtitle', subtitleClass)}>{subtitle}</span>}
    </div>
  );
}
