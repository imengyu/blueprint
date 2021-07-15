<template>
  <div 
    class="blueprint-editor editor-drag-area" 
    ref="editorHost"
    :style="{ cursor: (isDragView ? 'grabbing' : 'default') }"
    @dragover="$event.preventDefault()" 
    @drop="onDrop($event)"
    @mousedown="onMouseDown($event)"
    @mousemove="onMouseMove($event)"
    @mousewheel="onMouseWhell($event)"
    @contextmenu="onContextmenu($event)"
  >
    <!--背景渲染层-->
    <BluePrintBackgroundRenderer 
      ref="backgroundRenderer" 
      style="z-index: 0" 
      :viewPort="viewPort"
      :drawDebugInfo="settings.drawDebugInfo"
      :gridVisible="settings.gridShow"
      :renderEnabled="renderEnabled"
      :chunkedPanel="chunkedPanel"
      @contextmenu="onCanvasContextmenu"
    />
    <!--背景容器层-->
    <BluePrintContatiner 
      :viewPort="viewPort"
      @contextmenu="onContextmenu($event)"
      style="z-index: 1">
      <FlowBlock 
        v-for="(block, key) in blockMapBackground" 
        :instance="block[1]" 
        :key="key" 
        :chunkedPanel="chunkedPanel" 
        @on-delete-port="onDeletPort"
      />
    </BluePrintContatiner>
    <!--前景渲染层-->
    <BluePrintRenderer
      ref="foregroundRenderer" 
      style="z-index: 2; background: transparent;" 
      :viewPort="viewPort" 
      :renderEnabled="renderEnabled"
      :multiSelectRect="multiSelectRect"
      :isMultiSelecting="isMulitSelect"
      :connectingInfo="connectingInfo"
      :connectors="connectors"
      :chunkedPanel="chunkedPanel"
      @contextmenu="onCanvasContextmenu"
    />
    <!--主容器层-->
    <BluePrintContatiner 
      :viewPort="viewPort"
      @contextmenu="onContextmenu($event)"
      style="z-index: 3">
      <FlowBlock 
        v-for="(block, key) in blockMap" 
        :instance="block[1]" 
        :key="key" 
        :chunkedPanel="chunkedPanel" 
        @on-delete-port="onDeletPort"
      />
    </BluePrintContatiner>
    
    <!--子模块-->
    <ZoomTool :viewPort="viewPort" />
    <BasePanels 
      ref="basePanels"
      :viewPort="viewPort" 
      :connectingInfo="connectingInfo"
      :editor="editor"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, PropType, ref, SetupContext, toRefs } from 'vue';
import { BluePrintEditorViewport } from '@/model/BluePrintEditorBase'
import { BluePrintEditorInstance, BluePrintEditorSettings, IBluePrintEditorEventSettings } from '@/model/BluePrintEditor'
import { BluePrintFlowGraph } from '@/model/Flow/BluePrintFlowDoc';
import { useEditorSizeChecker } from './Base/EditorSizeChecker';
import { useEditorDropHandler } from './Base/EditorDropHandler';
import { useEditorGraphController } from './Base/EditorGraphController';
import { useEditorConnectorController } from './Base/EditorConnectorController';
import { useEditorSelectionContoller } from './Base/EditorSelectionContoller';
import { useEditorMouseEvents } from './Base/EditorMouseEvents';
import { useEditorKeyEvents } from './Base/EditorKeyEvents';
import { useEditorContextMenuEvents } from './Base/EditorContextMenuEvents';
import { useEditorUserControl } from './Base/EditorUserControl';
import BluePrintBackgroundRenderer from './BluePrintBackgroundRenderer.vue'
import BluePrintContatiner from './BluePrintContatiner.vue'
import BluePrintRenderer from './BluePrintRenderer.vue'
import FlowBlock from '../Flow/FlowBlock.vue'
import ZoomTool from './Base/ZoomTool.vue'
import BasePanels, { IBasePanels } from './Base/BasePanels.vue'
import BlockRegisterService from '@/model/Services/BlockRegisterService';
import app from '@/main';

export default defineComponent({
  name: 'BluePrintGraphEditor',
  components: {
    BluePrintBackgroundRenderer,
    BluePrintContatiner,
    BluePrintRenderer,
    FlowBlock,
    ZoomTool,
    BasePanels,
  },
  props: {
    graph: {
      type: Object as PropType<BluePrintFlowGraph>,
      default: null
    },
    settings: {
      type: Object as PropType<BluePrintEditorSettings>,
      default: () => {
        return {
          gridShow: true,
          drawDebugInfo: false,
        } as BluePrintEditorSettings
      }
    },
  },
  emits: [ 
    'file-updated',
    'select-block-changed',
    'select-connector-changed',
  ],
  setup(props, context) {

    //TODO: 撤销工具

    const { graph } = toRefs(props);

    const viewPort = ref(new BluePrintEditorViewport());
    const editorHost = ref<HTMLElement>();
    const renderEnabled = ref(false);
    const basePanels = ref<IBasePanels>();

    const editor = {} as BluePrintEditorInstance;
    const eventInfo = {} as IBluePrintEditorEventSettings;

    const { foregroundRenderer, backgroundRenderer, onWindowSizeChanged } = useEditorSizeChecker(editorHost, viewPort); //大小和其他检查

    const { currentGraph, chunkedPanel, blockMap, blockMapBackground, connectors } = useEditorGraphController(eventInfo, editor, context as SetupContext);
    const { connectingInfo } = useEditorConnectorController(eventInfo, editor);
    const { selectBlocks, selectConnectors, isMulitSelect, isMultiSelected, multiSelectRect } = useEditorSelectionContoller(editor, context as SetupContext);
    const { onDeletPort } = useEditorUserControl(editor);

    const { isDragView, onMouseDown, onMouseWhell, onMouseMove } = useEditorMouseEvents(editor);
    const { onKeyDown, onKeyUp } = useEditorKeyEvents(editor);
    const { onDrop } = useEditorDropHandler(editor);
    const { onContextmenu, onCanvasContextmenu } = useEditorContextMenuEvents(editor);

    //#region 初始化

    onMounted(() => {
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('keydown', onKeyDown);

      setTimeout(() => {
        initRenderer();
        BlockRegisterService.updateBlocksList();

        if(graph.value != null) {
          editor.openGraph(graph.value as BluePrintFlowGraph);
          editor.lockOpenGraph();

          graph.value.loadStatus = 'loaded';
        }
        if(typeof eventInfo.onReady === 'function')
          typeof eventInfo.onReady();
        

      }, 500);
    });
    onBeforeUnmount(() => {
      editor.closeGraph();
      renderEnabled.value = false;
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('keydown', onKeyDown);
    });
    
    function initRenderer() {
      onWindowSizeChanged();
      //Add debug text
      const render = backgroundRenderer.value;
      const _viewPort = viewPort.value;
      const _mouseInfo = editor.getMouseInfo();
      if(render) {
        render.addDebugInfoItem(() => `position: ${_viewPort.position}`);
        render.addDebugInfoItem(() => `size: ${_viewPort.size} scale: ${_viewPort.scale}`);
        render.addDebugInfoItem(() => `mouseCurrentPos: ${_mouseInfo.mouseCurrentPosScreen} -> ${_mouseInfo.mouseCurrentPosViewPort}`);
        render.addDebugInfoItem(() => `mouseDownPos: ${_mouseInfo.mouseDownPosScreen} -> ${_mouseInfo.mouseDownPosViewPort}`);
        render.addDebugInfoItem(() => `selectBlockCount: ${selectBlocks.value.length} selectConnectorCount ${selectConnectors.value.length}`);
      }
      //Start renderer
      renderEnabled.value = true;
    }

    //#endregion
   
    //#region 当前全局索引编辑器信息

    editor.closeSmallTip = () => (basePanels.value as IBasePanels).closeSmallTip();
    editor.showSmallTip = (t, v) => (basePanels.value as IBasePanels).showSmallTip(t, v);
    editor.showAddBlockPanel = (a, b, c, d, e) => (basePanels.value as IBasePanels).showAddBlockPanel(a, b, c, d, e);
    editor.showChooseTypePanel = (a, b, c, d) => (basePanels.value as IBasePanels).showChooseTypePanel(a, b, c, d);
    editor.closeAddBlockPanel = () => (basePanels.value as IBasePanels).closeAddBlockPanel();
    editor.closeChooseTypePanel = () => (basePanels.value as IBasePanels).closeChooseTypePanel();
    editor.getViewPort = () => viewPort.value;
    editor.showContextMenu = app.config.globalProperties.$contextmenu;
    editor.getVueApp = () => app;
    
    function getEvents() { return eventInfo; }

    //#endregion

    return {
      editor,
      editorHost,
      foregroundRenderer,
      backgroundRenderer,
      viewPort,
      renderEnabled,
      isDragView,
      onMouseDown,
      onMouseWhell,
      onMouseMove,
      onContextmenu,
      onCanvasContextmenu,
      onDeletPort,
      onDrop,
      getCurrentGraph: () => currentGraph.value,
      getEditor: () => editor,
      getEvents,
      connectingInfo,
      multiSelectRect,
      isMulitSelect,
      isMultiSelected,
      blockMap,
      blockMapBackground,
      connectors,
      chunkedPanel,
      basePanels,
    }
  },
});
</script>
