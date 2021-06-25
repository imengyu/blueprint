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
      @on-end-connect-to-new="endConnectToNew"
      @on-user-add-block="userAddBlock"
      @update-add-block-in-pos="onUpdateAddBlockInPos"
    />
  </div>
</template>

<script lang="ts">
import { ChunkedPanel, ChunkInstance } from '@/model/Cast/ChunkedPanel';
import { Rect } from '@/model/Base/Rect';
import { Vector2 } from '@/model/Base/Vector2';
import { BluePrintFlowBlock, BluePrintFlowBlockDefine } from '@/model/Flow/BluePrintFlowBlock';
import { BluePrintFlowConnector } from '@/model/Flow/BluePrintFlowConnector';
import { BluePrintFlowPort, BluePrintFlowPortDirection } from '@/model/Flow/BluePrintFlowPort';
import { BluePrintParamType, BluePrintParamTypeConverterDefine } from '@/model/Flow/BluePrintParamType';
import { defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { BluePrintEditorMouseInfo, BluePrintEditorViewport } from '../model/BluePrintEditorBase'
import { BluePrintEditorInfo, IBluePrintEditorEventSettings } from '../model/BluePrintEditor'
import { BluePrintFlowGraph } from '@/model/Flow/BluePrintFlowDoc';
import BluePrintBackgroundRenderer, { IBluePrintBackgroundRenderer } from './BluePrintBackgroundRenderer.vue'
import BluePrintContatiner from './BluePrintContatiner.vue'
import BluePrintRenderer, { IBluePrintRenderer } from './BluePrintRenderer.vue'
import BuiltinRuntimeBlocks from '../model/Blocks/Builtin/BuiltinRuntimeBlocks'
import FlowBlock from './Flow/FlowBlock.vue'
import ZoomTool from './Editor/Base/ZoomTool.vue'
import BasePanels, { IBasePanels } from './Editor/Base/BasePanels.vue'
import BlockRegisterService from '@/model/Services/BlockRegisterService';
import ParamTypeService from '@/model/Services/ParamTypeService';
import StringUtils from '@/model/Utils/StringUtils';
import HtmlUtils from '../model/Utils/HtmlUtils'
import logger from '@/model/Base/Logger';

/**
 * 连接状态信息
 */
export interface IConnectingInfo {
  isConnecting: boolean,
  isConnectingToNew: boolean,
  isFail: boolean,
  isSamePort: boolean,
  startPort: null|BluePrintFlowPort,
  currentHoverPort: null|BluePrintFlowPort,
  endPos: Vector2,
  canConnect: boolean,
  shouldAddConverter: boolean,
  nextAddConverter: null|BluePrintParamTypeConverterDefine,
  failedText: string,
  successText: string,
  otherSideRequireDirection: BluePrintFlowPortDirection,
  otherSideRequireType: null|BluePrintParamType,
}

export default defineComponent({
  name: 'BluePrintEditor',
  components: {
    BluePrintBackgroundRenderer,
    BluePrintContatiner,
    BluePrintRenderer,
    FlowBlock,
    ZoomTool,
    BasePanels,
  },
  props: {
  },
  emits: [ 'on-file-changed' ],
  setup(props, context) {

    //TODO: 撤销工具

    //#region 基础控制

    const viewPort = ref(new BluePrintEditorViewport());
    const editorHost = ref<HTMLElement>();
    const backgroundRenderer = ref<IBluePrintBackgroundRenderer>();
    const foregroundRenderer = ref<IBluePrintRenderer>();

    const renderEnabled = ref(false);

    //#endregion

    //#region 当前全局索引编辑器信息

    const basePanels = ref<IBasePanels>();
   
    const thisEditorInfo = {
      addBlock: addBlock,
      removeBlock: removeBlock,
      getSelectBlocks: () => selectBlocks.value,
      getSelectBlockCount: () => selectBlocks.value.length,
      unSelectAllBlocks: unSelectAllBlocks,
      selectAllBlocks: selectAllBlocks,
      selectBlock: selectBlock,
      selectConnector: selectConnector,
      unSelectBlock: unSelectBlock,
      unSelectConnector: unSelectConnector,
      isAnyConnectorHover: isAnyConnectorHover,
      getViewPort: () => viewPort.value,
      onMoveBlock: onMoveBlock,
      onMoveBlockEnd: onMoveBlockEnd,
      updateCurrentHoverPort: updateCurrentHoverPort,
      updateConnectEnd: updateConnectEnd,
      startConnect: startConnect,
      endConnect: endConnect,
      unConnectConnector: unConnectConnector,
      connectConnector: connectConnector,
      getCanConnect: getCanConnect,
      endConnectToNew: endConnectToNew,
      unSelectAllConnectors: unSelectAllConnectors,
      selectAllConnectors: selectAllConnectors,
      userAddBlock: userAddBlock,
      userDeleteBlock: userDeleteBlock,
      closeSmallTip: () => (basePanels.value as IBasePanels).closeSmallTip(),
      showSmallTip: (t, v) => (basePanels.value as IBasePanels).showSmallTip(t, v),
      markUpFileChanged: markUpFileChanged,
      showAddBlockPanel: (a, b, c, d, e) => (basePanels.value as IBasePanels).showAddBlockPanel(a, b, c, d, e),
      showChooseTypePanel: (a, b, c, d) => (basePanels.value as IBasePanels).showChooseTypePanel(a, b, c, d),
      closeAddBlockPanel: () => (basePanels.value as IBasePanels).closeAddBlockPanel(),
      closeChooseTypePanel: () => (basePanels.value as IBasePanels).closeChooseTypePanel(),
      deleteSelectedConnectors: deleteSelectedConnectors,
      deleteSelectedBlocks: deleteSelectedBlocks,

    } as BluePrintEditorInfo;
    let eventInfo = {} as IBluePrintEditorEventSettings;

    /**
     * 获取编辑器事件
     */
    function getEvents() { return eventInfo; }
    /**
     * 设置编辑器事件
     */
    function setEvents(evts : IBluePrintEditorEventSettings) { eventInfo = evts; }

    //#endregion

    //#region 流图加载、单元、连接管理

    const chunkedPanel = ref(new ChunkedPanel());
    const blockMap = ref(new Map<string, BluePrintFlowBlock>());
    const blockMapBackground = ref(new Map<string, BluePrintFlowBlock>());
    const connectors = ref(new Map<string, BluePrintFlowConnector>());

    /**
     * 添加单元至当前编辑器中
     */
    function addBlock(block : BluePrintFlowBlock) {
      block.editorInfo = thisEditorInfo;
      block.isAddToEditor = true;
      block.chunkInfo = new ChunkInstance(block.getRealRect(), "block", block.uid);
      block.updateLastPos();
      if(block.define.style.layer === 'normal')
        blockMap.value.set(block.uid, block);
      else 
        blockMapBackground.value.set(block.uid, block);
      chunkedPanel.value.addInstance(block.chunkInfo);

      if(typeof block.define.events.onAddToEditor === 'function')
        block.define.events.onAddToEditor(block);
      
      setTimeout(() => {
        block.updateRegion();
      }, 300);
    }
    /**
     * 从当前编辑器中移除单元
     */
    function removeBlock(block : BluePrintFlowBlock) {
      block.editorInfo = null;
      block.isAddToEditor = false;
      if(block.define.style.layer === 'normal')
        blockMap.value.delete(block.uid);
      else 
        blockMapBackground.value.delete(block.uid);

      //断开当前单元连接
      if(block.connectors.length > 0) {
        block.connectors.forEach((c) => {
          unConnectConnector(c);
        });
      }
      if(block.chunkInfo) {
        chunkedPanel.value.removeInstance(block.chunkInfo);
        block.chunkInfo = null;
      }

      if(typeof block.define.events.onRemoveFormEditor === 'function')
        block.define.events.onRemoveFormEditor(block);
    } 
    function addConnector(connector: BluePrintFlowConnector) {
      connectors.value.set(connector.uid, connector);
      connector.startPort?.parent.connectors.addOnce(connector);
      connector.endPort?.parent.connectors.addOnce(connector);

      //更新
      setTimeout(() => {
        if(connector != null) {
          connector.chunkInfo = new ChunkInstance(connector.updateRegion(), "connector", connector.uid);
          chunkedPanel.value.addInstance(connector.chunkInfo);
        }
      }, 200);
    }
    function removeConnector(connector: BluePrintFlowConnector) {
      if(connector.chunkInfo) {
        chunkedPanel.value.removeInstance(connector.chunkInfo);
        connector.chunkInfo = null;
      } 
      const start = connector.startPort, end = connector.endPort;
      if(start != null) 
        start.parent.connectors.remove(connector);
      if(end != null) 
        end.parent.connectors.remove(connector);
      connectors.value.delete(connector.uid);
    }
    /**
     * 连接单元
     * @param start 开始端口
     * @param end 结束端口
     */
    function connectConnector(startPort : BluePrintFlowPort, endPort : BluePrintFlowPort) {

      const invokeOnPortConnect = (startPort : BluePrintFlowPort, endPort : BluePrintFlowPort) => {
        if(eventInfo.onPortConnect)
          eventInfo.onPortConnect(startPort, endPort);
      };

      //新建链接
      let connector : BluePrintFlowConnector|null = null;

      //根据方向链接节点
      if(startPort.direction == 'output') {

        //如果已经链接上了，取消链接
        let connData = endPort.isConnectByPort(startPort);
        if(connData != null) {
          unConnectConnector(connData);   
          connectingInfo.isConnecting = false;
          return null;
        }

        connector = new BluePrintFlowConnector();

        //如果是行为端口，只能输出一条线路。取消连接之前的线路
        if(startPort.define.type.isExecute() && startPort.connectedToPort.length >= 0)
          startPort.connectedToPort.forEach((d) => unConnectConnector(d));
        //如果是参数端口，只能输入一条线路。取消连接之前的线路
        if(!startPort.define.type.isExecute() && endPort.connectedFromPort.length >= 0) 
          endPort.connectedFromPort.forEach((d) => unConnectConnector(d));

        startPort.connectedToPort.push(connector);
        startPort.state = 'normal';
        endPort.connectedFromPort.push(connector);
        endPort.state = 'normal';

        invokeOnPortConnect(startPort, endPort);

        connector.startPort = startPort;
        connector.endPort = endPort;
      }
      else if(endPort.direction == 'output') {

        //如果已经链接上了，取消链接
        let connData = startPort.isConnectByPort(endPort);
        if(connData != null) {
          unConnectConnector(connData);
          connectingInfo.isConnecting = false;
          return null;
        }

        connector = new BluePrintFlowConnector();

        //如果是行为端口，只能输出一条线路。
        if(endPort.define.type.isExecute() && endPort.connectedToPort.length > 0) 
          endPort.connectedToPort.forEach((d) => unConnectConnector(d));
        //如果是参数端口，只能输入一条线路。
        if(!startPort.define.type.isExecute() && startPort.connectedFromPort.length > 0) 
          startPort.connectedFromPort.forEach((d) => unConnectConnector(d));

        endPort.connectedToPort.push(connector);
        endPort.state = 'normal';
        startPort.connectedFromPort.push(connector);
        startPort.state = 'normal';
        
        invokeOnPortConnect(endPort, startPort);

        connector.startPort = endPort;
        connector.endPort = startPort;
      }

      //添加线段
      if(connector != null) 
        addConnector(connector);
      return connector;
    }
    /**
     * 取消连接单元
     * @param conn 对应连接 
     */
    function unConnectConnector(connector : BluePrintFlowConnector) {

      const start = connector.startPort, end = connector.endPort;
      if(start != null && end != null) {
        start.removeConnectToPort(end);
        end.removeConnectByPort(start);

        if(eventInfo.onPortUnConnect)
          eventInfo.onPortUnConnect(start, end);
      }
      removeConnector(connector);
    }

    //#region 用户操作

    let userAddBlockInPos = new Vector2();
    let userAddBlockWithPosition = false;
    
    /**
     * 用户删除单元
     */
    function userDeleteBlock(block : BluePrintFlowBlock) {
      if(block.define.canNotDelete) 
        return false;
      //自定义检查回调
      if(typeof block.define.events.onDeleteCheck == 'function') {
        let err = block.define.events.onDeleteCheck(block, currentGraph.value || null);
        if(err != null) {
          thisEditorInfo.showSmallTip('<i class="iconfont icon-error-1 text-warning mr-2"></i>' + err);
          return false;
        }
      }

      block.graph = null;
      removeBlock(block);
      return true;
    }
    /**
     * 用户添加单元处理
     */
    function userAddBlock(blockDefine : BluePrintFlowBlockDefine) {
      
      if(!currentGraph.value) {
        thisEditorInfo.showSmallTip('<i class="iconfont icon-info-1 text-info mr-2"></i>未打开图表，请先打开一个图表');
        return false;
      }
      //检查单元是否只能有一个
      if(blockDefine.hideInAddPanel && currentGraph.value.getBlocksByGUID(blockDefine.guid).length > 0) {      
        thisEditorInfo.showSmallTip('<i class="iconfont icon-info-1 text-info mr-2"></i> 当前文档中已经有 ' + blockDefine.name + ' 了，此单元只能有一个');
        return false;
      }

      //自定义检查回调
      if(typeof blockDefine.events.onAddCheck == 'function') {
        let err = blockDefine.events.onAddCheck(blockDefine, currentGraph.value);
        if(err != null) {
          thisEditorInfo.showSmallTip('<i class="iconfont icon-error-1 text-warning mr-2"></i>' + err);
          return false;
        }
      }

      let newBlock = new BluePrintFlowBlock(blockDefine);
      newBlock.graph = currentGraph.value;
      newBlock.load({});

      if(userAddBlockWithPosition) { //在指定位置添加单元
        newBlock.position.set(userAddBlockInPos);
        addBlock(newBlock)
      } 
      else if(connectingInfo.isConnectingToNew) { //添加单元并连接
         
        newBlock.position.set(connectingInfo.endPos);
        addBlock(newBlock);

        setTimeout(() => {
          const port = endConnectToNew(newBlock);
          if(!port || !port.getPortPositionRelative)
            return;
          const pos = port.getPortPositionRelative();
          pos.x = connectingInfo.endPos.x - pos.x;
          pos.y = connectingInfo.endPos.y - pos.y;

          newBlock.position.set(pos);
          newBlock.updateRegion();
        }, 200);
      } 
      else { //在屏幕中央位置添加单元
        const center = viewPort.value.rect().calcCenter();
        newBlock.position.set(center);
        addBlock(newBlock);
      }
      return true;
    }

    //删除选中的单元
    function deleteSelectedBlocks() {
      selectBlocks.value.forEach((block) => {
        if(block.define.canNotDelete) 
          return;
        //自定义检查回调
        if(typeof block.define.events.onDeleteCheck == 'function') {
          let err = block.define.events.onDeleteCheck(block as BluePrintFlowBlock, currentGraph.value || null);
          if(err != null) {
            logger.warning('Editor', `无法删除单元 ${block.define.name} ( ${block.uid}) : ${err}`);
            return;
          }
        }
        block.graph = null;
        removeBlock(block as BluePrintFlowBlock);
      });
      selectBlocks.value.empty();
    }
    //删除选中的连接
    function deleteSelectedConnectors() {
      selectConnectors.value.forEach((c) => unConnectConnector(c as BluePrintFlowConnector));
      selectConnectors.value.empty();
    }

    //用户删除端口
    function onDeletPort(port : BluePrintFlowPort) {
      if(port.dyamicAdd) {
        const parent = port.parent;
        parent.deletePort(port.guid);

        for (let i = parent.connectors.length - 1; i >= 0; i--) {
          const connector = parent.connectors[i];
          if(connector.startPort == port || connector.endPort == port)
            unConnectConnector(connector);
        }
      }
    }

    //#endregion

    //#region 流图加载

    const currentGraph = ref<BluePrintFlowGraph>();

    function openGraph(graph: BluePrintFlowGraph) {
      
      if(currentGraph.value) {
        if(currentGraph.value == graph) return;
        else closeGraph();
      }

      currentGraph.value = graph;

      //加载数据至编辑器中
      const _currentGraph = currentGraph.value;
      _currentGraph.blocks.forEach((v) => (v));
      _currentGraph.connectors.forEach((v) => addConnector(v));
      _currentGraph.loadStatus = 'loaded';
      //设置视口
      viewPort.value.set(_currentGraph.viewPort);
    }
    function closeGraph() {
      const _currentGraph = currentGraph.value;
      if(_currentGraph) {

        //重新将当前编辑器中的单元和连接保存回去
        _currentGraph.blocks.clear();
        _currentGraph.connectors.empty();

        blockMap.value.forEach((v) =>  {
          _currentGraph.blocks.set(v.uid, v);
          v.connectors.empty();
        });
        blockMapBackground.value.forEach((v) => {
          _currentGraph.blocks.set(v.uid, v);
          v.connectors.empty();
        });
        connectors.value.forEach((v) => _currentGraph.connectors.push(v));
        _currentGraph.loadStatus = 'notload';
        
        //设置视口
        _currentGraph.viewPort.set(viewPort.value);
        
        currentGraph.value = undefined;
      }

      //清空
      blockMap.value.clear();
      blockMapBackground.value.clear();
      connectors.value.clear();
    }
    function markUpFileChanged() {
      if(currentGraph.value)
        currentGraph.value.fileChanged = true;
      context.emit('on-file-changed');
    }

    //#endregion

    //#region 单元选择管理

    const selectBlocks = ref(new Array<BluePrintFlowBlock>());
    const selectConnectors = ref(new Array<BluePrintFlowConnector>());

    /**
     * 取消选中所有连接线
     */
    function unSelectAllConnectors() {
      selectConnectors.value.forEach((b) => {
        b.selected = false;
        b.hover = false;
      });
      selectConnectors.value.empty();
    }
    /**
     * 选中所有连接线
     */
    function selectAllConnectors() {
      selectConnectors.value.forEach((b) => {
        b.selected = false;
        b.hover = false;
      });
      selectConnectors.value.empty();
    }
    /**
     * 取消选中所有单元
     */
    function unSelectAllBlocks() {
      selectBlocks.value.forEach((b) => {
        b.selected = false;
        b.hover = false;
      });
      selectBlocks.value.empty();
    }
    /**
     * 选中当前编辑器中所有单元
     */
    function selectAllBlocks() {
      const _selectBlocks = selectBlocks.value;
      _selectBlocks.empty();
      blockMap.value.forEach((b) => {
        _selectBlocks.push(b);
        b.selected = true;
      });
    }
    /**
     * 取消选中某个单元
     */
    function unSelectBlock(block : BluePrintFlowBlock) {
      selectBlocks.value.remove(block);
      block.selected = false;
    }
    /**
     * 选中某个单元
     * @param append 是否是追加选择，否则将会清空之前的选择
     */
    function selectBlock(block : BluePrintFlowBlock, append = false) {
      if(append) 
        selectBlocks.value.addOnce(block);
      else {
        unSelectAllBlocks();
        unSelectAllConnectors();
        selectBlocks.value.push(block);
      }
      block.selected = true;
    }
    /**
     * 取消选中某个连接线
     */
    function unSelectConnector(connector : BluePrintFlowConnector) {
      selectConnectors.value.remove(connector);
      connector.selected = false;
    }
    /**
     * 选中某个连接线
     * @param append 是否是追加选择，否则将会清空之前的选择
     */
    function selectConnector(connector : BluePrintFlowConnector, append = false) {
      if(append) 
        selectConnectors.value.addOnce(connector);
      else {
        unSelectAllBlocks();
        unSelectAllConnectors();
        selectConnectors.value.push(connector);
      }
      connector.selected = true;
    }
    /**
     * 获取当前鼠标是否悬浮在某个连接线上
     */
    function isAnyConnectorHover() {
      return lastHoverConnector.length > 0;
    }

    const lastHoverConnector = new Array<BluePrintFlowConnector>();

    function connectorCast() {
      const _mousePos = mouseInfo.value.mouseCurrentPosViewPort;
      const _viewScale = viewPort.value.scale;

      lastHoverConnector.forEach((i) => i.hoverChecked = false);
      chunkedPanel.value.testPointCastTag(_mousePos, "connector").forEach((i) => {
        const connector = connectors.value.get(i.data as string);
        if(connector && connector.testInConnector(_mousePos, _viewScale)) {
          connector.hoverChecked = true;
          connector.hover = true;
          lastHoverConnector.addOnce(connector);
        }
      });
      for (let i = lastHoverConnector.length - 1; i >= 0; i--) {
        const connector = lastHoverConnector[i];
        if(!connector.hoverChecked) {
          connector.hover = false;
          lastHoverConnector.remove(i);
        }
      }
    }

    function selectOneConnector() {
      const _mousePos = mouseInfo.value.mouseCurrentPosViewPort;
      const _viewScale = viewPort.value.scale;
      const pointCastConnectors = chunkedPanel.value.testPointCastTag(_mousePos, "connector")
      if(pointCastConnectors.length > 0) {
        for (let i = 0; i < pointCastConnectors.length; i++) {
          const connector = connectors.value.get(pointCastConnectors[i].data as string);
          if(connector && connector.testInConnector(_mousePos, _viewScale)) {
            connector.hoverChecked = true;
            connector.hover = true;
            selectConnector(connector, false);
            return true;
          }
        }
      }
      return false;
    }

    //#endregion

    //#region 单元控制管理

    //用户结束移动单元
    function onMoveBlockEnd(block : BluePrintFlowBlock) {
      const _selectBlocks = selectBlocks.value;
      const _chunkedPanel = chunkedPanel.value;
      if(_selectBlocks.length > 0) {
        _selectBlocks.forEach(element => {
          element.updateLastPos();
          element.updateRegion();
          //更新单元对应连接的区块信息
          element.connectors.forEach((c) => {
            if(c.chunkInfo) {
              c.chunkInfo.rect.set(c.updateRegion());
              _chunkedPanel.updateInstance(c.chunkInfo as ChunkInstance);
            }
          });
        });
      }
      block.updateRegion();
    }
    //在移动单元时同时移动选中的其他单元
    function onMoveBlock(block : BluePrintFlowBlock, moveOffest : Vector2) {
      const _selectBlocks = selectBlocks.value;
      if(_selectBlocks.length > 0) {
        _selectBlocks.forEach(element => {
          if(element!=block) {
            element.position = new Vector2(
              element.lastBlockPos.x + moveOffest.x,
              element.lastBlockPos.y + moveOffest.y
            );
          }
          //更新单元对应连接的位置信息
          element.connectors.forEach((c) => c.updateRegion());
        });
      }
    }

    //#endregion

    //#region 单元连接管理

    const connectingInfo = reactive({
      isConnecting: false,
      isConnectingToNew: false,
      isFail: false,
      isSamePort: false,
      startPort: null as null|BluePrintFlowPort,
      currentHoverPort: null as null|BluePrintFlowPort,
      endPos: new Vector2(),
      canConnect: false,
      shouldAddConverter: false,
      nextAddConverter: null as null|BluePrintParamTypeConverterDefine,
      failedText: '',
      successText: '',
      otherSideRequireDirection: 'input' as BluePrintFlowPortDirection,
      otherSideRequireType: null as null|BluePrintParamType,
    } as IConnectingInfo);

    //更新当前鼠标激活的端口
    function updateCurrentHoverPort(port : BluePrintFlowPort, active : boolean) {
      if(active) {
        connectingInfo.currentHoverPort = port;
        connectingInfo.shouldAddConverter = false;
        connectingInfo.nextAddConverter = null;
        connectingInfo.successText = '';

        if(connectingInfo.startPort == null){
          connectingInfo.isFail = false;
          return;
        }

        connectingInfo.isSamePort = connectingInfo.startPort == port;

        //类型检查
        if(connectingInfo.currentHoverPort.parent == connectingInfo.startPort.parent){
          connectingInfo.canConnect = false;
          connectingInfo.failedText = '不能连接同一个单元的节点';
        }
        else{
          //方向必须不同才能链接
          connectingInfo.canConnect = connectingInfo.currentHoverPort.direction != connectingInfo.startPort.direction;
          if(!connectingInfo.canConnect) 
            connectingInfo.failedText ='不能连接相同方向的节点';

          //参数类型检查
          if(connectingInfo.canConnect) {

            if(connectingInfo.currentHoverPort.direction == 'input') {
              connectingInfo.canConnect = connectingInfo.currentHoverPort.checkTypeAllow(connectingInfo.startPort as BluePrintFlowPort); 

              if(connectingInfo.currentHoverPort.connectedFromPort.length > 0) 
                connectingInfo.successText = '将会替换已有连接';
            }
            else if(connectingInfo.startPort.direction == 'input') {
              connectingInfo.canConnect = connectingInfo.startPort.checkTypeAllow(connectingInfo.currentHoverPort as BluePrintFlowPort);

              if(connectingInfo.startPort.connectedFromPort.length > 0) 
                connectingInfo.successText = '将会替换已有连接';
            }

            //如果不能连接
            if(!connectingInfo.canConnect) {
              const startPot = connectingInfo.startPort.direction === 'output' ? connectingInfo.startPort : connectingInfo.currentHoverPort;
              const endPot = connectingInfo.currentHoverPort.direction === 'input' ? connectingInfo.currentHoverPort : connectingInfo.startPort;
              const startType = startPot.define.type;
              const endType = endPot.define.type;

              //检查类型有没有转换器
              const converter = ParamTypeService.getTypeCoverter(startType, endType);
              if(converter) {
                //有转换器
                if(connectingInfo.startPort.define.type.setType != connectingInfo.startPort.define.type.setType) 
                  connectingInfo.failedText = '端口集合类型不同，不能转换';
                else if(converter.allowSetType !== connectingInfo.startPort.define.type.setType)
                  connectingInfo.failedText = '转换器不支持端口集合类型';
                else {
                  //设置转换器，在连接的时候会进行添加
                  connectingInfo.shouldAddConverter = true;
                  connectingInfo.nextAddConverter = converter;
                  connectingInfo.canConnect = true;
                  connectingInfo.successText = `转换 ${startType.getNameString()} 至 ${endType.getNameString()}`;
                }
              } else  {
                //没有转换器，不兼容连接
                connectingInfo.failedText = `${startType.getNameString()} 与 ${endType.getNameString()} 不兼容`;
              }
            }
            else {
              //调用单元自己的检查函数检查是否可用连接
              //eslint-disable-next-line
              let err : string|null = null;
              if(connectingInfo.currentHoverPort.direction == 'input') {
                if(typeof connectingInfo.currentHoverPort.parent.define.events.onPortConnectCheck === 'function') {
                  err = connectingInfo.currentHoverPort.parent.define.events.onPortConnectCheck(
                    connectingInfo.currentHoverPort.parent as BluePrintFlowBlock, 
                    connectingInfo.currentHoverPort as BluePrintFlowPort, 
                    connectingInfo.startPort as BluePrintFlowPort
                  ); 
                  connectingInfo.canConnect = !StringUtils.isNullOrEmpty(err);
                }
              }else if(connectingInfo.startPort.direction == 'input') {
                if(typeof connectingInfo.startPort.parent.define.events.onPortConnectCheck === 'function') {
                  err = connectingInfo.startPort.parent.define.events.onPortConnectCheck(
                    connectingInfo.startPort.parent as BluePrintFlowBlock, 
                    connectingInfo.startPort as BluePrintFlowPort, 
                    connectingInfo.currentHoverPort as BluePrintFlowPort
                  ); 
                  connectingInfo.canConnect = !StringUtils.isNullOrEmpty(err);
                }
              }
              //如果不能连接，则显示错误
              if(!connectingInfo.canConnect && err) 
                connectingInfo.failedText = err;
            }
          }
        }

        //更新点的状态
        if(connectingInfo.canConnect) {
          connectingInfo.currentHoverPort.state = 'success';
          connectingInfo.isFail = false;
        }else {
          connectingInfo.currentHoverPort.state = 'error';
          connectingInfo.isFail = true;
        }
      }
      else {
        if(connectingInfo.currentHoverPort) {
          connectingInfo.currentHoverPort.state = 'normal';
          connectingInfo.currentHoverPort = null;
        }
        connectingInfo.isSamePort = false;
        connectingInfo.isFail = false;
      }
    }
    function updateConnectEnd(pos : Vector2) {
      if(!connectingInfo.isConnectingToNew) {
        const _viewPort = viewPort.value;
        _viewPort.screenPointToViewportPoint(pos, connectingInfo.endPos);
      }
    }
    //使用转换器连接两个端口
    function connectConnectorWithConverter() {
      //TODO: 使用转换器连接两个端口
      /*
      //创建转换器
      let convBlock = new BlockEditor(BaseBlocks.getScriptBaseConvertBlock());
      
      convBlock.options['coverterFrom'] = this.connectingNextAddConverter.fromType.toString();
      convBlock.options['coverterTo'] = this.connectingNextAddConverter.toType.toString();

      this.addBlock(
        convBlock, 
        MathUtils.calcVectorCenter(connectingInfo.startPort.editorData.getPosition(), connectingInfo.currentHoverPort.editorData.getPosition()) //计算两个端点的中心位置
      );

      //将两个端口连接至转换器上

      let startPot = connectingInfo.startPort.direction === 'output' ? connectingInfo.startPort : connectingInfo.currentHoverPort;
      let endPot = connectingInfo.currentHoverPort.direction === 'input' ? connectingInfo.currentHoverPort : connectingInfo.startPort;

      this.connectConnector(startPot, convBlock.getPortByGUID('INPUT'));
      this.connectConnector(convBlock.getPortByGUID('OUTPUT'), endPot);
      */
    }
    function startConnect(port : BluePrintFlowPort) {
      connectingInfo.startPort = port;
      connectingInfo.isConnecting = true;
      port.state = 'normal';
    }
    function endConnect(port ?: BluePrintFlowPort) {
      if(port)
        port.state = 'normal';

      //连接到新的节点
      if(connectingInfo.currentHoverPort == null && connectingInfo.startPort != null) {

        const panelPos = new Vector2();
        viewPort.value.viewportPointToScreenPoint(connectingInfo.endPos, panelPos);
        thisEditorInfo.showAddBlockPanel(
          panelPos, 
          connectingInfo.otherSideRequireType, 
          connectingInfo.otherSideRequireDirection);
        
        connectingInfo.isConnectingToNew = true;
        return;
      }
      
      //检查
      if(connectingInfo.canConnect && connectingInfo.currentHoverPort != null && connectingInfo.startPort != null) {

        //连接是否需要添加一个转换器
        if(connectingInfo.shouldAddConverter)
          connectConnectorWithConverter();
        else if(connectingInfo.startPort) {
          connectConnector(connectingInfo.startPort as BluePrintFlowPort, connectingInfo.currentHoverPort as BluePrintFlowPort);
          connectingInfo.startPort = null;
        }
      }

      connectingInfo.isConnecting = false;
      
      if(connectingInfo.startPort != null) {
        connectingInfo.startPort.state = 'normal';
        connectingInfo.startPort = null;
      }

    }
    //获取用户当前是否可以连接
    function getCanConnect() { 
      return connectingInfo.canConnect; 
    }
    //结束连接（连接至新的单元）
    function endConnectToNew(block?: BluePrintFlowBlock) : BluePrintFlowPort|null {
      let port : BluePrintFlowPort|null = null;
      if(typeof block != 'undefined' && connectingInfo.otherSideRequireType) {
        port = block.getPortByTypeAndDirection(connectingInfo.otherSideRequireType, connectingInfo.otherSideRequireDirection, true);
        if(port != null)
          connectConnector(connectingInfo.startPort as BluePrintFlowPort, port);
      }

      connectingInfo.isConnectingToNew = false;
      connectingInfo.isConnecting = false;
      
      if(connectingInfo.startPort != null) {
        connectingInfo.startPort.state = 'normal';
        connectingInfo.startPort = null;
      }
      return port;
    }

    //#endregion

    //#endregion

    //#region 大小和其他检查

    let lastViewSize = new Vector2();
    let tickCheckTimer = 0;

    function onWindowSizeChanged() {
      if(backgroundRenderer.value)
        backgroundRenderer.value.onWindowSizeChanged();
      if(foregroundRenderer.value)
        foregroundRenderer.value.onWindowSizeChanged();
      if(editorHost.value) {
        const ele = editorHost.value;
        viewPort.value.size.set(ele.offsetWidth, ele.offsetHeight);
      }
    }

    //每个tick运行的检查函数
    function onEditorCheckTick() {
      const ele = editorHost.value;
      if(ele) {
        const x = ele.offsetWidth, y = ele.offsetHeight;
        if(x != lastViewSize.x || y != lastViewSize.y) {
          lastViewSize.set(x, y);
          onWindowSizeChanged();
        }
        //更新绝对坐标
        updateEditorAbsolutePos();
      }
    }
    function updateEditorAbsolutePos() {
      const ele = editorHost.value;
      if(ele) {
        //更新绝对坐标
        viewPort.value.editorAbsolutePos.set(HtmlUtils.getLeft(ele), HtmlUtils.getLeft(ele));
      }
      return viewPort.value.editorAbsolutePos;
    }

    //#endregion

    //#region 编辑器键盘事件

    let keyControlDown = false;
    let keyAltDown = false;

    function onKeyDown(e : KeyboardEvent) {
      if(HtmlUtils.isEventInControl(e))
        return;
      switch(e.code) {
        case 'ControlRight':
        case 'ControlLeft':
          keyControlDown = true;
          break;
        case 'AltRight':
        case 'AltLeft':
          keyAltDown = true;
          break;
      }
    }
    function onKeyUp(e : KeyboardEvent) {
      if(HtmlUtils.isEventInControl(e))
        return;
      switch(e.code) {
        case 'ControlRight':
        case 'ControlLeft':
          keyControlDown = false;
          break;
        case 'AltRight':
        case 'AltLeft':
          keyAltDown = false;
          break;
        case 'KeyA':
          if(keyAltDown) selectAllConnectors();
          else if(keyControlDown) selectAllBlocks();
          break;
        case 'Delete': 
          if(keyAltDown) deleteSelectedConnectors();
          else deleteSelectedBlocks();
          break;
      }
    }

    //#endregion

    //#region 鼠标事件

    const mouseInfo = ref(new BluePrintEditorMouseInfo());
    const isDragView = ref(false);
    const isMulitSelect = ref(false);
    const isMultiSelected = ref(false);
    const multiSelectRect = ref(new Rect());

    let mouseDownViewPortPos = new Vector2();

    function onDocunmentMouseUp(e : MouseEvent) {
      const _mouseInfo = mouseInfo.value;

      document.removeEventListener('mousemove', onDocunmentMouseMove);
      document.removeEventListener('mouseup', onDocunmentMouseUp);

      updateMousePos(e);

      //鼠标放开，刷新相应状态
      if(_mouseInfo.mouseDowned){ 
        if(!_mouseInfo.mouseMoved) {

          unSelectAllBlocks();
          unSelectAllConnectors();

          if(selectOneConnector()) {// 选中了一个连接线
            if(keyAltDown && selectConnectors.value.length > 0) { //Alt按下，删除连接线
              unConnectConnector(selectConnectors.value[0] as BluePrintFlowConnector);
            } // else this.$emit('update-select-state');
          } else {
            //显示添加单元弹出菜单
            if(e.button == 2) {
              thisEditorInfo.showAddBlockPanel(
                new Vector2(e.x, e.y), 
                null,
                null,
                new Vector2(e.x, e.y));
            }
          }
        }
      }

      _mouseInfo.mouseDowned = false;
      _mouseInfo.mouseMoved = false;

      isDragView.value = false;
      isMulitSelect.value = false;
      multiSelectRect.value.set(0, 0, 0, 0);
    }
    function onDocunmentMouseMove(e : MouseEvent) {
      const _mouseInfo = mouseInfo.value;

      updateMousePos(e);
      
      if(!_mouseInfo.mouseMoved && !mouseInfo.value.mouseCurrentPosScreen.equal(mouseInfo.value.mouseDownPosScreen))
        _mouseInfo.mouseMoved = true;

      //如果按下并且移动
      if(_mouseInfo.mouseMoved && _mouseInfo.mouseDowned) { 

        if(isDragView.value) {
          //移动视图
          viewPort.value.position.set(
            mouseDownViewPortPos.x - (_mouseInfo.mouseCurrentPosScreen.x - _mouseInfo.mouseDownPosScreen.x),
            mouseDownViewPortPos.y - (_mouseInfo.mouseCurrentPosScreen.y - _mouseInfo.mouseDownPosScreen.y)
          );
        } else if(isMulitSelect.value) {
          //多选框
          doSelectBlocks();
        }
      }
    }
    function onMouseDown(e : MouseEvent) {

      if(HtmlUtils.isEventInControl(e)) return;
      if(!editorHost.value) return;
      
      const _mouseInfo = mouseInfo.value;
      const editorAbsolutePos = updateEditorAbsolutePos();//强制更新绝对坐标

      //坐标更新
      _mouseInfo.mouseMoved = false;
      _mouseInfo.mouseDownPosScreen.set(e.x - editorAbsolutePos.x, e.y - editorAbsolutePos.y);
      viewPort.value.screenPointToViewportPoint(_mouseInfo.mouseDownPosScreen, _mouseInfo.mouseDownPosViewPort);
      updateMousePos(e);
      mouseDownViewPortPos.set(viewPort.value.position);

      if(!(e.target as HTMLElement).className.contains('editor-drag-area')) return;

      _mouseInfo.mouseDowned = true;

      //按下后结束连接
      if(connectingInfo.isConnectingToNew) {
        endConnectToNew();
        thisEditorInfo.closeAddBlockPanel();
      }

      //左键
      if(e.buttons == 1) {
        isMulitSelect.value = true;
      }
      //右键
      else if(e.buttons == 2) {
        //移动视图
        isDragView.value = true;
      }
      
      document.addEventListener('mouseup', onDocunmentMouseUp);
      document.addEventListener('mousemove', onDocunmentMouseMove);
    }
    function onMouseMove(e : MouseEvent) {
      if(!mouseInfo.value.mouseDowned) {
        updateMousePos(e);
        connectorCast();
      }
    }
    function onMouseWhell(e : WheelEvent) {  
      updateMousePos(e);

      //TODO: 缩放功能
    }

    //多选选择
    function doSelectBlocks() {
      const _multiSelectRect = multiSelectRect.value;
      const _selectBlocks = selectBlocks.value;
      const _mouseInfo = mouseInfo.value;

      //多选框的方向处理
      {
        if(_mouseInfo.mouseCurrentPosViewPort.x > _mouseInfo.mouseDownPosViewPort.x) {
          _multiSelectRect.x = _mouseInfo.mouseDownPosViewPort.x;
          _multiSelectRect.w = _mouseInfo.mouseCurrentPosViewPort.x - _mouseInfo.mouseDownPosViewPort.x;
        }else {
          _multiSelectRect.x = _mouseInfo.mouseCurrentPosViewPort.x;
          _multiSelectRect.w = _mouseInfo.mouseDownPosViewPort.x - _mouseInfo.mouseCurrentPosViewPort.x;
        }
        if(_mouseInfo.mouseCurrentPosViewPort.y > _mouseInfo.mouseDownPosViewPort.y) {
          _multiSelectRect.y = _mouseInfo.mouseDownPosViewPort.y;
          _multiSelectRect.h = _mouseInfo.mouseCurrentPosViewPort.y - _mouseInfo.mouseDownPosViewPort.y;
        }else {
          _multiSelectRect.y = _mouseInfo.mouseCurrentPosViewPort.y;
          _multiSelectRect.h = _mouseInfo.mouseDownPosViewPort.y - _mouseInfo.mouseCurrentPosViewPort.y;
        }
      }
      //多选单元和连接
      if(_multiSelectRect.w > 0 && _multiSelectRect.h > 0) {

        //选择单元
        const castBlocks = chunkedPanel.value.testRectCastTag(_multiSelectRect as Rect, "block");
        const thisTimeSelectedBlock = new Array<BluePrintFlowBlock>();
        castBlocks.forEach((i) => {
          const block = blockMap.value.get(i.data as string);
          if(block) thisTimeSelectedBlock.addOnce(block);
        });
        for (var i = _selectBlocks.length - 1; i >= 0; i--) {
          const b = _selectBlocks[i] as BluePrintFlowBlock;
          if(!thisTimeSelectedBlock.contains(b)) {
            b.selected = false;
            _selectBlocks.remove(b);
          } else 
            thisTimeSelectedBlock.remove(b);
        }
        thisTimeSelectedBlock.forEach((b) => {
          b.selected = true;
          _selectBlocks.addOnce(b);
        });

        //选择单元
        selectConnectors.value.forEach((c) => {
          c.hover = false;
          c.selected = false;
        });
        selectConnectors.value.empty();
        chunkedPanel.value.testRectCastTag(_multiSelectRect as Rect, "connector").forEach((i) => {
          const connector = connectors.value.get(i.data as string);
          if(connector) selectConnectors.value.push(connector);
        });

        isMultiSelected.value = true;
      } else {
        _selectBlocks.forEach((b) => b.selected = false);
        _selectBlocks.empty();
        isMultiSelected.value = false;
      }
    }
    //更新鼠标坐标
    function updateMousePos(e : MouseEvent) {
      mouseInfo.value.mouseCurrentPosScreen.x = e.clientX - viewPort.value.editorAbsolutePos.x;
      mouseInfo.value.mouseCurrentPosScreen.y = e.clientY - viewPort.value.editorAbsolutePos.y;
      viewPort.value.screenPointToViewportPoint(mouseInfo.value.mouseCurrentPosScreen, mouseInfo.value.mouseCurrentPosViewPort);
    }

    //#endregion

    //#region 右键菜单事件

    //TODO: 右键菜单

    function onContextmenu(e : MouseEvent) {
      e.preventDefault();
      return false;
    }
    function onCanvasContextmenu(e : MouseEvent) {
      e.preventDefault();
      return false;
    }

    //#endregion

    //#region 其他事件

    function onUpdateAddBlockInPos(b : boolean, p : Vector2) {
      userAddBlockWithPosition = b;
      if(b)
        userAddBlockInPos.set(p);
    }

    //#endregion

    //#region 拖放

    function onDrop(e : DragEvent) {
      updateMousePos(e);
      if(!e.dataTransfer)
        return
      const data = e.dataTransfer.getData('text/plain');
      if(StringUtils.isNullOrEmpty(data) || !data.startsWith('drag:')) 
        return;
      const datav = data.split(':');
      switch(datav[1]) {
        case 'block': {
          userAddBlockInPos = mouseInfo.value.mouseCurrentPosViewPort;
          userAddBlockWithPosition = true;

          const block = BlockRegisterService.getRegisteredBlock(datav[2]);
          if(block) 
            userAddBlock(block);
          else
            thisEditorInfo.showSmallTip(`Block for guid ${datav[2]} not found!`, 3000);

          thisEditorInfo.closeAddBlockPanel()
          break;
        }
      }
    }    

    //#endregion

    //#region 初始化

    onMounted(() => {
      tickCheckTimer = setInterval(onEditorCheckTick);
      window.addEventListener('resize', onWindowSizeChanged);
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('keydown', onKeyDown);

      setTimeout(() => {
        initRenderer();
        BuiltinRuntimeBlocks.registerAll();
        BlockRegisterService.updateBlocksList();

        if(typeof eventInfo.onReady === 'function')
          typeof eventInfo.onReady();
      }, 500);
    });
    onBeforeUnmount(() => {
      renderEnabled.value = false;

      clearInterval(tickCheckTimer);
      window.removeEventListener('resize', onWindowSizeChanged);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('keydown', onKeyDown);
    });
    
    function initRenderer() {
      onWindowSizeChanged();
      //Add debug text
      const render = backgroundRenderer.value;
      const _viewPort = viewPort.value;
      const _mouseInfo = mouseInfo.value;
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

    //Tests
    //=======================================

    setTimeout(() => {
      openGraph(new BluePrintFlowGraph());
    }, 400);

    return {
      editorHost,
      foregroundRenderer,
      backgroundRenderer,
      viewPort,
      renderEnabled,
      isDragView,
      mouseInfo,
      onMouseDown,
      onMouseWhell,
      onMouseMove,
      onContextmenu,
      onCanvasContextmenu,
      onDeletPort,
      onDrop,
      onUpdateAddBlockInPos,
      openGraph,
      closeGraph,
      getCurrentGraph: () => currentGraph.value,
      getEditor: () => thisEditorInfo,
      getEvents,
      setEvents,
      endConnectToNew,
      userAddBlock,
      currentGraph,
      connectingInfo,
      multiSelectRect,
      isMulitSelect,
      isMultiSelected,
      blockMap,
      blockMapBackground,
      connectors,
      selectBlocks,
      selectConnectors,
      chunkedPanel,
      basePanels,
    }
  },
});
</script>
