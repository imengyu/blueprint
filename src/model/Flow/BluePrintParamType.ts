import ParamTypeService from "../Services/ParamTypeService";
import { SaveableTypes } from "../BluePrintEditorBase";
import { SaveableObject } from "../Utils/SaveObject";
import StringUtils from "../Utils/StringUtils";
import { BluePrintFlowPort, BluePrintFlowPortCreateEditorFunction } from "./BluePrintFlowPort";

/**
 * 端口参数的基本类型
 */
export type BluePrintParamBaseType =
  | "execute"
  | "bigint"
  | "number"
  | "string"
  | "boolean"
  | "function"
  | "object"
  | "any"
  | "enum"
  | "custom";

/**
 * 端口参数的集合类型
 * 
 * * variable：单个变量
 * * array：数组
 * * map：集合
 * * dictionary：字典（映射）
 */
export type BluePrintParamSetType = 'variable'|'array'|'set'|'dictionary';

/**
 * 类型定义类
 */
export class BluePrintParamType extends SaveableObject {
  /**
   * 获取静态any类型
   */
  public static Any() : BluePrintParamType  {
    return new BluePrintParamType("any");
  }
  /**
   * 获取静态execute类型
   */
  public static Execute() : BluePrintParamType  {
    return new BluePrintParamType('execute');
  }

  /**
   * 类型的基础类型
   */
  public baseType: BluePrintParamBaseType = "any";
  /**
   * 类型的自定义类型名称
   */
  public customType = "";
  /**
   * 类型的集合状态
   */
  public setType : BluePrintParamSetType = 'variable';
  /**
   * 当类型为Dictionary时的键类型
   */
  public dictionaryKeyType: BluePrintParamType|null = null;

  public constructor(baseType: BluePrintParamBaseType | BluePrintParamType, customType = "", setType : BluePrintParamSetType = 'variable') {
    super();
    this.saveClassName = 'BluePrintParamType';
    this.set(baseType, customType, setType);
  }

  /**
   * 设置当前类型对象的值
   * @param baseType 基础类型
   * @param customType 自定义类型
   */
  public set(baseType: string | BluePrintParamType, customType = "", setType : BluePrintParamSetType = 'variable') : void {
    if (typeof baseType == "undefined") {
      this.baseType = "any";
      this.customType = "";
      return;
    }
    if (typeof baseType == "string") {
      if (StringUtils.isNullOrEmpty(customType)) {
        this.baseType = ParamTypeService.getBaseTypeForCustomType(baseType);
        this.customType = baseType;
      } else {
        this.baseType = <BluePrintParamBaseType>baseType;
        this.customType = customType;
      }
    } else {
      this.baseType = baseType.baseType;
      this.customType = baseType.customType;
    }

    this.setType = setType;
  }

  /**
   * 获取当前类型的字符串表示方式
   */
  public getType() : string {
    return this.isCustom() ? this.customType : this.baseType;
  }

  /**
   * 获取类型对用户友好的字符串
   * @returns 
   */
  public getNameString() : string {
    let str = '';
    const typeName = ParamTypeService.getTypeNameString(this.getType()) || '';
    if(this.setType == 'dictionary')
      str = '<i>' + (this.dictionaryKeyType ? ParamTypeService.getTypeNameString(this.dictionaryKeyType.getType()) : '未知') + '</i>到<i>' + typeName + '</i><b>的映射</b>';
    else if(this.setType == 'array')
      str = typeName + '<b>数组</b>';
    else if(this.setType == 'set')
      str = typeName + '<b>集</b>';
    else 
      str = typeName;
    return str;
  }

  /**
   * 获取类型颜色
   * @returns 
   */
  public getTypeColor() : string {
    return ParamTypeService.getTypeColor(this.getType()) || '';
  }

  /**
   * 获取当前类型是不是执行类型
   */
  public isExecute() : boolean {
    return this.baseType == "execute";
  }

  /**
   * 获取当前类型是不是any类型
   */
  public isAny() : boolean {
    return this.baseType == "any";
  }

  /**
   * 获取当前类型是不是自定义类型
   */
  public isCustom() : boolean {
    return this.baseType == "custom" || this.baseType == "enum";
  }

  /**
   * 获取当前类型是不是自定义类型
   */
  public isDictionary() : boolean {
    return this.setType === 'dictionary';
  }

  /**
   * 与另外一个类型相比较，返回两个类型是否相同
   * @param otherType 另外一个类型对象
   * @param compareSetType 是否比较对应的类型集合状态
   */
  public equals(otherType: BluePrintParamType | string, compareSetType = true) : boolean {
    if (otherType == null) return false;
    if (otherType == this) return true;
    if (typeof otherType == "string") return otherType == this.getType();
    return (
      this.baseType == otherType.baseType &&
      (!compareSetType || this.setType == otherType.setType) &&
      this.customType == otherType.customType
    );
  }
}

/**
 * 类型的编辑器定义
 */
export class BluePrintParamEditorDefine {

  /**
   * 一个函数回调，在这里创建数据类型的对应编辑器，用来编辑此种类型的数据。
   */
  public editorCreate: BluePrintFlowPortCreateEditorFunction|null = null;
  /**
   * 指示这个类型编辑器可用的变量集合类型
   */
  public useInSetType: BluePrintParamSetType[] = ["variable"];
}

//类型注册
//========================
/**
 * 数据类型信息结构。
 * 此信息用来定义自己的参数类型
 */
export class BluePrintParamTypeDefine {
  public constructor(
    name: string,
    prototypeName: string,
    color?: string,
    editor?: BluePrintParamEditorDefine
  ) {
    this.name = name;
    this.prototypeName = prototypeName;
    if (typeof editor != "undefined") this.editor = editor;
    if (typeof color != "undefined") this.color = color;
  }

  /**
   * 类型名称
   */
  public name = "";
  /**
   * 自定义 object 的 prototype 名称
   */
  public prototypeName = "";
  /**
   * 自动创建Enum的转换器
   */
  public autoCreateEnumConverter = true;
  /**
   * 编辑器创建
   */
  public editor: BluePrintParamEditorDefine|null = null;
  /**
   * 类型的颜色
   */
  public color = "rgb(253,253,253)";

  /**
   * 显示给用户的名称
   */
  public nameString = "";

  /**
   * getHashCode 获取哈希码函数.
   */
  public getHashCode: null|((v: SaveableTypes) => string) = null;
  /**
   * createDefaultValue 创建默认值函数.
   */
  public createDefaultValue: null|(() => SaveableTypes|null) = null;
}

/**
 * 枚举的项结构
 */
export type BluePrintParamEnumValueDefine = {
  /**
   * 项的值
   */
  value: string;
  /**
   * 项的说明文字
   */
  description: string;
};

/**
 * 枚举类型信息结构。
 * 此信息用来定义自己的枚举类型
 */
export class BluePrintParamEnumDefine extends BluePrintParamTypeDefine {
  /**
   * 创建枚举类型信息结构
   * @param name 枚举名称
   * @param allowTypes 枚举允许的项
   * @param color 颜色
   * @param editor 编辑器数据，若不定义，则使用默认枚举编辑器
   */
  public constructor(
    name: string,
    allowTypes?: Array<BluePrintParamEnumValueDefine> | Array<string>,
    color?: string,
    editor?: BluePrintParamEditorDefine
  ) {
    super(name, "enum", color, editor);

    if (typeof allowTypes != "undefined" && allowTypes.length > 0) {
      allowTypes.forEach((element : BluePrintParamEnumValueDefine|string) => {
        this.allowTypes.push({
          value: typeof element === 'object' ? element.value : element,
          description: typeof element === 'object' ? element.description : '',
        });
      });
    }
  }

  /**
   * 枚举允许的项
   */
  public allowTypes: Array<BluePrintParamEnumValueDefine> = [];
}

/**
 * 类型转换器源
 */
export interface BluePrintParamTypeConverterSource {
  sourceValue: SaveableTypes|null;
  sourceParam: BluePrintFlowPort;
}
/**
 * 类型转换器回调函数定义
 */
export interface BluePrintParamTypeConverterGeneratorInfo {
  generate ?: boolean;
}

/**
 * 类型转换器的注册类型
 */
export class BluePrintParamTypeConverterDefine {
  /**
   * 源类型
   */
  public fromType: BluePrintParamType = BluePrintParamType.Any();
  /**
   * 目标类型
   */
  public toType: BluePrintParamType = BluePrintParamType.Any();
  /**
   * 转换所支持的集合类型
   */
  public allowSetType: BluePrintParamSetType = "variable";
  /**
   * 转换器
   */
  public converter = {} as BluePrintParamTypeConverterGeneratorInfo;
}
