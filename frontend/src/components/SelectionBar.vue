<script setup>
import SelectionCheckbox from '@/components/SelectionCheckbox.vue'

defineProps({
  selectedCount: { type: Number, required: true },
  totalCount: { type: Number, required: true },
})

defineEmits(['toggle'])
</script>

<template>
  <div
    v-if="selectedCount > 0"
    class="border-t bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between gap-4"
  >
    <SelectionCheckbox
      :selected-count="selectedCount"
      :total-count="totalCount"
      class="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
      @toggle="$emit('toggle')"
    />
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>
