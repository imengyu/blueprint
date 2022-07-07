<template>
  <div v-if="viewPort" 
    class="blueprint-continer editor-drag-area" 
    :style="{ 
      transform: `scale(${viewPort.scale})`,
      left: `${-(viewPort.position.x)}px`,
      top: `${-(viewPort.position.y)}px`,
    }"
    @contextmenu="onContextMenu($event)"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { BluePrintEditorViewport } from '@/model/BluePrintEditorBase'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'BluePrintContatiner',
  props: {
    viewPort: {
      type: Object as PropType<BluePrintEditorViewport>,
      default: null,
    },
  },
  emits: [ 'contextmenu' ],
  methods: {
    onContextMenu(e : Event) {
      this.$emit('contextmenu', e);
    },
  }
})
</script>

