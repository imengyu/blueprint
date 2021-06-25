export default {
  /**
   * 判断是否定义并且不为null
   * @param v 要判断的数值
   */
  isDefinedAndNotNull(v : undefined|null|unknown) : boolean {
    return v != null && typeof v != 'undefined';
  },
  /**
   * 判断是否定义并且不为null
   * @param v 要判断的数值
   */
  isDefined(v : undefined|null|unknown) : boolean {
    return typeof v != 'undefined';
  },

  /**
   * 如果参数未定义，则返回默认值，否则返回这个参数
   * @param v 要判断的数值
   * @param drfaultValue 默认值
   */
  defaultIfUndefined<T>(v : undefined|null|T, drfaultValue: T) : T {
    return (v != null && typeof v != 'undefined') ? v : drfaultValue;
  },

  isJSON,
  isArray,
  mergeJSON,
  mergeJsonArray,
  exportRaw,

  /**
   * 转换数据为字符串
   * @param val 任意数据
   */
  valueToStr(val : unknown) : string {
    if(typeof val == 'string') 
      return '"' + val + '"';
    else if(typeof val === 'undefined')
      return 'undefined'
    else if(val === null)
      return 'null'
    else 
      return val + ''
  },

  clone,
  cloneValue,

  swapItems,
  upData,
  downData,
}

/* eslint-disable */

/**
 * 克隆对象
 * @param {Object} obj 要克隆对象
 */
function clone(obj: any) {
  let temp : any = null;
  if (obj instanceof Array) {
    temp = obj.concat();
  } else {
    temp = new Object();
    for (let item in obj) {
      let val = obj[item];
      if(val == null) temp[item] = null;
      else temp[item] = typeof val == 'object' ? clone(val) : val; //这里也没有判断是否为函数，因为对于函数，我们将它和一般值一样处理
    }
  }
  return temp;
}
/**
 * 将源对象每个属性都复制到目标对象（不管目标对象有没有对应属性）
 * @param {*} setObj 
 * @param {*} sourceObj 
 */
function cloneValue(setObj: any, sourceObj: any){
  if(!setObj || !sourceObj) return;
  Object.keys(setObj).forEach(function(key){
    if(typeof sourceObj[key] != 'undefined') {
      if(isJSON(setObj[key])) cloneValue(setObj[key], sourceObj[key]);
      else setObj[key] = sourceObj[key];
    }
  });
}

function mergeJSON(minor: any, main: any) {
  for (let key in minor) {
    if (main[key] === undefined) { // 不冲突的，直接赋值 
      main[key] = minor[key];
      continue;
    }
    // 冲突了，如果是Object，看看有么有不冲突的属性
    // 不是Object 则以（minor）为准为主，
    if (isJSON(minor[key]) || isArray(minor[key])) { // arguments.callee 递归调用，并且与函数名解耦 
      main[key] = mergeJSON(minor[key], main[key]);
    } else {
      main[key] = minor[key];
    }
  }
  return main;
}
function isJSON(target : any) {
  return target != null && typeof target == "object" && target.constructor == Object;
}
function isArray(o : any) {
  return Object.prototype.toString.call(o) == '[object Array]';
}
/**
 * 混合两个 JsonArray
 * @param {*} a 
 * @param {*} b 
 */
function mergeJsonArray(a : any, b : any) {
  let r : any = {};
  let i = 0;
  for (let key in a) {
    r[i] = a[key];
    i++;
  }
  for (let key in b) {
    r[i] = b[key];
    i++;
  }
  return r;
}

//数组操作
//================

/**
 * 交换数组两个元素
 * @param {Array} arr 数组
 * @param {Number} index1 索引1
 * @param {Number} index2 索引2
 */
function swapItems(arr : Array<any>, index1 : number, index2: number) {
  arr[index1] = arr.splice(index2,1,arr[index1])[0]
  /*
  let x = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = x;
  */
  return arr
}
/**
 * 指定数组索引位置元素向上移
 * @param {Array} arr 数组
 * @param {Number} index 索引
 */
function upData (arr : Array<any>, index : number) {
  　if (arr.length > 1 && index !== 0)
  　return swapItems(arr, index, index - 1)
}
/**
 * 指定数组索引位置元素向下移
 * @param {Array} arr 数组
 * @param {Number} index 索引
 */
function downData (arr : Array<any>, index : number) {
  　if (arr.length > 1 && index !== (arr.length - 1))
    return swapItems(arr, index, index + 1)
}
/**
 * 虚拟点击事件
 * @param obj 要点击的元素
 */
function fakeClick(obj : HTMLElement) {
  let ev = document.createEvent("MouseEvents");
  ev.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  obj.dispatchEvent(ev);
}
/**
 * 调用浏览器下载
 * @param name 文件名
 * @param data 数据
 */
function exportRaw(name : string, data : string) {
  let export_blob = new Blob([data]);
  let save_link = <HTMLLinkElement>document.createElementNS("http://www.w3.org/1999/xhtml", "a")
  save_link.href = URL.createObjectURL(export_blob);
  save_link.setAttribute('download', name);
  fakeClick(save_link);
}
