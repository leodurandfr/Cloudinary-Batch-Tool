<script setup>
import { computed } from 'vue'
import { Check, Minus } from 'lucide-vue-next'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps({
  selectedCount: { type: Number, required: true },
  totalCount: { type: Number, required: true },
})

const emit = defineEmits(['toggle'])

const allSelected = computed(() =>
  props.totalCount > 0 && props.selectedCount === props.totalCount
)

const checkboxState = computed(() => {
  if (props.selectedCount === 0) return false
  return allSelected.value ? true : 'indeterminate'
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <Checkbox
      :model-value="checkboxState"
      v-bind="$attrs"
      @update:model-value="emit('toggle')"
    >
      <Minus v-if="checkboxState === 'indeterminate'" class="h-4 w-4" />
      <Check v-else class="h-4 w-4" />
    </Checkbox>
    <span class="text-sm font-medium whitespace-nowrap">
      {{ selectedCount }} / {{ totalCount }} sélectionnée(s)
    </span>
  </div>
</template>
