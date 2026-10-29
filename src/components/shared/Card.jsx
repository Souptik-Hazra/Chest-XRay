import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

export default function Card({ children, className = '', padding = 'card-padding-default', ...props }) {
  return <div className={cn('shared-card', padding, className)} {...props}>{children}</div>;
}
