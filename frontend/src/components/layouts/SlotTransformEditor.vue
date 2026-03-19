<script setup>
import { reactive, computed } from 'vue'
import BaseTransformEditor from '@/components/BaseTransformEditor.vue'
import { useDisplayRules } from '@/composables/useDisplayRules'

const props = defineProps({
  slotKey: { type: String, required: true }
})

const { displayRules, addSlotTransform, removeSlotTransform, reorderSlotTransform, updateSlotChain } = useDisplayRules()

const currentSlot = computed(() => displayRules.value?.slots?.[props.slotKey])
const cropOverlayVisible = reactive({})
const pseudoGroup = computed(() => ({
  id: `__slot__:${props.slotKey}`,
  image_ids: [],
  transformations: currentSlot.value?.transformations || [],
  cloudinary_chain: currentSlot.value?.cloudinary_chain || ''
}))
</script>

<template>
  <BaseTransformEditor
    v-if="currentSlot"
    :title="currentSlot.label"
    :transformations="currentSlot.transformations"
    :cloudinary-chain="currentSlot.cloudinary_chain"
    :group-proxy="pseudoGroup"
    :crop-overlay-visible="cropOverlayVisible"
    :on-update="() => updateSlotChain(slotKey)"
    @add="type => addSlotTransform(slotKey, type)"
    @remove="index => removeSlotTransform(slotKey, index)"
    @reorder="({ from, to }) => reorderSlotTransform(slotKey, from, to)"
  />
</template>
