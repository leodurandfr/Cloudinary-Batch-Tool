<script setup>
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SlotTransformEditor from '@/components/layouts/SlotTransformEditor.vue'
import TemplateView from '@/components/layouts/TemplateView.vue'
import { useReferences } from '@/composables/useReferences'
import { useDisplayRules } from '@/composables/useDisplayRules'

const {
  refsState,
  selectedRef,
  expandedCategories,
  refsByCategory,
  selectedRefImages,
  selectedRefLayout,
  toggleCategory,
  selectRef,
  toggleHas3d
} = useReferences()

const { displayRules } = useDisplayRules()

const showSidebar = ref(true)
const showRules = ref(false)
const viewMode = ref('overview') // 'overview' | 'template'

const has3d = computed(() =>
  selectedRef.value ? !!refsState.value.has3d?.[selectedRef.value.ref] : false
)

const SLOT_KEYS = ['cover', 'zoom', 'gallery', 'gallery_zoom']
</script>

<template>
  <!-- 48px = header with integrated tabs (h-12) -->
  <div class="flex" style="height: calc(100vh - 48px)">

    <!-- Left sidebar -->
    <aside v-if="showSidebar" class="w-[260px] min-w-[260px] border-r bg-card flex flex-col">
      <div class="px-4 py-3 border-b">
        <h3 class="text-xs uppercase tracking-widest text-muted-foreground">Références</h3>
      </div>
      <ScrollArea class="flex-1">
        <div class="p-2 space-y-0.5">
          <div v-if="Object.keys(refsByCategory).length === 0" class="text-center py-8 text-sm text-muted-foreground px-4">
            Aucune référence. Lancez un scan ou importez un inventaire.
          </div>
          <div v-for="(refs, category) in refsByCategory" :key="category">
            <!-- Category header -->
            <button
              class="w-full flex items-center gap-1.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary"
              @click="toggleCategory(category)"
            >
              <ChevronDown v-if="expandedCategories[category]" class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <ChevronRight v-else class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span class="text-sm font-medium truncate">{{ category }}</span>
              <Badge variant="secondary" class="text-[10px] shrink-0 ml-auto">{{ Object.keys(refs).length }}</Badge>
            </button>

            <!-- Refs list -->
            <div v-if="expandedCategories[category]" class="pl-3 space-y-0.5">
              <button
                v-for="(images, refName) in refs"
                :key="refName"
                class="w-full text-left rounded-lg px-3 py-1.5 transition-colors text-sm"
                :class="selectedRef?.ref === refName && selectedRef?.category === category
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary text-foreground'"
                @click="selectRef(refName, category)"
              >
                <span class="truncate">{{ refName }}</span>
                <Badge variant="secondary" class="text-[10px] ml-1.5">{{ images.length }}</Badge>
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Toggle bar (always visible) -->
      <div class="flex items-center justify-between border-b px-3 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          class="h-7 text-xs gap-1.5 text-muted-foreground"
          @click="showSidebar = !showSidebar"
        >
          <PanelLeftOpen v-if="!showSidebar" class="w-4 h-4" />
          <PanelLeftClose v-else class="w-4 h-4" />
          Références
        </Button>
        <Button
          v-if="selectedRef"
          variant="ghost"
          size="sm"
          class="h-7 text-xs gap-1.5 text-muted-foreground"
          @click="showRules = !showRules"
        >
          Règles d'affichage
          <PanelRightOpen v-if="!showRules" class="w-4 h-4" />
          <PanelRightClose v-else class="w-4 h-4" />
        </Button>
      </div>

      <!-- No selection state -->
      <div v-if="!selectedRef" class="flex-1 flex items-center justify-center text-muted-foreground">
        <p class="text-sm">Sélectionnez une référence</p>
      </div>

      <!-- Ref layout -->
      <template v-else>
        <!-- Header bar -->
        <div class="flex items-center justify-between gap-4 border-b px-5 py-3">
          <div class="min-w-0">
            <h2 class="text-sm font-medium truncate">{{ selectedRef.ref }}</h2>
            <p class="text-[11px] text-muted-foreground">
              {{ selectedRef.category }} · {{ selectedRefImages.length }} image{{ selectedRefImages.length !== 1 ? 's' : '' }}
            </p>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <Label class="text-xs text-muted-foreground">Vue 3D</Label>
            <Switch
              :model-value="has3d"
              @update:model-value="toggleHas3d(selectedRef.ref)"
            />

            <div class="flex items-center border rounded-md overflow-hidden ml-2">
              <Button
                variant="ghost"
                size="sm"
                class="h-7 text-xs rounded-none px-3"
                :class="viewMode === 'overview' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'"
                @click="viewMode = 'overview'"
              >
                Overview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 text-xs rounded-none px-3"
                :class="viewMode === 'template' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'"
                @click="viewMode = 'template'"
              >
                Template
              </Button>
            </div>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto" :class="viewMode === 'overview' ? 'p-5 space-y-6' : 'p-0'">

            <div v-if="!selectedRefLayout" class="text-center py-12 text-sm text-muted-foreground">
              Aucune image pour cette référence.
            </div>

            <!-- TEMPLATE MODE -->
            <TemplateView
              v-else-if="viewMode === 'template'"
              :layout="selectedRefLayout"
              :ref-info="selectedRef"
              :has3d="has3d"
            />

            <!-- OVERVIEW MODE -->
            <template v-else>
              <!-- Cover block -->
              <Card>
                <CardHeader class="pb-3">
                  <div class="flex items-center gap-2">
                    <CardTitle class="text-sm">Cover</CardTitle>
                    <Badge variant="outline" class="text-[10px]">1:1</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <!-- 3D placeholder -->
                  <div
                    v-if="has3d && !selectedRefLayout.cover"
                    class="flex items-center justify-center rounded-lg bg-muted text-muted-foreground"
                    style="aspect-ratio: 1/1; max-width: 400px; margin: 0 auto"
                  >
                    <span class="text-sm">Produit 3D</span>
                  </div>
                  <!-- Cover image -->
                  <template v-else-if="selectedRefLayout.cover">
                    <img
                      :src="selectedRefLayout.cover.finalUrl"
                      :alt="selectedRefLayout.cover.image.ref"
                      class="rounded-lg"
                      style="aspect-ratio: 1/1; object-fit: cover; max-width: 400px; margin: 0 auto; display: block"
                    >
                    <p class="text-[11px] text-muted-foreground mt-2 text-center">
                      {{ selectedRefLayout.cover.image.type }}
                      <template v-if="selectedRefLayout.cover.layer1Chain"> · L1: {{ selectedRefLayout.cover.layer1Chain }}</template>
                      <template v-if="selectedRefLayout.cover.layer2Chain"> · L2: {{ selectedRefLayout.cover.layer2Chain }}</template>
                    </p>
                  </template>
                  <!-- No cover -->
                  <div
                    v-else
                    class="flex items-center justify-center rounded-lg bg-muted text-muted-foreground"
                    style="aspect-ratio: 1/1; max-width: 400px; margin: 0 auto"
                  >
                    <span class="text-sm">Aucune image cover</span>
                  </div>
                </CardContent>
              </Card>

              <!-- Zoom block (conditional) -->
              <Card v-if="selectedRefLayout.zoom.visible">
                <CardHeader class="pb-3">
                  <div class="flex items-center gap-2">
                    <CardTitle class="text-sm">Zoom</CardTitle>
                    <Badge variant="outline" class="text-[10px]">8:5</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <img
                    :src="selectedRefLayout.zoom.finalUrl"
                    :alt="selectedRefLayout.zoom.image.ref"
                    class="w-full rounded-lg"
                    style="aspect-ratio: 8/5; object-fit: cover"
                  >
                  <p class="text-[11px] text-muted-foreground mt-2">
                    {{ selectedRefLayout.zoom.image.type }}
                    <template v-if="selectedRefLayout.zoom.layer1Chain"> · L1: {{ selectedRefLayout.zoom.layer1Chain }}</template>
                    <template v-if="selectedRefLayout.zoom.layer2Chain"> · L2: {{ selectedRefLayout.zoom.layer2Chain }}</template>
                  </p>
                </CardContent>
              </Card>

              <!-- Gallery block -->
              <Card v-if="selectedRefLayout.gallery.items.length > 0">
                <CardHeader class="pb-3">
                  <CardTitle class="text-sm">Galerie</CardTitle>
                </CardHeader>
                <CardContent>
                  <!-- Scroll mode (carousel) -->
                  <div
                    v-if="selectedRefLayout.gallery.mode === 'scroll'"
                    class="flex overflow-x-auto gap-3 pb-2"
                  >
                    <div
                      v-for="(item, i) in selectedRefLayout.gallery.items"
                      :key="i"
                      class="shrink-0 w-[180px]"
                    >
                      <img
                        :src="item.finalUrl"
                        :alt="item.image.ref"
                        class="w-full rounded-lg bg-muted"
                      >
                      <Badge variant="secondary" class="text-[10px] mt-1.5">{{ item.image.type }}</Badge>
                    </div>
                  </div>

                  <!-- Two-column mode -->
                  <div
                    v-else-if="selectedRefLayout.gallery.mode === 'two-column'"
                    class="grid grid-cols-2 gap-4"
                  >
                    <div v-for="(item, i) in selectedRefLayout.gallery.items" :key="i">
                      <img
                        :src="item.finalUrl"
                        :alt="item.image.ref"
                        class="w-full rounded-lg bg-muted"
                      >
                      <Badge variant="secondary" class="text-[10px] mt-1.5">{{ item.image.type }}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </template>
          </div>
      </template>
    </div>

    <!-- Right sidebar: Display rules (Couche 2) -->
    <aside v-if="showRules" class="w-[300px] min-w-[300px] border-l bg-card flex flex-col">
      <div class="px-4 py-3 border-b">
        <h3 class="text-xs uppercase tracking-widest text-muted-foreground">Règles d'affichage (Couche 2)</h3>
      </div>
      <ScrollArea class="flex-1">
        <div class="p-4 space-y-6">
          <template v-for="key in SLOT_KEYS" :key="key">
            <SlotTransformEditor
              v-if="displayRules?.slots?.[key]"
              :slot-key="key"
            />
          </template>
        </div>
      </ScrollArea>
    </aside>
  </div>
</template>
