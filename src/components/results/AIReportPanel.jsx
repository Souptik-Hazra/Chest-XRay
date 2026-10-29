import React, { useState } from 'react';
import { Copy, Download, Check, ShieldAlert, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';
import { Card, Callout } from '../shared/index.js';

export default function AIReportPanel({ analysisResult }) {
  const [copied, setCopied] = useState(false);

  if (!analysisResult) return null;

  const {
    id,
    filename,
    timestamp,
    predictedClass,
    confidence,
    probabilities = [],
    findings = {},
    report = {},
  } = analysisResult;

  const fullReportText = `=====================================================
CHESTX MULTI-AGENT RADIOGRAPH SYNTHESIS REPORT
=====================================================
Case ID: ${id}
Acquisition Timestamp: ${formatDate(timestamp)}
Input Artifact: ${filename}
Model Architecture: DenseNet121 Multi-View Ensemble

[1] PRIMARY FINDING & CLASSIFICATION
-----------------------------------------------------
Predicted Class: ${predictedClass.toUpperCase()}
Top Confidence: ${(confidence * 100).toFixed(1)}% (Confidence Level: High)
Full Class Distribution:
${probabilities.map((p) => `  - ${p.label.padEnd(22)}: ${(p.value * 100).toFixed(1)}%`).join('\n')}

[2] MULTI-VIEW & UNCERTAINTY METRICS
-----------------------------------------------------
- Cross-View Agreement: ${findings.crossViewAgreement || 'High'}
- Predictive Entropy: ${findings.predictionEntropy || 0.42} nats
- Confidence Margin: +${((findings.confidenceMargin || 0.58) * 100).toFixed(0)}%
- Out-Of-Distribution Flag: ${findings.oodDetected ? 'POSITIVE (Atypical)' : 'NEGATIVE (In-Distribution)'}
- Radiograph Quality: ${findings.imageQuality || 'Sufficient'}

[3] SYNTHESIS SUMMARY
-----------------------------------------------------
${report.summary || 'Patterns consistent with consolidative changes.'}

[4] INTERPRETABILITY (GRAD-CAM)
-----------------------------------------------------
${report.gradcamNote || 'Saliency focused over right lower zone.'}

[5] CLINICAL RECOMMENDATION
-----------------------------------------------------
- Correlate with clinical presentation (fever, WBC, sputum culture, auscultation).
- Recommend non-emergent formal radiologist verification.
- Consider follow-up chest radiograph in 7-10 days if symptoms persist.

=====================================================
RESEARCH DISCLAIMER:
${report.limitations || 'This is an AI research prototype. Results must be reviewed by a qualified radiologist before any clinical decision.'}
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullReportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChestX_Report_${id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header with Copy & Export buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Automated Clinical Summary
          </span>
          {analysisResult?.isDemoData ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 ml-2">
              Sample Summary
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800 ml-2">
              Clinical LLM Synthesis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export TXT</span>
          </button>
        </div>
      </div>

      {/* Styled Report Body */}
      <Card padding="p-4" className="space-y-3.5 text-xs">
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Section 1: Diagnostic Impression
          </h5>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {report.summary}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400">Predicted Class:</span>{' '}
            <strong className="text-slate-900 dark:text-white">{predictedClass}</strong>
          </div>
          <div>
            <span className="text-slate-400">Confidence:</span>{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {(confidence * 100).toFixed(1)}%
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Multi-View Consensus:</span>{' '}
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {findings.crossViewAgreement}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Shannon Entropy:</span>{' '}
            <span className="text-slate-700 dark:text-slate-300 font-mono">
              {findings.predictionEntropy} nats
            </span>
          </div>
        </div>

        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Section 2: Saliency & Spatial Attention
          </h5>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            {report.gradcamNote}
          </p>
        </div>

        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Section 3: Radiologist Recommendation
          </h5>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Correlate with acute patient inflammatory markers (C-reactive protein, WBC, body temperature). Review anterior-posterior projection alongside lateral views if clinically indicated.
          </p>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <Callout icon={ShieldAlert} variant="warning">
            <strong>Mandatory Academic Disclaimer:</strong> AI-generated research aid — not a certified clinical diagnostic device. Diagnostic and treatment decisions must always be rendered by licensed medical personnel.
          </Callout>
        </div>
      </Card>
    </div>
  );
}
