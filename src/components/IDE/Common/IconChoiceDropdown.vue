<template>
  <div class="flow-float-set-dropdown-base">
    <div class="flow-float-set-dropdown" v-tooltip="title + (' ' + choices[value].title)" @click="switchShow">
      <i :class="'iconfont '+ choices[value].icon"></i>
    </div>
    <div 
      v-show="show" ref="selector" 
      class="flow-float-set-dropdown-selector" 
      :style="{
        left: adjustSelectorLeft != 0 ? `${adjustSelectorLeft}px` : '',
        top: adjustSelectorTop != 0 ? `${adjustSelectorTop}px` : '',
        maxHeight: adjustSelectorMaxHeight > 0 ? `${adjustSelectorMaxHeight}px` : ''
      }">
      <div v-for="(c, i) in choices" :key="i" @click="switchType(i)">
        <i :class="'iconfont '+ c.icon"></i>
        {{ c.title }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import HtmlUtils from '@/model/Utils/HtmlUtils';
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'IconChoiceDropdown',
  props: {
    choices: {
      type: Object as PropType<Array<{
        title: string,
        icon: string
      }>>,
      default: null
    },
    value: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: '选择'
    },
  },
  watch: {
    show(newV : boolean) {
      if(newV) {
        //调整弹出菜单位置，防止超出屏幕
        this.adjustSelectorTop = 0;
        this.adjustSelectorLeft = 0;
        this.adjustSelectorMaxHeight = 0;
        this.$nextTick(() => {
          const selector = this.$refs.selector as HTMLElement;
          if(selector) {
            const screenWidth = window.innerWidth, screenHeight = window.innerHeight;
            const right = HtmlUtils.getLeft(selector) + selector.offsetWidth;
            if(right > screenWidth)
              this.adjustSelectorLeft = screenWidth - right - 10;
            else
              this.adjustSelectorLeft = 0;
            const top = HtmlUtils.getTop(selector) + selector.offsetHeight;

            if(selector.offsetHeight > screenHeight)
              this.adjustSelectorMaxHeight = screenHeight;
            else
              this.adjustSelectorMaxHeight = 0;

            if(top > screenHeight)
              this.adjustSelectorTop = screenHeight - top - 10;
            else
              this.adjustSelectorTop = 0;
          }
        });
      }
    }
  },
  data() {
    return {
      show: false,
      adjustSelectorLeft: 0,
      adjustSelectorTop: 0,
      adjustSelectorMaxHeight: 0,
    }
  },
  methods: {
    switchType(newType : number) {
      this.show = false;
      this.$emit('update:value', newType);
    },
    switchShow() {
      this.show = !this.show;
    },
  },
})
</script>

<style lang="scss">
.flow-float-set-dropdown-base {
  position: relative;
  display: inline-block;
}
.flow-float-set-dropdown {
  display: inline-block;
  cursor: pointer;
  padding: 2px 5px;
  text-shadow: 0px 0px 3px rgb(0, 0, 0);
  user-select: none;
}
.flow-float-set-dropdown-selector {
  position: absolute;
  top: 20px;
  border: 1px solid #000;
  background: #fff;
  z-index: 200;
  user-select: none;

  > div {
    cursor: pointer;
    display: block;
    text-align: center;
    padding: 5px;
    user-select: none;

    i {
      vertical-align: middle;
    }

    &:hover, &:active {
      background-color: #3f3f3f;
      color: #fff;
    }
  }
}
</style>