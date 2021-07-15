import { Vector2 } from "@/model/Base/Vector2";
import { ChooseTypePanelCallback } from "@/model/BluePrintEditor";
import { BluePrintFlowDoc } from "@/model/Flow/BluePrintFlowDoc";
import { BluePrintFlowPortDirection } from "@/model/Flow/BluePrintFlowPort";
import { BluePrintParamType } from "@/model/Flow/BluePrintParamType";
import { IOMapping } from "@/model/IO/IOMappingForIDE";
import { IDockHost } from "../DockLayout/DockDefine";

/**
 * IDE 公共方法
 */
export interface BluePrintIDEInstance {
  getSettings: () => BluePrintIDESettings;
  getDockLayout: () => IDockHost;
  resetDockLayout: () => void;
  openDocunment: (doc : BluePrintFlowDoc, active ?: boolean) => void;
  closeDocunment: (doc : BluePrintFlowDoc) => Promise<void>
  saveDocunment: (doc : BluePrintFlowDoc) => Promise<void>
  loadDocunment: () => Promise<void>
  openNewDocunment: () => void;
  getCurrentDocunment: () => BluePrintFlowDoc|null;
  getOpenedDocunments: () => BluePrintFlowDoc[];
  getOpenedDocunmentsByUid: (uid: string) => BluePrintFlowDoc|null;
  ioMapping : IOMapping,
  panels : BluePrintIDEPanels,
}
/**
 * IDE 设置结构体
 */
export interface BluePrintIDESettings {
  gridShow: boolean,
  drawDebugInfo: boolean,
  lastIsMaxed: boolean,
  lastWindowWidth: number,
  lastWindowHeight: number,
}

/**
 * 一些弹出菜单的公共方法
 */
export interface BluePrintIDEPanels {
  showChooseTypePanel: (pos: Vector2, canbeExecute: boolean, canbeAny: boolean, callback: ChooseTypePanelCallback) => void;
  closeChooseTypePanel: () => void;
  showAlert: (title: string, text : string, type : '' | 'success' | 'warning' | 'info' | 'error') => void;
  showConfirm: (title: string, text : string, type : '' | 'success' | 'warning' | 'info' | 'error') => Promise<string>;
}