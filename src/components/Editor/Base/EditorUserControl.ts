import logger from "@/model/Base/Logger";
import { Vector2 } from "@/model/Base/Vector2";
import { BluePrintEditorInstance } from "@/model/BluePrintEditor";
import { ChunkInstance } from "@/model/Cast/ChunkedPanel";
import { BluePrintBreakPoint, BluePrintFlowBlock, BluePrintFlowBlockDefine } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "@/model/Flow/BluePrintFlowConnector";
import { BluePrintFlowPort } from "@/model/Flow/BluePrintFlowPort";
import BlockRegisterService from "@/model/Services/BlockRegisterService";

/**
 * 当前全局索引编辑器信息
 * @returns
 */
export function useEditorUserControl(
  editor : BluePrintEditorInstance
) {
  const userAddBlockInPos = new Vector2();
  let userAddBlockWithPosition = false;

  //用户删除单元
  function userDeleteBlock(block: BluePrintFlowBlock) {
    if (block.define.canNotDelete) return false;
    //自定义检查回调
    if (typeof block.define.events.onDeleteCheck == "function") {
      const err = block.define.events.onDeleteCheck(
        block,
        editor.getCurrentGraph()
      );
      if (err != null) {
        editor.showSmallTip(
          '<i class="iconfont icon-error-1 text-warning mr-2"></i>' + err
        );
        return false;
      }
    }

    block.graph = null;
    editor.removeBlock(block);
    return true;
  }

  //用户添加单元处理
  function userAddBlock(blockDefine: BluePrintFlowBlockDefine) : BluePrintFlowBlock|false {
    const currentGraph = editor.getCurrentGraph();
    if (!currentGraph) {
      editor.showSmallTip(
        '<i class="iconfont icon-info-1 text-info mr-2"></i>未打开图表，请先打开一个图表'
      );
      return false;
    }
    //检查单元是否只能有一个
    if (
      blockDefine.hideInAddPanel &&
      currentGraph.getBlocksByGUID(blockDefine.guid).length > 0
    ) {
      editor.showSmallTip(
        '<i class="iconfont icon-info-1 text-info mr-2"></i> 当前文档中已经有 ' +
          blockDefine.name +
          " 了，此单元只能有一个"
      );
      return false;
    }

    //自定义检查回调
    if (typeof blockDefine.events.onAddCheck == "function") {
      const err = blockDefine.events.onAddCheck(blockDefine, currentGraph);
      if (err != null) {
        editor.showSmallTip(
          '<i class="iconfont icon-error-1 text-warning mr-2"></i>' + err
        );
        return false;
      }
    }

    const newBlock = new BluePrintFlowBlock(blockDefine);
    newBlock.graph = currentGraph;
    newBlock.load({});

    const connectingInfo = editor.getConnectingInfo()

    if (userAddBlockWithPosition) {
      //在指定位置添加单元
      newBlock.position.set(userAddBlockInPos);
      editor.addBlock(newBlock);
    } else if (connectingInfo.isConnectingToNew) {
      //添加单元并连接

      newBlock.position.set(connectingInfo.endPos);
      editor.addBlock(newBlock);

      setTimeout(() => {
        const port = editor.endConnectToNew(newBlock);
        if (!port || !port.getPortPositionRelative) return;
        const pos = port.getPortPositionRelative();
        pos.x = connectingInfo.endPos.x - pos.x;
        pos.y = connectingInfo.endPos.y - pos.y;

        newBlock.position.set(pos);
        newBlock.updateRegion();
      }, 200);
    } else {
      //在屏幕中央位置添加单元
      const center = editor.getViewPort().rect().calcCenter();
      newBlock.position.set(center);
      editor.addBlock(newBlock);
    }
    return newBlock;
  }

  //删除选中的单元
  function deleteSelectedBlocks() {
    editor.getSelectBlocks().forEach((block) => {
      if (block.define.canNotDelete) return;
      //自定义检查回调
      if (typeof block.define.events.onDeleteCheck == "function") {
        const err = block.define.events.onDeleteCheck(
          block as BluePrintFlowBlock,
          editor.getCurrentGraph()
        );
        if (err != null) {
          logger.warning(
            "Editor",
            `无法删除单元 ${block.define.name} ( ${block.uid}) : ${err}`
          );
          return;
        }
      }
      block.graph = null;
      editor.removeBlock(block as BluePrintFlowBlock);
    });
    editor.getSelectBlocks().clear();
  }
  //删除选中的连接
  function deleteSelectedConnectors() {
    editor.getSelectConnectors().forEach((c) =>
      editor.unConnectConnector(c as BluePrintFlowConnector)
    );
    editor.getSelectConnectors().clear();
  }
  //删除选中单元的连接
  function unConnectSelectedBlockConnectors() {
    editor.getSelectBlocks().forEach((block) => 
      editor.unConnectBlockConnectors(block)
    );
  }
  //拉直连接
  function straightenConnector(refPort : BluePrintFlowPort, connector : BluePrintFlowConnector) {

    if(!connector.startPort || !connector.endPort)
      return;

    const refPos = refPort.getPortPositionViewport();
    let block : BluePrintFlowBlock|null = null;
    let oldPos : Vector2|null = null;

    if(connector.startPort == refPort) {
      block = connector.endPort.parent;
      oldPos = connector.endPort.getPortPositionViewport();
    }
    else if(connector.endPort == refPort)  {
      block = connector.startPort.parent;
      oldPos = connector.startPort.getPortPositionViewport();
    }

    if(block && oldPos) {
      const offPos = oldPos.y - block.position.y;
      block.position = new Vector2(block.position.x, refPos.y - offPos);
      updateBlockForMoveEnd(block);
    }

    editor.markGraphChanged();
  }
  //对齐单元
  function alignSelectedBlock(baseBlock : BluePrintFlowBlock, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') {
    const selectedBlocks = editor.getSelectBlocks();
    const baseBlockSize = baseBlock.getRealSize();
    switch(align) {
      case 'left':
        selectedBlocks.forEach((b) => {
          b.position = new Vector2(baseBlock.position.x, b.position.y);
          updateBlockForMoveEnd(b);
        });
        break;
      case 'top':
        selectedBlocks.forEach((b) => {
          b.position = (new Vector2(b.position.x, baseBlock.position.y));
          updateBlockForMoveEnd(b);
        });
        break;
      case 'center-x': {
        const center = baseBlock.position.x + baseBlockSize.x / 2;
        selectedBlocks.forEach((b) => {
          b.position = (new Vector2(center + b.getRealSize().x / 2, b.position.y));
          updateBlockForMoveEnd(b);
        });
        break;
      }
      case 'center-y': {
        const center = baseBlock.position.y + baseBlockSize.y / 2;
        selectedBlocks.forEach((b) => {
          b.position = (new Vector2(b.position.x, center + b.getRealSize().y / 2));
          updateBlockForMoveEnd(b);
        });
        break;
      }
      case 'right': {
        const right = baseBlock.position.x + baseBlockSize.x;
        selectedBlocks.forEach((b) => {
          b.position = (new Vector2(right - baseBlockSize.x, b.position.y));
          updateBlockForMoveEnd(b);
        });
        break;
      }
      case 'bottom': {
        const bottom = baseBlock.position.y + baseBlockSize.y;
        selectedBlocks.forEach((b) => {
          b.position = (new Vector2(b.position.x, bottom - baseBlockSize.y));
          updateBlockForMoveEnd(b);
        });
        break;
      }
    }
    editor.markGraphChanged();
  }
  //设置选中单元断点状态
  function setSelectedBlockBreakpointState(state : BluePrintBreakPoint) {
    editor.getSelectBlocks().forEach((b) => b.breakpoint = state);
    editor.markGraphChanged();
  }
  //为选中项创建注释
  function genCommentForSelectedBlock() {
    if(editor.getSelectBlockCount() > 0) {
      const rect = editor.calcBlocksRegion(editor.getSelectBlocks());
      const block = new BluePrintFlowBlock(BlockRegisterService.getBaseBlock('Comment') as BluePrintFlowBlockDefine);
      block.position.set(rect.x - 15, rect.y - 15 - 50);
      block.customSize.set(rect.w + 30, rect.h + 30 + 50);
      block.load({});
      editor.addBlock(block);
    }
  }
  //用户删除端口
  function onDeletPort(port: BluePrintFlowPort) {
    if (port.dyamicAdd) {
      const parent = port.parent;
      parent.deletePort(port.guid);

      for (let i = parent.connectors.length - 1; i >= 0; i--) {
        const connector = parent.connectors[i];
        if (connector.startPort == port || connector.endPort == port)
          editor.unConnectConnector(connector);
      }
    }
  }

  //单元位置或大小更改，刷新单元
  function updateBlockForMoveEnd(block: BluePrintFlowBlock) {
    const _chunkedPanel = editor.getBaseChunkedPanel();
    block.updateLastPos();
    block.updateRegion();
    //更新单元对应连接的区块信息
    block.connectors.forEach((c) => {
      if (c.chunkInfo) {
        c.chunkInfo.rect.set(c.updateRegion());
        _chunkedPanel.updateInstance(c.chunkInfo as ChunkInstance);
      }
    });
  }

  //用户结束移动单元
  function onMoveBlockEnd(block: BluePrintFlowBlock) {
    const _selectBlocks = editor.getSelectBlocks();
    if (_selectBlocks.length > 0) 
      _selectBlocks.forEach((b) => updateBlockForMoveEnd(b));

    block.updateRegion();
  }
  //在移动单元时同时移动选中的其他单元
  function onMoveBlock(block: BluePrintFlowBlock, moveOffest: Vector2) {
    const _selectBlocks = editor.getSelectBlocks();
    if (_selectBlocks.length > 0) {
      _selectBlocks.forEach((element) => {
        if (element != block) {
          element.position = new Vector2(
            element.lastBlockPos.x + moveOffest.x,
            element.lastBlockPos.y + moveOffest.y
          );
        }
        //更新单元对应连接的位置信息
        element.connectors.forEach((c) => c.updateRegion());
      });
    }
  }
  //移动视图到单元位置
  function moveViewportToBlock(block: BluePrintFlowBlock) {
    const size = block.getRealSize();
    editor.getViewPort().position = new Vector2(block.position.x + size.x / 2, block.position.y + size.y / 2);
  }

  editor.onMoveBlock = onMoveBlock;
  editor.onMoveBlockEnd = onMoveBlockEnd;
  editor.onDeletPort = onDeletPort;
  editor.userAddBlock = userAddBlock;
  editor.userDeleteBlock =userDeleteBlock;
  editor.deleteSelectedConnectors = deleteSelectedConnectors;
  editor.deleteSelectedBlocks = deleteSelectedBlocks;
  editor.straightenConnector = straightenConnector;
  editor.unConnectSelectedBlockConnectors = unConnectSelectedBlockConnectors;
  editor.genCommentForSelectedBlock = genCommentForSelectedBlock;
  editor.updateBlockForMoveEnd = updateBlockForMoveEnd;

  editor.alignSelectedBlock = alignSelectedBlock;
  editor.setSelectedBlockBreakpointState = setSelectedBlockBreakpointState;
  editor.moveViewportToBlock = moveViewportToBlock;

  editor.setNoAddBlockInpos = () => {
    userAddBlockWithPosition = false;
  };
  editor.setAddBlockInpos = (pos : Vector2) => {
    userAddBlockWithPosition = true;
    userAddBlockInPos.set(pos);
  };

  return {
    onDeletPort,
  };
}
