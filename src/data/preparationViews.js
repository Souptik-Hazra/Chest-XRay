export const PREPARATION_VIEWS = [
  { id: 'original', name: 'Original View', desc: 'Original uploaded radiograph' },
  { id: 'resized', name: 'Resize Sensitivity', desc: '224×224 resize, restored to display dimensions' },
  { id: 'contrast', name: 'Contrast Sensitivity', desc: 'PIL contrast enhancement (1.35×)' },
  { id: 'cropped', name: 'Center-Crop Sensitivity', desc: 'Central 88% crop, then resized' },
  { id: 'augmented', name: 'Mild Rotation/Brightness', desc: '3° rotation and 1.05× brightness' },
];
