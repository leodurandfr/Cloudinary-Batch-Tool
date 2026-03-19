<script setup>
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import GravityGrid from './GravityGrid.vue'
import CenterPicker from './CenterPicker.vue'
import { useGroups } from '@/composables/useGroups'

const props = defineProps({
  block: { type: Object, required: true },
  blockIndex: { type: Number, required: true },
  group: { type: Object, required: true },
  cropOverlayVisible: { type: Object, required: true },
  onUpdate: { type: Function, default: null }
})

const { updateChain } = useGroups()

function triggerUpdate() {
  if (props.onUpdate) props.onUpdate()
  else updateChain(props.group)
}

function nudgeCrop(dx, dy) {
  const step = 10
  props.block.params.x_offset = (props.block.params.x_offset || 0) + dx * step
  props.block.params.y_offset = (props.block.params.y_offset || 0) + dy * step
  triggerUpdate()
}

function resetNudge() {
  props.block.params.x_offset = 0
  props.block.params.y_offset = 0
  triggerUpdate()
}

function stepNumericInput(event, key) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  const val = parseFloat(props.block.params[key])
  if (isNaN(val)) return
  event.preventDefault()
  const step = event.shiftKey ? 10 : 1
  const dir = event.key === 'ArrowUp' ? 1 : -1
  props.block.params[key] = String(Math.max(0, val + step * dir))
  triggerUpdate()
}

function setGravity(g) {
  props.block.params.gravity = g
  triggerUpdate()
}

function setCropOverlay(val) {
  props.cropOverlayVisible[props.group.id] = val
}
</script>

<template>
  <div class="space-y-3 p-4 bg-card rounded-b-lg border border-t-0 border-border">

    <!-- Trim -->
    <div v-if="block.type === 'trim'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Tolérance</Label>
      <Slider
        :model-value="[block.params.tolerance ?? 50]"
        :min="0" :max="100" :step="1"
        class="flex-1"
        @update:model-value="v => { block.params.tolerance = v[0]; triggerUpdate() }"
      />
      <span class="text-xs text-muted-foreground w-8 text-right">{{ block.params.tolerance }}</span>
    </div>

    <!-- Crop -->
    <template v-if="block.type === 'crop'">
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Mode</Label>
        <Select :model-value="block.params.mode" @update:model-value="v => { block.params.mode = v; triggerUpdate() }">
          <SelectTrigger class="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crop">crop</SelectItem>
            <SelectItem value="fill">fill</SelectItem>
            <SelectItem value="fit">fit</SelectItem>
            <SelectItem value="pad">pad</SelectItem>
            <SelectItem value="thumb">thumb</SelectItem>
            <SelectItem value="auto">auto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-start gap-3">
        <Label class="w-24 shrink-0 text-xs pt-1">Gravity</Label>
        <GravityGrid :model-value="block.params.gravity" @update:model-value="setGravity" />
      </div>

      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Width</Label>
        <Input
          :model-value="block.params.width"
          placeholder="ex: 800 ou iw"
          class="h-8 text-xs"
          @update:model-value="v => { block.params.width = v; triggerUpdate() }"
          @keydown="stepNumericInput($event, 'width')"
        />
      </div>

      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Height</Label>
        <Input
          :model-value="block.params.height"
          placeholder="ex: 800 ou ih"
          class="h-8 text-xs"
          @update:model-value="v => { block.params.height = v; triggerUpdate() }"
          @keydown="stepNumericInput($event, 'height')"
        />
      </div>

      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Aspect ratio</Label>
        <Input
          :model-value="block.params.aspect_ratio"
          placeholder="ex: 1:1, 4:3"
          class="h-8 text-xs"
          @update:model-value="v => { block.params.aspect_ratio = v; triggerUpdate() }"
        />
      </div>

      <div class="flex items-start gap-3">
        <Label class="w-24 shrink-0 text-xs pt-1">Décalage</Label>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="grid grid-cols-3 gap-0.5">
              <div class="w-6" />
              <Button variant="outline" size="icon-sm" class="w-6 h-6 text-xs" @click="nudgeCrop(0, -1)">&#8593;</Button>
              <div class="w-6" />
              <Button variant="outline" size="icon-sm" class="w-6 h-6 text-xs" @click="nudgeCrop(-1, 0)">&#8592;</Button>
              <Button variant="outline" size="icon-sm" class="w-6 h-6 text-xs" @click="resetNudge">&#8857;</Button>
              <Button variant="outline" size="icon-sm" class="w-6 h-6 text-xs" @click="nudgeCrop(1, 0)">&#8594;</Button>
              <div class="w-6" />
              <Button variant="outline" size="icon-sm" class="w-6 h-6 text-xs" @click="nudgeCrop(0, 1)">&#8595;</Button>
              <div class="w-6" />
            </div>
            <div class="text-[11px] text-muted-foreground">
              <div>X: {{ block.params.x_offset || 0 }}px</div>
              <div>Y: {{ block.params.y_offset || 0 }}px</div>
              <div class="mt-0.5 text-[10px]">Pas : 10px</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Switch
              :model-value="!!cropOverlayVisible[group.id]"
              @update:model-value="setCropOverlay"
            />
            <span class="text-[11px] text-muted-foreground">Aperçu du crop sur l'image</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Gradient Fade -->
    <template v-if="block.type === 'gradient_fade'">
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Direction</Label>
        <Select :model-value="block.params.direction" @update:model-value="v => { block.params.direction = v; triggerUpdate() }">
          <SelectTrigger class="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom">bottom</SelectItem>
            <SelectItem value="top">top</SelectItem>
            <SelectItem value="left">left</SelectItem>
            <SelectItem value="right">right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Intensité</Label>
        <Slider
          :model-value="[block.params.strength ?? 40]"
          :min="0" :max="100" :step="1"
          class="flex-1"
          @update:model-value="v => { block.params.strength = v[0]; triggerUpdate() }"
        />
        <span class="text-xs text-muted-foreground w-8 text-right">{{ block.params.strength }}</span>
      </div>
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Y position</Label>
        <Input
          :model-value="block.params.y"
          placeholder="ex: 0.5"
          class="h-8 text-xs"
          @update:model-value="v => { block.params.y = v; triggerUpdate() }"
        />
      </div>
    </template>

    <!-- Brightness / Contrast / Saturation / Vibrance -->
    <div v-if="['brightness', 'contrast', 'saturation', 'vibrance'].includes(block.type)" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Niveau</Label>
      <Slider
        :model-value="[block.params.level ?? 0]"
        :min="block.type === 'brightness' || block.type === 'contrast' ? -99 : -100"
        :max="100" :step="1"
        class="flex-1"
        @update:model-value="v => { block.params.level = v[0]; triggerUpdate() }"
      />
      <span class="text-xs text-muted-foreground w-10 text-right">{{ block.params.level }}</span>
    </div>

    <!-- Sharpen -->
    <div v-if="block.type === 'sharpen'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Intensité</Label>
      <Slider
        :model-value="[block.params.strength ?? 100]"
        :min="1" :max="500" :step="1"
        class="flex-1"
        @update:model-value="v => { block.params.strength = v[0]; triggerUpdate() }"
      />
      <span class="text-xs text-muted-foreground w-10 text-right">{{ block.params.strength }}</span>
    </div>

    <!-- Auto Improve -->
    <div v-if="block.type === 'auto_improve'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Mode</Label>
      <Select :model-value="block.params.mode || '_auto'" @update:model-value="v => { block.params.mode = v === '_auto' ? '' : v; triggerUpdate() }">
        <SelectTrigger class="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_auto">auto</SelectItem>
          <SelectItem value="outdoor">outdoor</SelectItem>
          <SelectItem value="indoor">indoor</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Rotation -->
    <template v-if="block.type === 'rotation'">
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Angle</Label>
        <Select :model-value="block.params.angle" @update:model-value="v => { block.params.angle = v; triggerUpdate() }">
          <SelectTrigger class="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0°</SelectItem>
            <SelectItem value="90">90°</SelectItem>
            <SelectItem value="180">180°</SelectItem>
            <SelectItem value="270">270° (-90°)</SelectItem>
            <SelectItem value="auto_right">Auto droite</SelectItem>
            <SelectItem value="auto_left">Auto gauche</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Flip</Label>
        <Select :model-value="block.params.flip || '_none'" @update:model-value="v => { block.params.flip = v === '_none' ? '' : v; triggerUpdate() }">
          <SelectTrigger class="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Aucun</SelectItem>
            <SelectItem value="hflip">Horizontal</SelectItem>
            <SelectItem value="vflip">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </template>

    <!-- Border -->
    <template v-if="block.type === 'border'">
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Épaisseur</Label>
        <Slider
          :model-value="[block.params.width ?? 2]"
          :min="1" :max="50" :step="1"
          class="flex-1"
          @update:model-value="v => { block.params.width = v[0]; triggerUpdate() }"
        />
        <span class="text-xs text-muted-foreground w-10 text-right">{{ block.params.width }}px</span>
      </div>
      <div class="flex items-center gap-3">
        <Label class="w-24 shrink-0 text-xs">Couleur</Label>
        <Input
          :model-value="block.params.color"
          placeholder="ex: black, FFFFFF"
          class="h-8 text-xs"
          @update:model-value="v => { block.params.color = v; triggerUpdate() }"
        />
      </div>
    </template>

    <!-- Radius -->
    <div v-if="block.type === 'radius'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Rayon</Label>
      <Select :model-value="block.params.value" @update:model-value="v => { block.params.value = v; triggerUpdate() }">
        <SelectTrigger class="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="max">Cercle (max)</SelectItem>
          <SelectItem value="10">10px</SelectItem>
          <SelectItem value="20">20px</SelectItem>
          <SelectItem value="30">30px</SelectItem>
          <SelectItem value="40">40px</SelectItem>
          <SelectItem value="50">50px</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Opacity -->
    <div v-if="block.type === 'opacity'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Opacité</Label>
      <Slider
        :model-value="[block.params.level ?? 100]"
        :min="0" :max="100" :step="1"
        class="flex-1"
        @update:model-value="v => { block.params.level = v[0]; triggerUpdate() }"
      />
      <span class="text-xs text-muted-foreground w-10 text-right">{{ block.params.level }}%</span>
    </div>

    <!-- Format -->
    <div v-if="block.type === 'format'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Format</Label>
      <Select :model-value="block.params.value" @update:model-value="v => { block.params.value = v; triggerUpdate() }">
        <SelectTrigger class="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">auto</SelectItem>
          <SelectItem value="jpg">JPG</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
          <SelectItem value="webp">WebP</SelectItem>
          <SelectItem value="avif">AVIF</SelectItem>
          <SelectItem value="tiff">TIFF</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- BG Removal -->
    <div v-if="block.type === 'bgremoval'" class="text-xs text-muted-foreground">
      Suppression automatique du fond (IA Cloudinary)
    </div>

    <!-- Upscale -->
    <div v-if="block.type === 'upscale'" class="text-xs text-muted-foreground">
      Agrandissement IA sans perte de qualité
    </div>

    <!-- Gen Fill -->
    <div v-if="block.type === 'gen_fill'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Prompt</Label>
      <Input
        :model-value="block.params.prompt"
        placeholder="(optionnel) ex: studio white background"
        class="h-8 text-xs"
        @update:model-value="v => { block.params.prompt = v; triggerUpdate() }"
      />
    </div>

    <!-- Quality -->
    <div v-if="block.type === 'quality'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Qualité</Label>
      <Select :model-value="block.params.level" @update:model-value="v => { block.params.level = v; triggerUpdate() }">
        <SelectTrigger class="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">auto</SelectItem>
          <SelectItem value="auto:best">auto:best</SelectItem>
          <SelectItem value="auto:good">auto:good</SelectItem>
          <SelectItem value="auto:eco">auto:eco</SelectItem>
          <SelectItem value="auto:low">auto:low</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Background -->
    <div v-if="block.type === 'background'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Couleur</Label>
      <Input
        :model-value="block.params.color"
        placeholder="ex: white, FFFFFF, transparent"
        class="h-8 text-xs"
        @update:model-value="v => { block.params.color = v; triggerUpdate() }"
      />
    </div>

    <!-- Center (focal point) -->
    <template v-if="block.type === 'center'">
      <CenterPicker :group="group" :block-index="blockIndex" />
      <div class="flex items-center gap-3">
        <Label class="w-16 shrink-0 text-xs">X</Label>
        <Slider
          :model-value="[block.params.x ?? 0.5]"
          :min="0" :max="1" :step="0.01"
          class="flex-1"
          @update:model-value="v => { block.params.x = v[0]; triggerUpdate() }"
        />
        <span class="text-xs text-muted-foreground w-10 text-right">{{ block.params.x }}</span>
      </div>
      <div class="flex items-center gap-3">
        <Label class="w-16 shrink-0 text-xs">Y</Label>
        <Slider
          :model-value="[block.params.y ?? 0.5]"
          :min="0" :max="1" :step="0.01"
          class="flex-1"
          @update:model-value="v => { block.params.y = v[0]; triggerUpdate() }"
        />
        <span class="text-xs text-muted-foreground w-10 text-right">{{ block.params.y }}</span>
      </div>
      <Button variant="outline" size="sm" class="text-xs" @click="block.params.x = 0.5; block.params.y = 0.5; triggerUpdate()">
        Reset
      </Button>
      <div v-if="block.params.ref_width" class="text-[11px] text-muted-foreground">
        Source : {{ block.params.ref_width }}×{{ block.params.ref_height }}px
        <template v-if="block.params.x != 0.5 || block.params.y != 0.5">
          — Décalage : {{ Math.round((block.params.x - 0.5) * block.params.ref_width) }}px,
          {{ Math.round((block.params.y - 0.5) * block.params.ref_height) }}px
        </template>
      </div>
    </template>

    <!-- Custom -->
    <div v-if="block.type === 'custom'" class="flex items-center gap-3">
      <Label class="w-24 shrink-0 text-xs">Params</Label>
      <Input
        :model-value="block.params.raw"
        placeholder="ex: e_sharpen:100"
        class="h-8 text-xs"
        @update:model-value="v => { block.params.raw = v; triggerUpdate() }"
      />
    </div>

  </div>
</template>
