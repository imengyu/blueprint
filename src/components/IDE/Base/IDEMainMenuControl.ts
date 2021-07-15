import logger from "@/model/Base/Logger";
import { BluePrintFlowDoc } from "@/model/Flow/BluePrintFlowDoc";
import { MenuItem } from "@imengyu/vue3-context-menu";
import { onMounted, reactive } from "vue";
import { BluePrintIDEInstance } from "./IDEDefine";

import MessageBox from 'element-plus/lib/el-message-box';

export function useIDEMainMenuControl(ide: BluePrintIDEInstance) {

  //保存当前文档
  function saveCurrentFile() {
    const current = ide.getCurrentDocunment();
    if(current) 
      ide.saveDocunment(current);
  }
  //保存所有文档
  function saveAllFile() {
    let current = 0;
    const docs = ide.getOpenedDocunments();
    const doSave = () => {
      ide.saveDocunment(docs[current]).then(() => {
        if(current < docs.length - 2) {
          current++;
          doSave();
        }
      });
    };
    doSave();
  }
  //关闭当前文档
  function closeCurrentFile() {
    const current = ide.getCurrentDocunment();
    if(current) 
      ide.closeDocunment(current);
  }

  const mainMenuEditItems = reactive([
    { label: "新文档", onClick: () => ide.openNewDocunment(), icon: 'icon-file-1' }, 
    { label: "打开", onClick: () => ide.loadDocunment(), icon: 'icon-folder-' }, 
    { label: "打开项目", divided: true, icon: 'icon-command' }, 
    { label: "保存", onClick: saveCurrentFile, icon: 'icon-save' },
    { label: "保存所有", divided: true, onClick: saveAllFile, icon: 'icon-file-' },
    { label: "关闭", onClick: closeCurrentFile, icon: 'icon-close-' },
    { label: "关闭项目", icon: 'icon-enlarge' },
  ]);
  const mainMenuViewItems = reactive([
    { label: "显示网格", divided: true, onClick: toggleShowGrid, icon: '' },
    { label: "绘制调试信息", onClick: toggleShowDebugInfo, icon: '', divided: true }, 
    { label: "重置视图", onClick: restLayout,  }, 
  ]);

  function restLayout() {
    MessageBox.confirm('真的要恢复界面布局到默认吗？', '提示', { type: 'warning' }).then(() => {
      ide.resetDockLayout();
    }).catch((e) => console.log(e));
  }
  function toggleShowGrid() {
    const settings = ide.getSettings();
    settings.gridShow = !settings.gridShow;
    updateShowGridMenuCheck();
  }
  function toggleShowDebugInfo() {
    const settings = ide.getSettings();
    settings.drawDebugInfo = !settings.drawDebugInfo;
    updateShowDebugInfoMenuCheck();
  }

  function updateShowGridMenuCheck() { mainMenuViewItems[0].icon = ide.getSettings().gridShow ? 'icon-check-' : ''; }
  function updateShowDebugInfoMenuCheck() { mainMenuViewItems[1].icon = ide.getSettings().drawDebugInfo ? 'icon-check-' : ''; }


  const mainMenuItems = reactive([
    {
      label: "文件",
      children: mainMenuEditItems
    },
    {
      label: "编辑",
      divided: true,
      children: [
        { label: "撤销" }, 
        { label: "重做", divided: true }, 
        { label: "剪切" },
        { label: "复制" },
        { label: "粘贴", divided: true },
        { label: "查找", icon: 'icon-search-' },
        { label: "选项", icon: 'icon-settings-2', divided: true },
      ]
    },
    {
      label: "视图",
      divided: true,
      children: mainMenuViewItems,
    },
    {
      label: "帮助",
      children: [
        { label: "欢迎"  },
        { label: "关于", icon: 'icon-info-'  }, 
        { label: "帮助文档", icon: 'icon-book'  },
      ]
    },
  ] as Array<MenuItem>)


  onMounted(() => {
    setTimeout(() => {
      updateShowGridMenuCheck();
      updateShowDebugInfoMenuCheck();
    }, 100);
  })

  return {
    mainMenuItems,
  }
}