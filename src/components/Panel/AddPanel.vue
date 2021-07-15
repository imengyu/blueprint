<template>
  <div ref="addBlockPanel" class="blueprint-editor-panel blueprint-float-panel" 
    :style="{ 
      left: (showPos != null ? showPos.x : 0) + 'px', 
      top: (showPos != null ? showPos.y : 0) + 'px' 
    }"
    @click="onClick($event)">

    <div class="text-center">
      添加
      <span v-html="filterText"></span>
    </div>

    <div class="input">
      <input class="small-input" type="text" v-model="searchValue" placeholder="搜索单元..." />
      <a href="javascript:;" class="small-button" v-tooltip data-title="清空">
        <i class="iconfont icon-close-2"></i>
      </a>
    </div>

    <div 
      v-for="(item, index) in allBlocksGrouped" 
      :key="index" :name="index.toString()" 
      v-show="item.show && item.filterShow && item.category!=''"
      class="collapse-item">
      <span class="collapse-title"  @click="item.open=!item.open;">
        <i :class="'collapse-arrow iconfont ' + (item.open ? 'icon-arrow-down-1' : 'icon-arrow-right-')"></i>
        {{ item.category }}
      </span>
      <BlockListCategory v-show="item.open" :categoryData="item" :isAddDirectly="isAddDirectly">
      </BlockListCategory>
    </div>

    <BlockListCategory v-if="blocksGroupedMostOut" :categoryData="blocksGroupedMostOut" :isAddDirectly="isAddDirectly">
    </BlockListCategory>

    <div v-if="currentShowCount===0 && currentFilterCount===0" class="text-center mt-5 mb-5">暂无筛选结果。请更改筛选条件后再试</div>

  </div>
</template>

<script lang="ts">
import { CategoryData } from '@/model/Services/BlockRegisterService'
import { Vector2 } from '@/model/Base/Vector2'
import { BluePrintFlowBlockDefine } from '@/model/Flow/BluePrintFlowBlock'
import { BluePrintFlowPortDirection } from '@/model/Flow/BluePrintFlowPort'
import { BluePrintParamType } from '@/model/Flow/BluePrintParamType'
import { defineComponent, PropType } from 'vue'
import BlockListCategory from './BlockListCategory.vue'

export default defineComponent({
  components: { BlockListCategory },
  name: 'AddPanel',
  emits: [ 'addBlock', 'close', ],
  props: {
    allBlocksGrouped: {
      type: Object as PropType<Array<CategoryData>>,  
      default: null,
    },
    showPos: {
      type: Object as PropType<Vector2>,
      default: null,
    }, 
    show: {
      type: Boolean,
      default: false,
    },
    isAddDirectly: {
      type: Boolean,
      default: false,
    },
    filterByPortDirection: {
      type: String as PropType<BluePrintFlowPortDirection>,  
      default: null,
    },
    filterByPortType: {
      type: Object as PropType<BluePrintParamType>,  
      default: null,
    },
  },
  data() {
    return {
      blocksGroupedMostOut: null as CategoryData|null,
      filterText: '所有可用单元',
      searchValue: '',
      currentShowCount: 0,
      currentFilterCount: 0,
    }
  },
  mounted() {
    setTimeout(() => {
      this.loadMostOutBlocks();
    }, 1000);
  },
  watch: {
    allBlocksGrouped(newV : Array<CategoryData>) {
      if(newV) { 
        this.loadMostOutBlocks();
      } 
    },
    show(newV: boolean) {
      if(newV) { setTimeout(() => {
        document.addEventListener('click', this.onDocClick);
        this.doFilter();
      }, 100); } 
      else document.removeEventListener('click', this.onDocClick);
    },
    searchValue(newV: string) {
      if(newV == '') this.clearSearch();
      else this.doSearch();
    },
  },
  provide() {
    return {
      addBlock: (block : BluePrintFlowBlockDefine) => {
        this.$emit('addBlock', block)
      }
    }
  },
  methods: {
    loadMostOutBlocks() {
      for (let index = 0; index < this.allBlocksGrouped.length; index++) {
        if( this.allBlocksGrouped[index].category == '') {
          this.blocksGroupedMostOut =  this.allBlocksGrouped[index];
          break;
        }        
      }
    },
    focus() {
      setTimeout(() => {
        (this.$refs['addBlockPanel'] as HTMLElement).focus();
      }, 50);
    },
    doFilterLoop(cn : (b : BluePrintFlowBlockDefine) => boolean) {
      this.currentFilterCount = 0;
      let loop = (data : CategoryData) => {
        let showChildCount = 0;
        data.blocks.forEach((b) => {
          b.show = cn(b.define);
          if(b.show) showChildCount++;
        });
        data.childCategories.forEach((d) => showChildCount += loop(d));
        data.show = showChildCount > 0;
        return showChildCount;
      };
      this.allBlocksGrouped.forEach((cd) => this.currentFilterCount += loop(cd));
    },
    /**
     * 根据方向、类型、键类型等参数在当前定义文件中查找一个端口
     * @param direction 端口方向
     * @param type 数据类型
     * @param keyType 集合键的类型
     * @param setType 数据集合的类型
     * @param includeAny 是否包含 any 类型
     */
    hasOnePortByDirectionAndType(block : BluePrintFlowBlockDefine, direction : BluePrintFlowPortDirection, type : BluePrintParamType, includeAny = false) {
      const ports = block.ports;
      if(type.isExecute()) {
        for(let i = 0, c = ports.length; i < c;i++) {
          const port = ports[i];
          if(port.direction == direction && port.type.isExecute())
            return true;
        }
      }else {
        for(let i = 0, c = ports.length; i < c;i++) {
          const port = ports[i];
          if(port.direction == direction) {
            if(type.setType == 'dictionary' && port.type.setType == 'dictionary' && port.type.dictionaryKeyType && type.dictionaryKeyType) {
              if(
                (type.equals(port.type) || (type.isAny() && includeAny))
                && (type.dictionaryKeyType.equals(port.type.dictionaryKeyType)
                  || (type.dictionaryKeyType.isAny() && includeAny))

              ) return true;

            }
            else if(type.isAny() && includeAny && port.type.setType == type.setType) return true;
            else if(type.equals(port.type) && port.type.setType == type.setType) return true;
          }
        }
      }
      return false;
    },
    doFilter() {
      if(this.filterByPortType != null) {
        this.doFilterLoop((b) => this.hasOnePortByDirectionAndType(b, this.filterByPortDirection, this.filterByPortType, true));
        this.filterText = (this.filterByPortDirection == 'input' ? '获取 ' : '输出 ') + this.filterByPortType.getNameString() + ' 的单元';
      }
      else this.clearFilter();
    },
    clearFilter() {
      this.currentFilterCount = 0;

      let loop = (data : CategoryData) => {
        data.show = true;
        data.blocks.forEach((b) => b.show = true);
        data.childCategories.forEach((d) => loop(d));
        this.currentFilterCount++;
      };

      this.allBlocksGrouped.forEach((cd) => loop(cd));
      this.filterText = '所有可用单元';
    },
    doSearch() {
      this.currentShowCount = 0;
      let loop = (data : CategoryData) => {
        let showChildCount = 0;
        data.blocks.forEach((b) => {
          b.filterShow = b.define.name.contains(this.searchValue) || b.define.description.contains(this.searchValue);
          if(b.filterShow) showChildCount++;

          data.childCategories.forEach((d) => showChildCount += loop(d));
        });
        data.childCategories.forEach((d) => showChildCount += loop(d));
        data.filterShow = showChildCount > 0;
        data.open = true;
        return showChildCount;
      };
      this.allBlocksGrouped.forEach((cd) => this.currentShowCount += loop(cd));
    },
    clearSearch() {

      let loop = function(data : CategoryData) {
        data.filterShow = true;
        data.open = false;
        data.blocks.forEach((b) => b.filterShow = true);
        data.childCategories.forEach((d) => loop(d));
      };

      this.allBlocksGrouped.forEach((cd) => loop(cd));
    },

    onDocClick() {
      this.$emit('close');
      document.removeEventListener('click', this.onDocClick);
    },
    onClick(e : MouseEvent) {
      e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
    },
  }
})
</script>