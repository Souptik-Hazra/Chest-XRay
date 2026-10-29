export const PREPARATION_VIEWS = [
  { id: 'original', name: 'Original View', desc: 'Raw PA radiograph 512x512', filter: 'none' },
  { id: 'resized', name: 'Resized (Bilinear)', desc: 'Standardized 224x224 tensor input', filter: 'blur(0.5px)' },
  { id: 'contrast', name: 'Contrast Adjusted', desc: 'Histogram equalized / CLAHE enhancement', filter: 'contrast(1.4) brightness(0.95)' },
  { id: 'cropped', name: 'Center Cropped', desc: 'Focused bilateral lung parenchyma field', filter: 'scale(1.2)' },
  { id: 'augmented', name: 'TTA Augmented', desc: 'Affine angle shift & mild contrast jitter', filter: 'hue-rotate(15deg) contrast(1.15)' },
];
