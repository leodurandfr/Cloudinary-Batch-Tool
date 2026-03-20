<script setup>
import { ref, reactive, computed } from 'vue'
import { X, Minus, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import CropOverlay from './CropOverlay.vue'
import { useGroups } from '@/composables/useGroups'
import { useCloudinary } from '@/composables/useCloudinary'

const props = defineProps({
  group: { type: Object, required: true },
  previewCols: { type: Number, default: 3 },
  cropOverlayVisible: { type: Object, required: true }
})

const cropImgNatural = reactive({})

const emit = defineEmits(['update:previewCols'])

const { getImageById, removeImageFromGroup } = useGroups()
const { buildTransformedUrl, thumbUrl, onImgError } = useCloudinary()

const showAfter = ref(false)
const selectedIds = reactive(new Set())

const hasSelection = computed(() => selectedIds.size > 0)
const allSelected = computed(() =>
  props.group.image_ids.length > 0 && selectedIds.size === props.group.image_ids.length
)

function toggleSelectAll() {
  if (allSelected.value) selectedIds.clear()
  else props.group.image_ids.forEach(id => selectedIds.add(id))
}

function toggleSelect(imgId) {
  if (selectedIds.has(imgId)) selectedIds.delete(imgId)
  else selectedIds.add(imgId)
}

defineExpose({ selectedIds, hasSelection, toggleSelectAll })

function onCropImgLoad(event, imgId) {
  cropImgNatural[imgId] = {
    naturalWidth: event.target.naturalWidth,
    naturalHeight: event.target.naturalHeight
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Controls bar -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <h4 class="text-xs uppercase tracking-widest text-muted-foreground">Preview</h4>
        <!-- Column count -->
        <div class="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" class="w-6 h-6" @click="emit('update:previewCols', Math.max(1, previewCols - 1))">
            <Minus class="w-3 h-3" />
          </Button>
          <span class="text-xs text-muted-foreground w-4 text-center">{{ previewCols }}</span>
          <Button variant="outline" size="icon-sm" class="w-6 h-6" @click="emit('update:previewCols', Math.min(8, previewCols + 1))">
            <Plus class="w-3 h-3" />
          </Button>
        </div>
        <!-- Before/After toggle -->
        <div class="flex rounded-md overflow-hidden">
          <Button
            :variant="!showAfter ? 'default' : 'secondary'"
            size="sm"
            class="h-7 text-xs rounded-r-none"
            @click="showAfter = false"
          >Avant</Button>
          <Button
            :variant="showAfter ? 'default' : 'secondary'"
            size="sm"
            class="h-7 text-xs rounded-l-none"
            @click="showAfter = true"
          >Après</Button>
        </div>
      </div>
    </div>

    <!-- Image grid -->
    <div
      class="grid gap-2"
      :style="{ gridTemplateColumns: `repeat(${previewCols}, 1fr)` }"
    >
      <div
        v-for="imgId in group.image_ids"
        :key="imgId"
        class="relative rounded-lg border-2 overflow-hidden bg-card transition-colors"
        :class="selectedIds.has(imgId) ? 'border-primary' : 'border-border'"
      >
        <!-- Selection + remove controls -->
        <div class="absolute top-1.5 left-1.5 z-10 flex gap-1">
          <button
            class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
            :class="selectedIds.has(imgId)
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-white/50 bg-black/40 text-white'"
            @click.stop="toggleSelect(imgId)"
          >
            <Check v-if="selectedIds.has(imgId)" class="w-3 h-3" />
          </button>
        </div>
        <button
          class="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-destructive transition-colors"
          title="Retirer du groupe"
          @click.stop="removeImageFromGroup(group, imgId)"
        >
          <X class="w-3 h-3" />
        </button>

        <!-- Image content -->
        <div @click="toggleSelect(imgId)" class="cursor-pointer">
          <!-- After mode -->
          <img
            v-if="showAfter"
            :src="buildTransformedUrl(imgId, group)"
            loading="lazy"
            class="w-full block bg-white"
            @error="onImgError"
          >
          <!-- Before mode: crop overlay -->
          <CropOverlay
            v-else-if="cropOverlayVisible[group.id]"
            :img-id="imgId"
            :group="group"
            :crop-img-natural="cropImgNatural"
            :crop-overlay-visible="cropOverlayVisible"
            @crop-img-load="onCropImgLoad"
          />
          <!-- Before mode: normal thumb -->
          <img
            v-else
            :src="thumbUrl(getImageById(imgId))"
            loading="lazy"
            class="w-full block bg-white"
          >
        </div>

        <!-- Info footer -->
        <div class="px-2 py-1.5 text-[11px]">
          <span class="font-medium text-foreground">{{ getImageById(imgId)?.ref }}</span>
          <span class="text-muted-foreground"> · {{ getImageById(imgId)?.type }}</span>
        </div>
      </div>
    </div>

    <div v-if="group.image_ids.length === 0" class="text-center py-8 text-sm text-muted-foreground">
      Aucune image dans ce groupe.
    </div>
  </div>
</template>
