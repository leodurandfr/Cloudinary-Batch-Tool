<script setup>
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GalerieTab from '@/views/GalerieTab.vue'
import GroupesTab from '@/views/GroupesTab.vue'
import ScannerTab from '@/views/ScannerTab.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-50 flex items-center justify-between border-b bg-card px-6 py-4">
      <h1 class="text-lg font-medium tracking-wide">CHANEL — Image Batch Tool</h1>
      <span class="text-sm text-muted-foreground">Cloudinary Manager</span>
    </header>

    <Tabs default-value="galerie" class="w-full">
      <TabsList class="flex w-full justify-start rounded-none border-b bg-card px-6">
        <TabsTrigger value="galerie" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
          Galerie
        </TabsTrigger>
        <TabsTrigger value="groupes" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
          Groupes
        </TabsTrigger>
        <TabsTrigger value="scanner" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
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
