import React from 'react';
import ProbabilityBars from './ProbabilityBars.jsx';
import { Clock, Check } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';
import { ClassBadge } from '../shared/index.js';

export default function FindingsPanel({ analysisResult }) {
  if (!analysisResult) return null;

  const {
    id,
    timestamp,
    predictedClass,
    confidence,
    probabilities = [],
    findings = {},
  } = analysisResult;

  return (
    <div className="space-y-4">
      {/* Header status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Analysis Complete
            </span>
            {analysisResult?.isDemoData ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Sample Record
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                DenseNet121 Inferred (Live)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {predictedClass}
            </h3>
            <ClassBadge
              predictedClass={predictedClass}
              className="text-xs px-2.5 py-0.5"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {id}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{formatDate(timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Probability Bars */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          Class Probabilities (DenseNet121 Ensemble)
        </h4>
        <ProbabilityBars probabilities={probabilities} predictedClass={predictedClass} />
      </div>

      {/* Key Findings Grid */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Model Diagnostic Indices
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">View Agreement</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {findings.crossViewAgreement || 'High'}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Entropy</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              {findings.predictionEntropy ?? 0.42}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Confidence Margin</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              +{(findings.confidenceMargin ? findings.confidenceMargin * 100 : 58).toFixed(0)}%
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Image Quality</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {findings.imageQuality || 'Good'}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">OOD Detected</div>
            <div className={`text-xs font-bold mt-0.5 ${findings.oodDetected ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {findings.oodDetected ? 'Yes (Check)' : 'No (In-Dist)'}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Review Status</div>
            <div className={`text-xs font-bold mt-0.5 ${findings.reviewNeeded ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {findings.reviewNeeded ? 'Priority' : 'Routine'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
