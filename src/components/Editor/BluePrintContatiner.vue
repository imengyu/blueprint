<template>
  <div v-if="viewPort" 
    class="blueprint-continer editor-drag-area" 
    :style="{ transform: `scaleX(${viewPort.scale}) scaleY(${viewPort.scale}) translate(${-viewPort.position.x}px, ${-viewPort.position.y}px)` }"
    @contextmenu="onContextMenu($event)"
  >
    <slot />
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
    }
  }
})
</script>

