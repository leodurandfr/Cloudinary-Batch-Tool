import { ref } from 'vue'
import { useCloudinary } from './useCloudinary'

const { buildChain, DEFAULT_PARAMS } = useCloudinary()

const displayRules = ref({
  slots: {
    cover: { label: 'Cover', transformations: [], cloudinary_chain: '' },
    zoom: { label: 'Zoom', transformations: [], cloudinary_chain: '' },
    gallery: { label: 'Galerie', transformations: [], cloudinary_chain: '' },
    gallery_zoom: { label: 'Galerie Zoom', transformations: [], cloudinary_chain: '' }
  }
})

async function loadDisplayRules() {
  try {
    const res = await fetch('/api/display-rules')
    if (res.ok) {
      displayRules.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to load display rules:', e)
  }
}

async function saveDisplayRules() {
  try {
    await fetch('/api/display-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(displayRules.value)
    })
  } catch (e) {
    console.error('Failed to save display rules:', e)
  }
}

function addSlotTransform(slotKey, type) {
  const slot = displayRules.value.slots[slotKey]
  if (!slot) return
  slot.transformations.push({ type, params: { ...DEFAULT_PARAMS[type] } })
  updateSlotChain(slotKey)
}

function removeSlotTransform(slotKey, index) {
  const slot = displayRules.value.slots[slotKey]
  if (!slot) return
  slot.transformations.splice(index, 1)
  updateSlotChain(slotKey)
}

function reorderSlotTransform(slotKey, from, to) {
  if (from === to) return
  const slot = displayRules.value.slots[slotKey]
  if (!slot) return
  const arr = [...slot.transformations]
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
  slot.transformations.splice(0, slot.transformations.length, ...arr)
  updateSlotChain(slotKey)
}

function updateSlotChain(slotKey) {
  const slot = displayRules.value.slots[slotKey]
  if (!slot) return
  slot.cloudinary_chain = buildChain(slot.transformations)
  saveDisplayRules()
}

export function useDisplayRules() {
  return {
    displayRules,
    loadDisplayRules,
    saveDisplayRules,
    addSlotTransform,
    removeSlotTransform,
    reorderSlotTransform,
    updateSlotChain
  }
}
