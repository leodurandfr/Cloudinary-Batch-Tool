import { ref, reactive, computed } from 'vue'
import { useInventory } from './useInventory'
import { useGroups } from './useGroups'
import { useDisplayRules } from './useDisplayRules'
import { useCloudinary } from './useCloudinary'

const { inventory } = useInventory()
const { groups } = useGroups()
const { displayRules } = useDisplayRules()
const { buildTwoLayerUrl } = useCloudinary()

const refsState = ref({ has3d: {} })
const selectedRef = ref(null)
const expandedCategories = reactive({})

// --- Computeds ---

const refsByCategory = computed(() => {
  if (!inventory.value?.images) return {}
  const result = {}
  for (const img of inventory.value.images) {
    const cat = img.category || 'unknown'
    const r = img.ref || 'unknown'
    if (!result[cat]) result[cat] = {}
    if (!result[cat][r]) result[cat][r] = []
    result[cat][r].push(img)
  }
  // Sort categories alphabetically
  const sorted = {}
  for (const cat of Object.keys(result).sort()) {
    sorted[cat] = result[cat]
  }
  return sorted
})

const totalRefCount = computed(() => {
  let count = 0
  for (const cat of Object.values(refsByCategory.value)) {
    count += Object.keys(cat).length
  }
  return count
})

const selectedRefImages = computed(() => {
  if (!selectedRef.value || !inventory.value?.images) return []
  return inventory.value.images.filter(
    img => img.ref === selectedRef.value.ref && img.category === selectedRef.value.category
  )
})

// --- resolveLayout (pure function) ---

function isPortee(type) {
  return /^portee(-\d+)?$/.test(type)
}

function isProductType(type) {
  return !isPortee(type) && type !== 'unknown'
}

function resolveLayout(images, has3d) {
  const productImages = images.filter(img => isProductType(img.type))
  const porteeImages = images.filter(img => isPortee(img.type))

  // Cover
  let cover = null
  if (!has3d) {
    cover = productImages.find(img => img.type === 'default') || null
  }

  // Zoom: motif → face-trois-quart → default
  let zoom = null
  for (const type of ['motif', 'face-trois-quart', 'default']) {
    zoom = productImages.find(img => img.type === type) || null
    if (zoom) break
  }
  // If zoom is same as cover and only one product type → hidden
  const productTypes = new Set(productImages.map(img => img.type))
  if (zoom && zoom === cover && productTypes.size <= 1) {
    zoom = null
  }

  // twoColumnMode: only 'default' product type available
  const nonDefaultProductTypes = productImages.filter(img => img.type !== 'default')
  const twoColumnMode = nonDefaultProductTypes.length === 0

  // Gallery
  let gallery = []
  if (twoColumnMode) {
    // [first portée, default]
    const firstPortee = porteeImages[0] || null
    const defaultImg = productImages.find(img => img.type === 'default') || null
    if (firstPortee) gallery.push(firstPortee)
    if (defaultImg) gallery.push(defaultImg)
  } else {
    // Exclude cover image (unless it's default type, which can appear with different transform)
    // Exclude zoom image
    const usedIds = new Set()
    if (cover && cover.type !== 'default') usedIds.add(cover.id)
    if (zoom) usedIds.add(zoom.id)

    const remainingProduct = productImages.filter(img => !usedIds.has(img.id))
    const firstPortee = porteeImages[0] || null
    const otherPortees = porteeImages.slice(1)

    // Order: first portée → remaining product → other portées
    if (firstPortee) gallery.push(firstPortee)
    gallery.push(...remainingProduct)
    gallery.push(...otherPortees)
  }

  return { cover, zoom, gallery, twoColumnMode }
}

// --- selectedRefLayout (computed) ---

function findGroupForImage(imageId) {
  return groups.value.find(g => g.image_ids.includes(imageId)) || null
}

function enrichImage(image, slotKey) {
  if (!image) return null
  const group = findGroupForImage(image.id)
  const layer1Chain = group ? group.cloudinary_chain : ''
  const layer2Chain = displayRules.value?.slots?.[slotKey]?.cloudinary_chain || ''
  const finalUrl = buildTwoLayerUrl(image, layer1Chain, layer2Chain)
  return { image, layer1Chain, layer2Chain, finalUrl }
}

const selectedRefLayout = computed(() => {
  if (!selectedRef.value) return null

  const images = selectedRefImages.value
  if (!images.length) return null

  const has3d = !!refsState.value.has3d?.[selectedRef.value.ref]
  const layout = resolveLayout(images, has3d)

  // Enrich cover
  const coverResult = layout.cover ? enrichImage(layout.cover, 'cover') : null

  // Enrich zoom
  const zoomVisible = layout.zoom !== null
  const zoomResult = zoomVisible
    ? { ...enrichImage(layout.zoom, 'zoom'), visible: true }
    : { image: null, layer1Chain: '', layer2Chain: '', finalUrl: '', visible: false }

  // Enrich gallery
  const galleryItems = layout.gallery.map(img => {
    // In twoColumnMode, default image gets gallery_zoom slot
    const slotKey = (layout.twoColumnMode && img.type === 'default') ? 'gallery_zoom' : 'gallery'
    return { ...enrichImage(img, slotKey), slotKey }
  })

  return {
    cover: coverResult,
    zoom: zoomResult,
    gallery: {
      mode: layout.twoColumnMode ? 'two-column' : 'scroll',
      items: galleryItems
    }
  }
})

// --- Functions ---

async function loadRefsState() {
  try {
    const res = await fetch('/api/refs-state')
    if (res.ok) {
      const data = await res.json()
      refsState.value = { has3d: {}, ...data }
    }
  } catch (e) {
    console.error('Failed to load refs state:', e)
  }
}

async function saveRefsState() {
  try {
    await fetch('/api/refs-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refsState.value)
    })
  } catch (e) {
    console.error('Failed to save refs state:', e)
  }
}

function toggleCategory(cat) {
  expandedCategories[cat] = !expandedCategories[cat]
}

function selectRef(r, category) {
  selectedRef.value = { ref: r, category }
}

function toggleHas3d(r) {
  if (!refsState.value.has3d) refsState.value.has3d = {}
  refsState.value.has3d[r] = !refsState.value.has3d[r]
  saveRefsState()
}

export function useReferences() {
  return {
    refsState,
    selectedRef,
    expandedCategories,
    refsByCategory,
    totalRefCount,
    selectedRefImages,
    selectedRefLayout,
    resolveLayout,
    loadRefsState,
    saveRefsState,
    toggleCategory,
    selectRef,
    toggleHas3d
  }
}
