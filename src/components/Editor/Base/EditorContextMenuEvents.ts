import { Vector2 } from "@/model/Base/Vector2";
import { BluePrintEditorInstance } from "@/model/BluePrintEditor";
import { BluePrintFlowBlock } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintFlowConnector } from "@/model/Flow/BluePrintFlowConnector";
import { BluePrintFlowPort } from "@/model/Flow/BluePrintFlowPort";
import { MenuItem } from "@imengyu/vue3-context-menu";

/**
 * 编辑器右键菜单事件处理
 * @returns 
 */
export function useEditorContextMenuEvents(editor: BluePrintEditorInstance) {


  function onContextmenu(e : MouseEvent) {
    e.preventDefault();
    return false;
  }
  function onCanvasContextmenu(e : MouseEvent) {
    e.preventDefault();

    const selectedConnectors = editor.getSelectConnectors();
    if(selectedConnectors.length > 0) 
      showConnectorRightMenu(new Vector2(e.x, e.y));

    return false;
  }

  //Connector Menu
  function showConnectorRightMenu(screenPos : Vector2) {
    const selectedConnectors = editor.getSelectConnectors();
    editor.showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: [
        { label: "断开连接", onClick: () => editor.deleteSelectedConnectors() },
      ].concat(selectedConnectors.length == 1 ? [
        { label: "按起始端位置拉直", onClick: () => editor.straightenConnector(selectedConnectors[0].startPort as BluePrintFlowPort, selectedConnectors[0]) },
        { label: "按结束端位置拉直", onClick: () => editor.straightenConnector(selectedConnectors[0].endPort as BluePrintFlowPort, selectedConnectors[0]) },
      ] : []),
      zIndex: 100,
      customClass: 'menu-context',
    });
  }
  //Block Menu
  function showBlockRightMenu(block : BluePrintFlowBlock, screenPos : Vector2) {

    const selectedCount = editor.getSelectBlockCount();
    const selectedBlocks = editor.getSelectBlocks();

    let blockMenuSettingsMenuItems : MenuItem[]|null = null;

    if(selectedCount == 1) {
      blockMenuSettingsMenuItems = selectedBlocks[0].define.menu.items;

      const loopMenuClick = (items : MenuItem[]) => {
        items.forEach((item) => {
          if(item.children) 
            loopMenuClick(item.children);
          if(typeof item.onClick === 'function') {
            const old = item.onClick;
            item.onClick = function() {
              old.call(selectedBlocks[0]);
            };
          }
        })
      }
      loopMenuClick(blockMenuSettingsMenuItems);
    }

    const menuItems = (selectedCount == 1 ? selectedBlocks[0].define.menu.items : []).concat(
      <MenuItem[]>[
        { label: "删除", onClick: () => editor.deleteSelectedBlocks(), divided: true },
        { label: "剪切", onClick: () => {/*TODO:剪贴板 this.clipboardCutSelect()*/} },
        { label: "复制", onClick: () => {/*TODO:剪贴板 (this.clipboardCopySelect()*/} },
        { label: "粘贴", 
          //disabled: !this.editoClipboard.getBlocksClipboardState(), 
          onClick: () => { /*TODO:剪贴板 this.clipboardPaste(editor.getMouseCurrentPosInViewPort())*/ },
          divided: true 
        },
        { label: "断开连接", onClick: () => editor.unConnectSelectedBlockConnectors(), divided: true },
        { label: "对齐", disabled: selectedCount < 2, children: [
          { label: "左对齐", onClick: () => editor.alignSelectedBlock(block, 'left') },
          { label: "上对齐", onClick: () => editor.alignSelectedBlock(block, 'top') },
          { label: "右对齐", onClick: () => editor.alignSelectedBlock(block, 'right') },
          { label: "下对齐", onClick: () => editor.alignSelectedBlock(block, 'bottom') },
          { label: "中对齐", onClick: () => editor.alignSelectedBlock(block, 'center-x') },
          { label: "中部对齐", onClick: () => editor.alignSelectedBlock(block, 'center-y') },
        ] },
        { label: "断点", children: [
          { label: "无", onClick: () => editor.setSelectedBlockBreakpointState('none') },
          { label: "启用", onClick: () => editor.setSelectedBlockBreakpointState('enable') },
          { label: "禁用", onClick: () => editor.setSelectedBlockBreakpointState('disable') },
        ], divided: true },
        { label: "为选中项创建注释", disabled: selectedCount < 2,  onClick: () => editor.genCommentForSelectedBlock() },
      ]
    );

    editor.showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      customClass: 'menu-context',
    });
  }
  //Port Menu
  function showPortRightMenu(port : BluePrintFlowPort, screenPos : Vector2) {
    const addCoonItem = (connector : BluePrintFlowConnector, isUp : boolean) => {
      const currentPort = (isUp ? connector.startPort : connector.endPort) as BluePrintFlowPort;
      menuJumpItems.push({ label: (isUp ? '上' : '下') + '级连接 ' + currentPort.parent.define.name, children: [
          { 
            label: '跳转到' + (isUp ? '上' : '下') + '级',
            onClick: () => {
              const block = currentPort.parent;
              editor.selectBlock(block, false);
              editor.moveViewportToBlock(block);
              block.twinkle();
            }
          },
          { label: '断开连接', onClick: () => editor.unConnectConnector(connector) },
          { label: '拉直连接', onClick: () => editor.straightenConnector(port, connector) }
        ] 
      });
    };
    const menuJumpItems : Array<MenuItem> = [];
    if(port.connectedFromPort.length > 0) 
      port.connectedFromPort.forEach((e) => addCoonItem(e, true));
    if(port.connectedToPort.length > 0) 
      port.connectedToPort.forEach((e) => addCoonItem(e, false));

    let menuItems : Array<MenuItem> = [
      { 
        label: "删除参数", onClick: () => {
          editor.onDeletPort(port);
        }, 
        disabled: !port.dyamicAdd, 
        divided: true 
      },
      { label: "断开所有连接", onClick: () => editor.unConnectPortConnectors(port) },
      { 
        label: "提升为变量", 
        onClick: () => {
          //TODO: 提升为变量
          //port
        }, 
        divided: true 
      },
    ];
    menuItems = menuItems.concat(menuJumpItems);

    editor.showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      customClass: 'menu-context',
    });
  }

  editor.showBlockRightMenu = showBlockRightMenu;
  editor.showPortRightMenu = showPortRightMenu;
  editor.showConnectorRightMenu = showConnectorRightMenu;

  return {
    onContextmenu,
    onCanvasContextmenu,
  }
}