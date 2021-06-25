<template>
  <div>

    <div v-for="(item, index) in categoryData.childCategories" :key="index" :name="index.toString()"
      v-show="item.show && item.filterShow"
      class="collapse-item">
      <span class="collapse-title" @click="item.open=!item.open;">
        <i :class="'collapse-arrow iconfont ' + (item.open ? 'icon-arrow-down-1' : 'icon-arrow-right-')"></i>
        {{ item.category }}
      </span>
      <BlockListCategory v-show="item.open" :categoryData="item" @on-block-item-click="(block) => $emit('on-block-item-click', block)">
      </BlockListCategory>
    </div>

    <div class="blueprint-block-list">
      <div class="item" 
        v-for="(item, index) in categoryData.blocks" 
        v-tooltip="item.define.description" 
        v-show="item.show && item.filterShow && !item.define.hideInAddPanel"
        :key="index"
        :draggable="isAddDirectly ? 'false' : 'true'"
        @click="$emit('on-block-item-click', item.define)"
        @dragstart="onDrag(item, $event)" >
        <img :src="item.define.style.logo" />
        {{ item.define.name }}
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { CategoryData, CategoryDataItem } from '@/model/Services/BlockRegisterService';
import HtmlUtils from '@/model/Utils/HtmlUtils';
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'BlockListCategory',
  emits: [ 'on-block-item-click' ],
  props: {
    categoryData: {
      type: Object as PropType<CategoryData>
    },
    isAddDirectly: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    onDrag(item : CategoryDataItem, e : DragEvent) {
      if(HtmlUtils.isEventInControl(e)) { 
        e.preventDefault(); 
        e.stopPropagation(); 
      }
      else if(e.dataTransfer) {
        e.dataTransfer.setData('text/plain', 'drag:block:' + item.define.guid);
      }
    }
  }
})
</script>