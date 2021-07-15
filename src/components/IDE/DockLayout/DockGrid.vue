<template>
  <div v-if="dockData" class="dock-grid">
    <DockSplit v-if="dockData.grids && dockData.grids.length > 0" :direction="dockData.currentDirection" :dockHost="dockHost">
      <DockGrid v-for="grid in dockData.grids" :key="grid.uid" :dockData="grid" :dockHost="dockHost" />
    </DockSplit>
    <div v-else-if="dockData.panels && dockData.panels.length > 0" class="dock-tab">
      <div class="dock-tab-list"
        @mouseenter="onTabMouseEnter($event)"
        @mouseleave="onTabMouseLeave($event)"
        @wheel="onTabMouseWhell($event)">
        <div v-show="showTableLrButton" class="left" draggable="false" @click="onTabScrollLeft">
          <i class="iconfont icon-arrow-left-2"></i>
        </div>
        <div v-show="showTableLrButton" class="right" draggable="false" @click="onTabScrollRight">
          <i class="iconfont icon-arrow-right-"></i>
        </div>
        <div class="tabs" :id="'dock-tab-contol-uid-'+dockData.uid" :style="{
          left: dockData.activeTab ? (dockData.activeTab.tabLeftOffset + 'px') : undefined,
          height: dockHost ? dockHost.tabHeight + 'px' : undefined
        }">
          <div
            v-for="panel in dockData.panels" 
            :class="'item drag-target-tab '+(dockData.activeTab===panel?'active':'')" 
            :key="panel.uid" 
            draggable="true" 
            @mousedown="onTabItemMouseDown($event,panel)"
            @dragstart="onTabItemDragStart($event, panel)"
            @dragend="onTabItemDragEnd($event, panel)"
            >
            <i :class="'icon '+panel.iconClass"></i>
            <span>{{ panel.title }}</span>
            <a v-if="panel.closeable" class="close cursor-pointer" :draggable="false" @click="onTabItemClose(panel)" title="关闭">
              <i :class="'iconfont '+(panel.closeUnSave?'icon-file-':'icon-close-')"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="dock-tab-content drag-target-host">
        <!--
          这里不再使用了
        <VNodeRenderer v-for="panel in dockData.panels" v-show="dockData.activeTab==panel" :key="panel.key+'_Host'" :vnode="panel.vnode" />
        -->
      </div>
    </div>
    <div v-else-if="dockHost && dockData.noPanelViewSlotName && dockData.noPanelViewSlotName!=''" class="dock-empty">
      <VNodeRenderer :vnode="dockHost.getOneSlot(dockData.noPanelViewSlotName)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { DockData, DockHostData, DockPanelData } from './DockData'
import VNodeRenderer from '../../Common/VNodeRenderer.vue'
import DockSplit from './DockSplit.vue'

export default defineComponent({
  name: 'DockGrid',
  components: {
    VNodeRenderer,
    'DockSplit': DockSplit,
  },
  props: {
    /**
     * 停靠数据
     */
    dockData: {
      type: Object as PropType<DockData>,
      default: null
    },
    dockHost: {
      type: Object as PropType<DockHostData>,
      default: null
    }
  },
  data() {
    return {
      dragActive: false,
      showTableLrButton: false,
    }
  },
  methods: {
    onTabItemMouseDown(e : MouseEvent, item : DockPanelData) {
      if(e.button == 0) {
        const dockData = this.dockData;
        const last = dockData.activeTab;
        dockData.activeTab = item;
        this.dockHost.onActiveTabChange(this.dockData, last, item);
      } else if(e.button == 2) {
        if(typeof item.onTabRightClick === 'function')
          item.onTabRightClick();
      }
    },
    onTabItemClose(panel : DockPanelData) {
      typeof panel.onClose === 'function' ? panel.onClose() : panel.visible = false;
    },
    onTabScrollLeft(off ?: number) {
      let el = document.getElementById('dock-tab-contol-uid-'+this.dockData.uid);
      if(el) {
        if(el.scrollLeft > 0) el.scrollLeft -= (typeof off === 'number' ? off : 30);
        else el.scrollLeft = 0;
      }
    },
    onTabScrollRight(off ?: number) {
      let el = document.getElementById('dock-tab-contol-uid-'+this.dockData.uid);
      if(el) {
        if(el.scrollLeft < el.scrollWidth) el.scrollLeft += (typeof off === 'number' ? off : 30);
        else el.scrollLeft = el.scrollWidth;
      }
    },
    onTabMouseWhell(e : WheelEvent) {
      if(e.deltaY < 0) {
        this.onTabScrollLeft(10);
      } else if(e.deltaY > 0) {
        this.onTabScrollRight(10);
      }
    },
    onTabMouseEnter(e : MouseEvent) {
      let el = e.target as HTMLElement;
      if(el)
        this.showTableLrButton = el.scrollWidth >= el.clientWidth;
    },
    onTabMouseLeave(e : MouseEvent) {
      let el = e.target as HTMLElement;
      if(el)
        this.showTableLrButton = false;
    },

    //Tab拖动事件
    onTabItemDragStart(ev : DragEvent, item : DockPanelData) {
      
      (ev.target as HTMLElement).style.opacity = '.2';
      
      setTimeout(() => {
        const dockHost = this.dockHost;
        dockHost.isDragging = true;
        dockHost.onStartDrag();
        dockHost.showDropLayout = true;
        dockHost.dropCurrentPanel = item;
      }, 100);

      const dataTransfer = ev.dataTransfer;
      if(dataTransfer) {
        dataTransfer.setData("text/plain", 'dock-panel-key-' + item.key);
        dataTransfer.dropEffect = 'none';
        dataTransfer.setDragImage((ev.target as HTMLElement), 20, 20);
      }
    },
    onTabItemDragEnd(ev : DragEvent) {
      (ev.target as HTMLElement).style.opacity = '';
      setTimeout(() => {
        const dockHost = this.dockHost;
        dockHost.isDragging = false;
        dockHost.onEndDrag();
        dockHost.showDropLayout = false;
        dockHost.dropCurrentPanel = null;
      },20);
    },
  },
  mounted() {
    setTimeout(() => {
      const dockData = this.dockData;
      if(dockData.activeTab == null && dockData.panels.length > 0)
        dockData.activeTab = dockData.panels[0];   
    }, 100)
  },
})
</script>