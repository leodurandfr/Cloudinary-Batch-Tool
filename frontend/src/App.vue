<script setup>
import { onMounted } from 'vue'
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink
} from '@/components/ui/navigation-menu'
import GalerieTab from '@/views/GalerieTab.vue'
import GroupesTab from '@/views/GroupesTab.vue'
import ScannerTab from '@/views/ScannerTab.vue'
import LayoutsTab from '@/views/LayoutsTab.vue'
import { useInventory } from '@/composables/useInventory'
import { useGroups } from '@/composables/useGroups'
import { useScanner } from '@/composables/useScanner'
import { useNavigation } from '@/composables/useNavigation'
import { useReferences } from '@/composables/useReferences'
import { useDisplayRules } from '@/composables/useDisplayRules'

const { inventory, loading, loadInventory, filteredImages } = useInventory()
const { groups, loadGroups, syncGroupIds } = useGroups()
const { checkScanStatus } = useScanner()
const { activeTab } = useNavigation()
const { totalRefCount, loadRefsState } = useReferences()
const { loadDisplayRules } = useDisplayRules()

onMounted(async () => {
  try {
    await Promise.all([loadInventory(), loadGroups(), loadRefsState(), loadDisplayRules()])
    syncGroupIds()
  } catch (e) {
    console.error('Init failed:', e)
  } finally {
    loading.value = false
  }
  checkScanStatus()
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-50 flex items-center h-12 border-b bg-card px-6">
      <h1 class="text-sm font-semibold tracking-wide shrink-0">GDS · IBT</h1>
      <NavigationMenu class="flex-1 justify-center h-full">
        <NavigationMenuList class="h-full gap-x-0">
          <NavigationMenuItem v-for="tab in [
            { key: 'galerie', label: 'Galerie', count: filteredImages.length },
            { key: 'groupes', label: 'Groupes', count: groups.length },
            { key: 'layouts', label: 'Layouts', count: totalRefCount },
            { key: 'scanner', label: 'Scanner' }
          ]" :key="tab.key">
            <NavigationMenuLink
              :active="activeTab === tab.key"
              class="inline-flex items-center h-12 px-4 text-sm font-medium border-b-2 cursor-pointer transition-colors"
              :class="activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'"
              @select.prevent
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span v-if="tab.count != null" class="ml-1.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px]">{{ tab.count }}</span>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <span v-if="inventory?.stats" class="shrink-0 text-xs text-muted-foreground">
        {{ inventory.stats.processable }} images
        · {{ Object.keys(inventory.stats.by_category).length }} cat.
        · {{ groups.length }} grp.
      </span>
    </header>

    <div v-if="loading" class="flex items-center justify-center p-20 text-muted-foreground">
      Chargement de l'inventaire...
    </div>

    <template v-else>
      <GalerieTab v-show="activeTab === 'galerie'" />
      <GroupesTab v-show="activeTab === 'groupes'" />
      <LayoutsTab v-show="activeTab === 'layouts'" />
      <ScannerTab v-show="activeTab === 'scanner'" />
    </template>
  </div>
</template>
