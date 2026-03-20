<script setup>
import { ref, onMounted } from 'vue'
import { Sun, Moon, HardDrive, Cloud } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink,
  navigationMenuTriggerStyle
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
import { useCloudinary } from '@/composables/useCloudinary'

const { inventory, loading, loadInventory, filteredImages } = useInventory()
const { groups, loadGroups, syncGroupIds } = useGroups()
const { checkScanStatus } = useScanner()
const { activeTab } = useNavigation()
const { totalRefCount, loadRefsState } = useReferences()
const { loadDisplayRules } = useDisplayRules()
const { useLocal } = useCloudinary()

const isDark = ref(localStorage.getItem('theme') === 'dark')

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Apply saved theme on load
document.documentElement.classList.toggle('dark', isDark.value)

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
    <header class="sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center h-12 border-b bg-card px-6">
      <h1 class="text-sm font-semibold tracking-wide">GDS · IBT</h1>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem v-for="tab in [
            { key: 'galerie', label: 'Galerie', count: filteredImages.length },
            { key: 'groupes', label: 'Groupes', count: groups.length },
            { key: 'layouts', label: 'Layouts', count: totalRefCount },
            { key: 'scanner', label: 'Scanner' }
          ]" :key="tab.key">
            <NavigationMenuLink
              :active="activeTab === tab.key"
              :class="navigationMenuTriggerStyle()"
              class="cursor-pointer"
              :style="activeTab !== tab.key ? 'color: hsl(var(--muted-foreground))' : ''"
              @select.prevent
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span v-if="tab.count != null" class="ml-1.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px]">{{ tab.count }}</span>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div class="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :title="useLocal ? 'Images locales — cliquez pour Cloudinary' : 'Cloudinary — cliquez pour local'"
          @click="useLocal = !useLocal"
        >
          <HardDrive v-if="useLocal" class="h-4 w-4" />
          <Cloud v-else class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleTheme">
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>
      </div>
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
