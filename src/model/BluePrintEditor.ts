import { Vector2 } from "./Base/Vector2";
import { BluePrintEditorViewport } from "./BluePrintEditorBase";
import { BluePrintFlowBlock, BluePrintFlowBlockDefine } from "./Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "./Flow/BluePrintFlowConnector";
import { BluePrintFlowGraph } from "./Flow/BluePrintFlowDoc";
import { BluePrintFlowPort, BluePrintFlowPortDirection } from "./Flow/BluePrintFlowPort";
import { BluePrintParamType } from "./Flow/BluePrintParamType";

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
   * 获取编辑器事件
   */
  getEvents: () => IBluePrintEditorEventSettings,
  /**
   * 设置编辑器事件
   */
  setEvents: (evts : IBluePrintEditorEventSettings) => void,
}

export type ChooseTypePanelCallback = (type: BluePrintParamType, isBaseType : boolean) => void;

/**
 * 编辑器内部接口
 */
export interface BluePrintEditorInfo {
  addBlock: (block : BluePrintFlowBlock) => void;
  removeBlock: (block : BluePrintFlowBlock) => void;
  addConnector: (block : BluePrintFlowConnector) => void;
  removeConnector: (block : BluePrintFlowConnector) => void;
  getSelectBlocks: () => BluePrintFlowBlock[];
  getSelectBlockCount: () => number;
  unSelectAllBlocks: () => void;
  selectAllBlocks: () => void;
  unSelectAllConnectors: () => void;
  selectAllConnectors: () => void;
  isAnyConnectorHover: () => boolean;
  unSelectConnector: (connector : BluePrintFlowConnector) => void;
  selectConnector: (connector : BluePrintFlowConnector, append : boolean) => void;
  selectBlock: (block : BluePrintFlowBlock, append : boolean) => void;
  unSelectBlock: (block : BluePrintFlowBlock) => void;
  getViewPort: () => BluePrintEditorViewport;
  onMoveBlockEnd: (block : BluePrintFlowBlock) => void,
  onMoveBlock: (block : BluePrintFlowBlock, moveOffest : Vector2) => void,
  updateCurrentHoverPort: (port : BluePrintFlowPort, active : boolean) => void,
  updateConnectEnd: (pos : Vector2) => void;
  startConnect: (port : BluePrintFlowPort) => void;
  endConnect: (port : BluePrintFlowPort) => void;
  getCanConnect: () => boolean;
  unConnectConnector: (conn : BluePrintFlowConnector) => void;
  connectConnector: (start : BluePrintFlowPort, end : BluePrintFlowPort) => BluePrintFlowConnector|null;
  endConnectToNew: (block?: BluePrintFlowBlock) => BluePrintFlowPort|null;
  setNoAddBlockInpos: () => void;
  setAddBlockInpos: (pos : Vector2) => void;
  userAddBlock: (blockDefine : BluePrintFlowBlockDefine) => boolean;
  userDeleteBlock: (block : BluePrintFlowBlock) => boolean;
  showSmallTip: (text : string, time ?: number) => void;
  closeSmallTip: () => void;
  markUpFileChanged: () => void;
  showAddBlockPanel: (pos: Vector2, filterByPortType ?: BluePrintParamType|null, filterByPortDirection ?: BluePrintFlowPortDirection|null, addBlockPos ?: Vector2, showAddDirectly ?: boolean) => void;
  showChooseTypePanel: (pos: Vector2, canbeExecute: boolean, canbeAny: boolean, callback: ChooseTypePanelCallback) => void;
  deleteSelectedConnectors: () => void;
  deleteSelectedBlocks: () => void;
  closeAddBlockPanel: () => void;
  closeChooseTypePanel: () => void;
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
}