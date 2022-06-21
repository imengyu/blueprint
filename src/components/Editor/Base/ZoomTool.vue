<template>
  <div class="blueprint-editor-zoom-tool">
    <a href="javascript:;" class="left iconfont icon-zoom-out" title="缩小" @click="zoomOut()"></a>
    <select v-model="zoomSelectValue" @change="zoomUpdate(zoomSelectValue / 100)">
      <option v-for="(v, i) in zoomValues" :key="i" :value="v">{{v}}%</option>
    </select>
    <span>{{Math.floor(viewPort.scale*100)}}%</span>
    <a href="javascript:;" class="right iconfont icon-zoom" title="放大" @click="zoomIn()"></a>
  </div>
</template>

<script lang="ts">
import { BluePrintEditorViewport } from '@/model/BluePrintEditorBase'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'ZoomTool',
  emits: [
    'zoom-update',
  ],
  data() {
    return {
      zoomValues: [ 30, 50, 60, 80, 100, 110, 120, 130, 150, 170, 190, 200 ],
      zoomSelectValue: 4,
    }
  },
  props: {
    viewPort: {
      type: Object as PropType<BluePrintEditorViewport>,
      default: null
    }
  },
  methods: {
    /**
     * 放大视图
     */
    zoomOut() {
      const viewScale = this.viewPort.scale;
      if(viewScale > 0.4) this.zoomUpdate(viewScale - 0.1);
      else this.zoomUpdate(0.3);
    },
    /**
     * 缩小视图
     */
    zoomIn() {
      const viewScale = this.viewPort.scale;
      if(viewScale <= 1.9) this.zoomUpdate(viewScale + 0.1);
      else this.zoomUpdate(2);
    },
    /**
     * 更新视图缩放
     */
    zoomUpdate(scale : number) {
      const viewPort = this.viewPort;

      let viewZoom = viewPort.scale;
      let viewSize = viewPort.size;
      let pos = viewPort.rect().calcCenter();
      pos.x = pos.x / viewZoom;
      pos.y = pos.y / viewZoom;

      viewPort.scale = scale;
      viewZoom = viewPort.scale;

      pos.x = pos.x * viewZoom - viewSize.x / 2;
      pos.y = pos.y * viewZoom - viewSize.y / 2;
      viewPort.position = pos;

      this.$emit('zoom-update', scale);
    },
  }
})
</script>
