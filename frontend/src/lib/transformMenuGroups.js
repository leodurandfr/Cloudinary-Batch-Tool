export const TRANSFORM_MENU_GROUPS = [
  {
    label: 'Recadrage',
    items: [
      { type: 'trim', label: 'Trim (rognage auto)' },
      { type: 'crop', label: 'Crop / Resize' },
      { type: 'rotation', label: 'Rotation / Flip' }
    ]
  },
  {
    label: 'Ajustements',
    items: [
      { type: 'brightness', label: 'Luminosité' },
      { type: 'contrast', label: 'Contraste' },
      { type: 'saturation', label: 'Saturation' },
      { type: 'vibrance', label: 'Vibrance' },
      { type: 'sharpen', label: 'Netteté' },
      { type: 'auto_improve', label: 'Auto Improve' }
    ]
  },
  {
    label: 'Apparence',
    items: [
      { type: 'background', label: 'Fond' },
      { type: 'gradient_fade', label: 'Gradient Fade' },
      { type: 'border', label: 'Bordure' },
      { type: 'radius', label: 'Coins arrondis' },
      { type: 'opacity', label: 'Opacité' }
    ]
  },
  {
    label: 'Livraison',
    items: [
      { type: 'quality', label: 'Qualité' },
      { type: 'format', label: 'Format' }
    ]
  },
  {
    label: 'IA',
    items: [
      { type: 'bgremoval', label: 'Suppression de fond' },
      { type: 'upscale', label: 'Upscale' },
      { type: 'gen_fill', label: 'Gen Fill (extension IA)' }
    ]
  },
  {
    label: 'Effets personnalisés',
    items: [
      { type: 'center', label: 'Centre (point focal)' },
      { type: 'zoom', label: 'Zoom' }
    ]
  },
  {
    label: 'Avancé',
    items: [
      { type: 'custom', label: 'Custom (raw)' }
    ]
  }
]
