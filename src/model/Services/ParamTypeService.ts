import logger from "../Base/Logger";
import StringUtils from "../Utils/StringUtils";
import { BluePrintParamBaseType, BluePrintParamEditorDefine, BluePrintParamType, BluePrintParamTypeConverterDefine, BluePrintParamTypeDefine } from "../Flow/BluePrintParamType";
import { SaveableTypes } from "../BluePrintEditorBase";
import { EventHandler } from "../Base/EventHandler";
import { getBaseTypeEditor } from "../Editor/BaseTypesEditor";

/**
 * 类型服务，用于管理系统中的数据类型
 */
export class ParamTypeServiceClass {
  private allCustomTypes : Map<string, BluePrintParamTypeDefine> = new Map<string, BluePrintParamTypeDefine>();
  private allTypeConverter = new Map<string, 
    Map<string, BluePrintParamTypeConverterDefine>
  >();

  /**
   * 获取所有自定义类型
   */
  public getAllCustomTypes() : Map<string, BluePrintParamTypeDefine> { return this.allCustomTypes; }
  /**
   * 获取所有的基础类型
   */
  public getAllBaseTypes() : string[] { return [ 'execute','boolean','bigint','number', 'string', 'function','object','any' ]; }
  /**
   * 获取指定名称自定义类型的基础类型
   * @param name 自定义类型名称
   */
  public getBaseTypeForCustomType(name : string) : BluePrintParamBaseType {
    if(this.isBaseType(name)) return <BluePrintParamBaseType>name;
    else {
      const c = this.getCustomType(name);
      return <BluePrintParamBaseType>(c ? c.prototypeName : 'any');
    }
  }
  /**
   * 获取类型是不是基础类型
   * @param name 类型名称
   */
  public isBaseType(name : string) : boolean {
    return this.getAllBaseTypes().indexOf(name) >= 0;
  }

  /**
   * 检查这个类型能不能用来作为集合的键
   * @param name 类型名称
   */
  public checkTypeCanBeDictionaryKey(type : BluePrintParamType) : boolean  {
    switch(type.baseType) {
      case 'any':
      case 'number':
      case 'bigint': 
      case 'enum':
      case 'string': return true;
      case 'custom':
      default: {
        const typeCustom = ParamTypeService.getCustomType(type.customType);
        if(typeCustom && typeof typeCustom.getHashCode == 'function') 
          return true;
      }
    }
    return false;
  }

  //类型转换注册
  //======================

  /**
   * 注册类型转换器
   * @param reg 类型转换器
   */
  public registerTypeCoverter(reg : BluePrintParamTypeConverterDefine) : void {

    const from = reg.fromType.toString();
    const to = reg.toType.toString();

    let typeChild = this.allTypeConverter.get(from);
    if(typeChild == null) {
      typeChild = new Map<string, BluePrintParamTypeConverterDefine>();
      this.allTypeConverter.set(from, typeChild);
    }

    typeChild.set(to, reg);
  }
  /**
   * 取消注册类型转换器
   * @param reg 类型转换器
   */
  public unregisterTypeCoverter(reg : BluePrintParamTypeConverterDefine) : void {

    const from = reg.fromType.toString();
    const to = reg.toType.toString();

    const typeChild = this.allTypeConverter.get(from);
    if(typeChild == null) 
      return;

    const target = typeChild.get(to);
    if(target != null) 
      typeChild.delete(to);
  }
  /**
   * 获取已经注册的类型转换器
   * @param fromType 源类型
   * @param toType 要转为的类型
   */
  public getTypeCoverter(fromType : BluePrintParamType|string, toType : BluePrintParamType|string) : BluePrintParamTypeConverterDefine|null {
    const from = typeof fromType === 'string' ? fromType : fromType.toString();
    const to = typeof toType === 'string' ? toType : toType.toString();
    let typeChild = this.allTypeConverter.get(from);
    if(typeChild == null) 
      typeChild = this.allTypeConverter.get('any');
    if(typeChild)
      return typeChild.get(to) || null;
    return null;
  }

  //类型注册
  //====================== 

  /**
   * 注册自定义类型
   * @param reg 类型数据
   */
  public registerCustomType(reg : BluePrintParamTypeDefine) : BluePrintParamTypeDefine {
    const old = this.getCustomType(reg.name);
    if(old != null) {
      logger.warning("registerCustomType", "Type " + reg.name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.set(reg.name, reg);
    if(reg.prototypeName == 'enum' && reg.autoCreateEnumConverter) 
      this.registerTypeCoverter({
        fromType: new BluePrintParamType('string'),
        toType: new BluePrintParamType('enum', reg.name),
        converter: {}
      });
    this.onTypeChanged.invoke('add', reg.name, reg);
    return reg;
  }
  /**
   * 获取已经注册的自定义类型
   * @param name 类型名称
   */
  public getCustomType(name : string) : BluePrintParamTypeDefine|null {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name) || null;
    return null;
  }
  /**
   * 取消注册自定义类型
   * @param name 类型名称
   */
  public unregisterCustomType(name : string) : void {
    if(!this.allCustomTypes.has(name)) {
      logger.warning("unregisterCustomType", "Type " + name + " are not register !");
      return;
    }
    this.allCustomTypes.delete(name);
    this.onTypeChanged.invoke('remove', name);
  }
  public onTypeChanged = new EventHandler<(act : 'add'|'remove', typeName ?: string, reg ?: BluePrintParamTypeDefine) => void>();

  //类型信息
  //======================

  /**
   * 获取自定义类型的自定义编辑器
   * @param name 类型名称
   */
  public getCustomTypeEditor(name : string) : null|BluePrintParamEditorDefine {
    //基础编辑器
    if(this.isBaseType(name))
      return getBaseTypeEditor(name);
    //自定义类型编辑器
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name)?.editor || null;
    return null;
  }
  /**
   * 获取类型的颜色
   * @param name 类型名称或类型对象
   * @param defaultColor 
   */
  public getTypeColor(name : string|BluePrintParamType, defaultColor ?: string) : string {
    if(typeof name === 'object')
      return name.getTypeColor();
    if(StringUtils.isNullOrEmpty(name))
      return defaultColor || '';
    switch(name) {
      case 'execute': return 'rgb(246,246,246)';
      case 'boolean': return 'rgb(180,0,0)';
      case 'bigint': return 'rgb(0,168,243)';
      case 'number': return 'rgb(158,258,68)';
      case 'string': return 'rgb(255,20,147)';
      case 'function': return 'rgb(247,196,33)';
      case 'object': return 'rgb(0,160,232)';
      case 'any': return 'rgb(250,250,250)';
      default: {
        const type = this.getCustomType(name);
        return type ? type.color : (defaultColor ? defaultColor : 'rgb(250,250,250)');
      }
    }
  }
  /**
   * 获取类型的默认值
   * @param type 类型对象
   */
  public getTypeDefaultValue(type : BluePrintParamType) : SaveableTypes|undefined|null {
    switch(type.baseType) {
      case 'execute': return undefined;
      case 'boolean': return false;
      case 'bigint': return 0;
      case 'number': return 0;
      case 'string': return '';
      case 'custom':
      default: {
        const customType = ParamTypeService.getCustomType(type.customType);
        if(customType && typeof customType.createDefaultValue == 'function') 
          return customType.createDefaultValue();
      }
    }
    return undefined;
  }
  /**
   * 获取对用户友好的类型名称
   * @param name 类型名称或类型对象
   */
  public getTypeNameString(name : string|BluePrintParamType) : string { 
    if(StringUtils.isNullOrEmpty(name as string))
      return '未定义';
    if(typeof name === 'object')
      return name.getNameString();
    switch(name) {
      case 'execute': return '执行';
      case 'any': return '通配符';
      case 'boolean': return '布尔';
      case 'bigint': return '大整数';
      case 'number': return '数字';
      case 'string': return '字符串';
      case 'function': return '函数';
      case 'object': return '对象';
      case 'custom': 
      case 'enum': 
        if(this.allCustomTypes.has(name)){
          const n = this.allCustomTypes.get(name)?.nameString;
          if(!StringUtils.isNullOrEmpty(n))
            return n || '';
        }
        return '枚举';
      default:
        return name;
    }
  }
}

const ParamTypeService = new ParamTypeServiceClass();

export default ParamTypeService;