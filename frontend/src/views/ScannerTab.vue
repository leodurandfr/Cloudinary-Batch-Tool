<script setup>
import { ref, watch, nextTick } from 'vue'
import { Play, RotateCcw, Upload } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { useScanner } from '@/composables/useScanner'
import { useInventory } from '@/composables/useInventory'
import { useGroups } from '@/composables/useGroups'
import { useNavigation } from '@/composables/useNavigation'

const {
  scanUrls, scanRunning, scanStatus, scanPercent,
  scanLog, scanResult, scanDone,
  startScan, clearScan
} = useScanner()

const { reloadInventory } = useInventory()
const { syncGroupIds } = useGroups()
const { activeTab } = useNavigation()

const logEl = ref(null)

watch(() => scanLog.value.length, () => {
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
})

async function loadScannedInventory() {
  await reloadInventory()
  syncGroupIds()
  activeTab.value = 'galerie'
}
</script>

<template>
  <div class="overflow-y-auto" style="height: calc(100vh - 105px)">
    <div class="mx-auto max-w-[900px] px-5 py-6">
      <!-- Header -->
      <div class="mb-5">
        <h2 class="text-base font-medium">Scanner des PLPs Chanel</h2>
        <p class="mt-1 text-[13px] text-muted-foreground">
          Entrez une URL de PLP par ligne. Le scanner extraira les liens PDP de chaque page,
          puis collectera les URLs d'images Cloudinary de chaque produit.
        </p>
      </div>

      <!-- URL input -->
      <textarea
        v-model="scanUrls"
        :disabled="scanRunning"
        class="mb-4 w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        style="min-height: 120px"
        placeholder="https://www.chanel.com/fr/joaillerie/bagues/c/3x1x2/
https://www.chanel.com/fr/joaillerie/colliers/c/3x1x1/
https://www.chanel.com/fr/joaillerie/boucles-doreilles/c/3x1x3/"
      />

      <!-- Action buttons -->
      <div class="mb-4 flex items-center gap-3">
        <Button
          @click="startScan"
          :disabled="scanRunning || !scanUrls.trim()"
        >
          <Play class="mr-2 h-4 w-4" />
          {{ scanRunning ? 'Scan en cours...' : 'Lancer le scan' }}
        </Button>

        <Button
          v-if="!scanRunning && scanLog.length"
          variant="outline"
          @click="clearScan"
        >
          <RotateCcw class="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>

        <Button
          v-if="scanDone && !scanRunning"
          @click="loadScannedInventory"
        >
          <Upload class="mr-2 h-4 w-4" />
          Charger dans la Galerie
        </Button>

        <span v-if="scanRunning" class="text-[13px] text-muted-foreground">
          {{ scanStatus }}
        </span>
      </div>

      <!-- Progress + Log -->
      <div v-if="scanRunning || scanLog.length">
        <Progress v-if="scanRunning" :model-value="scanPercent" class="mb-3 h-1.5" />

        <div
          ref="logEl"
          class="overflow-y-auto rounded-md border border-input bg-card p-3 font-mono text-xs leading-relaxed"
          style="height: 260px"
        >
          <div
            v-for="(entry, i) in scanLog"
            :key="i"
            :class="[
              'py-px',
              entry.phase === 'plp' && 'font-semibold text-primary',
              entry.phase === 'plp_done' && 'text-primary',
              entry.phase === 'pdp_done' && 'text-foreground',
              entry.phase === 'done' && 'font-semibold text-[hsl(var(--success))]',
              (entry.phase === 'error' || entry.phase === 'plp_error' || entry.phase === 'pdp_error') && 'text-destructive',
              !['plp', 'plp_done', 'pdp_done', 'done', 'error', 'plp_error', 'pdp_error'].includes(entry.phase) && 'text-muted-foreground'
            ]"
          >
            {{ entry.text }}
          </div>
        </div>
      </div>

      <!-- Results stats -->
      <div v-if="scanResult" class="mt-5">
        <Separator class="mb-5" />

        <div class="flex flex-wrap gap-4">
          <Card class="min-w-[140px] flex-1">
            <CardContent class="p-4 text-center">
              <div class="text-2xl font-semibold text-primary">{{ scanResult.total }}</div>
              <div class="mt-1 text-xs text-muted-foreground">Total inventaire</div>
            </CardContent>
          </Card>

          <Card class="min-w-[140px] flex-1">
            <CardContent class="p-4 text-center">
              <div class="text-2xl font-semibold text-[hsl(var(--success))]">{{ scanResult.new_count }}</div>
              <div class="mt-1 text-xs text-muted-foreground">Nouvelles</div>
            </CardContent>
          </Card>

          <Card v-if="scanResult.existing_count" class="min-w-[140px] flex-1">
            <CardContent class="p-4 text-center">
              <div class="text-2xl font-semibold text-foreground">{{ scanResult.existing_count }}</div>
              <div class="mt-1 text-xs text-muted-foreground">Existantes</div>
            </CardContent>
          </Card>

          <Card v-if="scanResult.duplicate_count" class="min-w-[140px] flex-1">
            <CardContent class="p-4 text-center">
              <div class="text-2xl font-semibold text-muted-foreground">{{ scanResult.duplicate_count }}</div>
              <div class="mt-1 text-xs text-muted-foreground">Doublons</div>
            </CardContent>
          </Card>
        </div>

        <!-- By category breakdown -->
        <div v-if="scanResult.by_category" class="mt-4">
          <h3 class="mb-2 text-[13px] text-muted-foreground">Par catégorie</h3>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="(count, cat) in scanResult.by_category"
              :key="cat"
              variant="secondary"
              class="px-3 py-1.5 text-[13px]"
            >
              <span class="text-muted-foreground">{{ cat }}</span>
              <span class="ml-2 font-medium text-foreground">{{ count }}</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
