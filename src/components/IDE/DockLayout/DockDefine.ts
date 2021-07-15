import { IDockGridData } from "./DockData";

export interface IDockHost {
  /**
   * 获取界面网格数据
   */
  getSaveData(): IDockGridData;
  /**
   * 设置界面网格数据
   */
  setData(data: IDockGridData) : void;

  /**
   * 激活指定的面板
   */
  activePanel(key: string) : void;
}
