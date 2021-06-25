/**
 * 基础扩展类
 */
/* eslint-disable */

import StringUtils from "./StringUtils";

const dateProtoType = (Date.prototype as any);
const stringProtoType = (String.prototype as any);
const arrayProtoType = (Array.prototype as any);

/**
 * 日期格式化（原型扩展或重载）
 * 格式 YYYY/yyyy/ 表示年份
 * MM/M 月份
 * dd/DD/d/D 日期
 * @param {formatStr} 格式模版
 * @type string
 * @returns 日期字符串
 */
dateProtoType.format = function (formatStr : string) {
  let str = formatStr ? formatStr : 'YYYY-MM-dd HH:ii:ss';
  //let Week = ['日','一','二','三','四','五','六'];
  str = str.replace(/yyyy|YYYY/, this.getFullYear().toString());
  str = str.replace(/MM/, StringUtils.pad(this.getMonth() + 1, 2));
  str = str.replace(/M/, (this.getMonth() + 1).toString());
  str = str.replace(/dd|DD/, StringUtils.pad(this.getDate(), 2));
  str = str.replace(/d/, this.getDate().toString());
  str = str.replace(/HH/, StringUtils.pad(this.getHours(), 2));
  str = str.replace(/hh/, StringUtils.pad(this.getHours() > 12 ? this.getHours() - 12 : this.getHours(), 2));
  str = str.replace(/mm/, StringUtils.pad(this.getMinutes(), 2));
  str = str.replace(/ii/, StringUtils.pad(this.getMinutes(), 2));
  str = str.replace(/ss/, StringUtils.pad(this.getSeconds(), 2));
  return str;
}
dateProtoType.toISOString = dateProtoType.toJSON = dateProtoType.toString = function() {
  return this.format();
}

//字符串

stringProtoType.contains = function (str : string) {
  return this.indexOf(str) >= 0;
}

//数组

arrayProtoType.addOnce = function(item : any) {
  if(this.indexOf(item) >= 0) return this.length;
  else return this.push(item);
}
arrayProtoType.empty = function() {
  this.splice(0, this.length);
}

if(typeof arrayProtoType.remove !== 'function')
  arrayProtoType.remove = function(item : any) {
    const index = this.indexOf(item);
    if(index >= 0) {
      this.splice(index, 1);
      return true;
    } 
    return false;
  }

if(typeof arrayProtoType.insert !== 'function')
  arrayProtoType.insert = function(i : number, item : any) {
    return this.splice(i, 0, item);
  }

if(typeof arrayProtoType.contains !== 'function')
  arrayProtoType.contains = function(item : any) {
    return this.indexOf(item) >= 0;
  }

if(typeof arrayProtoType.findIndex !== 'function')
  arrayProtoType.findIndex = function(predicateFn : Function, thisArg : any){
		const len = this.length
		for (let i = 0; i < len; i++) {
			const item = this[i];
			if(predicateFn.call(thisArg,item,i,this)){
				return i
			}
		}
		return -1
	}
