import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

export default function Callout({ icon: Icon, variant = 'info', children, className = '' }) {
  return (
    <div className={cn('shared-callout', `shared-callout--${variant}`, className)}>
      {Icon && <Icon className="shared-callout__icon" />}
      <span>{children}</span>
    </div>
  );
}
