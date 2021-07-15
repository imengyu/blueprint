import { Rect } from "./Base/Rect";
import { Vector2 } from "./Base/Vector2";
import { SaveableObject } from "./Utils/SaveObject";

export default {};

export interface CustomStorageObject { 
  [ index: string ]: SaveableTypes|null|undefined 
}

/**
 * 编辑器背景属性
 */
export class BluePrintBackgroundRendererOptions {
  gridSize = 20;
  gridColorSmall = "rgb(32,32,32)";
  gridColorBig = "rgb(16,16,16)";
}

/**
 * 编辑器视图信息结构体
 */
export class BluePrintEditorViewport extends SaveableObject {
  /**
   * 编辑器的元素绝对位置
   */
  editorAbsolutePos = new Vector2();
  /**
   * 视图位置
   */
  position = new Vector2();
  /**
   * 视图的真实大小
   */
  size = new Vector2();
  /**
   * 视图缩放 (0-2, 0%-200%, 默认1)
   */
  scale = 1;

  constructor() {
    super();
    this.saveableProperties = [ 'position', 'scale' ]
  }

  /**
   * 设置为另一个结构的数据
   * @param other 
   */
  set(other : BluePrintEditorViewport) : void {
    this.position.set(other.position);
    this.scale = other.scale;
  }

  /**
   * 获取视口矩形
   * @returns 
   */
  rect(): Rect {
    const rect = new Rect();
    rect.setPos(this.position);
    rect.setSize(this.size);
    return rect;
  }

  /**
   * 检测一个屏幕坐标是否显示在视口中
   * @param point
   */
  testPointVisibleInViewport(point: Vector2): boolean {
    return point.x > this.position.x && point.y > this.position.y 
      && point.x < this.position.x + this.size.x && point.y > this.position.y + this.size.y;
  }
  /**
   * 编辑器坐标转屏幕坐标
   * @param point 编辑器坐标
   * @param dest 编辑器坐标，结果被赋值到这里
   */
  viewportPointToScreenPoint(point: Vector2, dest: Vector2): void {
    dest.set(
      point.x - this.position.x + this.editorAbsolutePos.x,
      point.y - this.position.y + this.editorAbsolutePos.y
    );
  }
  /**
   * 屏幕坐标转编辑器坐标
   * @param point 屏幕坐标
   * @param dest 编辑器坐标，结果被赋值到这里
   */
  screenPointToViewportPoint(point: Vector2, dest: Vector2): void {
    dest.set(
      this.position.x + (point.x - this.editorAbsolutePos.x),
      this.position.y + (point.y - this.editorAbsolutePos.y)
    );
  }
  /**
   * 屏幕坐标减去编辑器绝对坐标
   */
   fixScreenPosWithEditorAbsolutePos(point: Vector2): Vector2 {
    point.substract(this.editorAbsolutePos);
    return point
  }
}

/**
 * 编辑器鼠标状态
 */
export class BluePrintEditorMouseInfo {
  mouseDowned = false;
  mouseCurrentPosScreen = new Vector2();
  mouseCurrentPosViewPort = new Vector2();
  mouseDownPosScreen = new Vector2();
  mouseDownPosViewPort = new Vector2();
  mouseMoved = false;
}

export type SaveableTypes = IKeyValueObject|Array<unknown>|Record<string, unknown>|number|string|boolean;

/**
 * KeyValue Object
 */
export interface IKeyValueObject {
  [index: string]: SaveableTypes|null|undefined;
}
