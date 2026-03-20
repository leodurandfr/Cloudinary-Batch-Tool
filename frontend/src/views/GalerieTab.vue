<script setup>
import { reactive, computed, ref, watch, nextTick } from 'vue'
import { Check, Search } from 'lucide-vue-next'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import SelectionBar from '@/components/SelectionBar.vue'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInventory } from '@/composables/useInventory'
import { useGroups } from '@/composables/useGroups'
import { useCloudinary } from '@/composables/useCloudinary'

const {
  inventory, filterCategory, filterType, filterState, filterRef,
  filteredImages, imageMap, ungroupedCount, groupedCount, deleteImages
} = useInventory()

const {
  groups, createGroup, addToGroup, ungroupImage, ungroupImages,
  removeImagesFromAllGroups, getGroupName, syncGroupIds
} = useGroups()

const { thumbUrl, onImgError } = useCloudinary()

const sortedCategories = computed(() =>
  Object.entries(inventory.value?.stats?.by_category || {}).sort(([, a], [, b]) => b - a)
)

const productTypes = computed(() =>
  Object.entries(inventory.value?.stats?.by_type || {})
    .filter(([type]) => !type.startsWith('portee'))
    .sort(([, a], [, b]) => b - a)
)

const porteeTypes = computed(() =>
  Object.entries(inventory.value?.stats?.by_type || {})
    .filter(([type]) => type.startsWith('portee'))
    .sort(([, a], [, b]) => b - a)
)

// --- Local UI state ---
const selectedIds = reactive(new Set())
const showCreateGroupModal = ref(false)
const showAddToGroupMenu = ref(false)
const showDeleteConfirm = ref(false)
const newGroupName = ref('')
const groupNameInput = ref(null)

const selectedGroupedCount = computed(() => {
  let count = 0
  for (const id of selectedIds) {
    const img = imageMap.value[id]
    if (img?.group_id) count++
  }
  return count
})

const allFilteredSelected = computed(() =>
  filteredImages.value.length > 0 && filteredImages.value.every(img => selectedIds.has(img.id))
)

function toggleSelectAll() {
  if (allFilteredSelected.value) clearSelection()
  else selectAllFiltered()
}

// --- Actions ---
function toggleSelect(img) {
  if (selectedIds.has(img.id)) {
    selectedIds.delete(img.id)
  } else {
    selectedIds.add(img.id)
  }
}

function selectAllFiltered() {
  for (const img of filteredImages.value) {
    selectedIds.add(img.id)
  }
}

function clearSelection() {
  selectedIds.clear()
}

function handleCreateGroup() {
  const result = createGroup(newGroupName.value, [...selectedIds])
  if (result) {
    selectedIds.clear()
    newGroupName.value = ''
    showCreateGroupModal.value = false
  }
}

function handleAddToGroup(groupId) {
  addToGroup(groupId, [...selectedIds])
  selectedIds.clear()
  showAddToGroupMenu.value = false
}

function handleGroupAction() {
  if (groups.value.length > 0) {
    showAddToGroupMenu.value = true
  } else {
    showCreateGroupModal.value = true
  }
}

async function openCreateFromAddMenu() {
  showAddToGroupMenu.value = false
  await nextTick()
  showCreateGroupModal.value = true
}

function handleUngroupSelected() {
  const ids = [...selectedIds].filter(id => {
    const img = imageMap.value[id]
    return img?.group_id
  })
  ungroupImages(ids)
  selectedIds.clear()
}

async function handleDeleteSelected() {
  const idsToDelete = new Set(selectedIds)
  showDeleteConfirm.value = false
  await deleteImages(idsToDelete)
  removeImagesFromAllGroups(idsToDelete)
  selectedIds.clear()
}


// Focus group name input when modal opens
watch(showCreateGroupModal, (val) => {
  if (val) {
    nextTick(() => groupNameInput.value?.$el?.focus?.() || groupNameInput.value?.focus?.())
  }
})
</script>

<template>
  <!-- 48px = header with integrated tabs (h-12) -->
  <div class="flex" style="height: calc(100vh - 48px)">
    <!-- Sidebar -->
    <aside class="w-[260px] min-w-[260px] border-r bg-card">
      <ScrollArea class="h-full">
        <div class="p-5">
        <Accordion type="multiple" :default-value="['category', 'type', 'state']" class="w-full">
          <!-- Category -->
          <AccordionItem value="category" class="border-b-0">
            <AccordionTrigger class="py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:no-underline">
              Catégorie
            </AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-px">
                <button
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterCategory === null ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterCategory = null"
                >
                  Toutes
                  <span class="text-muted-foreground">{{ inventory?.stats?.processable }}</span>
                </button>
                <button
                  v-for="[cat, count] in sortedCategories"
                  :key="cat"
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterCategory === cat ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterCategory = cat"
                >
                  {{ cat }}
                  <span class="text-muted-foreground">{{ count }}</span>
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- Type -->
          <AccordionItem value="type" class="border-b-0">
            <AccordionTrigger class="py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:no-underline">
              Type
            </AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-px">
                <button
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterType === null ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterType = null"
                >
                  Tous
                  <span class="text-muted-foreground">{{ inventory?.stats?.processable }}</span>
                </button>

                <!-- Produits -->
                <span class="text-[9px] uppercase tracking-widest text-muted-foreground mt-2 mb-0.5 px-1">Produits</span>
                <button
                  v-for="[type, count] in productTypes"
                  :key="type"
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterType === type ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterType = type"
                >
                  {{ type }}
                  <span class="text-muted-foreground">{{ count }}</span>
                </button>

                <!-- Portées -->
                <span class="text-[9px] uppercase tracking-widest text-muted-foreground mt-2 mb-0.5 px-1">Portées</span>
                <button
                  v-for="[type, count] in porteeTypes"
                  :key="type"
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterType === type ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterType = type"
                >
                  {{ type }}
                  <span class="text-muted-foreground">{{ count }}</span>
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- State -->
          <AccordionItem value="state" class="border-b-0">
            <AccordionTrigger class="py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:no-underline">
              État
            </AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-px">
                <button
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterState === null ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterState = null"
                >
                  Tous
                </button>
                <button
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterState === 'ungrouped' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterState = 'ungrouped'"
                >
                  Non groupées
                  <span class="text-muted-foreground">{{ ungroupedCount }}</span>
                </button>
                <button
                  class="flex items-center justify-between rounded px-2 h-7 text-xs transition-colors"
                  :class="filterState === 'grouped' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'"
                  @click="filterState = 'grouped'"
                >
                  Groupées
                  <span class="text-muted-foreground">{{ groupedCount }}</span>
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>
      </ScrollArea>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 border-b px-5 py-3">
        <span class="text-sm text-muted-foreground whitespace-nowrap">
          {{ filteredImages.length }} image{{ filteredImages.length !== 1 ? 's' : '' }}
        </span>
        <div class="relative w-64">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="filterRef"
            placeholder="Rechercher une référence..."
            class="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <!-- Scrollable grid -->
      <div class="flex-1 overflow-y-auto p-5">
        <!-- Image grid -->
        <div
          v-if="filteredImages.length > 0"
          class="grid gap-3"
          style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))"
        >
          <div
            v-for="img in filteredImages"
            :key="img.id"
            class="relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all bg-card"
            :class="{
              'border-primary': selectedIds.has(img.id),
              'border-border': !selectedIds.has(img.id),
              'opacity-50 hover:opacity-70': img.group_id && !selectedIds.has(img.id)
            }"
            @click="toggleSelect(img)"
          >
            <!-- Check circle (top-right) -->
            <div
              class="absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm transition-all"
              :class="selectedIds.has(img.id)
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-white/50 bg-black/30 text-white'"
            >
              <Check v-if="selectedIds.has(img.id)" class="w-3.5 h-3.5" />
            </div>

            <!-- Type badge (top-left) -->
            <Badge variant="secondary" class="absolute top-2 left-2 z-10 text-[10px] px-1.5 py-0">
              {{ img.type }}
            </Badge>

            <!-- Group badge (bottom-right) -->
            <Badge
              v-if="img.group_id"
              variant="outline"
              class="absolute bottom-8 right-2 z-10 text-[10px] bg-black/60"
            >
              {{ getGroupName(img.group_id) }}
            </Badge>

            <!-- Ungroup button -->
            <button
              v-if="img.group_id"
              class="absolute bottom-8 left-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-destructive transition-colors"
              @click.stop="ungroupImage(img.id)"
            >
              Retirer
            </button>

            <!-- Image thumbnail -->
            <img
              :src="thumbUrl(img)"
              :alt="img.filename"
              loading="lazy"
              class="w-full aspect-square object-contain bg-white"
              @error="onImgError"
            >

            <!-- Info footer -->
            <div class="px-2.5 py-2 text-[11px]">
              <span class="font-medium text-foreground">{{ img.ref }}</span>
              <span class="text-muted-foreground"> · {{ img.category }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <h3 class="text-base font-medium mb-1">Aucune image</h3>
          <p class="text-sm">Ajustez les filtres pour voir des images.</p>
        </div>
      </div>

      <!-- Selection bar (sticky bottom) -->
      <SelectionBar
        :selected-count="selectedIds.size"
        :total-count="filteredImages.length"
        @toggle="toggleSelectAll"
      >
        <Button
          v-if="selectedGroupedCount > 0"
          variant="secondary"
          size="sm"
          class="h-7 text-xs"
          @click="handleUngroupSelected"
        >
          Retirer du groupe ({{ selectedGroupedCount }})
        </Button>
        <Button variant="secondary" size="sm" class="h-7 text-xs bg-primary-foreground text-primary hover:bg-primary-foreground/90" @click="handleGroupAction">
          {{ groups.length > 0 ? 'Grouper...' : 'Créer un groupe' }}
        </Button>
      </SelectionBar>
    </div>

    <!-- Modal: Add to existing group -->
    <Dialog v-model:open="showAddToGroupMenu">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter {{ selectedIds.size }} image(s) à...</DialogTitle>
          <DialogDescription>Choisissez un groupe existant ou créez-en un nouveau.</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-2 my-4 max-h-60 overflow-y-auto">
          <Button
            v-for="group in groups"
            :key="group.id"
            variant="secondary"
            class="w-full justify-between"
            @click="handleAddToGroup(group.id)"
          >
            {{ group.name }}
            <span class="text-xs opacity-60">{{ group.image_ids.length }} images</span>
          </Button>
        </div>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showAddToGroupMenu = false">Annuler</Button>
          <Button @click="openCreateFromAddMenu">
            <Plus class="w-4 h-4 mr-1" />
            Nouveau groupe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal: Create group -->
    <Dialog v-model:open="showCreateGroupModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un groupe</DialogTitle>
          <DialogDescription>{{ selectedIds.size }} image(s) seront ajoutées au groupe.</DialogDescription>
        </DialogHeader>
        <Input
          ref="groupNameInput"
          v-model="newGroupName"
          placeholder="Nom du groupe (ex: bagues-default-centrées)"
          class="my-4"
          @keyup.enter="handleCreateGroup"
        />
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showCreateGroupModal = false">Annuler</Button>
          <Button :disabled="!newGroupName.trim()" @click="handleCreateGroup">
            Créer ({{ selectedIds.size }} images)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal: Delete confirmation -->
    <Dialog v-model:open="showDeleteConfirm">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer {{ selectedIds.size }} image(s) ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showDeleteConfirm = false">Annuler</Button>
          <Button variant="destructive" @click="handleDeleteSelected">
            <Trash2 class="w-4 h-4 mr-1" />
            Supprimer {{ selectedIds.size }} image(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
