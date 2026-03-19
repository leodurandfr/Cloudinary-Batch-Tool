<script setup>
import { ref, reactive, computed } from 'vue'
import { PanelRightClose, PanelRightOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import SelectionBar from '@/components/SelectionBar.vue'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import TransformEditor from '@/components/groupes/TransformEditor.vue'
import PreviewGrid from '@/components/groupes/PreviewGrid.vue'
import ExportModal from '@/components/groupes/ExportModal.vue'
import { useGroups } from '@/composables/useGroups'

const {
  groups, deleteGroup, exportGroup, exportAll, formatDate
} = useGroups()

// --- Local UI state ---
const selectedGroupId = ref(null)
const previewCols = ref(3)
const cropOverlayVisible = reactive({})
const showDeleteConfirm = ref(false)
const showExportModal = ref(false)
const previewGridRef = ref(null)
const showTransforms = ref(true)

const selectedGroup = computed(() =>
  groups.value.find(g => g.id === selectedGroupId.value) || null
)

function selectGroup(groupId) {
  selectedGroupId.value = selectedGroupId.value === groupId ? null : groupId
}

function confirmDelete() {
  if (!selectedGroup.value) return
  showDeleteConfirm.value = true
}

function handleDelete() {
  if (!selectedGroup.value) return
  const id = selectedGroup.value.id
  deleteGroup(id)
  selectedGroupId.value = null
  showDeleteConfirm.value = false
}
</script>

<template>
  <!-- 48px = header with integrated tabs (h-12) -->
  <div class="flex" style="height: calc(100vh - 48px)">

    <!-- Sidebar: Group list -->
    <aside class="w-[260px] min-w-[260px] border-r bg-card flex flex-col">
      <div class="px-4 py-3 border-b">
        <h3 class="text-xs uppercase tracking-widest text-muted-foreground">Groupes</h3>
      </div>
      <ScrollArea class="flex-1">
        <div class="p-2 space-y-1">
          <div v-if="groups.length === 0" class="text-center py-8 text-sm text-muted-foreground px-4">
            Aucun groupe. Sélectionnez des images dans la Galerie pour créer un groupe.
          </div>
          <button
            v-for="group in groups"
            :key="group.id"
            class="w-full text-left rounded-lg px-3 py-2.5 transition-colors"
            :class="selectedGroupId === group.id
              ? 'bg-primary/10 border border-primary'
              : 'border border-transparent hover:bg-secondary'"
            @click="selectGroup(group.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium truncate">{{ group.name }}</span>
              <Badge variant="secondary" class="text-[10px] shrink-0">{{ group.image_ids.length }}</Badge>
            </div>
            <div class="text-[11px] text-muted-foreground mt-1 truncate">
              {{ group.cloudinary_chain || 'Aucune transformation' }}
            </div>
            <div class="text-[10px] text-muted-foreground/60 mt-0.5">
              {{ formatDate(group.created_at) }}
            </div>
          </button>
        </div>
      </ScrollArea>

      <!-- Export all button -->
      <div v-if="groups.length > 0" class="p-3 border-t">
        <Button variant="outline" size="sm" class="w-full text-xs" @click="exportAll">
          Exporter tous les groupes
        </Button>
      </div>
    </aside>

    <!-- Main content: Selected group detail -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Toggle bar (always visible) -->
      <div class="flex items-center justify-end border-b px-3 py-1.5">
        <Button
          v-if="selectedGroup"
          variant="ghost"
          size="sm"
          class="h-7 text-xs gap-1.5 text-muted-foreground"
          @click="showTransforms = !showTransforms"
        >
          Transformations
          <PanelRightOpen v-if="!showTransforms" class="w-4 h-4" />
          <PanelRightClose v-else class="w-4 h-4" />
        </Button>
      </div>

      <!-- No selection state -->
      <div v-if="!selectedGroup" class="flex-1 flex items-center justify-center text-muted-foreground">
        <div class="text-center">
          <p class="text-sm">Sélectionnez un groupe pour le modifier</p>
          <p v-if="groups.length === 0" class="text-xs mt-1">
            Commencez par créer un groupe dans la Galerie
          </p>
        </div>
      </div>

      <!-- Group detail -->
      <template v-else>
        <!-- Header bar -->
        <div class="flex items-center justify-between gap-4 border-b px-5 py-3">
          <div class="min-w-0">
            <h2 class="text-sm font-medium truncate">{{ selectedGroup.name }}</h2>
            <p class="text-[11px] text-muted-foreground">
              {{ selectedGroup.image_ids.length }} image{{ selectedGroup.image_ids.length !== 1 ? 's' : '' }}
              · créé {{ formatDate(selectedGroup.created_at) }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" class="h-7 text-xs" @click="exportGroup(selectedGroup)">
              Export JSON
            </Button>
            <Button variant="outline" size="sm" class="h-7 text-xs" @click="showExportModal = true">
              Export images
            </Button>
            <Button variant="destructive" size="sm" class="h-7 text-xs" @click="confirmDelete">
              Supprimer
            </Button>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-5 space-y-6">
          <!-- Preview grid -->
          <PreviewGrid
            ref="previewGridRef"
            :group="selectedGroup"
            :preview-cols="previewCols"
            :crop-overlay-visible="cropOverlayVisible"
            @update:preview-cols="v => previewCols = v"
          />
        </div>

        <!-- Selection bar (sticky bottom) -->
        <SelectionBar
          v-if="previewGridRef?.hasSelection"
          :selected-count="previewGridRef.selectedIds.size"
          :total-count="selectedGroup.image_ids.length"
          @toggle="previewGridRef.toggleSelectAll()"
        />
      </template>
    </div>

    <!-- Right sidebar: Transformations -->
    <aside v-if="showTransforms && selectedGroup" class="w-[300px] min-w-[300px] border-l bg-card flex flex-col">
      <div class="px-4 py-3 border-b">
        <h3 class="text-xs uppercase tracking-widest text-muted-foreground">Transformations</h3>
      </div>
      <ScrollArea class="flex-1">
        <div class="p-4">
          <TransformEditor
            :group="selectedGroup"
            :crop-overlay-visible="cropOverlayVisible"
          />
        </div>
      </ScrollArea>
    </aside>

    <!-- Delete confirmation dialog -->
    <Dialog v-model:open="showDeleteConfirm">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le groupe</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le groupe "{{ selectedGroup?.name }}" ?
            Les images ne seront pas supprimées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showDeleteConfirm = false">Annuler</Button>
          <Button variant="destructive" @click="handleDelete">
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Export images modal -->
    <ExportModal
      :open="showExportModal"
      :group-id="selectedGroup?.id"
      @update:open="v => showExportModal = v"
    />
  </div>
</template>
