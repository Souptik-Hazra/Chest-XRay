export const INSIGHTS_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'classification', label: 'Classification' },
  { id: 'multiview', label: 'Multi-View Gain' },
  { id: 'calibration', label: 'Calibration & ECE' },
  { id: 'ood', label: 'OOD Benchmark' },
];

export const ARCHITECTURE_SPECS = [
  {
    title: 'Feature Extractor Backbone',
    desc: 'DenseNet121 pre-trained weights (4 DenseBlocks, 1024-channel output)',
    badge: '6.95M Params',
    badgeColor: 'text-indigo-400',
  },
  {
    title: 'Classifier Head Projection',
    desc: 'Linear(1024, 256) → ReLU(inplace=False) → Dropout(p=0.3) → Linear(256, 3)',
    badge: '263K Params',
    badgeColor: 'text-indigo-400',
  },
  {
    title: 'Grad-CAM Hook Layer',
    desc: 'features.denseblock4 (Target 7x7 spatial activation field for heatmap)',
    badge: 'Layer 4 Hook',
    badgeColor: 'text-emerald-400',
  },
  {
    title: 'Input Normalization Tensor',
    desc: 'ImageNet Norm: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]',
    badge: '224 x 224',
    badgeColor: 'text-slate-400',
  },
];

export const TEST_COHORTS = [
  {
    label: 'Normal Radiographs',
    count: '159 scans (27.1%)',
    color: 'bg-emerald-500',
  },
  {
    label: 'Bacterial Pneumonia',
    count: '278 scans (47.4%)',
    color: 'bg-red-500',
  },
  {
    label: 'Viral Pneumonia',
    count: '150 scans (25.5%)',
    color: 'bg-amber-500',
  },
];

export const CONFUSION_MATRIX = [
  {
    actual: 'Normal (159)',
    color: 'text-emerald-600 dark:text-emerald-400',
    normal: 153,
    bacterial: 4,
    viral: 2,
    recall: '96.2%',
    recallColor: 'text-emerald-600',
    highlightCol: 'normal',
  },
  {
    actual: 'Bacterial (278)',
    color: 'text-red-600 dark:text-red-400',
    normal: 16,
    bacterial: 206,
    viral: 56,
    recall: '74.1%',
    recallColor: 'text-red-600',
    highlightCol: 'bacterial',
  },
  {
    actual: 'Viral (150)',
    color: 'text-amber-600 dark:text-amber-400',
    normal: 11,
    bacterial: 35,
    viral: 104,
    recall: '69.3%',
    recallColor: 'text-amber-600',
    highlightCol: 'viral',
  },
];

export const SYNTHETIC_VIEWS = [
  { name: '1. Original PA View', desc: 'Raw PA radiograph with standard contrast', gain: 'Baseline (79.0%)' },
  { name: '2. Bilinear Tensor (224x224)', desc: 'Standardized resolution tensor input', gain: '+0.8% stability' },
  { name: '3. CLAHE Contrast Normalization', desc: 'Dynamic range expansion for lung bases', gain: '+1.6% detail recovery' },
  { name: '4. Parenchyma Center Crop (88%)', desc: 'Focused bilateral lung field exclusion', gain: '+0.5% edge rejection' },
  { name: '5. Test-Time Augmentation (±3°)', desc: 'Affine rotation and subtle brightness jitter', gain: '+0.9% angle invariance' },
];

export const CALIBRATION_BINS = [
  { bin: '50% - 60%', expected: 0.55, empirical: 0.542, count: 48 },
  { bin: '60% - 70%', expected: 0.65, empirical: 0.668, count: 72 },
  { bin: '70% - 80%', expected: 0.75, empirical: 0.764, count: 114 },
  { bin: '80% - 90%', expected: 0.85, empirical: 0.859, count: 168 },
  { bin: '90% - 100%', expected: 0.95, empirical: 0.961, count: 185 },
];

export const OOD_COHORTS = [
  { cohort: 'In-Distribution (Pediatric Frontal Chest PA)', auroc: 1.000, rejection: '1.4% False Alarm', meanEntropy: '0.42 nats', status: 'Accepted' },
  { cohort: 'Near-OOD: Severe Motion / Artifact Blurs', auroc: 0.924, rejection: '93.8% Rejected', meanEntropy: '0.88 nats', status: 'Flagged' },
  { cohort: 'Far-OOD: Abdominal / Pelvic Radiographs', auroc: 0.965, rejection: '98.2% Rejected', meanEntropy: '1.24 nats', status: 'Rejected' },
  { cohort: 'Far-OOD: Extremity / Limb Bone Scans', auroc: 0.982, rejection: '99.1% Rejected', meanEntropy: '1.36 nats', status: 'Rejected' },
];
