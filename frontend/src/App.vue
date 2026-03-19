<script setup>
import { onMounted } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GalerieTab from '@/views/GalerieTab.vue'
import GroupesTab from '@/views/GroupesTab.vue'
import ScannerTab from '@/views/ScannerTab.vue'
import { useInventory } from '@/composables/useInventory'
import { useGroups } from '@/composables/useGroups'
import { useScanner } from '@/composables/useScanner'

const { inventory, loading, loadInventory, filteredImages } = useInventory()
const { groups, loadGroups, syncGroupIds } = useGroups()
const { checkScanStatus } = useScanner()

onMounted(async () => {
  try {
    await Promise.all([loadInventory(), loadGroups()])
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
    <header class="sticky top-0 z-50 flex items-center justify-between border-b bg-card px-6 py-4">
      <h1 class="text-lg font-medium tracking-wide">CHANEL — Image Batch Tool</h1>
      <span v-if="inventory?.stats" class="text-sm text-muted-foreground">
        {{ inventory.stats.processable }} images
        · {{ Object.keys(inventory.stats.by_category).length }} catégories
        · {{ groups.length }} groupes
      </span>
    </header>

    <div v-if="loading" class="flex items-center justify-center p-20 text-muted-foreground">
      Chargement de l'inventaire...
    </div>

    <Tabs v-else default-value="galerie" class="w-full">
      <TabsList class="flex w-full justify-start rounded-none border-b bg-card px-6 py-0">
        <TabsTrigger value="galerie" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
          Galerie
          <span class="ml-1.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px]">{{ filteredImages.length }}</span>
        </TabsTrigger>
        <TabsTrigger value="groupes" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
          Groupes
          <span class="ml-1.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px]">{{ groups.length }}</span>
        </TabsTrigger>
        <TabsTrigger value="scanner" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
          Scanner
        </TabsTrigger>
      </TabsList>

      <TabsContent value="galerie" class="mt-0">
        <GalerieTab />
      </TabsContent>

      <TabsContent value="groupes" class="mt-0">
        <GroupesTab />
      </TabsContent>

      <TabsContent value="scanner" class="mt-0">
        <ScannerTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
