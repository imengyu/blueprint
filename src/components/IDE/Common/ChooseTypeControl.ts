import { Vector2 } from "@/model/Base/Vector2";
import { ChooseTypePanelCallback } from "@/model/BluePrintEditor";
import { BluePrintEditorViewport } from "@/model/BluePrintEditorBase";
import { BluePrintParamType } from "@/model/Flow/BluePrintParamType";
import { reactive, ref } from "vue";

/**
 * 选择类型菜单控制
 * @param viewPort 当前编辑器视口
 * @returns 
 */
export function useChooseTypeControl(viewPort ? : BluePrintEditorViewport) {
  const instanceChooseTypePanel = ref();

  const chooseTypePanel = reactive({
    show: false,
    pos: new Vector2(),
    canBeAny: false,
    canBeExecute: false,
    maxHeight: 400,
    callback: (() => {/*TT */}) as ChooseTypePanelCallback,
  });

  function onTypeItemClick(type : BluePrintParamType, isBaseType : boolean) {
    if (typeof chooseTypePanel.callback == "function") {
      chooseTypePanel.show = false;
      chooseTypePanel.callback(type, isBaseType);
    }
  }
  /**
   * 显示选择类型菜单
   */
  function showChooseTypePanel(screenPos: Vector2, canbeExecute: boolean, canbeAny: boolean, callback: ChooseTypePanelCallback) {
    chooseTypePanel.pos.set(screenPos);
    chooseTypePanel.show = true;
    chooseTypePanel.canBeAny = canbeAny;
    chooseTypePanel.canBeExecute = canbeExecute;
    chooseTypePanel.callback = callback;
    chooseTypePanel.maxHeight = (viewPort?.size.y || 600) - screenPos.y;

    if (screenPos.x + 300 > window.innerWidth)
      chooseTypePanel.pos.x -= chooseTypePanel.pos.x + 300 - window.innerWidth;
    if (chooseTypePanel.maxHeight > 500) chooseTypePanel.maxHeight = 500;
    else if (chooseTypePanel.maxHeight < 222) {
      chooseTypePanel.pos.y -= 222 - chooseTypePanel.maxHeight;
      chooseTypePanel.maxHeight = 222;
    }
    instanceChooseTypePanel.value.focus();
  }
  /**
   * 关闭选择类型菜单
   */
  function closeChooseTypePanel() {
    chooseTypePanel.show = false;
  }

  return {
    instanceChooseTypePanel,
    chooseTypePanel,
    onTypeItemClick,
    showChooseTypePanel,
    closeChooseTypePanel
  }
}