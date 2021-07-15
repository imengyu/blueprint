import { Vector2 } from "@/model/Base/Vector2";
import { BluePrintEditorInstance, IBluePrintEditorEventSettings, IConnectingInfo } from "@/model/BluePrintEditor";
import { BluePrintFlowBlock, BluePrintFlowBlockDefine } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "@/model/Flow/BluePrintFlowConnector";
import { BluePrintFlowPort, BluePrintFlowPortDirection } from "@/model/Flow/BluePrintFlowPort";
import { BluePrintParamType, BluePrintParamTypeConverterDefine } from "@/model/Flow/BluePrintParamType";
import BlockRegisterService from "@/model/Services/BlockRegisterService";
import ParamTypeService from "@/model/Services/ParamTypeService";
import MathUtils from "@/model/Utils/MathUtils";
import StringUtils from "@/model/Utils/StringUtils";
import { reactive } from "vue";

/**
 * 单元连接管理
 * @returns 
 */
export function useEditorConnectorController(
  eventInfo: IBluePrintEditorEventSettings,
  editor : BluePrintEditorInstance
) : {
  connectingInfo: IConnectingInfo
} {

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
              //设置转换器，在连接的时候会进行添加
              connectingInfo.shouldAddConverter = true;
              connectingInfo.nextAddConverter = converter;
              connectingInfo.canConnect = true;
              connectingInfo.successText = `转换 ${startType.getNameString()} 至 ${endType.getNameString()}`;
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
        connectingInfo.currentHoverPort.state = connectingInfo.currentHoverPort.isConnected() ? 'active' : 'normal';
        connectingInfo.currentHoverPort = null;
      }
      connectingInfo.isSamePort = false;
      connectingInfo.isFail = false;
    }
  }
  function updateConnectEnd(pos : Vector2) {
    if(!connectingInfo.isConnectingToNew) {
      editor.getViewPort().screenPointToViewportPoint(pos, connectingInfo.endPos);
    }
  }
  //使用转换器连接两个端口
  function connectConnectorWithConverter() {

    if(!connectingInfo.nextAddConverter || !connectingInfo.startPort || !connectingInfo.currentHoverPort)
      return;

    const convBlock = new BluePrintFlowBlock(BlockRegisterService.getBaseBlock('Convert') as BluePrintFlowBlockDefine);

    convBlock.options['coverterFrom'] = connectingInfo.nextAddConverter.fromType.toString();
    convBlock.options['coverterTo'] = connectingInfo.nextAddConverter.toType.toString();
    convBlock.position.set(
      MathUtils.calcVectorCenter(connectingInfo.startPort.getPortPositionViewport(), connectingInfo.currentHoverPort.getPortPositionViewport()) //计算两个端点的中心位置
    );
    convBlock.shouldMoveToSelfCenter = true;
    convBlock.load({});

    editor.addBlock(convBlock);

    //将两个端口连接至转换器上

    const startPot = (connectingInfo.startPort.direction === 'output' ? connectingInfo.startPort : connectingInfo.currentHoverPort) as BluePrintFlowPort;
    const endPot = (connectingInfo.currentHoverPort.direction === 'input' ? connectingInfo.currentHoverPort : connectingInfo.startPort) as BluePrintFlowPort;

    editor.connectConnector(startPot, convBlock.getPortByGUID('INPUT') as BluePrintFlowPort);
    editor.connectConnector(convBlock.getPortByGUID('OUTPUT') as BluePrintFlowPort, endPot);
  }
  function startConnect(port : BluePrintFlowPort) {
    connectingInfo.startPort = port;
    connectingInfo.isConnecting = true;
    port.state = 'active';
  }
  function endConnect(port ?: BluePrintFlowPort) {
    if(port)
      port.state = 'normal';

    //连接到新的节点
    if(connectingInfo.currentHoverPort == null && connectingInfo.startPort != null) {

      connectingInfo.otherSideRequireType = connectingInfo.startPort.define.type;
      connectingInfo.otherSideRequireDirection = connectingInfo.startPort.direction === 'input' ? 'output' : 'input';

      const viewPort =  editor.getViewPort();
      const panelPos = new Vector2();
      viewPort.viewportPointToScreenPoint(connectingInfo.endPos, panelPos);
      editor.showAddBlockPanel(
        viewPort.fixScreenPosWithEditorAbsolutePos(panelPos), 
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
        editor.connectConnector(connectingInfo.startPort as BluePrintFlowPort, connectingInfo.currentHoverPort as BluePrintFlowPort);
        connectingInfo.startPort = null;
      }
    }

    connectingInfo.isConnecting = false;
    
    if(connectingInfo.startPort != null) {
      connectingInfo.startPort.state = connectingInfo.startPort.isConnected() ? 'active' : 'normal';
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
      editor.connectConnector(connectingInfo.startPort as BluePrintFlowPort, port);

      connectingInfo.otherSideRequireType = null;
    }

    connectingInfo.isConnectingToNew = false;
    connectingInfo.isConnecting = false;
    
    if(connectingInfo.startPort != null) {
      connectingInfo.startPort.state =  connectingInfo.startPort.isConnected() ? 'active' : 'normal';
      connectingInfo.startPort = null;
    }
    return port;
  }
  /**
   * 连接单元
   * @param start 开始端口
   * @param end 结束端口
   */
  function connectConnector(
    startPort: BluePrintFlowPort,
    endPort: BluePrintFlowPort
  ) {
    const invokeOnPortConnect = (
      startPort: BluePrintFlowPort,
      endPort: BluePrintFlowPort
    ) => {
      if (eventInfo.onPortConnect) eventInfo.onPortConnect(startPort, endPort);
      if (startPort.parent.define.events.onPortConnect) startPort.parent.define.events.onPortConnect(startPort.parent, startPort);
      if (endPort.parent.define.events.onPortConnect) endPort.parent.define.events.onPortConnect(endPort.parent, endPort);

      //两个端口有一个是弹性端口，并且两者类型不一样，则触发弹性端口事件
      if(!startPort.define.type.equals(endPort.define.type)) {
        if(startPort.define.type.isAny() && startPort.define.isFlexible) {
          if (startPort.parent.define.events.onFlexPortConnect) 
            startPort.parent.define.events.onFlexPortConnect(startPort.parent, startPort, endPort);
        } else if(endPort.define.type.isAny() && endPort.define.isFlexible) {
          if (endPort.parent.define.events.onFlexPortConnect) 
          endPort.parent.define.events.onFlexPortConnect(endPort.parent, endPort, startPort);
        }
      }
    };

    //新建链接
    let connector: BluePrintFlowConnector | null = null;

    //根据方向链接节点
    if (startPort.direction == "output") {
      //如果已经链接上了，取消链接
      const connData = endPort.isConnectByPort(startPort);
      if (connData != null) {
        unConnectConnector(connData);
        editor.getConnectingInfo().isConnecting = false;
        return null;
      }

      connector = new BluePrintFlowConnector();

      //如果是行为端口，只能输出一条线路。取消连接之前的线路
      if (
        startPort.define.type.isExecute() &&
        startPort.connectedToPort.length >= 0
      )
        startPort.connectedToPort.forEach((d) => unConnectConnector(d));
      //如果是参数端口，只能输入一条线路。取消连接之前的线路
      if (
        !startPort.define.type.isExecute() &&
        endPort.connectedFromPort.length >= 0
      )
        endPort.connectedFromPort.forEach((d) => unConnectConnector(d));

      startPort.connectedToPort.push(connector);
      startPort.state = "active";
      endPort.connectedFromPort.push(connector);
      endPort.state = "active";

      invokeOnPortConnect(startPort, endPort);

      connector.startPort = startPort;
      connector.endPort = endPort;
    } else if (endPort.direction == "output") {
      //如果已经链接上了，取消链接
      const connData = startPort.isConnectByPort(endPort);
      if (connData != null) {
        unConnectConnector(connData);
        editor.getConnectingInfo().isConnecting = false;
        return null;
      }

      connector = new BluePrintFlowConnector();

      //如果是行为端口，只能输出一条线路。
      if (endPort.define.type.isExecute() && endPort.connectedToPort.length > 0)
        endPort.connectedToPort.forEach((d) => unConnectConnector(d));
      //如果是参数端口，只能输入一条线路。
      if (
        !startPort.define.type.isExecute() &&
        startPort.connectedFromPort.length > 0
      )
        startPort.connectedFromPort.forEach((d) => unConnectConnector(d));

      endPort.connectedToPort.push(connector);
      endPort.state = "active";
      startPort.connectedFromPort.push(connector);
      startPort.state = "active";

      invokeOnPortConnect(endPort, startPort);

      connector.startPort = endPort;
      connector.endPort = startPort;
    }

    //添加线段
    if (connector != null) {
      editor.addConnector(connector);
      connector.updatePortValue();
    }
    return connector;
  }
  /**
   * 取消连接单元
   * @param conn 对应连接
   */
  function unConnectConnector(connector: BluePrintFlowConnector) {
    const start = connector.startPort,
      end = connector.endPort;
    editor.removeConnector(connector);
    if (start != null && end != null) {

      start.removeConnectToPort(end);
      start.state = start.isConnected() ? 'active' : 'normal';
      end.removeConnectByPort(start);
      end.state = end.isConnected() ? 'active' : 'normal';

      if (eventInfo.onPortUnConnect) eventInfo.onPortUnConnect(start, end);
      if (start.parent.define.events.onPortUnConnect) start.parent.define.events.onPortUnConnect(start.parent, start);
      if (end.parent.define.events.onPortUnConnect) end.parent.define.events.onPortUnConnect(end.parent, end);
    }
  }
  //删除端口连接
  function unConnectPortConnectors(port: BluePrintFlowPort) {
    for (let i = port.connectedFromPort.length - 1; i >= 0; i--) 
      unConnectConnector(port.connectedFromPort[i]);
    for (let i = port.connectedToPort.length - 1; i >= 0; i--) 
      unConnectConnector(port.connectedToPort[i]);
  }
  //删除单元连接
  function unConnectBlockConnectors(block: BluePrintFlowBlock) {
    block.allPorts.forEach((p) => unConnectPortConnectors(p));
  }

  editor.updateCurrentHoverPort = updateCurrentHoverPort;
  editor.updateConnectEnd = updateConnectEnd;
  editor.startConnect = startConnect;
  editor.endConnect = endConnect;
  editor.endConnectToNew = endConnectToNew;
  editor.getCanConnect = getCanConnect;
  editor.getConnectingInfo = () => connectingInfo as IConnectingInfo;
  editor.connectConnector = connectConnector;
  editor.unConnectConnector = unConnectConnector;
  editor.unConnectPortConnectors = unConnectPortConnectors;
  editor.unConnectBlockConnectors = unConnectBlockConnectors;

  return {
    connectingInfo: connectingInfo as IConnectingInfo,
  }
}