import React, { useState } from 'react';
import { Copy, Download, Check, ShieldAlert, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';
import { Card, Callout } from '../shared/index.js';
import './results.css';

export default function AIReportPanel({ analysisResult }) {
  const [copied, setCopied] = useState(false);
  if (!analysisResult) return null;
  const { id, filename, timestamp, predictedClass, confidence, probabilities, findings = {}, report = {} } = analysisResult;
  const fullReportText = [
    'CHESTX AI RESEARCH OUTPUT', `Case ID: ${id}`, `Timestamp: ${formatDate(timestamp)}`, `Input: ${filename}`,
    'Model: fine-tuned DenseNet121; multi-view mean probability aggregation', '',
    'MODEL OUTPUT (not a verified diagnosis)', `Predicted class: ${predictedClass}`, `Top class score: ${(Number(confidence)*100).toFixed(1)}%`,
    'Class probabilities:', ...(probabilities||[]).map(p=>`- ${p.label}: ${(Number(p.value)*100).toFixed(1)}%`), '',
    'MEASURED DIAGNOSTICS', `Cross-view agreement: ${findings.crossViewAgreement??'Unavailable'}`,
    `Prediction entropy: ${findings.predictionEntropy??'Unavailable'}`, `Confidence margin: ${findings.confidenceMargin??'Unavailable'}`,
    `Image quality: ${findings.imageQuality??'Unavailable'}`,
    `Uncertainty heuristic flag: ${findings.oodDetected===true?'Flagged':findings.oodDetected===false?'Not flagged':'Unavailable'}`, '',
    'SUMMARY', report.summary||'No summary was returned.', '', 'GRAD-CAM LIMITATION', report.gradcamNote||'Grad-CAM description unavailable.', '',
    'REVIEW NOTE', report.reviewRecommendation||'Qualified review is required; no clinical recommendation was generated.', '',
    'LIMITATIONS', report.limitations||'Research prototype only. Do not use as a standalone diagnostic tool.'
  ].join('\n');
  const handleCopy = async () => { try { await navigator.clipboard.writeText(fullReportText); setCopied(true); } catch { setCopied(false); } };
  const handleDownload = () => {
    const blob = new Blob([fullReportText], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `ChestX_Report_${id}.txt`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="ai-report-panel">
    <div className="ai-report-toolbar"><div className="ai-report-title"><FileText className="ai-report-icon"/><span>Model Output Summary</span><span className="ai-report-source">{report.reportSource==='gemini_flash_lite' ? `Gemini ${report.reportModel || 'Flash-Lite'} · LangChain` : 'Evidence-bounded summary'}</span></div>
      <div className="ai-report-actions"><button onClick={handleCopy} className="ai-report-button">{copied?<Check className="ai-report-action-icon"/>:<Copy className="ai-report-action-icon"/>}{copied?'Copied':'Copy'}</button><button onClick={handleDownload} className="ai-report-button ai-report-button--primary"><Download className="ai-report-action-icon"/>Export TXT</button></div>
    </div>
    <Card padding="card-padding-lg" className="ai-report-content">
      <div><h5 className="ai-report-subheading">Model summary</h5><p className="ai-report-paragraph">{report.summary||'No report summary was returned by the backend.'}</p></div>
      <div className="ai-report-diagnostics"><div>Predicted class: <strong>{predictedClass}</strong></div><div>Model score: <strong>{(Number(confidence)*100).toFixed(1)}%</strong></div><div>View agreement: {findings.crossViewAgreement??'Unavailable'}</div><div>Entropy: {findings.predictionEntropy??'Unavailable'}</div><div>Image quality: {findings.imageQuality??'Unavailable'}</div><div>Uncertainty heuristic: {findings.oodDetected===true?'Flagged':findings.oodDetected===false?'Not flagged':'Unavailable'}</div></div>
      <div><h5 className="ai-report-subheading">Grad-CAM limitation</h5><p className="ai-report-paragraph ai-report-paragraph--muted">{report.gradcamNote||'Unavailable.'}</p></div>
      <div><h5 className="ai-report-subheading">Review note</h5><p className="ai-report-paragraph ai-report-paragraph--muted">{report.reviewRecommendation||'No review note returned.'}</p></div>
      <Callout icon={ShieldAlert} variant="warning"><strong>Research prototype only.</strong> Softmax scores are not necessarily calibrated probabilities. This system does not replace a qualified radiologist and must not guide diagnosis or treatment on its own.</Callout>
    </Card>
  </div>;
}
