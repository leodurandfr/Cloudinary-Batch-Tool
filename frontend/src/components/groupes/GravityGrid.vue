<script setup>
const props = defineProps({
  modelValue: { type: String, default: 'center' }
})
const emit = defineEmits(['update:modelValue'])

const positions = [
  'north_west', 'north', 'north_east',
  'west', 'center', 'east',
  'south_west', 'south', 'south_east'
]

function select(g) {
  emit('update:modelValue', g)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="grid grid-cols-3 gap-0.5">
      <button
        v-for="g in positions"
        :key="g"
        type="button"
        class="w-5 h-5 rounded-sm border transition-colors"
        :class="modelValue === g
          ? 'bg-primary border-primary'
          : 'border-border bg-secondary hover:bg-muted'"
        :title="g"
        @click="select(g)"
      />
    </div>
    <div class="flex flex-col gap-0.5">
      <button
        type="button"
        class="rounded px-2 py-0.5 text-[11px] border transition-colors"
        :class="modelValue === 'face'
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:text-foreground'"
        @click="select('face')"
      >face</button>
      <button
        type="button"
        class="rounded px-2 py-0.5 text-[11px] border transition-colors"
        :class="modelValue === 'auto'
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:text-foreground'"
        @click="select('auto')"
      >auto</button>
    </div>
  </div>
</template>
