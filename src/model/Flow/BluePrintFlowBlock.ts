import { ChunkInstance } from "../Cast/ChunkedPanel";
import { EventHandler, VoidDelegate } from "../Base/EventHandler";
import { Rect } from "../Base/Rect";
import { Vector2 } from "../Base/Vector2";
import { CustomStorageObject, IKeyValueObject, SaveableTypes } from "../BluePrintEditorBase";
import { BluePrintEditorInstance } from '../BluePrintEditor'
import { CreateObjectFactory, SaveableObject } from "../Utils/SaveObject";
import { BluePrintFlowConnector } from "./BluePrintFlowConnector";
import { BluePrintFlowGraph } from "./BluePrintFlowDoc";
import { BluePrintFlowPort, BluePrintFlowPortCreateEditorFunction, BluePrintFlowPortDefine, BluePrintFlowPortDirection, IBluePrintFlowPortDefine } from "./BluePrintFlowPort";
import { BluePrintParamSetType, BluePrintParamType } from "./BluePrintParamType";
import CommonUtils from "../Utils/CommonUtils";
import RandomUtils from "../Utils/RandomUtils";
import logger from "../Base/Logger";
import { VNode } from "vue";
import ParamTypeService from "../Services/ParamTypeService";

//------------------------------------------------------------

//eslint-disable-next-line
export type BluePrintFlowBlockCreateEditorFunction = (h: Function, block?: BluePrintFlowBlock) => {
  type: 'vnode'|'nameComponent'|'vnodes'|'nameComponents',
  ret: string[]|string|VNode|VNode[]
};

//------------------------------------------------------------

/**
 * 流图单元定义类
 */
export interface IBluePrintFlowBlockDefine  {
  /**
   * 唯一ID
   */
  guid : string,
  /**
   * 版本号
   */
  version : number,
  /**
   * 名称
   */
  name : string,
  /**
   * 说明文字
   */
  description ?: string,
  /**
   * 单元分组路径，使用 / 分隔一级，例如 基础/定时器
   */
  category ?: string,
  /**
   * 样式信息
   */
  style ?: IBluePrintFlowBlockStyleSettings,
  /**
   * 单元的预定义端口
   */
  ports ?: Array<IBluePrintFlowPortDefine>,
  /**
   * 指定这个单元是不是在用户添加菜单中隐藏。默认为 false
   */
  hideInAddPanel ?: boolean;
  /**
   * 指定这个单元在每个图表中是否只能出现一次。默认为 false
   */
  oneBlockOnly ?: boolean;
  /**
   * 指定这个单元是基础单元，不能被用户移除。默认为 false
   */
  canNotDelete ?: boolean;
  /**
   * 指示用户是否可以手动添加入执行端口。默认为 false
   */
  userCanAddInputExecute ?: boolean;
  /**
   * 指示用户是否可以手动添加出执行端口。默认为 false
   */
  userCanAddOutputExecute ?: boolean;
  /**
   * 指示用户是否可以手动添加入参数端口。默认为 false
   */
  userCanAddInputParam ?: boolean;
  /**
   * 指示用户是否可以手动添加出参数端口。默认为 false
   */
  userCanAddOutputParam ?: boolean;
  /**
   * 单元自定义事件设置
   */
  events ?: IBluePrintFlowBlockEventSettings,
  /**
   * 单元自定义菜单
   */
  menu ?: BluePrintFlowBlockMenuSettings,
}
/**
 * 单元样式设置
 */
export interface IBluePrintFlowBlockStyleSettings {
  /**
   * 单元主图标 16x16
   */
  logo ?: string;
  /**
   * 单元右上角的大图标 32x32
   */
  logoRight ?: string;
  /**
   * 单元左下角的小图标 16x16
   */
  logoBottom ?: string;
  /**
   * 单元背景的图标 16x16
   * 如果设置为 “title:xxxxx” 那么将会显示为文字 xxxxx
   */
  logoBackground ?: string;
  /**
   * 单元标题背景颜色
   */
  titleBakgroundColor ?: string;
  /**
   * 单元标题颜色
   */
  titleColor ?: string;
  /**
   * 标题栏状态
   * * normal 正常标题栏
   * * small 小号标题栏
   * * false 隐藏标题栏
   */
  titleState ?: 'normal'|'small'|'hide'|false,
  /**
   * 指示用户是否可以调整该单元大小的类型
   * * width 用户可以调整这个单元的宽度
   * * height 用户可以调整这个单元的高度
   * * all 用户可以调整这个单元的大小
   * * false 用户不能调整这个单元的大小
   */
  userResize ?: 'width'|'height'|'all'|false,
  /**
   * 是否不显示鼠标悬停提示
   */
  noTooltip?: boolean;
  /**
   * 是否不显示注释菜单
   */
  noComment?: boolean;
  /**
   * 是否隐logo
   */
  noLogo ?: boolean;
  /**
   * 单元最小宽度(px)
   */
  minWidth ?: number,
  /**
   * 单元最小高度(px)
   */
  minHeight ?: number,
  /**
   * 单元最小宽度(px)
   */
  maxWidth ?: number,
  /**
  * 单元最小高度(px)
  */
  maxHeight ?: number,
  /**
   * 指定单元渲染所在层
   */
  layer ?: 'normal'|'background',
  /**
   * 单元的自定义类名
   */
  customClassNames?: string,
}
/**
 * 单元自定义事件设置
 */
export interface IBluePrintFlowBlockEventSettings {
  /**
   * 自定义检查回调，在用户添加某个单元至图表中时触发。
   * @param block 当前用户添加的某个单元
   * @param graph 添加目标图表
   * @return 返回一个字符串信息表示错误信息；返回null表示无错误，用户可以继续添加。
   */
  onAddCheck ?: (block: IBluePrintFlowBlockDefine, graph: BluePrintFlowGraph) => string|null;
  /**
   * 自定义检查回调，在用户删除某个单元至图表中时触发。
   * @param block 当前用户删除的某个单元
   * @param graph 删除目标图表
   * @return 返回一个字符串信息表示错误信息；返回null表示无错误，用户可以继续添加。
   */
  onDeleteCheck ?: (block: BluePrintFlowBlock, graph: BluePrintFlowGraph|null) => string|null;
  /**
   * 自定义检查回调，在用户连接单元两个端口时触发。
   * @param block 当前用户操作的单元
   * @param startPort 起始端口
   * @param endPort 结束端口
   * @return 返回一个字符串信息表示错误信息；返回null表示无错误，用户可以继续连接。
   */
  onPortConnectCheck ?: (block: BluePrintFlowBlock, startPort: BluePrintFlowPort, endPort: BluePrintFlowPort) => string|null;
  /**
   * 弹性端口连接时触发。
   * @param block 当前用户操作的单元
   * @param thisPort 当前端口
   * @param anotherPort 另外一个端口
   */
  onFlexPortConnect ?: (block: BluePrintFlowBlock, thisPort: BluePrintFlowPort, anotherPort: BluePrintFlowPort) => void;
  /**
   * 在用户连接端口时触发。
   * @param block 当前用户操作的单元
   * @param port 当前端口
   */
  onPortConnect ?: (block: BluePrintFlowBlock, port: BluePrintFlowPort) => void;
  /**
   * 在用户断开端口的连接时触发。
   * @param block 当前用户操作的单元
   * @param port 当前端口
   */
  onPortUnConnect ?: (block: BluePrintFlowBlock, port: BluePrintFlowPort) => void;

  /**
   * 单元初始化时的回调。
   * 通常在这个回调里面进行单元初始化的一些工作.
   */
  onCreate ?: OnBlockEventCallback,
  /**
   * 单元释放时(删除)的回调。
   */
  onDestroy ?: OnBlockEventCallback,
  /**
   * 编辑器保存时的回调。（仅编辑器模式调用）
   */
  onSave ?: OnBlockEventCallback,
  /**
   * 单元加载到编辑器中时的回调。
   */
  onAddToEditor ?: OnBlockEventCallback,
  /**
   * 单元从编辑器中卸载时的回调。（不是删除）
   */
  onRemoveFormEditor ?: OnBlockEventCallback,
  /**
   * 用户添加了一个端口时的回调。
   */
  onPortAdd ?: OnPortEventCallback,
  /**
   * 用户删除了一个端口时的回调。
   */
  onPortRemove ?: OnPortEventCallback,
  /**
   * 单元鼠标事件
   * @return 返回true则终止默认事件
   */
  onBlockMouseEvent ?: (block : BluePrintFlowBlock, event : 'move'|'down'|'up'|'enter'|'leave', e : MouseEvent) => boolean,
  /**
   * 当用户点击创建端口时的回调。
   * @return  在这个回调中返回新创建端口的信息，由编辑器创建指定的端口
   */
  onUserAddPort ?: (block : BluePrintFlowBlock, direction : BluePrintFlowPortDirection, type : 'execute'|'param') => BluePrintFlowPortDefine|BluePrintFlowPortDefine[],
  /**
   * 创建自定义单元内部编辑器元素回调
   */
  onCreateCustomEditor ?: BluePrintFlowBlockCreateEditorFunction,
  /**
   * 创建自定义端口内部编辑器元素回调
   */
  onCreatePortCustomEditor ?: BluePrintFlowPortCreateEditorFunction,
}

//------------------------------------------------------------

export type BluePrintBreakPoint = 'none'|'disable'|'enable';

export type OnBlockEventCallback = (block : BluePrintFlowBlock) => void;
export type OnPortEventCallback = (block : BluePrintFlowBlock, port : BluePrintFlowPort) => void;

//------------------------------------------------------------

interface IPortDataDefine {
  guid: string,
  initialValue: SaveableTypes|null,
  dyamicAdd: boolean,
  define: IKeyValueObject|undefined,
}

/**
 * 流图单元控制类
 */
export class BluePrintFlowBlock extends SaveableObject {
  public uid = '';
  /**
   * 获取GUID
   */
  public get guid() : string { return this.define.guid; }
  public position = new Vector2();
  public customSize = new Vector2();
  public breakpoint : BluePrintBreakPoint = 'none';

  public define : BluePrintFlowBlockDefine;

  public inputPorts : { [index: string]: BluePrintFlowPort; } = {};
  public outputPorts : { [index: string]: BluePrintFlowPort; } = {};
  public inputPortCount = 0;
  public outputPortCount = 0;
  public allPorts : Array<BluePrintFlowPort> = [];
  public allPortsMap : Map<string, BluePrintFlowPort> = new Map<string, BluePrintFlowPort>();
  /**
   * 自定义单元属性供代码使用（全局）（会保存至文件中）
   */
  public options : CustomStorageObject = {};

  public constructor(define : BluePrintFlowBlockDefine) {
    super();
    this.saveClassName = 'BluePrintFlowBlock';
    this.define = define;
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);

    if(typeof this.define.events.onCreate === 'function')
      this.define.events.onCreate(this);
  }

  public save() : IKeyValueObject {

    //调用回调
    if(typeof this.define.events.onSave === 'function')
      this.define.events.onSave(this);
    this.onSave.invoke(this);

    const portDatas = new Array<IPortDataDefine>();
    this.allPorts.forEach((port) => {
      portDatas.push({
        guid: port.guid,
        initialValue: port.initialValue,
        dyamicAdd: port.dyamicAdd,
        define: port.dyamicAdd ? port.define.save() : undefined,
      });
    });

    return {
      save: true,
      portDatas,
      position: this.position.save(),
      customSize: this.customSize.save(),
      breakpoint: this.breakpoint,
      uid: this.uid,
      options: this.options,
      markOpen: this.markOpen,
      markContent: this.markContent,
    }
  }
  public load(data : IKeyValueObject) : void {
    if(data.save) {
      this.uid = data.uid as string;
      this.markContent = data.markContent as string;
      this.markOpen = data.markOpen as boolean;
      this.breakpoint = data.breakpoint as BluePrintBreakPoint;
      this.options = data.options as CustomStorageObject;
      this.position = CreateObjectFactory.createSaveableObject('Vector2', data.position as IKeyValueObject) as Vector2;
      this.customSize = CreateObjectFactory.createSaveableObject('Vector2', data.customSize as IKeyValueObject) as Vector2;

      //添加定义中的端口
      this.define.ports.forEach((p) => {
        let lastSavePortData : IPortDataDefine|undefined;
        (data.portDatas as Array<IKeyValueObject>).forEach(element => {
          if(element.guid === p.guid)
            lastSavePortData = element as unknown as IPortDataDefine;
        });
        const finalDefine = (lastSavePortData && lastSavePortData.define) ? (lastSavePortData.define as unknown as IBluePrintFlowPortDefine) : p;
        const initialValue = (lastSavePortData && lastSavePortData.initialValue) ? lastSavePortData.initialValue : null;
        const dyamicAdd = (lastSavePortData && lastSavePortData.dyamicAdd);

        this.addPort(finalDefine, dyamicAdd, initialValue);
      });
      //添加动态添加的端口
      (data.portDatas as Array<IKeyValueObject>).forEach(element => {
        if(element.dyamicAdd && element.define) {
          this.addPort(element.define as unknown as IBluePrintFlowPortDefine, true, element.initialValue);
        }
      });
    } else {
      this.define.ports.forEach((p) => {
        this.addPort(p, false, ParamTypeService.getTypeDefaultValue(p.type));
      });
    }
  }

  public getName() : string {
    return this.define.name;
  }

  /**
   * 添加行为端口
   * @param data 行为端口数据
   * @param isDyamicAdd 是否是动态添加。动态添加的端口会被保存至文件中。
   */
  public addPort(data : IBluePrintFlowPortDefine, isDyamicAdd = true, initialValue : SaveableTypes|null = null, forceChangeDirection ?: BluePrintFlowPortDirection) : BluePrintFlowPort {
    const oldData = this.getPort(data.guid, data.direction);
    if(oldData != null && oldData != undefined) {
      logger.warning(this.getName() + ".addPort", data.direction + " port " + data.name + " (" + data.guid + ") alreday exist !", {
        srcBlock: this
      });
      return oldData;
    }

    const newPort = new BluePrintFlowPort(this, new BluePrintFlowPortDefine(data));
    newPort.direction = CommonUtils.defaultIfUndefined(forceChangeDirection, data.direction);
    newPort.dyamicAdd = isDyamicAdd;
    newPort.initialValue = initialValue;

    if(newPort.direction == 'input') {
      this.inputPorts[newPort.guid] = newPort;
      this.inputPortCount++;
    }
    else if(newPort.direction == 'output') {
      this.outputPorts[newPort.guid] = newPort;
      this.outputPortCount++;
    }

    if(data.defaultConnectPort) this.allPorts.unshift(newPort);
    else this.allPorts.push(newPort);
    this.allPortsMap.set(newPort.guid, newPort);

    if(typeof this.define.events.onPortAdd === 'function')
      this.define.events.onPortAdd(this, newPort);
    return newPort;
  }
  /**
   * 删除行为端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public deletePort(guid : string|BluePrintFlowPort, direction ?: BluePrintFlowPortDirection) : void {
    const oldData = typeof guid == 'string' ? this.getPort(guid, direction) : guid;
    if(oldData == null || oldData == undefined) {
      logger.warning(this.getName() + ".deletePort", guid + " port not exist !", {
        srcBlock: this,
      });
      return;
    }

    this.allPorts.remove(oldData);
    this.allPortsMap.delete(oldData.guid);

    if(typeof this.define.events.onPortRemove === 'function')
      this.define.events.onPortRemove(this, oldData);

    if(direction == 'input') {
      delete(this.inputPorts[typeof guid == 'string' ? guid : guid.guid]);
      this.inputPortCount--;
    }
    else if(direction == 'output') {
      delete(this.outputPorts[typeof guid == 'string' ? guid : guid.guid]);
      this.outputPortCount--;
    }
  }
  /**
   * 获取某个行为端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public getPort(guid : string, direction ?: BluePrintFlowPortDirection) : BluePrintFlowPort|null {
    if(direction == 'input')
      return this.inputPorts[guid];
    else if(direction == 'output')
      return this.outputPorts[guid];
    else
      return this.getPortByGUID(guid);
  }
  /**
   * 根据GUID获取某个端口
   * @param guid 
   */
  public getPortByGUID(guid : string) : BluePrintFlowPort|null {
    if(this.allPortsMap.has(guid))
      return this.allPortsMap.get(guid) || null;
    return null;
  }
  /**
   * 获取当前单元中与指定方向和类型匹配的第一个端口
   * @param type 匹配类型
   * @param direction 匹配方向
   * @param includeAny 指定是否包括any类型的端口
   * @returns 返回端口，如果没有匹配则返回null
   */
  public getPortByTypeAndDirection(type: BluePrintParamType, direction: BluePrintFlowPortDirection, includeAny = true) : BluePrintFlowPort|null  {
    if(type.isExecute()) {
      for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].direction == direction && this.allPorts[i].define.type.isExecute())
          return this.allPorts[i];
    }else {
      for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].direction == direction)  {
          
          const ptype = this.allPorts[i].define.type;
          const dictionaryKeyType = ptype.dictionaryKeyType;

          if(dictionaryKeyType && type.setType == 'dictionary' && ptype.setType == 'dictionary') {
            if(includeAny && type.isAny() && type.isAny()) return this.allPorts[i];
            if(includeAny && (this.allPorts[i]).define.type.isAny() && dictionaryKeyType.isAny()) return this.allPorts[i];
            if(ptype.equals(type) && dictionaryKeyType.equals(type)) return this.allPorts[i];

          } else if(
            (includeAny && type.isAny())
            || (ptype.equals(type) && ptype.setType == type.setType)
            || (includeAny && ptype.isAny() && ptype.setType == type.setType)      
          ) return this.allPorts[i];
        }
    }
    return null;
  }
  /**
   * 更改参数端口的数据类型
   * @param port 参数端口
   * @param newType 新的数据类型
   * @param changeSetType 是否更改集合类型
   * @param changeKeyType 是否更改键类型
   */
  public changePortParamType(port : BluePrintFlowPort, newType: BluePrintParamType, changeSetType = false, changeKeyType = false) : void {
    if(!port)
      logger.error(this.getName(), 'changePortParamType: Must provide port');
    else if(port.parent == this) {

      port.define.type.setTypeName(newType as BluePrintParamType);

      if(changeKeyType)
        port.define.type.dictionaryKeyType = newType.dictionaryKeyType;
      if(changeSetType)
        port.define.type.setType = newType.setType;
      
      port.connectedFromPort.forEach((c) => c.updatePortValue());
      port.connectedToPort.forEach((c) => c.updatePortValue());
    }
  }
  /**
   * 更改参数端口的数据集合类型
   * @param port 参数端口
   * @param newSetType 新的集合类型
   */
  public changePortParamSetType(port : BluePrintFlowPort, newSetType: BluePrintParamSetType) : void {
    if(!port)
      logger.error(this.getName(), 'changePortParamType: Must provide port');
    else if(port.parent == this) {
      port.define.type.setType = newSetType;
      port.connectedFromPort.forEach((c) => c.updatePortValue());
      port.connectedToPort.forEach((c) => c.updatePortValue());
    }
  }

  public markContent = '';
  public markOpen = false;

  //编辑器使用数据
  //============================================

  public selected = false;
  public hover = false;
  public chunkInfo : ChunkInstance|null = null;
  public mouseDown = false;
  public mouseDownInPort = false;
  public mouseConnectingPort = false;
  /**
   * 是否需要修复位置移动到自身中心
   */
  public shouldMoveToSelfCenter = false;
  public lastMovedBlock = false;
  public mouseLastDownPos = new Vector2();
  public lastBlockPos = new Vector2();
  public lastBlockSize = new Vector2();
  public connectors = new Array<BluePrintFlowConnector>();
  public graph : BluePrintFlowGraph|null = null;
  public breakpointTriggered = false;
  

  /**
   * 获取当前单元编辑器实例信息
   */
  public editor : BluePrintEditorInstance|null = null;
  /**
   * 获取当前单元是否添加到编辑器中
   */
  public isAddToEditor = false;

  public callbackGetRealSize : (() => Vector2)|null = null;
  public callbackUpdateRegion : VoidDelegate|null = null;
  public callbackGetCurrentSizeType : (() => number)|null = null;
  public callbackForceUpdate : VoidDelegate|null = null;
  public callbackTwinkle : ((time: number) => void)|null = null;

  //实时事件
  //============================================

  public onSave = new EventHandler<(block: BluePrintFlowBlock) => void>();

  //实时状态获取
  //============================================

  public forceUpdate() : void {
    if(typeof this.forceUpdate === 'function')
      this.forceUpdate();
  }
  /**
   * 获取单元当前调整大小类型
   * @returns 
   */
  public getGetCurrentSizeTypee() : number  {
    if(typeof this.callbackGetCurrentSizeType === 'function')
      return this.callbackGetCurrentSizeType();
    return 0;
  }
  /**
   * 获取单元真实大小
   * @returns 
   */
  public getRealSize() : Vector2  {
    if(typeof this.callbackGetRealSize === 'function') {
      return this.callbackGetRealSize();
    }
    return this.customSize;
  }
  /**
   * 获取当前单元矩形
   * @returns 
   */
  public getRealRect() : Rect {
    const rect = new Rect();
    rect.setPos(this.position);
    rect.setSize(this.getRealSize());
    return rect;
  }
  /**
   * 更新单元编辑器区块信息。在更改位置、大小之后必须调用才能让区块检测器正常检测。
   */
  public updateRegion() : void {
    if(typeof this.callbackUpdateRegion === 'function')
      this.callbackUpdateRegion();
  }
  /**
   * 更新移动之前的位置
   */
  public updateLastPos() : void { this.lastBlockPos.set(this.position); }
  /**
   * 闪烁
   */
  public twinkle(time = 1000) : void {
    if(typeof this.callbackTwinkle === 'function') 
      return this.callbackTwinkle(time);
  }

}
export class BluePrintFlowBlockDefine implements IBluePrintFlowBlockDefine {
  public guid = '';
  public name = '';
  public category = '';
  public description = '';
  public version = 0;
  public hideInAddPanel = false;
  public oneBlockOnly = false;
  public userCanAddInputExecute = false;
  public userCanAddOutputExecute = false;
  public userCanAddInputParam = false;
  public userCanAddOutputParam = false;
  public canNotDelete = false;
  public style : BluePrintFlowBlockStyleSettings;
  public events : IBluePrintFlowBlockEventSettings = {} as IBluePrintFlowBlockEventSettings;
  public ports : Array<IBluePrintFlowPortDefine> = [];
  public menu : BluePrintFlowBlockMenuSettings = new BluePrintFlowBlockMenuSettings();

  public constructor(define : IBluePrintFlowBlockDefine) {
    this.guid = define.guid;
    this.name = define.name;
    this.description = CommonUtils.defaultIfUndefined(define.description, '');
    this.category = CommonUtils.defaultIfUndefined(define.category, '');
    this.ports = CommonUtils.defaultIfUndefined(define.ports, this.ports);
    this.oneBlockOnly = CommonUtils.defaultIfUndefined(define.oneBlockOnly, this.oneBlockOnly);
    this.events = CommonUtils.defaultIfUndefined(define.events, this.events);
    this.userCanAddInputExecute = CommonUtils.defaultIfUndefined(define.userCanAddInputExecute, this.userCanAddInputExecute);
    this.userCanAddOutputExecute = CommonUtils.defaultIfUndefined(define.userCanAddOutputExecute, this.userCanAddOutputExecute);
    this.userCanAddInputParam = CommonUtils.defaultIfUndefined(define.userCanAddInputParam, this.userCanAddInputParam);
    this.userCanAddOutputParam = CommonUtils.defaultIfUndefined(define.userCanAddOutputParam, this.userCanAddOutputParam);
    this.canNotDelete = CommonUtils.defaultIfUndefined(define.canNotDelete, this.canNotDelete);
    this.version = define.version;
    this.style = new BluePrintFlowBlockStyleSettings(define.style);
    this.menu = CommonUtils.defaultIfUndefined(define.menu, this.menu);
  }
}
export class BluePrintFlowBlockStyleSettings implements IBluePrintFlowBlockStyleSettings  {

  public constructor(define ?: IBluePrintFlowBlockStyleSettings) {
    if(define) {
      this.logo = CommonUtils.defaultIfUndefined(define.logo, this.logo);
      this.logoRight = CommonUtils.defaultIfUndefined(define.logoRight, this.logoRight);
      this.logoBottom = CommonUtils.defaultIfUndefined(define.logoBottom, this.logoBottom);
      this.logoBackground = CommonUtils.defaultIfUndefined(define.logoBackground, this.logoBackground);
      this.titleBakgroundColor = CommonUtils.defaultIfUndefined(define.titleBakgroundColor, this.titleBakgroundColor);
      this.titleColor = CommonUtils.defaultIfUndefined(define.titleColor, this.titleColor);
      this.titleState = CommonUtils.defaultIfUndefined(define.titleState, this.titleState);
      this.userResize = CommonUtils.defaultIfUndefined(define.userResize, this.userResize);
      this.noTooltip = CommonUtils.defaultIfUndefined(define.noTooltip, this.noTooltip);
      this.noComment = CommonUtils.defaultIfUndefined(define.noComment, this.noComment);
      this.minWidth = CommonUtils.defaultIfUndefined(define.minWidth, this.minWidth);
      this.minHeight = CommonUtils.defaultIfUndefined(define.minHeight, this.minHeight);
      this.maxWidth = CommonUtils.defaultIfUndefined(define.maxWidth, this.maxWidth);
      this.maxHeight = CommonUtils.defaultIfUndefined(define.maxHeight, this.maxHeight);
      this.layer = CommonUtils.defaultIfUndefined(define.layer, this.layer);
      this.customClassNames = CommonUtils.defaultIfUndefined(define.customClassNames, this.customClassNames);
    }
  }

  public logo = require('../../assets/images/BlockIcon/function.svg');
  public logoRight = "";
  public logoBottom = "";
  public logoBackground = "";
  public titleBakgroundColor = 'rgba(255,255,255,0.3)';
  public titleColor = '#fff';
  public titleState : 'normal'|'small'|'hide'|false = 'normal';
  public userResize : 'width'|'height'|'all'|false = false;
  public noTooltip = false;
  public noComment = false;
  public noLogo = false;
  public minWidth = 0;
  public minHeight = 0;
  public maxWidth = 0;
  public maxHeight = 0;
  public layer : 'normal'|'background' = 'normal';
  public customClassNames = "";

}

export interface MenuItemForBlock {
  label ?: string,
  icon ?: string,
  disabled ?: boolean,
  divided ?: boolean,
  customClass ?: string,
  maxWidth ?: number,
  minWidth ?: number,
  onClick ?: (this: BluePrintFlowBlock) => void,
  children ?: MenuItemForBlock[],
}

export class BluePrintFlowBlockMenuSettings  {
  /**
   * 自定义菜单
   */
  public items : Array<MenuItemForBlock> = [];
}