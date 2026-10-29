export const PREPARATION_VIEWS = [
  { id: 'original', name: 'Original View', desc: 'Original uploaded radiograph', filter: 'none' },
  { id: 'resized', name: 'Resize Sensitivity', desc: 'Resized to 224×224 and returned to display size', filter: 'blur(0.5px)' },
  { id: 'contrast', name: 'Contrast Adjusted', desc: 'PIL contrast enhancement (1.35×)', filter: 'contrast(1.35)' },
  { id: 'cropped', name: 'Center Cropped', desc: 'Central 88% crop, then resized', filter: 'none' },
  { id: 'augmented', name: 'Mild TTA', desc: '3° rotation and 1.05× brightness', filter: 'brightness(1.05)' },
];
