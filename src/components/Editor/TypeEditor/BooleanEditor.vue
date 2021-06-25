<template>
  <input :value="value" @update-value="(v) => $emit('update-value', v)" type="checkbox" class="param-editor" style="display: inline-block;">
</template>

<script lang="ts">
import { CustomStorageObject } from '@/model/BluePrintEditorBase'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'BooleanEditor',
  emits: [ 'update-value', 'update-custom-data' ],
  props: {
    value: {
      type: Boolean,
      required: true
    },
    customData: Object as PropType<CustomStorageObject>,
  },
})
</script>
