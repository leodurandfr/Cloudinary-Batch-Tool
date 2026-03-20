<script setup>
import { computed } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'

const props = defineProps({
  imgId: { type: String, required: true },
  group: { type: Object, required: true },
  cropImgNatural: { type: Object, required: true },
  cropOverlayVisible: { type: Object, required: true }
})

const emit = defineEmits(['cropImgLoad'])
const { buildCropPreviewUrl, getCropOverlay } = useCloudinary()

const overlay = computed(() => getCropOverlay(props.group, props.imgId, props.cropImgNatural, props.cropOverlayVisible))

function onLoad(event) {
  emit('cropImgLoad', event, props.imgId)
}
</script>

<template>
  <div class="relative">
    <img
      :src="buildCropPreviewUrl(imgId, group)"
      loading="lazy"
      class="w-full block bg-white"
      @load="onLoad"
    >
    <template v-if="overlay">
      <div class="absolute bg-black/50 pointer-events-none" :style="overlay.top" />
      <div class="absolute bg-black/50 pointer-events-none" :style="overlay.bottom" />
      <div class="absolute bg-black/50 pointer-events-none" :style="overlay.left" />
      <div class="absolute bg-black/50 pointer-events-none" :style="overlay.right" />
      <div class="absolute border-2 border-dashed border-primary pointer-events-none" :style="overlay.crop" />
    </template>
  </div>
</template>
