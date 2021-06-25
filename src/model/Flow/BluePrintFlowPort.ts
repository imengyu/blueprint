import { VNode } from "vue";
import { Vector2 } from "../Base/Vector2";
import { SaveableTypes } from "../BluePrintEditorBase";
import ParamTypeService from "../Services/ParamTypeService";
import CommonUtils from "../Utils/CommonUtils";
import { SaveableObject } from "../Utils/SaveObject";
import { BluePrintFlowBlock } from "./BluePrintFlowBlock";
import { BluePrintFlowConnector } from "./BluePrintFlowConnector";
import { BluePrintParamEditorDefine, BluePrintParamType } from "./BluePrintParamType";

/**
 * 端口的方向
 *
 * * input：入端口，
 * * output：出端口
 */
export type BluePrintFlowPortDirection = "input" | "output";
/**
 * 状态
 */
export type BluePrintFlowPortState = "normal" | "active" | "error" | "success";

//eslint-disable-next-line
export type BluePrintFlowPortCreateEditorFunction = (h: Function, port?: BluePrintFlowPort) => {
  type: 'vnode'|'nameComponent',
  ret: string|VNode
};

//------------------------------------------------------------

/**
 * 端口定义
 */
export interface IBluePrintFlowPortDefine {
  /**
   * 端口参数类型
   */
  type: BluePrintParamType;
  /**
   * 节点 的唯一ID (不能为空，数字或字符串，可以随便写，在16个字符之内)，只要保证一个单元内不能重复即可
   */
  guid: string;
  /**
   * 名称
   */
  name?: string;
  /**
   * 说明
   */
  description?: string;
  /**
   * 节点的方向
   */
  direction: BluePrintFlowPortDirection;
  /**
   * 设置是否默认连接至此节点。最好只有一个设置为true，如果有多个，先添加的为默认连接。
   */
  defaultConnectPort?: boolean;
  /**
   * 表名该端口是否是异步的
   */
  isAsync?: boolean;
  /**
   * 是否引用传递参数值，默认为 false
   */
  isRefPassing?: boolean;
  /**
   * 参数值是否为全局变量，默认为 false
   */
  isStatic?: boolean;
  /**
   * 这个端口的起始值，默认为null
   */
  initialValue ?: SaveableTypes|null,
  /**
   * 是否强制不显示编辑参数控件
   */
  forceNoEditorControl?: boolean;
  /**
   * 是否强制在输出端口显示编辑参数控件
   */
  forceEditorControlOutput?: boolean;
  /**
   * 强制不检查循环调用
   */
  forceNoCycleDetection?: boolean;
}

//------------------------------------------------------------

/**
 * 单元端口控制类
 */
export class BluePrintFlowPort {
  define: BluePrintFlowPortDefine;

  constructor(parent: BluePrintFlowBlock, define: BluePrintFlowPortDefine) {
    this.define = define;
    this.initialValue = CommonUtils.defaultIfUndefined(define.initialValue, this.initialValue);
    this.direction = CommonUtils.defaultIfUndefined(define.direction, this.direction);
    this.parent = parent;
  }

  /**
   * 获取端口GUID
   */
  get guid() : string { return this.define.guid; }

  /**
   * 端口方向
   */
  direction: BluePrintFlowPortDirection = 'input';
  /**
   * 是否是动态添加，否则为单元自带端口
   */
  dyamicAdd = false;
  /**
   * 被连接的端口
   */
  connectedFromPort: Array<BluePrintFlowConnector> = [];
  /**
   * 连接至的端口
   */
  connectedToPort: Array<BluePrintFlowConnector> = [];
  /**
   * 端口参数默认值
   */
  initialValue : null|SaveableTypes = null;
  /**
   * 当前端口所属单元
   */
  parent: BluePrintFlowBlock;
  /**
   * 端口状态
   */
  state : BluePrintFlowPortState = 'normal';

  /**
   * 获取是否连接至指定端口
   * @param port 指定端口
   * @returns
   */
  public isConnectToPort(
    port: BluePrintFlowPort
  ): BluePrintFlowConnector | null {
    for (let i = this.connectedToPort.length - 1; i >= 0; i--) {
      if (this.connectedToPort[i].endPort == port)
        return this.connectedToPort[i];
    }
    return null;
  }
  /**
   * 获取是否被指定端口连接
   * @param port 指定端口
   * @returns
   */
  public isConnectByPort(
    port: BluePrintFlowPort
  ): BluePrintFlowConnector | null {
    for (let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if (this.connectedFromPort[i].startPort == port)
        return this.connectedFromPort[i];
    }
    return null;
  }
  /**
   * 删除已连接至的指定端口
   * @param port 指定端口
   */
  public removeConnectToPort(port: BluePrintFlowPort): void {
    for (let i = this.connectedToPort.length - 1; i >= 0; i--) {
      if (this.connectedToPort[i].endPort == port) {
        this.connectedToPort.remove(this.connectedToPort[i]);
      }
    }
  }
  /**
   * 删除被指定端口连接的连接
   * @param port 指定端口
   */
  public removeConnectByPort(port: BluePrintFlowPort): void {
    for (let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if (this.connectedFromPort[i].startPort == port) {
        this.connectedFromPort.remove(this.connectedFromPort[i]);
      }
    }
  }
  /**
   * 获取当前端口是否连接至任意位置
   * @returns
   */
  public isConnected(): boolean {
    if (this.direction == "input") return this.connectedFromPort.length > 0;
    else if (this.direction == "output") return this.connectedToPort.length > 0;
    return false;
  }

  /**
   * 检查目标端口参数类型是否与本端口匹配
   * @param targetPort 目标端口
   */
  public checkTypeAllow(targetPort : BluePrintFlowPort) : boolean {

    const targetType = targetPort.define.type;
    const thisType = targetPort.define.type;

    //判断是否是执行
    if(thisType.isExecute()) return targetType.isExecute();
    if(targetType.isExecute()) return thisType.isExecute();

    //判断集合类型是否一致
    if(thisType.setType != targetType.setType) return false;

    //映射特殊处理
    if(thisType.setType == 'dictionary' && thisType.dictionaryKeyType && targetType.dictionaryKeyType) {

      return (thisType.equals(targetType) || (thisType.isAny() || targetType.isAny())) 
        && (thisType.dictionaryKeyType.equals(targetType.dictionaryKeyType) || (thisType.dictionaryKeyType.isAny() || targetType.dictionaryKeyType.isAny())) ;
    
    }else {

      //any判断
      if(thisType.isAny() && !targetType.isExecute())
        return true;
      if(targetType.isAny() && !targetType.isExecute())
        return true;

      return thisType.equals(targetType) && thisType.setType == targetType.setType;
    }
  }
  public getTypeColor() : string {
    return this.define.type.getTypeColor();
  }
  public getTypeEditor() : null|BluePrintParamEditorDefine {
    return ParamTypeService.getCustomTypeEditor(this.define.type.getType());
  }
  /**
   * 更新当前端口的编辑器元素
   */
  public updateEditor : (() => void)|null = null;

  private pos = new Vector2();

  /**
   * 获取当前端口连接点的相对位置
   */
  public getPortPositionRelative : (() => Vector2)|null = null;
  
  /**
   * 获取当前端口连接点的绝对视口位置
   * @returns 
   */
  public getPortPositionViewport() : Vector2 {
    if(this.getPortPositionRelative) {
      this.pos.set(this.parent.position);
      this.pos.add(this.getPortPositionRelative());
    }
    return this.pos;
  }
}

export class BluePrintFlowPortDefine extends SaveableObject implements IBluePrintFlowPortDefine {

  public constructor(define ?: IBluePrintFlowPortDefine) {
    super();
    this.saveClassName = 'BluePrintFlowPortDefine';
    if(define) {
      this.type = CommonUtils.defaultIfUndefined(define.type, this.type);
      this.guid = CommonUtils.defaultIfUndefined(define.guid, this.guid);
      this.name = CommonUtils.defaultIfUndefined(define.name, this.name);
      this.description = CommonUtils.defaultIfUndefined(define.description, this.description);
      this.defaultConnectPort = CommonUtils.defaultIfUndefined(define.defaultConnectPort, this.defaultConnectPort);
      this.direction = CommonUtils.defaultIfUndefined(define.direction, this.direction);
      this.isRefPassing = CommonUtils.defaultIfUndefined(define.isRefPassing, this.isRefPassing);
      this.isStatic = CommonUtils.defaultIfUndefined(define.isStatic, this.isStatic);
      this.isAsync = CommonUtils.defaultIfUndefined(define.isAsync, this.isAsync);
      this.forceNoEditorControl = CommonUtils.defaultIfUndefined(define.forceNoEditorControl, this.forceNoEditorControl);
      this.forceEditorControlOutput = CommonUtils.defaultIfUndefined(define.forceEditorControlOutput, this.forceEditorControlOutput);
      this.forceNoCycleDetection = CommonUtils.defaultIfUndefined(define.forceNoCycleDetection, this.forceNoCycleDetection);
      this.initialValue = CommonUtils.defaultIfUndefined(define.initialValue, this.initialValue);
    }
  }

  public initialValue : SaveableTypes|null = null;
  public type : BluePrintParamType = BluePrintParamType.Any();
  public guid = '';
  public name = '';
  public description = '';
  public direction : BluePrintFlowPortDirection = 'input';
  public defaultConnectPort = false;
  public isRefPassing = false;
  public isStatic = false;
  public isAsync = false;
  public forceNoEditorControl = false;
  public forceEditorControlOutput = false;
  public forceNoCycleDetection = false;
}
