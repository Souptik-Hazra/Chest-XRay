import React, { useState } from 'react';
import { Copy, Download, Check, ShieldAlert, FileText } from 'lucide-react';
import { Card, Callout } from '../shared/index.js';
import './results.css';

function InlineMarkdown({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function FormattedReport({ content }) {
  const lines = String(content || 'No report summary was returned by the backend.')
    .replace(/\r/g, '')
    .replace(/[ \t]+(?=#{1,3}\s)/g, '\n')
    .replace(/\s+-\s+(?=\*\*)/g, '\n- ')
    .replace(/\s+(?=\*\*[^*]+\*\*:)/g, '\n')
    .split('\n');
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(<ul className="ai-report-list" key={`list-${blocks.length}`}>{listItems.map((item, i) => <li key={i}><InlineMarkdown text={item} /></li>)}</ul>);
      listItems = [];
    }
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      return;
    }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      return;
    }
    flushList();
    if (heading) {
      blocks.push(<h4 className="ai-report-section-heading" key={index}><InlineMarkdown text={heading[1]} /></h4>);
    } else {
      blocks.push(<p className="ai-report-paragraph" key={index}><InlineMarkdown text={line} /></p>);
    }
  });
  flushList();
  return <div className="ai-report-formatted">{blocks}</div>;
}

export default function AIReportPanel({ analysisResult }) {
  const [copied, setCopied] = useState(false);
  if (!analysisResult) return null;
  const { id, predictedClass, confidence, findings = {}, report = {} } = analysisResult;
  const reportText = report.summary || 'No report summary was returned by the backend.';
  const fullReportText = report.exportText || report.summary || 'No report export was returned by the backend.';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullReportText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
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

  const isGemini = report.reportSource === 'gemini';
  const sourceLabel = isGemini
    ? `Gemini ${report.reportModel || 'Flash-Lite'} · LangChain`
    : 'Evidence-bounded summary';

  return <div className="ai-report-panel">
    <div className="ai-report-toolbar">
      <div className="ai-report-title">
        <FileText className="ai-report-icon" />
        <div className="ai-report-title-copy">
          <span>Model Output Summary</span>
          <span className="ai-report-source">{sourceLabel}</span>
        </div>
      </div>
      <div className="ai-report-actions">
        <button onClick={handleCopy} className="ai-report-button">
          {copied ? <Check className="ai-report-action-icon" /> : <Copy className="ai-report-action-icon" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handleDownload} className="ai-report-button ai-report-button--primary">
          <Download className="ai-report-action-icon" /> Export TXT
        </button>
      </div>
    </div>
    <Card padding="card-padding-lg" className="ai-report-content">
      <div className="ai-report-summary-block">
        <div className="ai-report-section-kicker">AI report</div>
        <FormattedReport content={reportText} />
      </div>
      <div>
        <h5 className="ai-report-subheading">Model output at a glance</h5>
        <div className="ai-report-diagnostics">
          <div>Predicted class <strong>{predictedClass}</strong></div>
          <div>Top class score <strong>{(Number(confidence) * 100).toFixed(1)}%</strong></div>
          <div>Cross-view agreement <strong>{findings.crossViewAgreement ?? 'Unavailable'}</strong></div>
          <div>Prediction entropy <strong>{findings.predictionEntropy ?? 'Unavailable'}</strong></div>
          <div>Image quality <strong>{findings.imageQuality ?? 'Unavailable'}</strong></div>
          <div>Uncertainty heuristic <strong>{findings.oodDetected === true ? 'Flagged' : findings.oodDetected === false ? 'Not flagged' : 'Unavailable'}</strong></div>
        </div>
      </div>
      <div>
        <h5 className="ai-report-subheading">Grad-CAM limitation</h5>
        <p className="ai-report-paragraph ai-report-paragraph--muted">{report.gradcamNote || 'Unavailable.'}</p>
      </div>
      <div>
        <h5 className="ai-report-subheading">Review note</h5>
        <p className="ai-report-paragraph ai-report-paragraph--muted">{report.reviewRecommendation || 'No review note returned.'}</p>
      </div>
      <Callout icon={ShieldAlert} variant="warning"><strong>Research prototype only.</strong> Softmax scores are not necessarily calibrated probabilities. This system does not replace a qualified radiologist and must not guide diagnosis or treatment on its own.</Callout>
    </Card>
  </div>;
}