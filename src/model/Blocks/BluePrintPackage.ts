import { IBluePrintFlowBlockDefine } from "../Flow/BluePrintFlowBlock";

/**
 * 单元包的定义
 */
export interface BluePrintPackage {
  /**
   * 注册回调函数，请在这个函数中返回所有单元的注册信息，系统将会进行注册。
   */
  register: () => IBluePrintFlowBlockDefine[],
  /**
   * 包名
   */
  packageName: string,
  /**
   * 版本
   */
  version: number,
}