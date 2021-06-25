import { IKeyValueObject } from "../BluePrintEditorBase";

const createObjectFactorys = new Map<string, () => SaveableObject>();

export const CreateObjectFactory = {
  addObjectFactory(name : string, createFn : () => SaveableObject) : void {
    createObjectFactorys.set(name, createFn);
  },
  createSaveableObject(name : string, k : IKeyValueObject) : SaveableObject|null {
    const objCreate = createObjectFactorys.get(name);
    if(objCreate) {
      const obj = objCreate();
      obj.load(k);
      return obj;
    }
    return null;
  }
}

/* eslint-disable */

/**
 * 自动保存对象
 */
export class SaveableObject {
  /**
   * 创建类的名字
   */
  saveClassName = '';
  /**
   * 可保存的属性
   */
  saveableProperties : string[] = [];
  /**
   * 保存本对象为 key-value 对象
   * @returns 
   */
  save() : IKeyValueObject {
    let o : any = {}
    for (const key in this) {
      const element = this[key];
      if(!this.saveableProperties.contains(key))
        continue;
      if(typeof element === 'bigint' || typeof element === 'number' || typeof element === 'boolean' || typeof element === 'string')
        o[key] = element;
      else if(typeof element === 'object' && element instanceof SaveableObject) {
        //This is a SaveableObject
        if(typeof element.save === 'function' && typeof element.load === 'function' && typeof element.saveClassName === 'string') 
          o[key] = {
            class: element.saveClassName,
            obj: element.save()
          }
      }
    }
    return o;
  }
  /**
   * 从 key-value 对象信息加载本对象
   * @param data 
   */
  load(data : IKeyValueObject) {
    if(data) {
      for (const key in data) {
        if(!this.saveableProperties.contains(key))
          continue;
        const element = data[key] as any;
        if(typeof element === 'bigint' || typeof element === 'number' || typeof element === 'boolean' || typeof element === 'string')
          (this as any)[key] = element;
        else if(typeof element === 'object') {
          if(typeof element.class === 'string' && typeof element.obj === 'object') {
            let newObj = CreateObjectFactory.createSaveableObject(element.class, element.obj);
            if(newObj)
              (this as any)[key] = newObj;
          }
        }
      }
    }
  }
}

