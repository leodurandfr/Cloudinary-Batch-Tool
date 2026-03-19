import { ref } from 'vue'
import { useInventory } from './useInventory'
import { useCloudinary } from './useCloudinary'

const groups = ref([])
const { inventory, imageMap } = useInventory()
const { buildChain, buildTransformedUrl, DEFAULT_PARAMS } = useCloudinary()

function syncGroupIds() {
  if (!inventory.value) return
  // Reset all
  for (const img of inventory.value.images) {
    img.group_id = null
  }
  // Apply from groups
  for (const group of groups.value) {
    for (const imgId of group.image_ids) {
      const img = imageMap.value[imgId]
      if (img) img.group_id = group.id
    }
  }
}

async function saveGroups() {
  try {
    await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups: groups.value })
    })
  } catch (e) {
    console.error('Save failed:', e)
  }
}

async function loadGroups() {
  try {
    const res = await fetch('/api/groups')
    const data = await res.json()
    groups.value = data.groups || []
    syncGroupIds()
  } catch (e) {
    console.error('Failed to load groups:', e)
  }
}

function createGroup(name, imageIds) {
  if (!name.trim() || !imageIds.length) return null
  const group = {
    id: 'grp_' + Date.now(),
    name: name.trim(),
    created_at: new Date().toISOString(),
    image_ids: [...imageIds],
    transformations: [],
    cloudinary_chain: ''
  }
  groups.value.push(group)
  syncGroupIds()
  saveGroups()
  return group
}

function deleteGroup(groupId) {
  groups.value = groups.value.filter(g => g.id !== groupId)
  syncGroupIds()
  saveGroups()
}

function addToGroup(groupId, imageIds) {
  const group = groups.value.find(g => g.id === groupId)
  if (!group) return
  const existing = new Set(group.image_ids)
  for (const id of imageIds) {
    if (!existing.has(id)) group.image_ids.push(id)
  }
  syncGroupIds()
  saveGroups()
}

function ungroupImages(imageIds) {
  for (const id of imageIds) {
    for (const group of groups.value) {
      group.image_ids = group.image_ids.filter(gid => gid !== id)
    }
  }
  groups.value = groups.value.filter(g => g.image_ids.length > 0)
  syncGroupIds()
  saveGroups()
}

function ungroupImage(imgId) {
  ungroupImages([imgId])
}

function removeImagesFromAllGroups(idsToDelete) {
  for (const group of groups.value) {
    group.image_ids = group.image_ids.filter(id => !idsToDelete.has(id))
  }
  groups.value = groups.value.filter(g => g.image_ids.length > 0)
  syncGroupIds()
  saveGroups()
}

function removeImageFromGroup(group, imgId) {
  group.image_ids = group.image_ids.filter(id => id !== imgId)
  if (group.image_ids.length === 0) {
    groups.value = groups.value.filter(g => g.id !== group.id)
  }
  syncGroupIds()
  saveGroups()
}

function removeSelectedFromGroup(group, selectedSet) {
  if (!selectedSet || selectedSet.size === 0) return
  group.image_ids = group.image_ids.filter(id => !selectedSet.has(id))
  if (group.image_ids.length === 0) {
    groups.value = groups.value.filter(g => g.id !== group.id)
  }
  syncGroupIds()
  saveGroups()
}

function getGroupName(groupId) {
  const g = groups.value.find(g => g.id === groupId)
  return g ? g.name : ''
}

function getImageById(imgId) {
  return imageMap.value[imgId] || null
}

// Transform management
function addTransform(group, type) {

  group.transformations.push({ type, params: { ...DEFAULT_PARAMS[type] } })
  updateChain(group)
}

function removeTransform(group, index) {
  group.transformations.splice(index, 1)
  updateChain(group)
}

function moveTransform(group, index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= group.transformations.length) return
  const arr = group.transformations
  const tmp = arr[index]
  arr[index] = arr[newIndex]
  arr[newIndex] = tmp
  group.transformations = [...arr]
  updateChain(group)
}

function updateChain(group) {

  group.cloudinary_chain = buildChain(group.transformations)
  saveGroups()
}

// Export
function exportGroup(group) {


  const mapping = group.image_ids.map(imgId => {
    const img = imageMap.value[imgId]
    return {
      filename: img?.filename,
      ref: img?.ref,
      category: img?.category,
      type: img?.type,
      original_url: img?.full_url,
      transformed_url: buildTransformedUrl(imgId, group).replace('/w_400/', '/w_1240/'),
      cloudinary_chain: group.cloudinary_chain
    }
  })

  downloadJson(`export-${group.name}.json`, { group: group.name, images: mapping })
}

function exportAll() {


  const allMappings = groups.value.map(group => ({
    group: group.name,
    cloudinary_chain: group.cloudinary_chain,
    images: group.image_ids.map(imgId => {
      const img = imageMap.value[imgId]
      return {
        filename: img?.filename,
        ref: img?.ref,
        category: img?.category,
        type: img?.type,
        original_url: img?.full_url,
        transformed_url: buildTransformedUrl(imgId, group).replace('/w_400/', '/w_1240/')
      }
    })
  }))

  downloadJson('export-all-groups.json', { exported_at: new Date().toISOString(), groups: allMappings })
}

async function exportImages(groupId, format = 'jpg', onProgress) {
  const group = groups.value.find(g => g.id === groupId)
  if (!group || !group.cloudinary_chain) return



  const images = group.image_ids.map(imgId => {
    const img = imageMap.value[imgId]
    return {
      id: imgId,
      filename: img?.filename,
      url: buildTransformedUrl(imgId, group).replace('/w_400/', '/w_1240/')
    }
  })

  try {
    const res = await fetch('/api/export-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_name: group.name, format, images })
    })
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const msg = JSON.parse(line)
          if (onProgress) onProgress(msg)
        } catch {}
      }
    }
  } catch (e) {
    if (onProgress) onProgress({ error: e.message })
  }
}

async function openInFinder(folder) {
  await fetch('/api/open-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder })
  })
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export function useGroups() {
  return {
    groups,
    loadGroups,
    syncGroupIds,
    saveGroups,
    createGroup,
    deleteGroup,
    addToGroup,
    ungroupImage,
    ungroupImages,
    removeImagesFromAllGroups,
    removeImageFromGroup,
    removeSelectedFromGroup,
    getGroupName,
    getImageById,
    addTransform,
    removeTransform,
    moveTransform,
    updateChain,
    exportGroup,
    exportAll,
    exportImages,
    openInFinder,
    formatDate
  }
}
