import { BluePrintEditorInstance } from "@/model/BluePrintEditor";
import HtmlUtils from "@/model/Utils/HtmlUtils";

/**
 * 编辑器键盘事件处理
 * @returns 
 */
export function useEditorKeyEvents(
  editor : BluePrintEditorInstance
) {

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
        if(keyAltDown) editor.selectAllConnectors();
        else if(keyControlDown) editor.selectAllBlocks();
        break;
      case 'Delete': 
        if(keyAltDown) editor.deleteSelectedConnectors();
        else editor.deleteSelectedBlocks();
        break;
    }
  }

  editor.isKeyAltDown = () => keyAltDown;
  editor.isKeyControlDown = () => keyControlDown;

  return {
    onKeyDown,
    onKeyUp,
  }
}