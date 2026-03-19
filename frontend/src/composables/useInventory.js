import { ref, computed } from 'vue'

const inventory = ref(null)
const loading = ref(true)
const error = ref(null)
const filterCategory = ref(null)
const filterType = ref(null)
const filterState = ref(null)
const filterRef = ref('')

const imageMap = computed(() => {
  const map = {}
  if (inventory.value) {
    for (const img of inventory.value.images) {
      map[img.id] = img
    }
  }
  return map
})

const filteredImages = computed(() => {
  if (!inventory.value) return []
  let imgs = inventory.value.images
  if (filterCategory.value) {
    imgs = imgs.filter(i => i.category === filterCategory.value)
  }
  if (filterType.value) {
    imgs = imgs.filter(i => i.type === filterType.value)
  }
  if (filterState.value === 'ungrouped') {
    imgs = imgs.filter(i => !i.group_id)
  } else if (filterState.value === 'grouped') {
    imgs = imgs.filter(i => i.group_id)
  }
  if (filterRef.value) {
    const search = filterRef.value.toLowerCase()
    imgs = imgs.filter(i => i.ref?.toLowerCase().includes(search))
  }
  return imgs
})

const ungroupedCount = computed(() => {
  if (!inventory.value) return 0
  return inventory.value.images.filter(i => !i.group_id).length
})

const groupedCount = computed(() => {
  if (!inventory.value) return 0
  return inventory.value.images.filter(i => i.group_id).length
})

async function loadInventory() {
  try {
    const res = await fetch('/api/inventory').catch(() => null)
    if (res?.ok) {
      inventory.value = await res.json()
    }
  } catch (e) {
    error.value = e.message
  }
}

async function reloadInventory() {
  try {
    const res = await fetch('/api/inventory')
    if (res.ok) inventory.value = await res.json()
  } catch (e) {
    console.error('Failed to reload inventory:', e)
  }
}

async function deleteImages(idsToDelete) {
  if (!inventory.value) return
  inventory.value.images = inventory.value.images.filter(img => !idsToDelete.has(img.id))

  // Rebuild stats
  const stats = { total: inventory.value.images.length, by_category: {}, by_type: {} }
  for (const img of inventory.value.images) {
    stats.by_category[img.category] = (stats.by_category[img.category] || 0) + 1
    stats.by_type[img.type] = (stats.by_type[img.type] || 0) + 1
  }
  stats.processable = inventory.value.images.length
  inventory.value.stats = stats

  try {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory.value)
    })
  } catch (e) {
    console.error('Failed to save inventory:', e)
  }
}

export function useInventory() {
  return {
    inventory,
    loading,
    error,
    filterCategory,
    filterType,
    filterState,
    filterRef,
    imageMap,
    filteredImages,
    ungroupedCount,
    groupedCount,
    loadInventory,
    reloadInventory,
    deleteImages
  }
}
