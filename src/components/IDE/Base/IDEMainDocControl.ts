import logger from "@/model/Base/Logger";
import { BluePrintFlowDoc } from "@/model/Flow/BluePrintFlowDoc";
import { computed, ref } from "vue";
import { DockPanelData } from "../DockLayout/DockData";
import { BluePrintIDEInstance } from "./IDEDefine";

import MessageBox from 'element-plus/lib/el-message-box';
import StringUtils from "@/model/Utils/StringUtils";
import { BluePrintFlowBlock } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintEditorInstance } from "@/model/BluePrintEditor";

export function useIDEMainDocControl(ide: BluePrintIDEInstance) {

  const openedDocunments = ref<Array<BluePrintFlowDoc>>([]);
  const currentDocunment = ref<BluePrintFlowDoc|null>(null);

  //载入一个新文档
  function openNewDocunment() {
    const doc = new BluePrintFlowDoc('');
    doc.name = 'New Docunment';
    doc.initNew();
    ide.openDocunment(doc, true);
  }
  //载入文档
  function openDocunment(doc : BluePrintFlowDoc, active ?: boolean) {
    const _openedDocunments = openedDocunments.value;
    if(!_openedDocunments.contains(doc)) {
      _openedDocunments.addOnce(doc);
      doc.loadStatus = 'loaded';
    }
    if(active) {
      currentDocunment.value = doc;
      setTimeout(() => ide.getDockLayout().activePanel('Doc_' + doc.uid), 100);
    }
  }
  //关闭文档
  function closeDocunment(doc : BluePrintFlowDoc) : Promise<void> {
    return new Promise<void>((resolve) => {
      const doClose = () => {
        const _openedDocunments = openedDocunments.value;
        const oldIndex = _openedDocunments.indexOf(doc);
        if(oldIndex >= 0) {
          if(currentDocunment.value == doc) {
            currentDocunment.value = oldIndex > 0
              ? _openedDocunments[oldIndex - 1]
              : _openedDocunments.length > 0
              ? _openedDocunments[0]
              : null;
          }
          _openedDocunments.removeIndex(oldIndex);
          doc.loadStatus = 'notload';
        }
        resolve();
      }
      if(doc.isFileChanged()) {
        MessageBox.confirm(`${doc.name} 没有保存，保存吗？点击“x”取消关闭`, '提示', { 
          type: 'warning',
          cancelButtonText: '不保存关闭',
          confirmButtonText: '保存并关闭',
        }).then((e) => {
          if(e.action == 'confirm') 
            saveDocunment(doc).then(() => doClose()).catch((e) => console.log(e));
          else resolve();
        }).catch((e) => {
          doClose();
        });
      } else doClose();
    });
  }
  //保存文档
  function saveDocunment(doc : BluePrintFlowDoc) : Promise<void> {
    if(StringUtils.isNullOrEmpty(doc.path)) {
      return new Promise<void>((resolve, reject) => {
        ide.ioMapping.saveFileAs(JSON.stringify(doc.save()), 'application/json').then((path) => {
          doc.path = path;
          resolve();
        }).catch((e) => reject(e));
      });
    }
    return ide.ioMapping.saveFile(doc.path, JSON.stringify(doc.save()));
  }
  //加载文档文件
  function loadDocunment() : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ide.ioMapping.loadFile('application/json').then((data) => {
        const json = JSON.parse(data.data);
        const doc = new BluePrintFlowDoc(data.path);
        doc.load(json);
        ide.openDocunment(doc, true);
        resolve();
      }).catch((e) => {
        logger.warning('OpenFile', e);
        reject(e);
      })
    });
  }
  //获取打开的文档
  function getOpenedDocunmentsByUid(uid: string) : BluePrintFlowDoc|null {
    const _openedDocunments = openedDocunments.value;
    for(let i = 0; i < _openedDocunments.length; i++) {
      if(_openedDocunments[i].uid === uid) 
        return _openedDocunments[i] as BluePrintFlowDoc;
    }
    return null;
  }

  //关闭回调
  function onEditorMainTabClose(data: DockPanelData) {
    const uid = data.key.substring(4);
    const doc = getOpenedDocunmentsByUid(uid);
    if(doc) closeDocunment(doc as BluePrintFlowDoc);
  }
  function onEditorMainActiveTabChange(current : DockPanelData) {
    if(current && current.tag === 'doc') {
      const uid = current.key.substr(4);
      const doc = getOpenedDocunmentsByUid(uid);
      if(doc)
        currentDocunment.value = doc;
      updateCurrentGraphSelectBlocks();
    }else {
      updateCurrentGraphSelectBlocks();
    }
  }

  //#region 图表选中单元状态更新

  const currentGraph = computed(() => {
    return (currentDocunment.value && currentDocunment.value.activeGraph) || null;
  });
  const currentGraphSelectBlocks = ref<BluePrintFlowBlock[]>([]);

  function onSelectBlockChanged(selectBlocks : BluePrintFlowBlock[], editor : BluePrintEditorInstance) {
    if(currentGraph.value == currentGraph.value?.activeEditor?.getCurrentGraph()) {
      currentGraphSelectBlocks.value = selectBlocks;
    }
  }
  function updateCurrentGraphSelectBlocks() {
    if(currentDocunment.value && currentGraph.value) {
      currentGraphSelectBlocks.value = (currentGraph.value.activeEditor) ? currentGraph.value.activeEditor.getSelectBlocks() : [];
    } else currentGraphSelectBlocks.value = [];
  }

  //#endregion

  ide.getOpenedDocunmentsByUid = getOpenedDocunmentsByUid;
  ide.openDocunment = openDocunment;
  ide.loadDocunment = loadDocunment;
  ide.closeDocunment = closeDocunment;
  ide.saveDocunment = saveDocunment;
  ide.openNewDocunment = openNewDocunment;
  ide.getCurrentDocunment = () => currentDocunment.value as BluePrintFlowDoc|null; 
  ide.getOpenedDocunments = () => openedDocunments.value as BluePrintFlowDoc[];

  return {
    openedDocunments,
    currentDocunment,
    currentGraphSelectBlocks,
    currentGraph,
    onSelectBlockChanged,
    onEditorMainTabClose,
    onEditorMainActiveTabChange,
  }
}