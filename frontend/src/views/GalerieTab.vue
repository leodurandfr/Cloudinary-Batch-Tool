<script setup>
import { reactive, computed, ref, watch, nextTick } from 'vue'
import { Check, Search, Plus, Trash2, X, UserMinus } from 'lucide-vue-next'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInventory } from '@/composables/useInventory'
import { useGroups } from '@/composables/useGroups'

const {
  inventory, filterCategory, filterType, filterState, filterRef,
  filteredImages, imageMap, ungroupedCount, groupedCount, deleteImages
} = useInventory()

const {
  groups, createGroup, addToGroup, ungroupImage, ungroupImages,
  removeImagesFromAllGroups, getGroupName, syncGroupIds
} = useGroups()

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

function onImageError(event, img) {
  if (!event.target.dataset.fallback) {
    event.target.dataset.fallback = '1'
    event.target.src = '/images/' + img.local_path
  }
}

// Focus group name input when modal opens
watch(showCreateGroupModal, (val) => {
  if (val) {
    nextTick(() => groupNameInput.value?.$el?.focus?.() || groupNameInput.value?.focus?.())
  }
})
</script>

<template>
  <!-- 105px = header (57px) + tab bar (48px) -->
  <div class="flex" style="height: calc(100vh - 105px)">
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
              <div class="flex flex-col gap-0.5">
                <Button
                  :variant="filterCategory === null ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterCategory = null"
                >
                  Toutes
                  <span class="opacity-60">{{ inventory?.stats?.processable }}</span>
                </Button>
                <Button
                  v-for="(count, cat) in inventory?.stats?.by_category"
                  :key="cat"
                  :variant="filterCategory === cat ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterCategory = cat"
                >
                  {{ cat }}
                  <span class="opacity-60">{{ count }}</span>
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- Type -->
          <AccordionItem value="type" class="border-b-0">
            <AccordionTrigger class="py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:no-underline">
              Type
            </AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-0.5">
                <Button
                  :variant="filterType === null ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterType = null"
                >
                  Tous
                  <span class="opacity-60">{{ inventory?.stats?.processable }}</span>
                </Button>
                <Button
                  v-for="(count, type) in inventory?.stats?.by_type"
                  :key="type"
                  :variant="filterType === type ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterType = type"
                >
                  {{ type }}
                  <span class="opacity-60">{{ count }}</span>
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- State -->
          <AccordionItem value="state" class="border-b-0">
            <AccordionTrigger class="py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:no-underline">
              État
            </AccordionTrigger>
            <AccordionContent>
              <div class="flex flex-col gap-0.5">
                <Button
                  :variant="filterState === null ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterState = null"
                >
                  Tous
                </Button>
                <Button
                  :variant="filterState === 'ungrouped' ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterState = 'ungrouped'"
                >
                  Non groupées
                  <span class="opacity-60">{{ ungroupedCount }}</span>
                </Button>
                <Button
                  :variant="filterState === 'grouped' ? 'default' : 'ghost'"
                  size="sm"
                  class="w-full justify-between h-8 text-xs"
                  @click="filterState = 'grouped'"
                >
                  Groupées
                  <span class="opacity-60">{{ groupedCount }}</span>
                </Button>
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
              :src="img.thumb_url"
              :alt="img.filename"
              loading="lazy"
              class="w-full aspect-square object-contain bg-white"
              @error="onImageError($event, img)"
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
      <div
        v-if="selectedIds.size > 0"
        class="border-t bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between gap-4"
      >
        <span class="text-sm font-medium whitespace-nowrap">
          {{ selectedIds.size }} image{{ selectedIds.size !== 1 ? 's' : '' }} sélectionnée{{ selectedIds.size !== 1 ? 's' : '' }}
        </span>
        <div class="flex items-center gap-2">
          <Button variant="link" size="sm" class="text-primary-foreground h-7" @click="selectAllFiltered">
            Tout sélectionner ({{ filteredImages.length }})
          </Button>
          <Button variant="link" size="sm" class="text-primary-foreground h-7" @click="clearSelection">
            Désélectionner
          </Button>
          <Button
            v-if="selectedGroupedCount > 0"
            variant="secondary"
            size="sm"
            class="h-7 gap-1"
            @click="handleUngroupSelected"
          >
            <UserMinus class="w-3.5 h-3.5" />
            Retirer du groupe ({{ selectedGroupedCount }})
          </Button>
          <Button variant="destructive" size="sm" class="h-7 gap-1" @click="showDeleteConfirm = true">
            <Trash2 class="w-3.5 h-3.5" />
            Supprimer ({{ selectedIds.size }})
          </Button>
          <Button variant="secondary" size="sm" class="h-7 gap-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90" @click="handleGroupAction">
            <Plus class="w-3.5 h-3.5" />
            {{ groups.length > 0 ? 'Grouper...' : 'Créer un groupe' }}
          </Button>
        </div>
      </div>
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
