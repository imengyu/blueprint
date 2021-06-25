<template>
  <canvas ref="renderer" class="editor-drag-area" @contextmenu="onContextMenu($event)" />
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, PropType, ref, toRefs, watch } from 'vue';
import { BluePrintEditorViewport } from '../model/BluePrintEditorBase'
import { BluePrintFlowConnector } from '../model/Flow/BluePrintFlowConnector'
import { Rect } from '../model/Base/Rect'
import { ChunkedPanel } from '@/model/Cast/ChunkedPanel';
import { IConnectingInfo } from './BluePrintEditor.vue';
import { ConnectorDrawer } from '@/model/Utils/ConnectorDrawer';

export interface IBluePrintRenderer {
  onWindowSizeChanged() : void;
}

export default defineComponent({
  name: 'BluePrintRenderer',
  props: {
    viewPort: {
      type: Object as PropType<BluePrintEditorViewport>,
      default: null,
    },
    renderEnabled: {
      type: Boolean,
      default: true,
    },
    connectors: {
      type: Object as PropType<Map<string, BluePrintFlowConnector>>,
      default: null,
    },
    connectingInfo: {
      type: Object as PropType<IConnectingInfo>,
      default: null,
    },
    isMultiSelecting: {
      type: Boolean,
      default: false,
    },
    multiSelectRect: {
      type: Rect,
      default: null,
    },
    chunkedPanel: {
      type: Object as PropType<ChunkedPanel>,
      default: null,
    }
  },
  emits: [ 'contextmenu' ],
  setup(props, context) {

    //-----------------------------
    //Renderer

    const renderer = ref<HTMLCanvasElement>();
    const { 
      connectors, viewPort, 
      renderEnabled, isMultiSelecting, multiSelectRect ,
      chunkedPanel, connectingInfo,
    } = toRefs(props);

    let ctx : CanvasRenderingContext2D|null = null;
    let renderAnimId = 0;

    function onWindowSizeChanged() {
      const canvas = renderer.value;
      if(canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    }

    //-----------------------------
    //Renderer

    /**
     * 渲染连接
     */
    function renderConnectors() {
      if(ctx == null || !connectors.value) return;

      //从区块检测器中选出当前显示在屏幕中的连接
      const instances = chunkedPanel.value.testRectCastTag(viewPort.value.rect(), 'connector');
      const _viewPort = viewPort.value;
      for (let i = 0; i < instances.length; i++) {
        const connector = connectors.value.get(instances[i].data as string);
        if(connector)
          connector.render(_viewPort, ctx);
      }
    }

    const drawerConnectingConnector = new ConnectorDrawer();

    /**
     * 渲染鼠标连接的连接线
     */
    function renderConnectingConnector() {
      if(ctx == null) return;

      const _connectingInfo = connectingInfo.value;
      const _viewPort = viewPort.value;
      if(_connectingInfo.isConnecting && _connectingInfo.startPort && !_connectingInfo.isSamePort) {
        const startPos = _connectingInfo.startPort.getPortPositionViewport();
        const endPos = _connectingInfo.endPos;
        const scale = _viewPort.scale;
        const x1 = startPos.x * scale, x2 = endPos.x * scale, 
          y1 = startPos.y * scale, y2 = endPos.y * scale;

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#d71345';
        ctx.fillStyle = ctx.strokeStyle;

        drawerConnectingConnector.drawConnectorBezierCurve(ctx, x1, y1, x2, y2, _viewPort, true, -1, false);
      }
    }

    /**
     * 绘制多选的框
     */
    function renderMultiSelBox() {
      if(!ctx) return;

      const _viewPort = viewPort.value;
      const _multiSelectRect = multiSelectRect.value;
      
      ctx.lineWidth = 3;

      if(isMultiSelecting.value) {
        ctx.fillStyle = "rgba(36, 114, 200, 0.4)";
        ctx.fillRect(_multiSelectRect.x - _viewPort.position.x, _multiSelectRect.y - _viewPort.position.y, _multiSelectRect.w, _multiSelectRect.h);
        ctx.strokeStyle = "rgba(79, 184, 254)";
        ctx.strokeRect(_multiSelectRect.x - _viewPort.position.x, _multiSelectRect.y - _viewPort.position.y, _multiSelectRect.w, _multiSelectRect.h)
      }
    }

    let drawTick = 0;

    /**
     * Render main
     */
    function onRender() {

      if(!ctx) return;
      if(drawTick < Number.MAX_SAFE_INTEGER) drawTick++;
      else drawTick = 0;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      renderConnectors();
      renderConnectingConnector();
      renderMultiSelBox();

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
      if(renderer.value)
        ctx = renderer.value.getContext('2d');
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
      renderer
    }
  }
});
</script>
