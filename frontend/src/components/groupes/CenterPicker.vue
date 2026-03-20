<script setup>
import { reactive, computed } from 'vue'
import { useGroups } from '@/composables/useGroups'
import { useCloudinary } from '@/composables/useCloudinary'

const props = defineProps({
  group: { type: Object, required: true },
  blockIndex: { type: Number, required: true }
})

const { getImageById, updateChain } = useGroups()
const { fixCloudinaryUrl, cloudinaryBase } = useCloudinary()
const cursor = reactive({})

const block = computed(() => props.group.transformations[props.blockIndex])
const firstImage = computed(() => getImageById(props.group.image_ids[0]))

function onMouseMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  cursor.x = event.clientX - rect.left
  cursor.y = event.clientY - rect.top
}

function onMouseLeave() {
  cursor.x = null
  cursor.y = null
}

function onClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 1000
  const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 1000
  block.value.params.x = Math.max(0, Math.min(1, x))
  block.value.params.y = Math.max(0, Math.min(1, y))
  updateChain(props.group)
}

function onImageLoad(event) {
  const img = event.target
  if (block.value && img.naturalWidth > 0) {
    const first = firstImage.value
    if (first && (!block.value.params.ref_width || block.value.params.ref_width === 0)) {
      const probe = new Image()
      probe.crossOrigin = 'anonymous'
      probe.onload = () => {
        if (!block.value) return
        block.value.params.ref_width = probe.naturalWidth
        block.value.params.ref_height = probe.naturalHeight
        updateChain(props.group)
      }
      probe.src = `${cloudinaryBase(first.type)}t_one/q_auto:low,f_auto,fl_lossy/${first.filename}`
    }
  }
}

</script>

<template>
  <div v-if="firstImage" class="space-y-3">
    <p class="text-xs text-muted-foreground">Cliquez sur l'image pour définir le centre</p>
    <div
      class="relative cursor-crosshair overflow-hidden rounded border border-border"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @click="onClick"
    >
      <img
        :src="fixCloudinaryUrl(firstImage, 'full_url')"
        draggable="false"
        class="w-full block"
        @dragstart.prevent
        @load="onImageLoad"
      >
      <!-- Crosshair lines -->
      <div
        v-if="cursor.x != null"
        class="absolute left-0 right-0 h-px bg-primary/70 pointer-events-none"
        :style="{ top: cursor.y + 'px' }"
      />
      <div
        v-if="cursor.x != null"
        class="absolute top-0 bottom-0 w-px bg-primary/70 pointer-events-none"
        :style="{ left: cursor.x + 'px' }"
      />
      <!-- Fixed marker at chosen point -->
      <div
        v-if="block.params.x != 0.5 || block.params.y != 0.5"
        class="absolute w-4 h-4 -ml-2 -mt-2 pointer-events-none"
        :style="{ left: (block.params.x * 100) + '%', top: (block.params.y * 100) + '%' }"
      >
        <div class="w-full h-full rounded-full border-2 border-primary bg-primary/30" />
      </div>
    </div>
  </div>
</template>
