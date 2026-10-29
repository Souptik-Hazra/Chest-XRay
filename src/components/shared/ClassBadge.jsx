import React from 'react';
import { cn } from '../../lib/utils.js';
import './shared.css';

const CLASS_VARIANTS = {
  'Normal': 'class-badge--normal',
  'Bacterial Pneumonia': 'class-badge--bacterial',
  'Viral Pneumonia': 'class-badge--viral',
};

export default function ClassBadge({ predictedClass, className = '' }) {
  return <span className={cn('class-badge', CLASS_VARIANTS[predictedClass] || 'class-badge--default', className)}>{predictedClass}</span>;
}
