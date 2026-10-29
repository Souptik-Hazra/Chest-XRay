import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

export default function PageLayout({ children, className = '' }) {
  return <div className={cn('page-layout', className)}>{children}</div>;
}
