import React, { useState } from 'react';
import { Copy, Download, Check, ShieldAlert, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';
import { Card, Callout } from '../shared/index.js';

export default function AIReportPanel({ analysisResult }) {
  const [copied, setCopied] = useState(false);
  if (!analysisResult) return null;
  const { id, filename, timestamp, predictedClass, confidence, probabilities, findings = {}, report = {} } = analysisResult;
  const fullReportText = [
    'CHESTX AI RESEARCH OUTPUT',
    `Case ID: ${id}`,
    `Timestamp: ${formatDate(timestamp)}`,
    `Input: ${filename}`,
    'Model: fine-tuned DenseNet121; multi-view mean probability aggregation',
    '',
    'MODEL OUTPUT (not a verified diagnosis)',
    `Predicted class: ${predictedClass}`,
    `Top class score: ${(Number(confidence) * 100).toFixed(1)}%`,
    'Class probabilities:',
    ...(probabilities || []).map(p => `- ${p.label}: ${(Number(p.value) * 100).toFixed(1)}%`),
    '',
    'MEASURED DIAGNOSTICS',
    `Cross-view agreement: ${findings.crossViewAgreement ?? 'Unavailable'}`,
    `Prediction entropy: ${findings.predictionEntropy ?? 'Unavailable'}`,
    `Confidence margin: ${findings.confidenceMargin ?? 'Unavailable'}`,
    `Image quality: ${findings.imageQuality ?? 'Unavailable'}`,
    `Uncertainty heuristic flag: ${findings.oodDetected === true ? 'Flagged' : findings.oodDetected === false ? 'Not flagged' : 'Unavailable'}`,
    '',
    'SUMMARY',
    report.summary || 'No summary was returned.',
    '',
    'GRAD-CAM LIMITATION',
    report.gradcamNote || 'Grad-CAM description unavailable.',
    '',
    'REVIEW NOTE',
    report.reviewRecommendation || 'Qualified review is required; no clinical recommendation was generated.',
    '',
    'LIMITATIONS',
    report.limitations || 'Research prototype only. Do not use as a standalone diagnostic tool.'
  ].join('\n');

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(fullReportText); setCopied(true); }
    catch { setCopied(false); }
  };
  const handleDownload = () => {
    const blob = new Blob([fullReportText], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `ChestX_Report_${id}.txt`; link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500"/><span className="text-xs font-semibold">Model Output Summary</span><span className="text-[10px] text-slate-400 ml-2">{report.reportSource === 'langchain' ? 'LangChain summary' : 'Evidence-bounded summary'}</span></div><div className="flex gap-2"><button onClick={handleCopy} className="px-2.5 py-1 rounded-md border border-slate-700 text-xs flex items-center gap-1">{copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}{copied ? 'Copied' : 'Copy'}</button><button onClick={handleDownload} className="px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs flex items-center gap-1"><Download className="w-3.5 h-3.5"/>Export TXT</button></div></div>
    <Card padding="p-4" className="space-y-3.5 text-xs"><div><h5 className="text-[10px] font-bold uppercase text-slate-400 mb-1">Model summary</h5><p className="leading-relaxed">{report.summary || 'No report summary was returned by the backend.'}</p></div>
      <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-slate-800/60"><div>Predicted class: <strong>{predictedClass}</strong></div><div>Model score: <strong>{(Number(confidence)*100).toFixed(1)}%</strong></div><div>View agreement: {findings.crossViewAgreement ?? 'Unavailable'}</div><div>Entropy: {findings.predictionEntropy ?? 'Unavailable'}</div><div>Image quality: {findings.imageQuality ?? 'Unavailable'}</div><div>Uncertainty heuristic: {findings.oodDetected === true ? 'Flagged' : findings.oodDetected === false ? 'Not flagged' : 'Unavailable'}</div></div>
      <div><h5 className="text-[10px] font-bold uppercase text-slate-400 mb-1">Grad-CAM limitation</h5><p className="text-slate-300">{report.gradcamNote || 'Unavailable.'}</p></div>
      <div><h5 className="text-[10px] font-bold uppercase text-slate-400 mb-1">Review note</h5><p className="text-slate-300">{report.reviewRecommendation || 'No review note returned.'}</p></div>
      <Callout icon={ShieldAlert} variant="warning"><strong>Research prototype only.</strong> Softmax scores are not necessarily calibrated probabilities. This system does not replace a qualified radiologist and must not guide diagnosis or treatment on its own.</Callout>
    </Card>
  </div>;
}
