<template>
  <canvas ref="backgroundRenderer" class="editor-drag-area" @contextmenu="onContextMenu($event)" />
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, PropType, ref, toRefs, watch } from 'vue';
import { BluePrintEditorViewport, BluePrintBackgroundRendererOptions } from '../../model/BluePrintEditorBase'
import { FPSCalculator } from '../../model/Utils/FPSCalculator'
import { ChunkedPanel } from '@/model/Cast/ChunkedPanel';
import RandomUtils from '@/model/Utils/RandomUtils';

export default defineComponent({
  name: 'BluePrintBackgroundRenderer',
  props: {
    /**
     * 编辑器的视口
     */
    viewPort: {
      type: Object as PropType<BluePrintEditorViewport>,
      default: null,
    },
    renderEnabled: {
      type: Boolean,
      default: true,
    },
    options: {
      type: Object as PropType<BluePrintBackgroundRendererOptions>,
      default: () => new BluePrintBackgroundRendererOptions(),
    },
    drawDebugInfo: {
      type: Boolean,
      default: false,
    },
    gridVisible: {
      type: Boolean,
      default: true,
    },
    chunkedPanel: {
      type: Object as PropType<ChunkedPanel>,
      default: null,
    }
  },
  emits: [ 'contextmenu' ],
  setup(props, context) {

    //-----------------------------
    //Config



    //-----------------------------
    //Renderer

    const backgroundRenderer = ref<HTMLCanvasElement>();
    const { 
      gridVisible, options, viewPort, 
      renderEnabled,
      chunkedPanel,
      drawDebugInfo,
    } = toRefs(props);

    let ctx : CanvasRenderingContext2D|null = null;
    let renderAnimId = 0;

    function onWindowSizeChanged() {
      const canvas = backgroundRenderer.value;
      if(canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    }

    //-----------------------------
    //Renderer

    /**
     * render the grid of editor
     */
    function renderGrid() {
      if(!ctx) return;

      const _viewPort = viewPort.value;
      const startPos = _viewPort.position;
      const viewPortSize = _viewPort.size;
      const scaledGridSize = _viewPort.scale * options.value.gridSize;
      const scaledStepSize = 5;
      
      const gridColorSmall = options.value.gridColorSmall;
      const gridColorBig = options.value.gridColorBig;

      const xStartOffset = startPos.x % scaledGridSize;
      const yStartOffset = startPos.y % scaledGridSize;

      let c = Math.floor(startPos.x / scaledGridSize) % scaledStepSize;
      if(startPos.x < 0) c++;

      for(let x = -xStartOffset; x < viewPortSize.x; x += scaledGridSize, c++) {
        if(c % scaledStepSize == 0) ctx.strokeStyle = gridColorBig;
        else ctx.strokeStyle = gridColorSmall;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, viewPortSize.y);
        ctx.closePath();
        ctx.stroke();
      }

      c = Math.floor(startPos.y / scaledGridSize) % scaledStepSize;
      if(startPos.y < 0) c++;

      for(let y = -yStartOffset; y < viewPortSize.y; y += scaledGridSize, c++) {
        if(c % scaledStepSize == 0) ctx.strokeStyle = gridColorBig;
        else ctx.strokeStyle = gridColorSmall;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(viewPortSize.x, y);
        ctx.closePath();
        ctx.stroke();      
      }
    }

    //#region DebugText

    let drawTick = 0;
    let drawDebugInfoItems = new Map<number, () => string>();
    let drawFpsShow = "";

    function addDebugInfoItem(v : () => string) {
      const id = RandomUtils.genNonDuplicateNumber()
      drawDebugInfoItems.set(id, v);
      return id;
    }
    function removeDebugInfoItem(id : number) {
      drawDebugInfoItems.delete(id);
    }

    const fpsCalculator = new FPSCalculator();

    function renderDebugText() {
      if(ctx == null) return;

      //Debug text
      if(drawDebugInfo.value){
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#fff";
        
        let h = 20;
        ctx.fillText(drawFpsShow, 20, h);
        drawDebugInfoItems.forEach((k) => {
          if(ctx == null) return;
          h += 10;
          ctx.fillText(k(), 20, h);
        });
      }
    }

    //#endregion

    /**
     * Render main
     */
    function onRender() {

      if(!ctx) return;
      if(drawTick < Number.MAX_SAFE_INTEGER) drawTick++;
      else drawTick = 0;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      fpsCalculator.calculateFps();
      if(drawTick % 10 == 0) 
        drawFpsShow = "fps : " + fpsCalculator.fps.toFixed(2);
      
      if(gridVisible.value)
        renderGrid();
      if(drawDebugInfo.value) {
        chunkedPanel.value.renderDebugInfo(viewPort.value, ctx);
        renderDebugText();
      }
      renderAnimId = requestAnimationFrame(onRender);
    }

    function startRender() { onRender(); }
    function stopRender() { cancelAnimationFrame(renderAnimId); }

    //-----------------------------
    //Init and destroy

    watch(renderEnabled, () => {
      if(renderEnabled.value) startRender();
      else stopRender();
    });
    onMounted(() => {

      //Init context
      if(backgroundRenderer.value)
        ctx = backgroundRenderer.value.getContext('2d');
      if(ctx) {
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = 'Arial 14px';
        
        if(renderEnabled.value) 
          startRender();
      }
    });
    onBeforeUnmount(() => {
      if(renderEnabled.value) stopRender();
    });
    
    function onContextMenu(e : MouseEvent) {
      e.preventDefault();
      context.emit('contextmenu', e);
      return false;
    }

    return {
      onWindowSizeChanged,
      onContextMenu,
      addDebugInfoItem,
      removeDebugInfoItem,
      backgroundRenderer
    }
  }
});
</script>
