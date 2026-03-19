<script setup>
import { ref, watch } from 'vue'
import { Download, FolderOpen } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { useGroups } from '@/composables/useGroups'

const props = defineProps({
  open: { type: Boolean, default: false },
  groupId: { type: String, default: null }
})

const emit = defineEmits(['update:open'])

const { exportImages, openInFinder } = useGroups()

const format = ref('jpg')
const progress = ref(null)
const percent = ref(0)
const folder = ref(null)
const error = ref(null)
let closeTimer = null

function resetState() {
  progress.value = null
  percent.value = 0
  folder.value = null
  error.value = null
}

function close() {
  emit('update:open', false)
  // Reset after close animation
  closeTimer = setTimeout(resetState, 200)
}

// Cancel pending reset if modal reopens quickly
watch(() => props.open, (val) => {
  if (val && closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
})

async function startExport() {
  if (!props.groupId) return
  progress.value = 'Démarrage...'
  percent.value = 0
  error.value = null
  folder.value = null

  await exportImages(props.groupId, format.value, (msg) => {
    if (msg.progress) {
      progress.value = msg.progress
    }
    if (msg.percent != null) {
      percent.value = msg.percent
    }
    if (msg.done) {
      progress.value = `Terminé — ${msg.total} images`
      percent.value = 100
    }
    if (msg.folder) {
      folder.value = msg.folder
    }
    if (msg.error) {
      error.value = msg.error
      progress.value = null
    }
  })
}

const formats = ['jpg', 'png', 'webp']
</script>

<template>
  <Dialog :open="open" @update:open="v => v ? null : close()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Exporter les images transformées</DialogTitle>
        <DialogDescription>
          Télécharge toutes les images "après" du groupe depuis Cloudinary.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- Format selector -->
        <div class="space-y-2">
          <Label class="text-xs">Format</Label>
          <div class="flex gap-2">
            <Button
              v-for="fmt in formats"
              :key="fmt"
              :variant="format === fmt ? 'default' : 'outline'"
              size="sm"
              class="text-xs"
              @click="format = fmt"
            >
              {{ fmt.toUpperCase() }}
            </Button>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="progress" class="space-y-2">
          <p class="text-sm">{{ progress }}</p>
          <Progress :model-value="percent" class="h-2" />
        </div>

        <!-- Error -->
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="close">
          {{ progress ? 'Fermer' : 'Annuler' }}
        </Button>
        <Button v-if="folder" class="gap-1.5" @click="openInFinder(folder)">
          <FolderOpen class="w-4 h-4" />
          Ouvrir dans le Finder
        </Button>
        <Button v-else class="gap-1.5" :disabled="!!progress" @click="startExport">
          <Download class="w-4 h-4" />
          Télécharger
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
