import { Vector2 } from "@/model/Base/Vector2";
import { BluePrintEditorViewport } from "@/model/BluePrintEditorBase";
import { IBluePrintBackgroundRenderer, IBluePrintRenderer } from "@/model/BluePrintRenderer";
import { onBeforeUnmount, onMounted, Ref, ref } from "vue";
import HtmlUtils from "@/model/Utils/HtmlUtils";

/**
 * 当前全局索引编辑器信息
 * @returns 
 */
export function useEditorSizeChecker(editorHost : Ref<HTMLElement|undefined>, viewPort : Ref<BluePrintEditorViewport>) {

  const backgroundRenderer = ref<IBluePrintBackgroundRenderer>();
  const foregroundRenderer = ref<IBluePrintRenderer>();

  const lastViewSize = new Vector2();
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
      viewPort.value.editorAbsolutePos.set(HtmlUtils.getLeft(ele), HtmlUtils.getTop(ele));
    }
    return viewPort.value.editorAbsolutePos;
  }

  onMounted(() => {
    tickCheckTimer = setInterval(onEditorCheckTick);
    window.addEventListener('resize', onWindowSizeChanged);
  })
  onBeforeUnmount(() => {
    clearInterval(tickCheckTimer);
    window.removeEventListener('resize', onWindowSizeChanged);
  });

  return {
    backgroundRenderer,
    foregroundRenderer,
    onWindowSizeChanged,
  }
}