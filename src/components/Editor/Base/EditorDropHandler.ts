import { BluePrintEditorInstance } from "@/model/BluePrintEditor";
import BlockRegisterService from "@/model/Services/BlockRegisterService";
import StringUtils from "@/model/Utils/StringUtils";

/**
 * 编辑器拖放处理
 * @returns 
 */
export function useEditorDropHandler(editor : BluePrintEditorInstance) {

  function onDrop(e : DragEvent) {
    editor.updateMousePos(e);

    if(!e.dataTransfer)
      return
    const data = e.dataTransfer.getData('text/plain');
    if(StringUtils.isNullOrEmpty(data) || !data.startsWith('drag:')) 
      return;
      
    const datav = data.split(':');
    switch(datav[1]) {
      case 'block': {//拖放单元
        editor.setAddBlockInpos(editor.getMouseInfo().mouseCurrentPosViewPort);
        
        //添加单元
        const block = BlockRegisterService.getRegisteredBlock(datav[2]);
        if(block) 
          editor.userAddBlock(block);
        else
          editor.showSmallTip(`Block for guid ${datav[2]} not found!`, 3000);

        editor.closeAddBlockPanel()
        break;
      }
    }
  }    
  
  return {
    onDrop,
  }
}