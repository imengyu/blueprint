import { BluePrintFlowBlockDefine, IBluePrintFlowBlockDefine } from "../Flow/BluePrintFlowBlock";
import logger from "../Base/Logger";
import { BluePrintPackage } from "../Blocks/BluePrintPackage";
import BaseBlock from "../Blocks/Builtin/BaseBlock";

/**
 * 单元注册服务。
 * 用于将单元的预定义注册至编辑器
 */
export class BlockRegisterServiceClass {
  //所有单元
  private allBlocks = new Map<string, CategoryDataItem>();
  //所有单元（已分类）
  private allBlocksGrouped: Array<CategoryData> = [
    {
      category: "",
      childCategories: [],
      blocks: [],
      open: true,
      show: true,
      filterShow: true,
    },
  ];
  //所有包
  private allPacks = new Map<string, {
    allDefineGUids: Array<string>,
    pack: BluePrintPackage
  }>()

  /**
   * 获取所有单元（已分类）列表
   */
  public getAllBlocksGrouped() :Array<CategoryData>  {
    return this.allBlocksGrouped;
  }
  /**
   * 设置所有单元（已分类）列表
   */
  public setAllBlocksGrouped(v: Array<CategoryData>) : void {
    this.allBlocksGrouped = v;
  }
  /**
   * 注册单元
   * @param BlockDef 单元信息
   * @param pack 单元包
   * @param updateList 是否刷新列表
   */
  public registerBlock(BlockDef: IBluePrintFlowBlockDefine, updateList = true) : void {
    const oldBlock = this.getRegisteredBlock(BlockDef.guid);
    if (oldBlock != null && oldBlock != undefined) {
      logger.warning(
        "BlockService",
        "Block guid " + BlockDef.guid + " alreday registered !"
      );
      return;
    }

    const define = new BluePrintFlowBlockDefine(BlockDef);
    this.allBlocks.set(BlockDef.guid, {
      define: define,
      show: true,
      filterShow: true,
      grouped: false,
      hideInAddPanel: define.hideInAddPanel,
      categoryObject: null,
    });
    if (updateList) this.updateBlocksList();
  }
  /**
   * 获取已经注册的单元
   * @param guid 单元GUID
   */
  public getRegisteredBlock(guid: string) : BluePrintFlowBlockDefine|null {
    const v = this.allBlocks.get(guid);
    return v ? v.define : null;
  }
  /**
   * 取消注册单个单元
   * @param guid 单元GUID
   * @param updateList 是否刷新列表
   */
  public unregisterBlock(guid: string, updateList = true) : void {
    const regData = this.allBlocks.get(guid);
    if (regData) {
      if (regData.categoryObject) {
        regData.categoryObject.blocks.remove(regData);
      }
    }
    this.allBlocks.delete(guid);
    if (updateList) this.updateBlocksList();
  }

  /**
   * 注册单元包
   * @param pack 单元包
   */
  public registerBlockPack(pack : BluePrintPackage, updateList = true) : void {

    const guids = new Array<string>();
    const defines = pack.register();
    defines.forEach((blockDefine) => {
      this.registerBlock(blockDefine, false);
      guids.addOnce(blockDefine.guid);
    });

    this.allPacks.set(pack.packageName, {
      pack,
      allDefineGUids: guids
    });
    logger.log('BlockService', `Register BlockPack : ${pack.packageName}`);

    if(updateList)
      this.updateBlocksList();
  }
  /**
   * 取消注册单元包
   * @param pack 单元包
   */
  public unregisterBlockPack(pack : BluePrintPackage) : void {

    const packData = this.allPacks.get(pack.packageName);
    if(!packData) {
      logger.log('BlockService', `Unregister BlockPack : ${pack.packageName} failed: ${pack.packageName} not registered.`);
      return;
    }

    this.allPacks.delete(pack.packageName);
    logger.log('BlockService', `Unregister BlockPack : ${pack.packageName}`);

    packData.allDefineGUids.forEach((guid) => {
      this.unregisterBlock(guid, false);
    })

    this.updateBlocksList();
  }
  /**
   * 获取包是否注册
   * @param name 包名
   */
  public getBlockPackRegistered(name : string) : BluePrintPackage|null {
    const packData = this.allPacks.get(name);
    if(packData)
      return packData.pack
    return null
  }

  //单元列表
  //======================

  /**
   * 查找或生成单元分类菜单
   * @param path 路径
   * @param parent 父级
   */
  private findOrCrateBlocksListCategoryAtCategory(
    path: string,
    parent: Array<CategoryData>
  ): CategoryData {
    const spIndex = path.indexOf("/");
    let categoryName = "";

    if (spIndex > 0) categoryName = path.substring(0, spIndex);
    else categoryName = path;

    let category: CategoryData|null = null;
    for (let i = 0, c = parent.length; i < c; i++) {
      if (parent[i].category == categoryName) {
        category = parent[i];
        break;
      }
    }

    //没有则创建
    if (category == null) {
      category = {
        category: categoryName,
        childCategories: [],
        blocks: [],
        open: false,
        show: true,
        filterShow: true,
      };
      parent.push(category);
    }

    //如果还有下一级，则递归查找
    if (spIndex > 0 && spIndex < path.length)
      return this.findOrCrateBlocksListCategoryAtCategory(
        path.substring(spIndex + 1),
        category.childCategories
      );
    else return category;
  }

  /**
   * 查找或生成单元分类菜单
   * @param path 路径
   */
  public findBlocksListCategory(path: string): CategoryData {
    return this.findOrCrateBlocksListCategoryAtCategory(
      path,
      this.allBlocksGrouped
    );
  }
  /**
   * 刷新单元列表
   */
  public updateBlocksList() : void {
    this.allBlocks.forEach((regData) => {
      if (!regData.grouped) {
        const category = this.findBlocksListCategory(regData.define.category);

        regData.categoryObject = category;

        if (!category.blocks.contains(regData)) category.blocks.push(regData);

        regData.grouped = true;
      }
    });
  }
  /**
   * 获取基础单元定义
   * @param name 
   */
  public getBaseBlock(name : string) : BluePrintFlowBlockDefine|null {
    switch(name) {
      case 'BaseIn': return this.allBlocks.get(BaseBlock.getScriptBaseInBlockGUID())?.define || null;
      case 'Comment': return this.allBlocks.get(BaseBlock.getScriptBaseCommentBlockGUID())?.define || null;
      case 'Convert': return this.allBlocks.get(BaseBlock.getScriptBaseConvertBlockGUID())?.define || null;
      case 'VariableGet': return this.allBlocks.get(BaseBlock.getScriptBaseVariableGetBlockGUID())?.define || null;
      case 'VariableSet': return this.allBlocks.get(BaseBlock.getScriptBaseVariableSetBlockGUID())?.define || null;
    }
    return null;
  }
}

/**
 * 单元分类的结构
 */
export type CategoryData = {
  category: string;
  childCategories: Array<CategoryData>;
  blocks: Array<CategoryDataItem>;
  open: boolean;
  show: boolean;
  filterShow: boolean;
};
export type CategoryDataItem = {
  define: BluePrintFlowBlockDefine;
  show: boolean;
  filterShow: boolean;
  hideInAddPanel: boolean;
  grouped: boolean;
  categoryObject: CategoryData|null,
};

const BlockRegisterService = new BlockRegisterServiceClass();
export default BlockRegisterService;
