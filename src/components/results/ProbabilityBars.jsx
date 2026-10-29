import React, { useEffect, useState } from 'react';
import { CLASS_COLORS } from '../../data/demoData.js';
import './results.css';

export default function ProbabilityBars({ probabilities = [], predictedClass = '' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setMounted(true), 100); return () => clearTimeout(timer); }, []);
  return <div className="probability-bars">{probabilities.map(item => {
    const isPredicted = item.label === predictedClass;
    const color = CLASS_COLORS[item.label] || '#6366f1';
    const percent = Math.round(item.value * 1000) / 10;
    return <div key={item.label} className="probability-item">
      <div className="probability-heading"><span className={`probability-name ${isPredicted?'probability-name--predicted':''}`}><span className="probability-dot" style={{backgroundColor:color}}/><span>{item.label}</span>{isPredicted && <span className="probability-badge">Predicted</span>}</span><span className={`probability-value ${isPredicted?'probability-value--predicted':''}`}>{percent.toFixed(1)}%</span></div>
      <div className="probability-track"><div className="probability-fill" style={{width:mounted ? `${item.value*100}%` : '0%',backgroundColor:color}}/></div>
    </div>;
  })}</div>;
}
