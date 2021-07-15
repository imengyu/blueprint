import logger from "@/model/Base/Logger";
import { Rect } from "@/model/Base/Rect";
import { BluePrintEditorInstance, IBluePrintEditorEventSettings } from "@/model/BluePrintEditor";
import { ChunkedPanel, ChunkInstance } from "@/model/Cast/ChunkedPanel";
import { BluePrintFlowBlock } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "@/model/Flow/BluePrintFlowConnector";
import { BluePrintFlowGraph } from "@/model/Flow/BluePrintFlowDoc";
import { ref, SetupContext } from "vue";

export function useEditorGraphController(
  eventInfo: IBluePrintEditorEventSettings,
  editor : BluePrintEditorInstance,
  context : SetupContext
) {

  let openGraphLocked = false;

  //#region 基础单元与连接管理

  const chunkedPanel = ref(new ChunkedPanel());
  const blockMap = ref(new Map<string, BluePrintFlowBlock>());
  const blockMapBackground = ref(new Map<string, BluePrintFlowBlock>());
  const connectors = ref(new Map<string, BluePrintFlowConnector>());

  /**
   * 添加单元至当前编辑器中
   */
  function addBlock(block: BluePrintFlowBlock) {
    block.editor = editor;
    block.isAddToEditor = true;
    block.chunkInfo = new ChunkInstance(
      block.getRealRect(),
      "block",
      block.uid
    );
    block.updateLastPos();
    if (block.define.style.layer === "normal") blockMap.value.set(block.uid, block);
    else blockMapBackground.value.set(block.uid, block);

    currentGraph.value?.blocks.set(block.uid, block);
    chunkedPanel.value.addInstance(block.chunkInfo);

    if (typeof block.define.events.onAddToEditor === "function")
      block.define.events.onAddToEditor(block);

    setTimeout(() => {
      block.updateRegion();
    }, 300);
  }
  /**
   * 从当前编辑器中移除单元
   */
  function removeBlock(block: BluePrintFlowBlock) {
    block.editor = null;
    block.isAddToEditor = false;
    if (block.define.style.layer === "normal") blockMap.value.delete(block.uid);
    else blockMapBackground.value.delete(block.uid);

    currentGraph.value?.blocks.delete(block.uid);

    //断开当前单元连接
    if (block.connectors.length > 0) {
      for (let i = block.connectors.length - 1; i >= 0; i--) 
        editor.unConnectConnector(block.connectors[i]);
    }
    if (block.chunkInfo) {
      chunkedPanel.value.removeInstance(block.chunkInfo);
      block.chunkInfo = null;
    }

    if (typeof block.define.events.onRemoveFormEditor === "function")
      block.define.events.onRemoveFormEditor(block);
  }
  function addConnector(connector: BluePrintFlowConnector) {
    connectors.value.set(connector.uid, connector);
    currentGraph.value?.connectors.push(connector);
    connector.startPort?.parent.connectors.addOnce(connector);
    connector.endPort?.parent.connectors.addOnce(connector);

    //更新
    setTimeout(() => {
      if (connector != null) {
        connector.chunkInfo = new ChunkInstance(
          connector.updateRegion(),
          "connector",
          connector.uid
        );
        chunkedPanel.value.addInstance(connector.chunkInfo);
      }
    }, 200);
  }
  function removeConnector(connector: BluePrintFlowConnector) {
    if (connector.chunkInfo) {
      chunkedPanel.value.removeInstance(connector.chunkInfo);
      connector.chunkInfo = null;
    }
    const start = connector.startPort,
      end = connector.endPort;
    if (start != null) start.parent.connectors.remove(connector);
    if (end != null) end.parent.connectors.remove(connector);
    connectors.value.delete(connector.uid);
    currentGraph.value?.connectors.remove(connector);
  }
  /**
   * 计算一些单元的矩形区域
   * @param blocks 要计算的单元
   */
  function calcBlocksRegion(blocks : BluePrintFlowBlock[]) : Rect {
    let x = 0, y = 0, r = 0, b = 0;
    blocks.forEach((block) => {
      const size = block.getRealSize();

      if(x == null || block.position.x < x) x = block.position.x;
      if(y == null || block.position.y < y) y = block.position.y;

      if(r == null || block.position.x + size.x > r) r = block.position.x + size.x;
      if(b == null || block.position.y + size.y > b) b = block.position.y + size.y;
    })
    return new Rect(x, y, r - x, b - y);
  }

  //#endregion

  //#region 流图加载管理

  const currentGraph = ref<BluePrintFlowGraph>();

  function openGraph(graph: BluePrintFlowGraph) {
    
    if(currentGraph.value) {
      if(openGraphLocked) {
        logger.warning('EditorGraphController', 'This editor is locked to open the document. No other files can be opened now.');
        return;
      }
      if(currentGraph.value == graph) return;
      else closeGraph();
    }

    currentGraph.value = graph;

    //加载数据至编辑器中
    const _currentGraph = currentGraph.value;
    _currentGraph.blocks.forEach((v) => addBlock(v));
    _currentGraph.connectors.forEach((v) => addConnector(v));
    _currentGraph.loadStatus = 'loading';
    _currentGraph.activeEditor = editor;
    //设置视口
    editor.getViewPort().set(_currentGraph.viewPort);
  }
  function closeGraph() {
    const _currentGraph = currentGraph.value;
    if(_currentGraph) {
      _currentGraph.loadStatus = 'notload';
      _currentGraph.activeEditor = null;
      currentGraph.value = undefined;
    }
    //清空 
    blockMap.value.forEach((v) => v.connectors.clear());
    blockMapBackground.value.forEach((v) => v.connectors.clear());
    blockMap.value.clear();
    blockMapBackground.value.clear();
    connectors.value.clear();
  }
  function markGraphChanged() {
    if(currentGraph.value) {
      currentGraph.value.fileChanged = true;
      if(typeof eventInfo.onGraphChanged === 'function')
        eventInfo.onGraphChanged(currentGraph.value);
      context.emit('file-updated');
    }
  }

  //#endregion

  editor.addBlock = addBlock,
  editor.removeBlock = removeBlock;
  editor.addConnector = addConnector;
  editor.removeConnector = removeConnector;

  editor.getConnectors = () => connectors.value;
  editor.getBlocks = (layer) => {
    return layer === 'background' ? blockMapBackground.value : blockMap.value
  };
  editor.getBaseChunkedPanel = () => chunkedPanel.value as ChunkedPanel;
  
  editor.openGraph = openGraph;
  editor.closeGraph = closeGraph;
  editor.lockOpenGraph = () => openGraphLocked = true;
  editor.getCurrentGraph = () => currentGraph.value || null;
  editor.markGraphChanged = markGraphChanged;

  editor.calcBlocksRegion = calcBlocksRegion;

  return {
    chunkedPanel,
    blockMap,
    blockMapBackground,
    connectors,
    currentGraph,
  };
}
