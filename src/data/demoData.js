export const CLASSES = ['Normal', 'Bacterial Pneumonia', 'Viral Pneumonia'];

export const CLASS_COLORS = {
  'Normal': '#10b981',
  'Bacterial Pneumonia': '#ef4444',
  'Viral Pneumonia': '#f59e0b',
};

export const CLASS_BG = {
  'Normal': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  'Bacterial Pneumonia': 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300 dark:border-red-800',
  'Viral Pneumonia': 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800',
};

export const demoAnalysisResult = {
  id: 'CHX-20251028-001',
  filename: 'chest_xray_patient.png',
  timestamp: '2025-10-28T14:32:10Z',
  isDemoData: true,
  predictedClass: 'Bacterial Pneumonia',
  confidence: 0.738,
  confidenceLevel: 'High',
  probabilities: [
    { label: 'Normal', value: 0.103, color: '#10b981' },
    { label: 'Bacterial Pneumonia', value: 0.738, color: '#ef4444' },
    { label: 'Viral Pneumonia', value: 0.160, color: '#f59e0b' },
  ],
  findings: {
    crossViewAgreement: 'High',
    predictionEntropy: 0.42,
    confidenceMargin: 0.58,
    imageQuality: 'Good',
    oodDetected: false,
    reviewNeeded: false,
  },
  workflow: {
    totalDuration: '28.4s',
    stages: [
      { id: 'validation', label: 'Image Validation & Preprocessing', status: 'completed', duration: '12.4s' },
      { id: 'inference', label: 'Multi-View DenseNet121 Inference', status: 'completed', duration: '8.7s' },
      { id: 'consensus', label: 'Consensus & Uncertainty', status: 'completed', duration: '2.1s' },
      { id: 'gradcam', label: 'Grad-CAM Explainability', status: 'completed', duration: '5.3s' },
      { id: 'segmentation', label: 'Opacity Segmentation', status: 'skipped', duration: '-' },
      { id: 'ood', label: 'Quality & OOD Analysis', status: 'completed', duration: '3.8s' },
      { id: 'report', label: 'LLM Report Generation', status: 'completed', duration: '4.2s' },
    ]
  },
  report: {
    summary: 'The X-ray shows focal consolidation and opacity patterns consistent with Bacterial Pneumonia, primarily in the right lower lung zone. Multi-view model consensus exhibits high confidence with low predictive entropy.',
    limitations: 'This is an AI research prototype. Results must be reviewed by a qualified radiologist before any clinical decision.',
    gradcamNote: 'Highlighted regions show areas that most influenced the prediction. These do not reliably outline lesion boundaries or determine affected volumes.',
    segmentationNote: 'Opacity segmentation was not performed for this analysis (optional secondary module disabled).',
  }
};

export const demoHistory = [
  { id: 'CHX-20251028-001', date: '2025-10-28T14:32:10Z', filename: 'chest_xray_01.png', predictedClass: 'Bacterial Pneumonia', confidence: 0.738, status: 'Completed', oodFlag: false, isDemoData: true },
  { id: 'CHX-20251027-003', date: '2025-10-27T09:15:42Z', filename: 'xray_patient_b.jpg', predictedClass: 'Normal', confidence: 0.912, status: 'Completed', oodFlag: false, isDemoData: true },
  { id: 'CHX-20251026-007', date: '2025-10-26T16:48:30Z', filename: 'scan_20251026.png', predictedClass: 'Viral Pneumonia', confidence: 0.621, status: 'Completed', oodFlag: true, isDemoData: true },
  { id: 'CHX-20251025-002', date: '2025-10-25T11:22:05Z', filename: 'chest_ap_view.jpg', predictedClass: 'Bacterial Pneumonia', confidence: 0.845, status: 'Completed', oodFlag: false, isDemoData: true },
  { id: 'CHX-20251024-009', date: '2025-10-24T08:05:18Z', filename: 'xray_frontal.png', predictedClass: 'Normal', confidence: 0.967, status: 'Completed', oodFlag: false, isDemoData: true },
];


export const demoMetrics = {
  overall: { accuracy: 0.8188, precision: 0.800, recall: 0.790, f1: 0.790, auc: 0.947 },
  perClass: [
    { label: 'Normal', precision: 0.850, recall: 0.960, f1: 0.910, auc: 0.971, support: 159 },
    { label: 'Bacterial Pneumonia', precision: 0.870, recall: 0.740, f1: 0.800, auc: 0.941, support: 278 },
    { label: 'Viral Pneumonia', precision: 0.620, recall: 0.690, f1: 0.650, auc: 0.929, support: 150 },
  ],
  multiViewGain: { singleView: 0.790, multiView: 0.819, gain: '+2.9%', note: 'Evaluated on 587 held-out test images' },
  calibration: { ece: 0.043, mce: 0.089, note: 'Expected Calibration Error (lower is better)' },
  ood: { auroc: 0.941, fpr95: 0.089, note: 'OOD detection evaluated on held-out non-chest images' },
};

export const analysisStages = [
  { num: 1, title: 'Image Input', desc: 'Upload chest X-ray in DICOM, PNG, or JPEG format.' },
  { num: 2, title: 'Validation & Preprocessing', desc: 'Format check, quality assessment, and generation of multiple image views.' },
  { num: 3, title: 'Multi-View Inference', desc: 'Fine-tuned DenseNet121 runs on each view independently.' },
  { num: 4, title: 'Probability Aggregation', desc: 'Per-view probabilities are averaged; entropy and confidence margin computed.' },
  { num: 5, title: 'Grad-CAM Explainability', desc: 'Gradient-weighted activation maps highlight influential image regions.' },
  { num: 6, title: 'Optional Segmentation', desc: 'Lung opacity segmentation estimates affected area when the module is active.' },
  { num: 7, title: 'Uncertainty & OOD Checks', desc: 'Prediction entropy and OOD score flag low-confidence or atypical inputs.' },
  { num: 8, title: 'LLM Report Generation', desc: 'Evidence-grounded language model synthesises all results into a structured report.' },
];
