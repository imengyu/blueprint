<template>
  <div class="mx-menu-bar">
    <slot />
    <div 
      v-for="(item, k) in items" 
      :class="'mx-menu-bar-item'+(currentShowItem==item?' active':'')" 
      :key="k"
      @click="onItemClick($event.target, item)"
      @mouseenter="onItemMouseEnter($event.target, item)"
    >
      {{ item.label }}
    </div>
    <ContextSubMenu
      v-if="currentShowChildItems"
      :items="currentShowChildItems"
      :position="position"
      :parentItem="parentItem"
      :options="options"
      :zIndex="zIndex"
      :globalData="globalData"
      @close="onChildMenuClose"
    />
    <div v-show="currentShowItem!=null" class="mx-menu-bar-out-click-overlay" @click="onOutClick">
    </div>
  </div>
</template>

<script lang="ts">
import { MenuItem, MenuOptions } from '@imengyu/vue3-context-menu'
import { ContextMenuGlobalData } from '@imengyu/vue3-context-menu/src/ContextMenuDefine'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'MenuBar',
  props: {
    items: {
      type: Object as PropType<Array<MenuItem>>,
      required: true,
    }
  },
  data() {
    return {
      position: {
        x: 0,
        y: 0
      },
      currentShowItem: null as MenuItem|null,
      currentShowChildItems: null as Array<MenuItem>|null,
      parentItem: {
        maxWidth: 400,
        minWidth: 150,
      },
      options: { 
        iconFontClass: 'iconfont',
        customClass: '',
        yOffset: 0,
        xOffset: 0,
      } as MenuOptions,
      zIndex: 101,
      globalData: {
        parentPosition: {
          x: 0,
          y: 0
        },
        screenSize: {
          w: 0,
          h: 0
        }
      } as ContextMenuGlobalData,
      focused: false,
    }
  },
  mounted() {
    setTimeout(() => {
      this.globalData.screenSize.w = window.innerWidth;
      this.globalData.screenSize.h = window.innerHeight;
    }, 50);
  },
  methods: {
    onItemClick(target: HTMLElement, item : MenuItem) {
      this.focused = true;
      this.currentShowChildItems = item.children || null;
      this.currentShowItem = item;
      this.position.x = target.offsetLeft;
      this.position.y = target.offsetHeight;
      if(!this.currentShowChildItems && typeof item.onClick === 'function')
        item.onClick();
    },
    onItemMouseEnter(target: HTMLElement, item : MenuItem) {
      if(this.focused) {
        this.currentShowChildItems = item.children || null;
        this.currentShowItem = item;

        this.position.x = target.offsetLeft;
        this.position.y = target.offsetHeight;
      }
    },
    onOutClick() {
      this.focused = false;
      this.currentShowChildItems = null;
      this.currentShowItem = null;
    },
    onChildMenuClose(byUserClick : boolean) {
      if(byUserClick)
        this.onOutClick()
    }
  }

})
</script>

<style lang="scss">
.mx-menu-bar {
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 30px;
  overflow: visible;
}
.mx-menu-bar-item {
  display: inline-block;
  padding: 8px 10px;
  position: relative;
  user-select: none;    
  font-size: 14px;
  white-space: nowrap;
  z-index: 101;
  color: #fff;

  &:hover {
    background-color: rgba(241, 241, 241, 0.09);
  }
  &:active, &.active {
    background-color: rgba(223, 223, 223, 0.123);
  }
}
.mx-menu-bar-out-click-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}
</style>