<script setup>
import BaseTransformEditor from '@/components/BaseTransformEditor.vue'
import { useGroups } from '@/composables/useGroups'

const props = defineProps({
  group: { type: Object, required: true },
  cropOverlayVisible: { type: Object, required: true }
})

const { addTransform, removeTransform, reorderTransform } = useGroups()
</script>

<template>
  <BaseTransformEditor
    title="Transformations"
    :transformations="group.transformations"
    :cloudinary-chain="group.cloudinary_chain"
    :group-proxy="group"
    :crop-overlay-visible="cropOverlayVisible"
    empty-text="Aucune transformation. Cliquez sur «Ajouter» pour commencer."
    @add="type => addTransform(group, type)"
    @remove="index => removeTransform(group, index)"
    @reorder="({ from, to }) => reorderTransform(group, from, to)"
  />
</template>
