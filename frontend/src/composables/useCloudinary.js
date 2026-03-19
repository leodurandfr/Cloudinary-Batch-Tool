import { useInventory } from './useInventory'

const { imageMap } = useInventory()

const TRANSFORM_LABELS = {
  trim: 'Trim', crop: 'Crop / Resize', center: 'Centre (focal)',
  rotation: 'Rotation / Flip',
  brightness: 'Luminosité', contrast: 'Contraste', saturation: 'Saturation',
  vibrance: 'Vibrance', sharpen: 'Netteté', auto_improve: 'Auto Improve',
  background: 'Fond', gradient_fade: 'Gradient Fade', border: 'Bordure',
  radius: 'Coins arrondis', opacity: 'Opacité',
  quality: 'Qualité', format: 'Format',
  bgremoval: 'Suppression de fond (IA)', upscale: 'Upscale (IA)',
  gen_fill: 'Gen Fill (IA)',
  custom: 'Custom'
}

const DEFAULT_PARAMS = {
  trim: { tolerance: 50 },
  crop: { mode: 'crop', gravity: 'center', width: '', height: '', aspect_ratio: '', x_offset: 0, y_offset: 0 },
  gradient_fade: { direction: 'bottom', strength: 40, y: '' },
  quality: { level: 'auto:good' },
  background: { color: 'white' },
  custom: { raw: '' },
  center: { x: 0.5, y: 0.5, ref_width: 0, ref_height: 0 },
  brightness: { level: 0 },
  contrast: { level: 0 },
  saturation: { level: 0 },
  vibrance: { level: 0 },
  sharpen: { strength: 100 },
  auto_improve: { mode: '' },
  rotation: { angle: '0', flip: '' },
  border: { width: 2, color: 'black' },
  radius: { value: '20' },
  opacity: { level: 100 },
  format: { value: 'auto' },
  bgremoval: {},
  upscale: {},
  gen_fill: { prompt: '' }
}

function transformLabel(type) {
  return TRANSFORM_LABELS[type] || type
}

function transformSummary(block) {
  const p = block.params
  switch (block.type) {
    case 'trim': return p.tolerance
    case 'crop': {
      let s = p.mode || 'crop'
      if (p.width || p.height) s += ` ${p.width || '?'}×${p.height || '?'}`
      if (p.aspect_ratio) s += ` ${p.aspect_ratio}`
      return s
    }
    case 'gradient_fade': return `${p.direction} ${p.strength}%`
    case 'quality': return p.level
    case 'background': return p.color
    case 'custom': return p.raw || '...'
    case 'center': return (p.x !== 0.5 || p.y !== 0.5) ? `${p.x}, ${p.y}` : 'centre'
    case 'brightness': return (p.level > 0 ? '+' : '') + p.level
    case 'contrast': return (p.level > 0 ? '+' : '') + p.level
    case 'saturation': return (p.level > 0 ? '+' : '') + p.level
    case 'vibrance': return (p.level > 0 ? '+' : '') + p.level
    case 'sharpen': return p.strength
    case 'auto_improve': return p.mode || 'auto'
    case 'rotation': {
      let s = p.angle !== '0' ? p.angle + '°' : ''
      if (p.flip) s += (s ? ' + ' : '') + p.flip
      return s || '0°'
    }
    case 'border': return `${p.width}px ${p.color}`
    case 'radius': return p.value === 'max' ? 'cercle' : p.value + 'px'
    case 'opacity': return p.level + '%'
    case 'format': return (p.value || 'auto').toUpperCase()
    case 'bgremoval': return 'IA'
    case 'upscale': return 'IA'
    case 'gen_fill': return p.prompt || 'auto'
    default: return ''
  }
}

function buildChain(transformations) {
  const parts = []
  for (const block of transformations) {
    const p = block.params
    switch (block.type) {
      case 'trim':
        parts.push(`c_trim:${p.tolerance || 10}`)
        break
      case 'crop': {
        let seg = `c_${p.mode || 'crop'}`
        if (p.gravity) seg += `,g_${p.gravity}`
        if (p.width) seg += `,w_${p.width}`
        if (p.height) seg += `,h_${p.height}`
        if (p.aspect_ratio) seg += `,ar_${p.aspect_ratio}`
        if (p.x_offset) seg += `,x_${p.x_offset}`
        if (p.y_offset) seg += `,y_${p.y_offset}`
        parts.push(seg)
        break
      }
      case 'gradient_fade': {
        let seg = 'e_gradient_fade'
        if (p.strength) seg += `:${p.strength}`
        if (p.direction && p.direction !== 'bottom') seg += `,e_gradient_fade_direction:${p.direction}`
        if (p.y) seg += `,y_${p.y}`
        parts.push(seg)
        break
      }
      case 'quality':
        parts.push(`q_${p.level || 'auto'}`)
        break
      case 'background':
        parts.push(`b_${p.color || 'white'}`)
        break
      case 'center': {
        const cx = p.x ?? 0.5
        const cy = p.y ?? 0.5
        const rw = p.ref_width || 0
        const rh = p.ref_height || 0
        if (rw > 0 && rh > 0 && (cx !== 0.5 || cy !== 0.5)) {
          const px = Math.round(cx * rw)
          const py = Math.round(cy * rh)
          const offX = px - Math.round(rw / 2)
          const offY = py - Math.round(rh / 2)
          const padW = rw + 2 * Math.abs(offX)
          const padH = rh + 2 * Math.abs(offY)
          parts.push(`c_pad,w_${padW},h_${padH},g_center,b_transparent`)
          parts.push(`c_crop,w_${rw},h_${rh},g_center,x_${offX},y_${offY}`)
        }
        break
      }
      case 'custom':
        if (p.raw) parts.push(p.raw)
        break
      case 'brightness':
        if (p.level !== 0) parts.push(`e_brightness:${p.level}`)
        break
      case 'contrast':
        if (p.level !== 0) parts.push(`e_contrast:${p.level}`)
        break
      case 'saturation':
        if (p.level !== 0) parts.push(`e_saturation:${p.level}`)
        break
      case 'vibrance':
        if (p.level !== 0) parts.push(`e_vibrance:${p.level}`)
        break
      case 'sharpen':
        parts.push(`e_sharpen:${p.strength || 100}`)
        break
      case 'auto_improve':
        parts.push(p.mode ? `e_improve:${p.mode}` : 'e_improve')
        break
      case 'rotation': {
        const segs = []
        if (p.angle && p.angle !== '0') segs.push(`a_${p.angle}`)
        if (p.flip) segs.push(`a_${p.flip}`)
        if (segs.length) parts.push(segs.join(','))
        break
      }
      case 'border':
        parts.push(`bo_${p.width || 2}px_solid_${(p.color || 'black').replace('#', '')}`)
        break
      case 'radius':
        parts.push(`r_${p.value || 20}`)
        break
      case 'opacity':
        if (p.level !== 100) parts.push(`o_${p.level}`)
        break
      case 'format':
        if (p.value) parts.push(`f_${p.value}`)
        break
      case 'bgremoval':
        parts.push('e_background_removal')
        break
      case 'upscale':
        parts.push('e_upscale')
        break
      case 'gen_fill':
        parts.push(p.prompt ? `b_gen_fill:${p.prompt}` : 'b_gen_fill')
        break
    }
  }
  return parts.join('/')
}

function buildTransformedUrl(imgId, group) {
  const img = imageMap.value[imgId]
  if (!img || !group.cloudinary_chain) return img?.thumb_url || ''
  const base = 'https://www.chanel.com/images/'
  const chain = group.cloudinary_chain
  return `${base}t_one/${chain}/q_auto:good,f_auto,fl_lossy/w_400/${img.filename}`
}

function buildCropPreviewUrl(imgId, group) {
  const img = imageMap.value[imgId]
  if (!img) return ''
  const withoutCrop = (group.transformations || []).filter(b => b.type !== 'crop')
  const chain = buildChain(withoutCrop)
  const base = 'https://www.chanel.com/images/'
  const chainPart = chain ? `${chain}/` : ''
  return `${base}t_one/${chainPart}q_auto:low,f_auto,fl_lossy/${img.filename}`
}

function getCropOverlay(group, imgId, cropImgNatural, cropOverlayVisible) {
  if (cropOverlayVisible && !cropOverlayVisible[group.id]) return null
  const cropBlock = group.transformations?.find(b => b.type === 'crop')
  if (!cropBlock) return null
  const p = cropBlock.params
  const nat = cropImgNatural[imgId]
  if (!nat) return null

  const imgW = nat.naturalWidth
  const imgH = nat.naturalHeight
  if (!imgW || !imgH) return null

  let pw = p.width ? parseFloat(p.width) : 0
  let ph = p.height ? parseFloat(p.height) : 0
  const wIsRelative = p.width && /[a-z]/i.test(String(p.width))
  const hIsRelative = p.height && /[a-z]/i.test(String(p.height))

  let rw = wIsRelative ? 1 : (pw > 0 ? pw / imgW : 0)
  let rh = hIsRelative ? 1 : (ph > 0 ? ph / imgH : 0)

  if (p.aspect_ratio && (rw === 0 || rh === 0)) {
    const m = String(p.aspect_ratio).match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/)
    if (m) {
      const ar = parseFloat(m[1]) / parseFloat(m[2])
      if (rw > 0 && rh === 0) rh = (rw * imgW) / (ar * imgH)
      else if (rh > 0 && rw === 0) rw = (rh * imgH * ar) / imgW
      else {
        const iar = imgW / imgH
        if (ar > iar) { rw = 1; rh = iar / ar } else { rh = 1; rw = ar / iar }
      }
    }
  }

  if (rw === 0 && rh === 0) return null
  if (rw === 0) rw = 1
  if (rh === 0) rh = 1
  rw = Math.min(rw, 1)
  rh = Math.min(rh, 1)

  let rx = 0, ry = 0
  const g = p.gravity || 'center'
  if (g.includes('west')) rx = 0
  else if (g.includes('east')) rx = 1 - rw
  else rx = (1 - rw) / 2

  if (g.includes('north')) ry = 0
  else if (g.includes('south')) ry = 1 - rh
  else ry = (1 - rh) / 2

  rx += (p.x_offset || 0) / imgW
  ry += (p.y_offset || 0) / imgH
  rx = Math.max(0, Math.min(rx, 1 - rw))
  ry = Math.max(0, Math.min(ry, 1 - rh))

  const l = (rx * 100) + '%'
  const t = (ry * 100) + '%'
  const w = (rw * 100) + '%'
  const h = (rh * 100) + '%'
  const r = ((rx + rw) * 100) + '%'
  const b = ((ry + rh) * 100) + '%'
  const remW = ((1 - rx - rw) * 100) + '%'
  const remH = ((1 - ry - rh) * 100) + '%'

  return {
    crop: { left: l, top: t, width: w, height: h },
    top: { left: '0', top: '0', width: '100%', height: t },
    bottom: { left: '0', top: b, width: '100%', height: remH },
    left: { left: '0', top: t, width: l, height: h },
    right: { left: r, top: t, width: remW, height: h }
  }
}

function buildTwoLayerUrl(image, layer1Chain, layer2Chain, width = 400) {
  if (!image) return ''
  const base = 'https://www.chanel.com/images/'
  const l1 = layer1Chain ? `${layer1Chain}/` : ''
  const l2 = layer2Chain ? `${layer2Chain}/` : ''
  return `${base}t_one/${l1}${l2}q_auto:good,f_auto,fl_lossy/w_${width}/${image.filename}`
}

function handleAfterError(event, imgId) {
  if (event.target.dataset.fallback) return
  event.target.dataset.fallback = '1'
  const img = imageMap.value[imgId]
  if (img) event.target.src = '/images/' + img.local_path
}

export function useCloudinary() {
  return {
    TRANSFORM_LABELS,
    DEFAULT_PARAMS,
    transformLabel,
    transformSummary,
    buildChain,
    buildTransformedUrl,
    buildTwoLayerUrl,
    buildCropPreviewUrl,
    getCropOverlay,
    handleAfterError
  }
}
