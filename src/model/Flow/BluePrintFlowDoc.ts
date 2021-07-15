import logger from "../Base/Logger";
import { BluePrintDocEditorInstance, BluePrintEditorInstance } from "../BluePrintEditor";
import { BluePrintEditorViewport, IKeyValueObject } from "../BluePrintEditorBase";
import BlockRegisterService from "../Services/BlockRegisterService";
import RandomUtils from "../Utils/RandomUtils";
import { SaveableObject } from "../Utils/SaveObject";
import { BluePrintFlowBlock } from "./BluePrintFlowBlock";
import { BluePrintFlowConnector } from "./BluePrintFlowConnector";
import { IBluePrintFlowPortDefine } from "./BluePrintFlowPort";
import { BluePrintFlowVariable } from "./BluePrintFlowVariable";

/**
 * 流图文档
 */
export class BluePrintFlowDoc extends SaveableObject {
  name = '';
  uid : string;
  version = '';
  description = '';
  author = '';
  loadStatus : 'notload'|'loaded'|'error' = 'notload';
  /**
  * 库版本
  */
  libVersion  = 0
  /**
  * 编辑器版本
  */
  openEditorVersion  = 0
  /**
  * 文件所在位置
  */
  path = '';
  /**
   * 所有图表
   */
  graphs = new Array<BluePrintFlowGraph>();
  /**
   * 变量
   */
  variables : Array<BluePrintFlowVariable> = [];

  getVariableByName(name : string) : BluePrintFlowVariable|null {
    for (let i = this.variables.length - 1; i >= 0; i--) {
      if(this.variables[i].name == name) return this.variables[i];
    }
    return null;
  }

  constructor(path : string) {
    super();
    this.path = path;
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
  }

  save() : IKeyValueObject {
    const graphs = new Array<IKeyValueObject>();
    this.graphs.forEach((g) => {
      graphs.push(g.save());
    })
    const o = {
      name: this.name,
      uid: this.uid,
      version: this.version,
      description: this.description,
      author: this.author,
      graphs,
    }
    return o;
  }
  load(data : IKeyValueObject) : void {
    if(data) {
      this.graphs = [];
      this.name = data.name as string;
      if(data.uid)
        this.uid = data.uid as string;
      this.version = data.version as string;
      this.description = data.description as string;
      this.author = data.author as string;
      (data.graphs as IKeyValueObject[]).forEach((g) => {
        const graph = new BluePrintFlowGraph(this);
        graph.load(g);
        this.graphs.push(graph)
      });
      
      if(this.graphs.length > 0)
        this.activeGraph = this.graphs[0];
    }
  }

  addGraph(name: string, type: BluePrintFlowGraphType) : BluePrintFlowGraph {
    const graph = new BluePrintFlowGraph(this);
    graph.name = name;
    graph.type = type;
    this.graphs.push(graph)
    return graph;
  }
  removeGraph(graph : BluePrintFlowGraph) : void {
    graph.docunment = null;
    this.graphs.remove(graph)
  }
  getGraphByName(name : string) : BluePrintFlowGraph|null {
    for (let i = this.graphs.length - 1; i >= 0; i--) {
      if(this.graphs[i].name == name) return this.graphs[i];
    }
    return null;
  }

  initNew() : void {
    // eslint-disable-next-line
    this.load(require('@/assets/json/DefaultGraph.json'));
  }

  isFileChanged() : boolean {
    for (let i = 0; i < this.graphs.length; i++) {
      if(this.graphs[i].fileChanged)
        return true;
    }
    return false;
  }

  //编辑器
  //==========================

  /**
   * 当前激活的编辑器实例
   */
  activeEditor: BluePrintDocEditorInstance|null = null;
  activeGraph: BluePrintFlowGraph|null = null;

  getUseableVariableName(baseName : string) : string {
    for(let i = this.variables.length, c = this.variables.length + 10; i < c; i++) {
      const name = baseName + i;
      if(this.getVariableByName(name) == null)
        return name;
    }
    return baseName;
  }
  getUseableGraphName(baseName : string) : string {
    for(let i = this.graphs.length, c = this.graphs.length + 10; i < c; i++) {
      const name = baseName + i;
      if(this.getGraphByName(name) == null)
        return name;
    }
    return baseName;
  }
}

/**
 * 流图类型
 */
export type BluePrintFlowGraphType = 'none'|'static'|'constructor'|'function'|'macro';

/**
 * 流图类
 */
export class BluePrintFlowGraph extends SaveableObject {
  type = 'none' as BluePrintFlowGraphType;
  name = '';
  uid : string;
  version = '';
  description = '';
  author = '';
  loadStatus : 'notload'|'loaded'|'error'|'loading' = 'notload';

  constructor(docunment ?: BluePrintFlowDoc) {
    super();
    this.docunment = docunment || null;
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
  }

  save() : IKeyValueObject {

    if(this.activeEditor) {
      this.viewPort.set(this.activeEditor.getViewPort());
    }

    const guidMap = new Array<string>();
    this.blocks.forEach((b) => guidMap.addOnce(b.guid));

    const uidMap = new Array<string>();
    const blocks = new Array<IKeyValueObject>();
    this.blocks.forEach((b) => {
      uidMap.push(b.uid);
      blocks.push({
        instance: b.save(),
        guidMap: guidMap.indexOf(b.guid)
      });
    })

    const connectors = new Array<IKeyValueObject>();
    this.connectors.forEach((g) => {
      if(g.startPort && g.endPort) {
        uidMap.push(g.uid);
        connectors.push({
          uid: uidMap.length - 1,
          startBlock: uidMap.indexOf(g.startPort.parent.uid),
          startPort: g.startPort.guid,
          endBlock: uidMap.indexOf(g.endPort.parent.uid),
          endPort: g.endPort.guid,
        });
      }
    })

    this.fileChanged = false;

    const o = {
      guidMap,
      uidMap,
      blocks,
      connectors,
      viewPort: this.viewPort.save(),
      name: this.name,
      uid: this.uid,
      version: this.version,
      description: this.description,
      author: this.author,
      type: this.type,
    }
    return o;
  }
  load(data : IKeyValueObject) : void {
    if(data) {
      this.blocks = new Map<string, BluePrintFlowBlock>();
      this.connectors = [];

      this.name = data.name as string;
      this.uid = data.uid as string;
      this.version = data.version as string;
      this.description = data.description as string;
      this.author = data.author as string;
      this.type = data.type as BluePrintFlowGraphType;
      this.viewPort.load(data.viewPort as IKeyValueObject);

      const guidMap = data.guidMap as Array<string>; 
      const uidMap = data.uidMap as Array<string>;
      const blocks = data.blocks as Array<IKeyValueObject>;
      const connectors = data.connectors as Array<IKeyValueObject>;

      blocks.forEach((block) => {
        const guid = guidMap[block.guidMap as number];
        if(!guid) 
          return;
        const blockDefine = BlockRegisterService.getRegisteredBlock(guid);
        if(!blockDefine) {
          logger.warning('Loader', `Not found block define for guid ${guid} !`);
          return;
        }
        const blockInstace = new BluePrintFlowBlock(blockDefine);
        blockInstace.graph = this;
        blockInstace.load((block.instance as IKeyValueObject) || {});
        this.blocks.set(blockInstace.uid as string, blockInstace);
      });

      connectors.forEach((connector) => {
        const startBlock = this.blocks.get(uidMap[connector.startBlock as number]);
        const endBlock = this.blocks.get(uidMap[connector.endBlock as number]);
        if(!startBlock || !endBlock)
          return;
        const startPort = startBlock.getPortByGUID(connector.startPort as string);
        const endPort = startBlock.getPortByGUID(connector.endPort as string);
        if(!startPort || !endPort)
          return;
         
        const connectorInstance = new BluePrintFlowConnector();
        connectorInstance.uid = uidMap[connector.uid as number];
        connectorInstance.startPort = startPort;
        connectorInstance.endPort = endPort;
        this.connectors.push(connectorInstance);
      });

      this.fileChanged = false;
    }
  }

  /**
   * 保存的视口信息
   */
  viewPort = new BluePrintEditorViewport();
  /**
   * 单元
   */
  blocks = new Map<string, BluePrintFlowBlock>();

  /**
   * 根据单元GUID获取当前文档中的所有单元
   * @param guid 单元GUID
   */
  public getBlocksByGUID(guid : string) : BluePrintFlowBlock[] { 
    const arr : BluePrintFlowBlock[] = [];
    this.blocks.forEach(element => {
      if(element.guid==guid)
        arr.push(element);
    });
    return arr;
  }
  /**
   * 根据单元UID获取当前文档单元
   * @param guid 单元UID
   */
  public getOneBlockByUID(uid : string) : BluePrintFlowBlock|null { 
    return this.blocks.get(uid) || null;
  }

  initNew() : void {
    //
  }

  /**
   * 连接
   */
  connectors : Array<BluePrintFlowConnector> = [];

  /**
   * 变量
   */
  variables : Array<BluePrintFlowVariable> = [];
  /**
   * 指示当前函数是否是静态
   */
  static = false;

  getVariableByName(name : string) : BluePrintFlowVariable|null {
    for (let i = this.variables.length - 1; i >= 0; i--) {
      if(this.variables[i].name == name) return this.variables[i];
    }
    return null;
  }

  public inputPorts = new Array<IBluePrintFlowPortDefine>();
  public outputPorts = new Array<IBluePrintFlowPortDefine>();

  //编辑器
  //==========================

  /**
   * 图表所在文档
   */
  docunment : BluePrintFlowDoc|null;
  /**
   * 指定当前文件是否已经更改
   */
  fileChanged = false;
  /**
   * 当前激活的编辑器实例
   */
  activeEditor: BluePrintEditorInstance|null = null;

  getUseableVariableName(baseName : string) : string {
    for(let i = this.variables.length, c = this.variables.length + 10; i < c; i++) {
      const name = baseName + i;
      if(this.getVariableByName(name) == null)
        return name;
    }
    return baseName;
  }
}