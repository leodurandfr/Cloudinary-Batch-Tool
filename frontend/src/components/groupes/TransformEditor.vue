<script setup>
import { ref } from 'vue'
import { Plus, X, GripVertical } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import TransformPanel from './TransformPanel.vue'
import { useGroups } from '@/composables/useGroups'
import { useCloudinary } from '@/composables/useCloudinary'

const props = defineProps({
  group: { type: Object, required: true },
  cropOverlayVisible: { type: Object, required: true }
})

const { addTransform, removeTransform, reorderTransform } = useGroups()
const { transformLabel, transformSummary } = useCloudinary()

const openBlock = ref(null) // index of expanded block
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function toggleBlock(index) {
  openBlock.value = openBlock.value === index ? null : index
}

function handleAdd(type) {
  addTransform(props.group, type)
  // Open the newly added block
  openBlock.value = props.group.transformations.length - 1
}

function handleRemove(index) {
  removeTransform(props.group, index)
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
  reorderTransform(props.group, from, index)
  // Track the open panel through the reorder
  if (openBlock.value !== null) {
    if (openBlock.value === from) {
      openBlock.value = index
    } else {
      let o = openBlock.value
      if (from < o) o--       // removal before open shifts it down
      if (index <= o) o++     // insertion at or before open shifts it up
      openBlock.value = o
    }
  }
  dragIndex.value = null
  dragOverIndex.value = null
}

const MENU_GROUPS = [
  {
    label: 'Recadrage',
    items: [
      { type: 'trim', label: 'Trim (rognage auto)' },
      { type: 'crop', label: 'Crop / Resize' },
      { type: 'center', label: 'Centre (point focal)' },
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
    label: 'Avancé',
    items: [
      { type: 'custom', label: 'Custom (raw)' }
    ]
  }
]
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-xs uppercase tracking-widest text-muted-foreground">Transformations</h4>
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
    <div v-if="group.transformations.length > 0" class="space-y-0">
      <template v-for="(block, i) in group.transformations" :key="i">
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
          :group="group"
          :crop-overlay-visible="cropOverlayVisible"
        />
      </template>
    </div>

    <div v-else class="text-xs text-muted-foreground py-2">
      Aucune transformation. Cliquez sur "Ajouter" pour commencer.
    </div>

    <!-- Chain preview -->
    <div v-if="group.cloudinary_chain" class="rounded border border-border bg-secondary/50 px-3 py-2">
      <code class="text-[11px] text-muted-foreground break-all">{{ group.cloudinary_chain }}</code>
    </div>
  </div>
</template>
