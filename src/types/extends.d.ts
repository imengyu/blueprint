/* eslint-disable */

interface Array<T> {
  /**
   * 查找元素在数组中的索引
   * @param predicateFn 
   * @param thisArg 
   */
  findIndex(predicateFn: (item: T, index?: number, arr?: T[]) => boolean, thisArg?: any): number;
  /**
   * 删除数组中的元素
   * @param item 元素 或 元素索引
   */
  remove(item: T | number): boolean;
  /**
   * 查找数组中是否存在某一元素
   * @param item 元素
   */
  contains(item: T) : boolean;

  /**
   * 在数组中插入元素
   * @param index 插入位置
   * @param item 要插入的元素
   */
  insert(index: number, item: T): void;

  /**
   * 仅添加元素一次到数组中，如果数组中已存在，则不会添加
   * @param item 元素
   * @returns 返回元素新的长度
   */
  addOnce(item: T) : number;

  /**
   * 清空数组
   */
  empty();
}
interface Date {
  /**
   * 格式化日期
   * @param formatStr 格式化字符串 支持 YYYY-MM-DD HH:ii:ss
   */
  format(formatStr?: string);

  toGMTString() : string;
}

interface String {
  /**
   * 查找字符串中是包含另一个字符串
   * @param item 字符串
   */
  contains(str: string) : boolean;
}