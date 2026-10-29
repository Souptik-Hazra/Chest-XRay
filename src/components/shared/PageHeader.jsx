import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

export default function PageHeader({ title, badge, badgeVariant = 'emerald', subtitle, children, className = '' }) {
  return (
    <div className={cn('page-header', className)}>
      <div>
        <div className="page-header__title-row">
          <h2 className="page-header__title">{title}</h2>
          {badge && <span className={cn('page-header__badge', `page-header__badge--${badgeVariant}`)}>{badge}</span>}
        </div>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  );
}
