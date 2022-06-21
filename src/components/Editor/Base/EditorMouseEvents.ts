import { Vector2 } from "@/model/Base/Vector2";
import { BluePrintEditorInstance } from "@/model/BluePrintEditor";
import { BluePrintEditorMouseInfo } from "@/model/BluePrintEditorBase";
import { BluePrintFlowConnector } from "@/model/Flow/BluePrintFlowConnector";
import { ref } from "vue";
import HtmlUtils from "@/model/Utils/HtmlUtils";

/**
 * 编辑器鼠标事件处理
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useEditorMouseEvents(editor: BluePrintEditorInstance) {
  const mouseInfo = new BluePrintEditorMouseInfo();
  const mouseDownViewPortPos = new Vector2();

  const isDragView = ref(false);

  //#region 连接线的鼠标选择判断

  const lastHoverConnector = new Array<BluePrintFlowConnector>();

  function isAnyConnectorHover() {
    return lastHoverConnector.length > 0;
  }
  function connectorCast() {
    const _mousePos = editor.getMouseInfo().mouseCurrentPosViewPort;
    const _viewScale = editor.getViewPort().scale;

    lastHoverConnector.forEach((i) => (i.hoverChecked = false));
    editor
      .getBaseChunkedPanel()
      .testPointCastTag(_mousePos, "connector")
      .forEach((i) => {
        const connector = editor.getConnectors().get(i.data as string);
        if (connector && connector.testInConnector(_mousePos, _viewScale)) {
          connector.hoverChecked = true;
          connector.hover = true;
          lastHoverConnector.addOnce(connector);
        }
      });
    for (let i = lastHoverConnector.length - 1; i >= 0; i--) {
      const connector = lastHoverConnector[i];
      if (!connector.hoverChecked) {
        connector.hover = false;
        lastHoverConnector.removeIndex(i);
      }
    }
  }
  function selectOneConnector() {
    const _mousePos = editor.getMouseInfo().mouseCurrentPosViewPort;
    const _viewScale = editor.getViewPort().scale;
    const pointCastConnectors = editor
      .getBaseChunkedPanel()
      .testPointCastTag(_mousePos, "connector");
    if (pointCastConnectors.length > 0) {
      for (let i = 0; i < pointCastConnectors.length; i++) {
        const connector = editor
          .getConnectors()
          .get(pointCastConnectors[i].data as string);
        if (connector && connector.testInConnector(_mousePos, _viewScale)) {
          connector.hoverChecked = true;
          connector.hover = true;
          editor.selectConnector(connector, false);
          return true;
        }
      }
    }
    return false;
  }

  //#endregion

  function onDocunmentMouseUp(e: MouseEvent) {
    document.removeEventListener("mousemove", onDocunmentMouseMove);
    document.removeEventListener("mouseup", onDocunmentMouseUp);

    updateMousePos(e);

    //鼠标放开，刷新相应状态
    if (mouseInfo.mouseDowned) {
      if (!mouseInfo.mouseMoved) {
        editor.unSelectAllBlocks();
        editor.unSelectAllConnectors();

        if (editor.selectOneConnector()) {
          // 选中了一个连接线
          const selectConnectors = editor.getSelectConnectors();
          if (editor.isKeyAltDown() && selectConnectors.length > 0)
            //Alt按下，删除连接线
            editor.unConnectConnector(
              selectConnectors[0] as BluePrintFlowConnector
            );
        } else {
          //显示添加单元弹出菜单
          if (e.button == 2) {
            const viewPort = editor.getViewPort();
            const addBlockPos = new Vector2();
            viewPort.screenPointToViewportPoint(new Vector2(e.x, e.y), addBlockPos);
            editor.showAddBlockPanel(
              viewPort.fixScreenPosWithEditorAbsolutePos(new Vector2(e.x, e.y)),
              null,
              null,
              addBlockPos,
            );
          }
        }
      }
    }

    mouseInfo.mouseDowned = false;
    mouseInfo.mouseMoved = false;

    isDragView.value = false;

    editor.clearMulitSelect();
  }
  function onDocunmentMouseMove(e: MouseEvent) {

    updateMousePos(e);

    if (
      !mouseInfo.mouseMoved &&
      !mouseInfo.mouseCurrentPosScreen.equal(
        mouseInfo.mouseDownPosScreen
      )
    )
    mouseInfo.mouseMoved = true;

    //如果按下并且移动
    if (mouseInfo.mouseMoved && mouseInfo.mouseDowned) {
      if (isDragView.value) {
        //移动视图
        editor
          .getViewPort()
          .position.set(
            mouseDownViewPortPos.x -
              (mouseInfo.mouseCurrentPosScreen.x -
                mouseInfo.mouseDownPosScreen.x),
            mouseDownViewPortPos.y -
              (mouseInfo.mouseCurrentPosScreen.y -
                mouseInfo.mouseDownPosScreen.y)
          );
      } else if (editor.isMulitSelect()) editor.doSelectBlocks(); //多选框
    }
  }
  function onMouseDown(e: MouseEvent) {
    if (HtmlUtils.isEventInControl(e)) return;

    const viewPort = editor.getViewPort();

    //坐标更新
    mouseInfo.mouseMoved = false;
    mouseInfo.mouseDownPosScreen.set(e.x, e.y);
    viewPort.screenPointToViewportPoint(mouseInfo.mouseDownPosScreen, mouseInfo.mouseDownPosViewPort);
    updateMousePos(e);
    mouseDownViewPortPos.set(viewPort.position);

    if (!(e.target as HTMLElement).className.contains("editor-drag-area"))
      return;

    mouseInfo.mouseDowned = true;

    //按下后结束连接
    if (editor.getConnectingInfo().isConnectingToNew) {
      editor.endConnectToNew();
      editor.closeAddBlockPanel();
    }

    //左键
    if (e.buttons == 1) editor.startMulitSelect();
    //右键
    else if (e.buttons == 2) isDragView.value = true; //移动视图

    document.addEventListener("mouseup", onDocunmentMouseUp);
    document.addEventListener("mousemove", onDocunmentMouseMove);
  }
  function onMouseMove(e: MouseEvent) {
    if (!mouseInfo.mouseDowned) {
      updateMousePos(e);
      connectorCast();
    }
  }
  function onMouseWhell(e: WheelEvent) {
    updateMousePos(e);
    e.preventDefault();

    //TODO: 缩放功能
  }

  //更新鼠标坐标
  function updateMousePos(e: MouseEvent) {
    const viewPort = editor.getViewPort();
    mouseInfo.mouseCurrentPosScreen.x = e.clientX;
    mouseInfo.mouseCurrentPosScreen.y = e.clientY;
    viewPort.screenPointToViewportPoint(
      mouseInfo.mouseCurrentPosScreen,
      mouseInfo.mouseCurrentPosViewPort
    );
  }

  editor.isAnyConnectorHover = isAnyConnectorHover;
  editor.selectOneConnector = selectOneConnector;
  editor.updateMousePos = updateMousePos;
  editor.getMouseInfo = () => mouseInfo;
  
  return {
    isDragView,
    onMouseDown,
    onMouseMove,
    onMouseWhell,
  };
}
