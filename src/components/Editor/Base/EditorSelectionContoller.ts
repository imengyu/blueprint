import { Rect } from "@/model/Base/Rect";
import { BluePrintEditorInstance } from "@/model/BluePrintEditor";
import { BluePrintFlowBlock } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "@/model/Flow/BluePrintFlowConnector";
import { ref, SetupContext, watch } from "vue";

/**
 * 编辑器用户选择控制模块
 * @param eventInfo 
 * @param editor 
 * @returns 
 */
export function useEditorSelectionContoller(
  editor : BluePrintEditorInstance,
  context : SetupContext
) {

  const selectBlocks = ref(new Array<BluePrintFlowBlock>());
  const selectConnectors = ref(new Array<BluePrintFlowConnector>());
  const isMulitSelect = ref(false);
  const isMultiSelected = ref(false);
  const multiSelectRect = ref(new Rect());

  /**
   * 取消选中所有连接线
   */
  function unSelectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    selectConnectors.value.clear();
    notifySelectConnectorChanged();
  }
  /**
   * 选中所有连接线
   */
  function selectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    selectConnectors.value.clear();
    notifySelectConnectorChanged();
  }
  /**
   * 取消选中所有单元
   */
  function unSelectAllBlocks() {
    selectBlocks.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    selectBlocks.value.clear();
    notifySelectBlockChanged();
  }
  /**
   * 选中当前编辑器中所有单元
   */
  function selectAllBlocks() {
    const _selectBlocks = selectBlocks.value;
    _selectBlocks.clear();
    editor.getBlocks().forEach((b) => {
      _selectBlocks.push(b);
      b.selected = true;
    });
    notifySelectBlockChanged();
  }
  /**
   * 取消选中某个单元
   */
  function unSelectBlock(block : BluePrintFlowBlock) {
    selectBlocks.value.remove(block);
    block.selected = false;
    notifySelectBlockChanged();
  }
  /**
   * 选中某个单元
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectBlock(block : BluePrintFlowBlock, append = false) {
    if(append) 
      selectBlocks.value.addOnce(block);
    else {
      unSelectAllBlocks();
      unSelectAllConnectors();
      selectBlocks.value.push(block);
    }
    block.selected = true;
    notifySelectBlockChanged();
  }
  //选择指定的单元
  function selectSomeBlocks(blocks : BluePrintFlowBlock[], append = false) {
    if(append) {
      blocks.forEach(element => {
        selectBlocks.value.addOnce(element);
        element.selected = true;
      });
    }
    else {
      unSelectAllBlocks();
      unSelectAllConnectors();
      blocks.forEach(block => {
        selectBlocks.value.push(block);
        block.selected = true;
      });
    }
    notifySelectBlockChanged();
  }

  //多选选择
  function doSelectBlocks() {
    const _multiSelectRect = multiSelectRect.value;
    const _selectBlocks = selectBlocks.value;
    const _mouseInfo = editor.getMouseInfo();

    //多选框的方向处理
    {
      if(_mouseInfo.mouseCurrentPosViewPort.x > _mouseInfo.mouseDownPosViewPort.x) {
        _multiSelectRect.x = _mouseInfo.mouseDownPosViewPort.x;
        _multiSelectRect.w = _mouseInfo.mouseCurrentPosViewPort.x - _mouseInfo.mouseDownPosViewPort.x;
      }else {
        _multiSelectRect.x = _mouseInfo.mouseCurrentPosViewPort.x;
        _multiSelectRect.w = _mouseInfo.mouseDownPosViewPort.x - _mouseInfo.mouseCurrentPosViewPort.x;
      }
      if(_mouseInfo.mouseCurrentPosViewPort.y > _mouseInfo.mouseDownPosViewPort.y) {
        _multiSelectRect.y = _mouseInfo.mouseDownPosViewPort.y;
        _multiSelectRect.h = _mouseInfo.mouseCurrentPosViewPort.y - _mouseInfo.mouseDownPosViewPort.y;
      }else {
        _multiSelectRect.y = _mouseInfo.mouseCurrentPosViewPort.y;
        _multiSelectRect.h = _mouseInfo.mouseDownPosViewPort.y - _mouseInfo.mouseCurrentPosViewPort.y;
      }
    }
    //多选单元和连接
    if(_multiSelectRect.w > 0 && _multiSelectRect.h > 0) {

      //选择单元
      const castBlocks = editor.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "block");
      const thisTimeSelectedBlock = new Array<BluePrintFlowBlock>();
      castBlocks.forEach((i) => {
        const block = editor.getBlocks().get(i.data as string);
        if(block) thisTimeSelectedBlock.addOnce(block);
      });
      for (let i = _selectBlocks.length - 1; i >= 0; i--) {
        const b = _selectBlocks[i] as BluePrintFlowBlock;
        if(!thisTimeSelectedBlock.contains(b)) {
          b.selected = false;
          _selectBlocks.remove(b);
        } else 
          thisTimeSelectedBlock.remove(b);
      }
      thisTimeSelectedBlock.forEach((b) => {
        b.selected = true;
        _selectBlocks.addOnce(b);
      });

      //选择单元
      selectConnectors.value.forEach((c) => {
        c.hover = false;
        c.selected = false;
      });
      selectConnectors.value.clear();
      editor.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "connector").forEach((i) => {
        const connector = editor.getConnectors().get(i.data as string);
        if(connector) selectConnectors.value.push(connector);
      });

      isMultiSelected.value = true;
    } else {
      _selectBlocks.forEach((b) => b.selected = false);
      _selectBlocks.clear();
      isMultiSelected.value = false;
    }

    notifySelectBlockChanged();
  }

  /**
   * 取消选中某个连接线
   */
  function unSelectConnector(connector : BluePrintFlowConnector) {
    selectConnectors.value.remove(connector);
    connector.selected = false;

    notifySelectConnectorChanged();
  }
  /**
   * 选中某个连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectConnector(connector : BluePrintFlowConnector, append = false) {
    if(append) 
      selectConnectors.value.addOnce(connector);
    else {
      unSelectAllBlocks();
      unSelectAllConnectors();
      selectConnectors.value.push(connector);
    }
    connector.selected = true;

    notifySelectConnectorChanged();
  }

  editor.unSelectAllBlocks = unSelectAllBlocks;
  editor.unSelectAllConnectors = unSelectAllConnectors;
  editor.unSelectConnector = unSelectConnector;
  editor.unSelectBlock = unSelectBlock;
  editor.selectBlock = selectBlock;
  editor.selectSomeBlocks = selectSomeBlocks;
  editor.selectAllBlocks = selectAllBlocks;
  editor.selectAllConnectors = selectAllConnectors;
  editor.selectConnector = selectConnector;
  editor.doSelectBlocks = doSelectBlocks;
  editor.getSelectBlocks = () => selectBlocks.value as Array<BluePrintFlowBlock>;
  editor.getSelectBlockCount = () => selectBlocks.value.length;
  editor.getSelectConnectors = () => selectConnectors.value as Array<BluePrintFlowConnector>;
  editor.clearMulitSelect = () => {
    isMulitSelect.value = false;
    multiSelectRect.value.set(0, 0, 0, 0);
  }
  editor.startMulitSelect = () => { isMulitSelect.value = true; }
  editor.isMulitSelect = () => isMulitSelect.value;

  function notifySelectBlockChanged() {
    context.emit('select-block-changed', selectBlocks.value, editor)
  }
  function notifySelectConnectorChanged() {
    context.emit('select-connector-changed', selectConnectors.value, editor)
  }

  return {
    selectBlocks,
    selectConnectors,
    isMulitSelect,
    isMultiSelected,
    multiSelectRect,
  }
}