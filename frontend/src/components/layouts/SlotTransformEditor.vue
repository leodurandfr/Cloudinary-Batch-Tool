<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, X, GripVertical } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import TransformPanel from '@/components/groupes/TransformPanel.vue'
import { useDisplayRules } from '@/composables/useDisplayRules'
import { useCloudinary } from '@/composables/useCloudinary'
import { TRANSFORM_MENU_GROUPS } from '@/lib/transformMenuGroups'

const props = defineProps({
  slotKey: { type: String, required: true }
})

const { displayRules, addSlotTransform, removeSlotTransform, reorderSlotTransform, updateSlotChain } = useDisplayRules()
const { transformLabel, transformSummary } = useCloudinary()

// Always read live from the composable to avoid stale references
const currentSlot = computed(() => displayRules.value?.slots?.[props.slotKey])

const openBlock = ref(null)
const dragIndex = ref(null)
const dragOverIndex = ref(null)
const cropOverlayVisible = reactive({})

// Pseudo-group for TransformPanel compatibility — keyed by slotKey to avoid crop overlay collisions
const pseudoGroupId = computed(() => `__slot__:${props.slotKey}`)

function handleOnUpdate() {
  updateSlotChain(props.slotKey)
}

function toggleBlock(index) {
  openBlock.value = openBlock.value === index ? null : index
}

function handleAdd(type) {
  addSlotTransform(props.slotKey, type)
  if (!currentSlot.value) return
  openBlock.value = currentSlot.value.transformations.length - 1
}

function handleRemove(index) {
  removeSlotTransform(props.slotKey, index)
  if (openBlock.value === index) openBlock.value = null
  else if (openBlock.value !== null && openBlock.value > index) openBlock.value--
}

// --- Drag & drop ---
function onDragStart(event, index) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', '')
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragOver(event, index) {
  if (dragIndex.value === null) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function onDrop(event, index) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  const from = dragIndex.value
  reorderSlotTransform(props.slotKey, from, index)
  if (openBlock.value !== null) {
    if (openBlock.value === from) {
      openBlock.value = index
    } else {
      let o = openBlock.value
      if (from < o) o--
      if (index <= o) o++
      openBlock.value = o
    }
  }
  dragIndex.value = null
  dragOverIndex.value = null
}

const MENU_GROUPS = TRANSFORM_MENU_GROUPS
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-xs uppercase tracking-widest text-muted-foreground">{{ currentSlot?.label }}</h4>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-7 text-xs gap-1">
            <Plus class="w-3.5 h-3.5" />
            Ajouter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
          <template v-for="(menuGroup, gi) in MENU_GROUPS" :key="menuGroup.label">
            <DropdownMenuSeparator v-if="gi > 0" />
            <DropdownMenuLabel class="text-[11px]">{{ menuGroup.label }}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                v-for="item in menuGroup.items"
                :key="item.type"
                class="text-xs cursor-pointer"
                @click="handleAdd(item.type)"
              >
                {{ item.label }}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Chips row -->
    <div v-if="currentSlot?.transformations?.length > 0" class="space-y-0">
      <template v-for="(block, i) in currentSlot.transformations" :key="i">
        <div
          class="flex items-center gap-1 rounded-t-lg border border-border px-2 py-1.5 cursor-pointer transition-colors select-none"
          :class="{
            'bg-secondary': openBlock !== i,
            'bg-primary/10 border-primary': openBlock === i,
            'opacity-40': dragIndex === i,
            'border-t-2 border-t-primary': dragOverIndex === i && dragIndex !== i,
            'rounded-b-lg': openBlock !== i,
            'mb-0': openBlock === i,
            'mb-1': openBlock !== i
          }"
          draggable="true"
          @dragstart="onDragStart($event, i)"
          @dragend="onDragEnd"
          @dragover="onDragOver($event, i)"
          @drop="onDrop($event, i)"
          @click="toggleBlock(i)"
        >
          <GripVertical class="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grab" @mousedown.stop />
          <Badge variant="secondary" class="text-[11px] px-1.5 py-0 pointer-events-none">
            {{ transformLabel(block.type) }}
          </Badge>
          <span class="text-[11px] text-muted-foreground truncate">{{ transformSummary(block) }}</span>
          <button
            class="ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Supprimer"
            @click.stop="handleRemove(i)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Expanded panel -->
        <TransformPanel
          v-if="openBlock === i"
          :block="block"
          :block-index="i"
          :group="{ id: pseudoGroupId, image_ids: [], transformations: currentSlot.transformations, cloudinary_chain: currentSlot.cloudinary_chain }"
          :crop-overlay-visible="cropOverlayVisible"
          :on-update="handleOnUpdate"
        />
      </template>
    </div>

    <div v-else class="text-xs text-muted-foreground py-2">
      Aucune transformation.
    </div>

    <!-- Chain preview -->
    <div v-if="currentSlot?.cloudinary_chain" class="rounded border border-border bg-secondary/50 px-3 py-2">
      <code class="text-[11px] text-muted-foreground break-all">{{ currentSlot.cloudinary_chain }}</code>
    </div>
  </div>
</template>
