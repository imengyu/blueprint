import { BluePrintIDEInstance } from "@/components/IDE/Base/IDEDefine";
import { MenuOptions } from "@imengyu/vue3-context-menu";
import { App } from "vue";
import { Rect } from "./Base/Rect";
import { Vector2 } from "./Base/Vector2";
import { BluePrintEditorMouseInfo, BluePrintEditorViewport } from "./BluePrintEditorBase";
import { ChunkedPanel } from "./Cast/ChunkedPanel";
import { BluePrintBreakPoint, BluePrintFlowBlock, BluePrintFlowBlockDefine } from "./Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "./Flow/BluePrintFlowConnector";
import { BluePrintFlowGraph } from "./Flow/BluePrintFlowDoc";
import { BluePrintFlowPort, BluePrintFlowPortDirection } from "./Flow/BluePrintFlowPort";
import { BluePrintParamType, BluePrintParamTypeConverterDefine } from "./Flow/BluePrintParamType";

/**
 * 编辑器实例导出的API
 */
export interface IBluePrintEditor { 
  /**
   * 加载指定图表至编辑器中
   * @param graph 指定图表 
   */
  openGraph: (graph: BluePrintFlowGraph) => void;
  /**
   * 关闭编辑器已打开的图表 
   */
  closeGraph: () => void;
  /**
   * 获取编辑器当前打开的图表 
   */
  getCurrentGraph: () => BluePrintFlowGraph;
  /**
   * 获取编辑器事件接口
   */
  getEvents: () => IBluePrintEditorEventSettings,
  /**
   * 获取编辑器实例
   */
  getEditor: () => BluePrintEditorInstance,
}

export type ChooseTypePanelCallback = (type: BluePrintParamType, isBaseType : boolean) => void;

/**
 * 编辑器内部接口
 */
export interface BluePrintEditorInstance {

  //Base block management
  //===================================

  addBlock: (block : BluePrintFlowBlock) => void;
  removeBlock: (block : BluePrintFlowBlock) => void;
  addConnector: (block : BluePrintFlowConnector) => void;
  removeConnector: (block : BluePrintFlowConnector) => void;


  getConnectors: () => Map<string, BluePrintFlowConnector>;
  getBlocks: (layer?: 'normal'|'background') => Map<string, BluePrintFlowBlock>;
  getMouseInfo: () => BluePrintEditorMouseInfo;
  getConnectingInfo: () => IConnectingInfo;
  getViewPort: () => BluePrintEditorViewport;
  getBaseChunkedPanel: () => ChunkedPanel;

  moveViewportToBlock: (block: BluePrintFlowBlock) => void;
  /**
   * 计算一些单元的矩形区域
   * @param blocks 要计算的单元
   */
  calcBlocksRegion: (blocks : BluePrintFlowBlock[]) => Rect;

  //Graph management
  //===================================

  openGraph: (graph: BluePrintFlowGraph) => void;
  lockOpenGraph: () => void;
  closeGraph: () => void;
  getCurrentGraph: () => BluePrintFlowGraph|null;
  markGraphChanged: () => void;

  //Selection management
  //==================================

  getSelectBlocks: () => BluePrintFlowBlock[];
  getSelectBlockCount: () => number;
  getSelectConnectors: () => BluePrintFlowConnector[];

  selectAllBlocks: () => void;
  selectAllConnectors: () => void;
  unSelectAllBlocks: () => void;
  unSelectAllConnectors: () => void;

  isMulitSelect: () => boolean;
  startMulitSelect: () => void;
  clearMulitSelect: () => void;
  doSelectBlocks: () => void;

  //Connect
  //==================================

  selectConnector: (connector : BluePrintFlowConnector, append : boolean) => void;
  selectBlock: (block : BluePrintFlowBlock, append : boolean) => void;
  selectSomeBlocks: (blocks : BluePrintFlowBlock[], append : boolean) => void;
  selectOneConnector: () => boolean;
  unSelectBlock: (block : BluePrintFlowBlock) => void;
  unSelectConnector: (connector : BluePrintFlowConnector) => void;

  //User action
  //==================================

  deleteSelectedConnectors: () => void;
  deleteSelectedBlocks: () => void;
  straightenConnector: (refPort : BluePrintFlowPort, connector : BluePrintFlowConnector) => void;
  unConnectSelectedBlockConnectors: () => void;

  alignSelectedBlock: (baseBlock : BluePrintFlowBlock, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') => void;
  setSelectedBlockBreakpointState: (state : BluePrintBreakPoint) => void;
  genCommentForSelectedBlock: () => void;

  userAddBlock: (blockDefine : BluePrintFlowBlockDefine) => BluePrintFlowBlock|false;
  userDeleteBlock: (block : BluePrintFlowBlock) => boolean;

  //Tool
  //==================================

  onMoveBlockEnd: (block : BluePrintFlowBlock) => void,
  onMoveBlock: (block : BluePrintFlowBlock, moveOffest : Vector2) => void,
  onDeletPort: (block : BluePrintFlowPort) => void,

  updateBlockForMoveEnd: (block: BluePrintFlowBlock) => void,
    
  //Connect
  //==================================

  isAnyConnectorHover: () => boolean;
  updateCurrentHoverPort: (port : BluePrintFlowPort, active : boolean) => void,
  updateConnectEnd: (pos : Vector2) => void;
  startConnect: (port : BluePrintFlowPort) => void;
  endConnect: (port : BluePrintFlowPort) => void;
  getCanConnect: () => boolean;
  connectConnector: (start : BluePrintFlowPort, end : BluePrintFlowPort) => BluePrintFlowConnector|null;
  endConnectToNew: (block?: BluePrintFlowBlock) => BluePrintFlowPort|null;

  unConnectConnector: (conn : BluePrintFlowConnector) => void;
  unConnectPortConnectors: (port: BluePrintFlowPort) => void;
  unConnectBlockConnectors: (block: BluePrintFlowBlock) => void;

  //Tool functions (Clone from doc editor)
  //==================================

  setNoAddBlockInpos: () => void;
  setAddBlockInpos: (pos : Vector2) => void;

  showSmallTip: (text : string, time ?: number) => void;
  closeSmallTip: () => void;

  showAddBlockPanel: (pos: Vector2, filterByPortType ?: BluePrintParamType|null, filterByPortDirection ?: BluePrintFlowPortDirection|null, addBlockPos ?: Vector2, showAddDirectly ?: boolean) => void;
  showChooseTypePanel: (pos: Vector2, canbeExecute: boolean, canbeAny: boolean, callback: ChooseTypePanelCallback) => void;
  closeAddBlockPanel: () => void;
  closeChooseTypePanel: () => void;

  updateMousePos: (e : MouseEvent) => void;

  //Key functions
  //==================================

  isKeyAltDown: () => boolean;
  isKeyControlDown: () => boolean;
 
  //Right Menu
  //==================================

  showConnectorRightMenu: (screenPos : Vector2) => void;
  showBlockRightMenu: (block : BluePrintFlowBlock, screenPos : Vector2)  => void;
  showPortRightMenu: (port : BluePrintFlowPort, screenPos : Vector2) => void;
  showContextMenu: (options: MenuOptions) => void;

  getVueApp: () => App;
}

export interface BluePrintEditorSettings {
  gridShow: boolean,
  drawDebugInfo: boolean
}

/**
 * 文档编辑器接口
 */
export interface BluePrintDocEditorInstance {
  getIde: () => BluePrintIDEInstance|null;
  openGraph: (graph: BluePrintFlowGraph, active ?: boolean) => void;
  closeGraph: (graph: BluePrintFlowGraph) => void;
}

/**
 * 编辑器事件定义
 */
export interface IBluePrintEditorEventSettings {
  /**
   * 当用户连接两个端口时触发此回调
   */
  onPortConnect ?: (startPort: BluePrintFlowPort, endPort: BluePrintFlowPort) => void;
  /**
    * 当用户断开两个端口连接时触发此回调
    */
  onPortUnConnect ?: (startPort: BluePrintFlowPort, endPort: BluePrintFlowPort) => void;
  /**
   * 编辑器就绪回调
   */
  onReady ?: () => void;
  /**
   * 当前文档更改事件
   */
  onGraphChanged ?: (graph : BluePrintFlowGraph) => void;
}

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
