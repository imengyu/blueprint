import SettingsService from "@/model/Services/SettingsService";
import StringUtils from "@/model/Utils/StringUtils";
import { onBeforeUnmount, onMounted, reactive } from "vue";
import { BluePrintIDEInstance, BluePrintIDESettings } from "./IDEDefine";

export function useIDEMainSettingsControl(ide: BluePrintIDEInstance) {
  const settings = reactive({
    gridShow: true,
    drawDebugInfo: false,
    lastIsMaxed: false,
    lastWindowWidth: 0,
    lastWindowHeight: 0,
  } as BluePrintIDESettings);

  function loadSettings() {
    settings.drawDebugInfo = SettingsService.getSettingsBoolean(
      "drawDebugInfo",
      false
    );
    settings.gridShow = SettingsService.getSettingsBoolean("gridShow", true);
    settings.lastIsMaxed = SettingsService.getSettingsBoolean(
      "lastIsMaxed",
      settings.lastIsMaxed
    );
    settings.lastWindowWidth = SettingsService.getSettingsNumber(
      "lastWindowWidth",
      settings.lastWindowWidth
    );
    settings.lastWindowHeight = SettingsService.getSettingsNumber(
      "lastWindowHeight",
      settings.lastWindowHeight
    );
    loadDockData();
  }
  function saveSettings() {
    SettingsService.setSettingsBoolean(
      "drawDebugInfo",
      settings.drawDebugInfo
    );
    SettingsService.setSettingsBoolean("gridShow", settings.gridShow);
    saveDockData();
  }
  function resetDockLayout() {
    //eslint-disable-next-line
    const def = require("@/assets/cfgs/dock-default.json");
    ide.getDockLayout().setData(def);
    saveDockData();
  }
  function loadDockData() {
    //eslint-disable-next-line
    const def = require("@/assets/cfgs/dock-default.json");
    //eslint-disable-next-line
    let data : any = SettingsService.getSettings("dockData", "");
    if (StringUtils.isNullOrEmpty(data)) data = def;
    else data = JSON.parse(data);

    setTimeout(() => {
      ide.getDockLayout().setData(data);
    }, 200);
  }
  function saveDockData() {
    SettingsService.setSettings("dockData", JSON.stringify(ide.getDockLayout().getSaveData()));
  }

  ide.getSettings = () => settings;
  ide.resetDockLayout = resetDockLayout;

  function onBeforeunload() {
    saveSettings();
  }

  onMounted(() => {
    loadSettings();
    window.addEventListener('beforeunload', onBeforeunload);
  })
  onBeforeUnmount(() => {
    saveSettings();
    window.removeEventListener('beforeunload', onBeforeunload);
  })

  return {
    settings
  }
}