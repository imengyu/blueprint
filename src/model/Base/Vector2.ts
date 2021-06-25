import { CreateObjectFactory, SaveableObject } from "../Utils/SaveObject";

CreateObjectFactory.addObjectFactory('Vector2', () => new Vector2());

/**
 * 2D Vector
 */
export class Vector2 extends SaveableObject {

  /**
   * X axis
   */
  public x = 0;
  /**
   * Y axis
   */
  public y = 0;

  public constructor(x = 0, y = 0) {
    super();
    this.saveClassName = 'Vector2';
    this.y = y;
    this.x = x;
  }

  /**
   * Set new vector values
   * @param x X axis or other Vector
   * @param y Y axis or none
   */
  public set(x : number|Vector2, y = 0) : void {
    if(typeof x === "number") {
      this.y = y;
      this.x = x;
    }else {
      this.y = x.y;
      this.x = x.x;
    }
  }
  /**
   * Clone a new item
   * @returns 
   */
  public clone() : Vector2 {
    return new Vector2(this.x, this.y);
  }
  public add(v : number|Vector2) : Vector2 {
    if(typeof v === "number") {
      this.x += v;
      this.y += v;
    }
    else if(typeof v == "object") {
      this.x += v.x;
      this.y += v.y;
    }
    return this;
  }
  public substract(v : number|Vector2) : Vector2 {
    if(typeof v === "number") {
      this.x -= v;
      this.y -= v;
    }
    else if(typeof v == "object") {
      this.x -= v.x;
      this.y -= v.y;
    }
    return this;
  }
  public multiply(v : number) : Vector2 {
    this.x *= v;
    this.y *= v;
    return this;
  }
  public divide(v : number) : Vector2 {
    this.x /= v;
    this.y /= v;
    return this;
  }
  /**
   * Test two vector2's value is equal
   */
  public equal(another : Vector2) : boolean {
    return this.x == another.x && this.y == another.y;
  }
  /**
   * 转为字符串
   * @returns 
   */
  public toString() : string {
    return `{x=${this.x},y=${this.y}}`;
  }
}
