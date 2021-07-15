<template>
  <div class="dock-panel">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { DockHostData, DockPanelData } from "./DockData";

export default defineComponent({
  name: 'DockPanel',
  emits: [ 
    'on-close',
    'on-tab-right-click',
  ],
  props: {
    closeUnSave: {
      type: Boolean,
      default:false
    },
    title: {
      type: String,
      default: 'false'
    },
    iconClass: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: true
    }, 
    closeable: {
      type: Boolean,
      default: false
    },
    insertTo: {
      type: String,
      default: ''
    },
    tabLeftOffset: {
      type: Number,
      default: 0
    },
    dockPanelData: {
      type: Object as PropType<DockPanelData>,
      default: null
    },
    dockHost: {
      type: Object as PropType<DockHostData>,
      default: null
    },
    tag: {
      type: String,
      default: ''
    }, 
  },
  mounted() {
    this.onClose = this.onClose.bind(this);
    this.onTabRightClick = this.onTabRightClick.bind(this);
    setTimeout(() => {
      this.onUpdateDockPanelData();
    }, 400)
  },
  watch: {
    title() { this.onUpdateTitle() },
    iconClass() { this.onUpdateIconClass() },
    closeable() { this.onUpdateCloseable() },
    insertTo() { this.onUpdateInsertTo() },
    visible() { this.onUpdateVisible() },
    tabLeftOffset() { this.onUpdateTabLeftOffset() },
    dockPanelData() { this.onUpdateDockPanelData() },
    tag() { this.onUpdateTag() },
  },
  methods: {
    onClose() {
      this.$emit('on-close', this.dockPanelData);
    },
    onTabRightClick() {
      this.$emit('on-tab-right-click', this.dockPanelData);
    },
    onUpdateTitle() { const dockPanelData = this.dockPanelData; if(dockPanelData && this.title) dockPanelData.title = this.title; },
    onUpdateIconClass() { const dockPanelData = this.dockPanelData; if(dockPanelData && this.iconClass) dockPanelData.iconClass = this.iconClass; },
    onUpdateCloseable() { const dockPanelData = this.dockPanelData; if(dockPanelData && typeof this.closeable === 'boolean') dockPanelData.closeable = this.closeable; },
    onUpdateInsertTo() { const dockPanelData = this.dockPanelData; if(dockPanelData && this.insertTo) dockPanelData.insertTo = this.insertTo; },
    onUpdateVisible() { const dockPanelData = this.dockPanelData; if(dockPanelData && typeof this.visible === 'boolean') dockPanelData.visible = this.visible; },
    onUpdateTabLeftOffset() { const dockPanelData = this.dockPanelData; if(dockPanelData && this.tabLeftOffset) dockPanelData.tabLeftOffset = this.tabLeftOffset; },
    onUpdateTag() { 
      const dockPanelData = this.dockPanelData; 
      console.log('onUpdateTag: ' +  this.tag);
      if(dockPanelData && this.tag) {
        dockPanelData.tag = this.tag; 
      }
    },
    onUpdateDockPanelData() {
      const dockPanelData = this.dockPanelData; 
      if(dockPanelData) {
        dockPanelData.onClose = this.onClose;
        dockPanelData.onTabRightClick = this.onTabRightClick;
      }
    },
  }
})
</script>