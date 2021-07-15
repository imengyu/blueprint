import { CreateObjectFactory, SaveableObject } from "../Utils/SaveObject";
import { Vector2 } from "./Vector2";

CreateObjectFactory.addObjectFactory('Rect', () => new Rect());

/**
 * 矩形类
 */
export class Rect extends SaveableObject {
  public x = 0;
  public y = 0;
  public w = 0;
  public h = 0;

  public constructor(x ? : number | Rect, y? : number, w? : number, h? : number) {
    super();
    this.saveClassName = 'Rect';
    this.saveableProperties = [ 'x', 'y', 'w', 'h' ]
    this.set(x,y,w,h);
  }

  public set(x ?: number | Rect, y? : number, w? : number, h? : number) : void {
    if(typeof x === "number") this.x = x;
    else if(typeof x == "object") {
      this.x = x.x;
      this.y = x.y;
      this.w = x.w;
      this.h = x.h;
    }
    if(typeof y != "undefined") this.y = y;
    if(typeof w != "undefined") this.w = w;
    if(typeof h != "undefined") this.h = h;
  }

  public testInRect(x : Vector2|number, y = 0) : boolean {
    if(typeof x === 'object') {
      const point = x;
      return point.x >= this.getLeft() && point.y >= this.getTop() 
        && point.x <= this.getRight() && point.y <= this.getBottom();
    }
    else
      return x >= this.getLeft() && y >= this.getTop() 
        && x <= this.getRight() && y <= this.getBottom();
  }
  public testRectCross(rect : Rect) : boolean {

    /* 第一个中心点*/
    const a_cx = this.x + (this.w/2);
    const a_cy = this.y + (this.h/2);
    /* 第二个中心点*/
    const b_cx = rect.x + (rect.w/2);
    const b_cy = rect.y + (rect.h/2);

    return ((Math.abs(a_cx - b_cx) <= (this.w/2 + rect.w/2))
      && (Math.abs(a_cy - b_cy) <= (this.h/2 + rect.h/2)));
  }

  public setPos(pointOrX : Vector2 | number, y?:number) : void {
    if(typeof pointOrX == "number"){
      this.x = pointOrX;
      this.y = y || this.y;
    }else {
      this.x = pointOrX.x;
      this.y = pointOrX.y;
    }
  }
  public setSize(sizeOrX : Vector2 | number, y?:number) : void {
    if(typeof sizeOrX == "number"){
      this.w = sizeOrX;
      this.h = y || this.h;
    }else {
      this.w = sizeOrX.x;
      this.h = sizeOrX.y;
    }
  }

  public expand(v : number) : void {
    this.x -= v;
    this.y -= v;
    this.w += v * 2;
    this.h += v * 2;
  }
  public multiply(v : number) : void {
    this.x *= v;
    this.y *= v;
    this.w *= v;
    this.h *= v;
  }

  public getRight() : number { return this.w < 0 ? this.x : this.x + this.w; }
  public getBottom() : number { return this.h < 0 ? this.y : this.y + this.h; }
  public getLeft() : number { return this.w < 0 ? this.x + this.w : this.x; }
  public getTop() : number { return this.h < 0 ? this.y + this.h : this.y; }

  private center = new Vector2();

  /**
   * 计算中心点
   * @returns 
   */
  public calcCenter() : Vector2 {
    this.center.x = this.x + this.w / 2;
    this.center.y = this.y + this.h / 2;
    return this.center;
  }

  /**
   * 转为字符串形式
   * @returns 
   */
  public toString() : string {
    return `{x=${this.x},y=${this.y},w=${this.w},h=${this.h}}`;
  }

  /**
   * 使用两个点构造一个矩形
   * @param pt1 
   * @param pt2 
   * @returns 
   */
  public static makeBy2Point(rect : Rect, pt1 : Vector2, pt2 : Vector2) : Rect {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    if(pt1.x <= pt2.x) {
      x1 = pt1.x;
      x2 = pt2.x;
    } else {
      x1 = pt2.x;
      x2 = pt1.x;
    }
    if(pt1.y <= pt2.y) {
      y1 = pt1.y;
      y2 = pt2.y;
    } else {
      y1 = pt2.y;
      y2 = pt1.y;
    }

    rect.set(x1, y1, x2 - x1, y2 - y1);
    return rect;
  }
}

