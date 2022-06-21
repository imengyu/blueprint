<script lang="ts">
import { ComponentPublicInstance, defineComponent, h, VNode } from 'vue'
import StringUtils from '@/model/Utils/StringUtils';
import DockGrid from "./DockGrid.vue";
import DockDropLayout from "./DockDropLayout.vue";
import { DockData, DockDirection, DockHostData, DockPanelData, IDockGridData } from './DockData';
import { Rect } from '@/model/Base/Rect';
import { Vector2 } from '@/model/Base/Vector2';
import { IKeyValueObject } from '@/model/BluePrintEditorBase';

export default defineComponent({
  name: 'DockHost',
  components: {
    DockGrid: DockGrid,
    DockDropLayout: DockDropLayout
  },
  props: {
    /**
     * 第一个布局网格是不是垂直的，默认为false
     */
    startVerticalDirection: {
      type: Boolean,
      default: false
    },
    defaultAddGridName: {
      type: String,
      default: ''
    },
    tabHeight: {
      type: Number,
      default: 40
    },
  },
  data() {
    return {
      dockPanels: new Map<string, DockPanelData>(),
      dockData: new DockData() as DockData,
      dockHost: null as DockHostData|null,

      needRemovePanels: new Array<string>(),
      isDragging: false,

      mainLayout: null as ComponentPublicInstance|null,
      dropLayout: null as HTMLDivElement|null,
      host: null as HTMLDivElement|null,
      dropStyleRegion: new Rect(),//高亮区域坐标
      dropStyleRegionInTab: new Rect(),//高亮区域坐标(Tab中)
      dropInRegionParent: new Rect(),//当前鼠标所在区域的父级网格坐标
      dropInRegion: new Rect(),//当前鼠标所在区域的网格坐标
      dropCurrentRegion : null as DockData|null,//当前鼠标所在区域的网格信息
      dropCurrentRegionDirection: '',//当前拖拽指定的强制插入方向
      dropCurrentPanel: null as DockPanelData|null,//当前拖动的面板
      dropIsTabMove: false,//当前拖动是否是在Tab中移动
      dropTabMoveTargetIndex: 0,//在Tab中移动到的目标索引

      showDropLayout: false,
      showDropMiddle: true,
      showDropLeftDep: true,
      showDropTopDep: true,
      showDropRightDep: true,
      showDropBottomDep: true,
      showDropTop: true,
      showDropBottom: true,
      showDropLeft: true,
      showDropRight: true,
      tabOffset: 3,

      lastPos: new Vector2(),
      nextInDir: '',
      lastBuildSlotCount: 0,
      checkSizeChangedTimer: 0,
      lastSize: new Vector2(),
      
      lastHoverTabUid: '',
      lastHoverTab : null as HTMLElement|null,
      dataSetFinished: false,
    }
  },
  methods: {
    //#region 插槽操作

    getSlots(key : string) : VNode[]|null {
      const s = this.$slots[key];
      if(s)
        return s();
      return null;
    },
    getOneSlot(key : string) : VNode|null {
      const s = this.$slots[key];
      if(s) {
        const slots = s();
        return slots.length > 0 ? slots[0] : null;
      }
      return null;
    },
    bulidAllSlots() : VNode[] {

      const dockPanels = this.dockPanels; 
      const defSlots = this.$slots.default ? this.$slots.default() : [];
      const panelSlot = new Array<VNode>();

      for (let i = 0; i < defSlots.length; i++) {
        const s = defSlots[i];
        if(s.key == null && s.children && s.children instanceof Array && s.children.length > 0) {
          s.children.forEach((c) => {
            if(((c as VNode).type as IKeyValueObject).name === 'DockPanel')
              panelSlot.push(c as VNode);
          });
        } else if((s.type as IKeyValueObject).name === 'DockPanel') {
          panelSlot.push(s);
        }
      }

      if(panelSlot.length == this.lastBuildSlotCount) {
        //在这里刷新一次所有VNode
        /*
        defSlot.forEach((v) => {
          if (v.key) {
            if (dockPanels.has(v.key.toString())) {
              const panelData = dockPanels.get(v.key.toString());
              if(panelData && panelData.vnode != v) {
                panelData.vnode = v;
              }
            }
          }
        });
        */
      } else {
        //首先清空标记
        dockPanels.forEach((v) => (v.refFound = false));

        if (panelSlot.length > 0) {
          //扫描所有插槽
          panelSlot.forEach((v) => {
            if (StringUtils.isNullOrEmpty(v.key)) 
              return;
            const key = v.key + '';
            let panelData = dockPanels.get(key);
            if (panelData)
              panelData.isNew = false;
            else {
              panelData = new DockPanelData();
              panelData.isNew = true;
              panelData.key = key;
              dockPanels.set(key, panelData);
            }
            //标记插槽有效
            panelData.refFound = true;
            if(panelData.vnode != v) {
              panelData.vnode = v;
            }

            //复制属性
            const props = v.props;
            if(props) {
              panelData.iconClass = props['iconClass'];
              panelData.tag = props['tag'];
              panelData.title = props['title'];
              panelData.closeable = props['closeable'];
              panelData.closeUnSave = props['closeUnSave'];
              panelData.insertTo = props['insertTo'];
              panelData.tabLeftOffset = props['tabLeftOffset'];
            }
            
          });
        } 
      
        let hasNewItem = false;
        let hasRemoveItem = false;

        this.needRemovePanels.clear();
        dockPanels.forEach((v, k) => {
          if (!v.refFound) {
            //如果没有有效标记，则标记删除插槽
            this.needRemovePanels.push(k);
            return;
          }
          //是新添加的，加入网格树
          if (v.isNew) {
            v.isNew = false;
            if(!StringUtils.isNullOrEmpty(v.insertTo))
              this.findAndInsertPanel(v.insertTo, v);
            else if(StringUtils.isNullOrEmpty(this.defaultAddGridName)) {
              let grid = this.loopForLastChildren(this.dockData as DockData);
              grid.addPanel(v);
            }  
            else
              this.findAndInsertPanel(this.defaultAddGridName, v);
            hasNewItem = true;
          }
        });

        this.$nextTick(() => {     
          //进行删除插槽
          this.needRemovePanels.forEach((k) => {
            const dockData = dockPanels.get(k);          
            if(dockData) {
              const parent = dockData.parent;
              dockPanels.delete(k);
              //删除
              if(parent) {
                let needFlushTabActive = parent.removePanel(dockData);
                if(needFlushTabActive) this.onActiveTabChange(parent, null, parent.activeTab as DockPanelData);
                let el = document.getElementById('dock-panel-'+dockData.uid);
                if(el) (this.host as HTMLElement).removeChild(el);
                this.checkAndRemoveEmptyGrid(parent);
                hasRemoveItem = true;
              }
            }
          });
          if(hasRemoveItem)
            this.forceFlushAllPanelPos(null);
        });
       
        if(hasNewItem) {
          this.$nextTick(() => this.forceFlushAllPanelPos(null));
        }
      }
      

      this.lastBuildSlotCount = panelSlot.length;
      let tabHeight = this.tabHeight - this.tabOffset;

      //构建网格
      let arrBuildSlot = new Array<VNode>();
      let loopChild = function(data : DockData, region : Rect) {    
        data.lastLayoutSize.set(region);
        if(data.panels.length > 0) {
          let panel : DockPanelData|null = null;
          for(let i = 0; i < data.panels.length; i++) {
            panel = data.panels[i];
            if(panel && panel.vnode) {
              if(!panel.vnode.props)
                panel.vnode.props = {};
                
              panel.vnode.props['id'] = 'dock-panel-' + panel.uid;

              let style = panel.vnode.props['style'];
              if(!style) { 
                style = {};
                panel.vnode.props.style = style;
              }
              style.top = `${region.y + tabHeight}px`;
              style.left = `${region.x + 2}px`;
              style.width = `${region.w - 4}px`;
              style.height = `${region.h - tabHeight}px`;
              style.display = panel == data.activeTab ? 'block' : 'none';

              panel.vnode.props['dockPanelData'] = panel;
              //if(panel.vnode.data.props) panel.vnode.data.props['dockPanelData'] = panel;

              arrBuildSlot.push(panel.vnode);
            }
          }
        } else {
          const rect = new Rect();
          let dockData : DockData|null = null;
          let currSize = 0, curGridSize = 0;
          for(let i = 0; i < data.grids.length; i++) {
            dockData = data.grids[i];
            if(data.currentDirection === 'vertical') {
              curGridSize = region.h * (dockData.size / 100);
              rect.set(region.x, currSize, region.w, curGridSize);
            } else if(data.currentDirection === 'horizontal') {
              curGridSize = region.w * (dockData.size / 100);
              rect.set(currSize, region.y, curGridSize, region.h);
            }
            currSize += curGridSize;
            loopChild(dockData, rect);
          }
        }
      }
      if(this.$refs.mainLayout) {
        const el = this.$refs.mainLayout as ComponentPublicInstance;
        const rect = new Rect(0,0, el.$el.clientWidth, el.$el.clientHeight);
        this.dockData.lastLayoutSize.set(rect.h);
        loopChild(this.dockData as DockData, rect);
      }

      return arrBuildSlot;
    },
    loopForLastChildren(data : DockData) : DockData {
      if(data.grids.length == 0)
        return data;
      for(let i = 0; i < data.grids.length; i++) {
        let dataInChild = this.loopForLastChildren(data.grids[i]);
        if(dataInChild) 
          return dataInChild;
      }
      return data;
    },
    loopUpdateChildPanelPosition(data : DockData, region : Rect) {
      data.lastLayoutSize.set(region);
      if(data.panels.length > 0) {
        let panel : DockPanelData|null = null;
        for(let i = 0; i < data.panels.length; i++) {
          panel = data.panels[i];
          let panelEl = document.getElementById('dock-panel-' + panel.uid);
          if(panelEl) {        
            panelEl.style.top = `${region.y + this.tabHeight - this.tabOffset}px`;
            panelEl.style.left = `${region.x + 2}px`;
            panelEl.style.width = `${region.w - 4}px`;
            panelEl.style.height = `${region.h - this.tabHeight - this.tabOffset}px`;
          }
        }
      } else {
        let dockData : DockData|null = null;
        let rect = new Rect();
        let currSize = 0, curGridSize = 0;
        for(let i = 0; i < data.grids.length; i++) {
          dockData = data.grids[i];
          if(data.currentDirection === 'vertical') {
            curGridSize = region.h * (dockData.size / 100);
            rect.set(region.x, currSize, region.w, curGridSize);
            currSize += curGridSize;
            this.loopUpdateChildPanelPosition(dockData, rect);
          } else if(data.currentDirection === 'horizontal') {
            curGridSize = region.w * (dockData.size / 100);
            rect.set(currSize, region.y, curGridSize, region.h);
            currSize += curGridSize;
            this.loopUpdateChildPanelPosition(dockData, rect);
          }
        }
      }
    },
    forceFlushAllPanelPos(grid : DockData|null) {
      const el = this.$refs.mainLayout as ComponentPublicInstance;
      const rect = new Rect(0, 0, el.$el.clientWidth, el.$el.clientHeight);
      if(this.dockData != grid) {
        this.dockData.lastLayoutSize.set(rect);
        this.loopUpdateChildPanelPosition(this.dockData as DockData, rect);
      }
    },
    /**
     * 查找网格
     */
    findGrid(name : string) : DockData|null {
      let find = (data : DockData, name : string) : DockData|null => {
        if(data.name === name) 
          return data;
        for(let i = 0; i < data.grids.length; i++) {
          let dataInChild = find(data.grids[i], name);
          if(dataInChild) 
            return dataInChild;
        }
        return null;
      };
      return find(this.dockData as DockData, name);
    },
    findAndInsertPanel(name : string, panel : DockPanelData) {
      let grid = this.findGrid(name);
      if(!grid) 
        grid = this.dockData as DockData;
      if(grid) {
        grid = this.loopForLastChildren(grid);
        grid.addPanel(panel);
      }
    },

    //#endregion

    //#region 子容器的数据回传

    onGridDrag(thisGrid : DockData, nextGrid : DockData) {
      this.loopUpdateChildPanelPosition(thisGrid, thisGrid.lastLayoutSize);
      if(nextGrid)
        this.loopUpdateChildPanelPosition(nextGrid, nextGrid.lastLayoutSize);
    },
    onGridDropFinish(grid : DockData) {
      this.forceFlushAllPanelPos(grid);
    },
    onActiveTabChange(grid : DockData, lastActive : DockPanelData|null, currentActive : DockPanelData) {
      if(lastActive){
        let lastActiveEl = document.getElementById('dock-panel-' + lastActive.uid);
        if(lastActiveEl) lastActiveEl.style.display = 'none';
      } 
      if(currentActive){
        let currentActiveEl = document.getElementById('dock-panel-' + currentActive.uid); 
        if(currentActiveEl) currentActiveEl.style.display = 'block';
      }
      this.$emit('active-tab-change', currentActive, lastActive);
    },
    onSizeChanged() {
      this.forceFlushAllPanelPos(null);
    },

    //检测大小更改
    checkSizeChangedTick() {
      const host = this.host as HTMLElement;
      if(!this.dataSetFinished)
        return;
      if(this.lastSize.x != host.clientWidth || this.lastSize.y != host.clientHeight) {
        this.onSizeChanged();
        this.lastSize.x = host.clientWidth;
        this.lastSize.y = host.clientHeight;
      }
    },

    //#endregion

    //#region 主容器拖动事件

    //放置
    onDrop(ev: DragEvent) {

      if(this.dropCurrentRegion == null || !ev.dataTransfer)
        return;

      ev.preventDefault();

      if(!this.dropIsTabMove && this.dropCurrentRegionDirection == 'float')
        return;
      
      //通过拖动数据找到当前正在拖动的面板
      let currentPanelKey = ev.dataTransfer.getData('text/plain');
      if(StringUtils.isNullOrEmpty(currentPanelKey) || currentPanelKey.length < 16)
        return;
      currentPanelKey = currentPanelKey.substring(15);
      let currentPanel = this.dockPanels.get(currentPanelKey);
      if(!currentPanel)
        return;

      const currentIndexInPanel = this.dropCurrentRegion.panels.indexOf(currentPanel);  
      const parent = currentPanel.parent; 
      if(parent && !(this.dropIsTabMove && parent == this.dropCurrentRegion)) {
        let needFlushTabActive = parent.removePanel(currentPanel);//在原来的容器中移除
        if(needFlushTabActive) this.onActiveTabChange(parent, null, parent.activeTab as DockPanelData);
        this.checkAndRemoveEmptyGrid(parent);
      }

      if(this.dropIsTabMove) { 
        //是放置在标签页中
        
        //如果拖动元素不在当前Tab中,或目标与当前索引不一致，重新插入
        if(currentIndexInPanel < 0 || currentIndexInPanel != this.dropTabMoveTargetIndex) {
          
          //如果拖动元素在当前Tab中，当前拖动的元素移除掉之后，后面的索引-1      
          if(currentIndexInPanel >= 0 && parent) {
            parent.panels.remove(currentPanel);
            if(currentIndexInPanel < this.dropTabMoveTargetIndex) 
              this.dropTabMoveTargetIndex--; 
          }
          
          //重新插入
          let lastActiveTab = this.dropCurrentRegion.activeTab as DockPanelData|null;
          this.dropCurrentRegion.addPanel(currentPanel, this.dropTabMoveTargetIndex);
          this.dropCurrentRegion.activeTab = currentPanel;
          this.onGridDropFinish(this.dropCurrentRegion as DockData);
          this.onActiveTabChange(this.dropCurrentRegion as DockData, lastActiveTab, currentPanel);
        }
      } else {
        //是放置在网格中

        //通过指示箭头来计算当前需要把面板放置在哪个位置
        switch(this.dropCurrentRegionDirection) {
          case 'float': 
            //浮动

            break;
          case 'middle':
            if(this.dropCurrentRegion.grids.length == 0) {
              const lastActiveTab = this.dropCurrentRegion.activeTab as DockPanelData|null;
              this.dropCurrentRegion.addPanel(currentPanel);
              this.dropCurrentRegion.activeTab = currentPanel;
              this.onActiveTabChange(this.dropCurrentRegion as DockData, lastActiveTab, currentPanel);
              this.onGridDropFinish(this.dropCurrentRegion as DockData);
            }
            break;
          case 'top': 
          case 'bottom':   
            this.reGridRegion(this.dropCurrentRegion as DockData, 'vertical', currentPanel);
            break;
          case 'right':
          case 'left': 
            this.reGridRegion(this.dropCurrentRegion as DockData, 'horizontal', currentPanel);
            break;
          case 'top-dep': 
          case 'bottom-dep': 
            if(this.dropCurrentRegion.parent)
              this.reGridRegion(this.dropCurrentRegion.parent as DockData, 'vertical', currentPanel);
            break;
          case 'right-dep': 
          case 'left-dep': 
            if(this.dropCurrentRegion.parent)
              this.reGridRegion(this.dropCurrentRegion.parent as DockData, 'horizontal', currentPanel);
            break;
        }
      }

      this.dropIsTabMove = false;
      this.dropStyleRegion.set(0,0,0,0);
      this.dropStyleRegionInTab.set(0,0,0,0);

      //清除掉箭头的状态
      document.querySelectorAll('.dock-drop-square.active').forEach((e) => e.classList.remove('active'));
    },
    onDragEnter(ev: DragEvent) {
      let target = ev.target as HTMLElement;
      if (target) {
        if (target.getAttribute('data-drag-drop') == "true")
          this.dragArrowActive(target);
      }
    },
    onDragLeave(ev: DragEvent) {
      const target = ev.target as HTMLElement;
      if (target && target.getAttribute('data-drag-drop') == "true") 
        this.dragArrowDeactive(target);
    },
    onDragOver(ev: DragEvent) {
      ev.preventDefault();

      const host = this.host as HTMLElement;
      const x = ev.clientX - host.offsetLeft;
      const y = ev.clientY - host.offsetTop;

      if(Math.abs(x - this.lastPos.x) > 10 || Math.abs(y - this.lastPos.y) > 10) {
        this.lastPos.set(x, y);
        this.flushDragCurrentRegion(this.lastPos.x, this.lastPos.y);
      }
    },
    dragArrowActive(el : HTMLElement) {
      const direction = el.getAttribute('data-direction') || '';
      if(StringUtils.isNullOrEmpty(direction))
        return;
      el.classList.add("active");
      this.nextInDir = direction;
    },
    dragArrowDeactive(el : HTMLElement) {
      let direction = el.getAttribute('data-direction');
      if(!StringUtils.isNullOrEmpty(direction)) {
        el.classList.remove("active");
        this.dropCurrentRegionDirection = this.nextInDir;
        this.flushDragDirectionRegion();
      }
    },
    checkAndRemoveEmptyGrid(data : DockData) {
      if (data.alwaysVisible)
        return;
      if (data.grids.length == 0 && data.panels.length == 0) {
        let parent = data.parent; 
        if(parent) {
          parent.removeGrid(data);
          this.checkAndRemoveEmptyGrid(parent);
        }
      } else if (data.grids.length == 1 && data.panels.length == 0) { 
        //只有一个网格了，合并重复的
        let child = data.grids[0];
        data.panels = child.panels;
        data.grids = child.grids;
        data.resetPanelsParent();
        data.resetGridsParent();

        //递归继续合并子级的数据
        if(data) this.checkAndRemoveEmptyGrid(data);
      } 
    },
    reGridRegion(grid : DockData, driection : 'vertical'|'horizontal', currentPanel : DockPanelData) {
      if(grid.currentDirection === driection) { //方向相同

        let oldActiveTab = grid.activeTab;
        let isLeftDir = (this.dropCurrentRegionDirection.startsWith('top') || this.dropCurrentRegionDirection.startsWith('left'));
        let isDep = this.dropCurrentRegionDirection.endsWith('-dep');
        
        let newRegionOne = grid, newRegionTwo = new DockData();
        newRegionTwo.setDirectionByParent(grid);
        newRegionTwo.addPanel(currentPanel);

        if(grid.panels.length > 0) {
          //拆分网格并重构层级
          newRegionOne = new DockData();
          newRegionOne.panels = grid.panels;
          newRegionOne.resetPanelsParent();
          newRegionOne.setDirectionByParent(grid); 
          grid.panels = [];

          //添加拆分的网格
          grid.addGrid(newRegionOne);
          grid.addGrid(newRegionTwo, isLeftDir ? 0 : undefined);
          this.onGridDropFinish(newRegionOne);
          this.onGridDropFinish(newRegionTwo);
        } else {
          //这本来就是网格，可直接添加，不需要拆分
          const index = grid.grids.indexOf(this.dropCurrentRegion as DockData);
          if(index == -1 || isDep)
            grid.addGrid(newRegionTwo, isLeftDir ? 0 : undefined)
          else
            grid.addGrid(newRegionTwo, isLeftDir ? index : index + 1)
          
          this.onGridDropFinish(newRegionTwo);
        }

        let oldActiveTabOne = newRegionOne.activeTab;
        let oldActiveTabTwo = newRegionTwo.activeTab;

        newRegionOne.activeTab = oldActiveTab;
        newRegionTwo.activeTab = currentPanel;
        
        this.onActiveTabChange(newRegionOne, oldActiveTabOne, oldActiveTab as DockPanelData);
        this.onActiveTabChange(newRegionTwo, oldActiveTabTwo, currentPanel);
      } else if(grid.parent) { //方向不同，直接推到父级去
        this.reGridRegion(grid.parent, driection, currentPanel);
      } 
    },

    //刷新当前鼠标拖动插入方向箭头的区域信息
    flushDragDirectionRegion() {

      //刷新箭头显示
      this.showDropLeftDep = this.dropInRegionParent.x != this.dropInRegion.x;
      this.showDropTopDep = this.dropInRegionParent.y != this.dropInRegion.y;
      this.showDropRightDep = this.dropInRegionParent.w != this.dropInRegion.w;
      this.showDropBottomDep = this.dropInRegionParent.h != this.dropInRegion.h;

      if(this.dropCurrentRegion != null) {

        let isCurrentViewNotRedundant = (!this.dropCurrentRegion.panels.contains(this.dropCurrentPanel as DockPanelData) || this.dropCurrentRegion.panels.length > 1);
        let isSuperHrView =  (this.dropCurrentRegion.parent != null || (this.dropCurrentRegion == this.dockData && this.dropCurrentRegion.currentDirection === 'horizontal'));
        let isSuperVeView =  (this.dropCurrentRegion.parent != null || (this.dropCurrentRegion == this.dockData && this.dropCurrentRegion.currentDirection === 'vertical'));

        this.showDropMiddle = !this.dropCurrentRegion.panels.contains(this.dropCurrentPanel as DockPanelData);
        this.showDropTop = isSuperVeView && isCurrentViewNotRedundant;
        this.showDropBottom = isSuperVeView && isCurrentViewNotRedundant;
        this.showDropLeft = isSuperHrView && isCurrentViewNotRedundant;
        this.showDropRight = isSuperHrView && isCurrentViewNotRedundant;
        //不同插入方向
        switch(this.dropCurrentRegionDirection) {
          case 'middle':
            this.dropStyleRegion.set(this.dropInRegion as Rect);
            break;
          case 'top': 
            this.dropStyleRegion.set(this.dropInRegion.x, this.dropInRegion.y, this.dropInRegion.w, this.dropInRegion.h / 2);
            break;
          case 'right': 
            this.dropStyleRegion.set(this.dropInRegion.x + this.dropInRegion.w / 2, this.dropInRegion.y, this.dropInRegion.w / 2, this.dropInRegion.h);
            break;
          case 'bottom':
            this.dropStyleRegion.set(this.dropInRegion.x, this.dropInRegion.y + this.dropInRegion.h / 2, this.dropInRegion.w, this.dropInRegion.h / 2);
            break;
          case 'left': 
            this.dropStyleRegion.set(this.dropInRegion.x, this.dropInRegion.y, this.dropInRegion.w / 2, this.dropInRegion.h);
            break;
          case 'top-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x, this.dropInRegionParent.y, this.dropInRegionParent.w, this.dropInRegionParent.h / 4);
            break;
          case 'right-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x + this.dropInRegionParent.w / 4 * 2, this.dropInRegionParent.y, this.dropInRegionParent.w / 4, this.dropInRegionParent.h);
            break;
          case 'bottom-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x, this.dropInRegionParent.y + this.dropInRegionParent.h / 4 * 2, this.dropInRegionParent.w, this.dropInRegionParent.h / 4);
            break; 
          case 'left-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x, this.dropInRegionParent.y, this.dropInRegionParent.w / 4, this.dropInRegionParent.h);
            break;
        }
      } else {
        this.showDropTop = false;
        this.showDropBottom = false;
        this.showDropLeft = false;
        this.showDropRight = false;
        this.showDropMiddle = false;
        if(this.dropIsTabMove) this.dropStyleRegion.set(this.dropStyleRegionInTab as Rect);
        else this.flushFloatDragLightBox();
      }
    },
    flushFloatDragLightBox() {
      this.dropStyleRegion.set(this.lastPos.x - 100, this.lastPos.y + 12, 200, 100);
    },
    //刷新当前鼠标拖动所在的网格区域
    flushDragCurrentRegion(x : number, y : number) {

      const mainLayout = this.mainLayout as ComponentPublicInstance;
      const lastRegion = this.dropCurrentRegion;

      const region = new Rect(0, 0, mainLayout.$el.clientWidth, mainLayout.$el.clientHeight);
      const loopChilds = (dockData : DockData, region : Rect) : boolean => {
        let gridLen = dockData.grids.length;
        if(gridLen > 0) {
          //有子级，平分当前区域
          if(dockData.currentDirection === 'vertical') {
            let nowY = 0, nowH = 0, nowS = 0;
            for(let i = 0; i < gridLen; i++) {
              nowS = dockData.grids[i].size;
              nowH = (nowS <= 0 ? (1 / gridLen) : (nowS / 100)) * region.h;
              if(y >= nowY && y <= nowY + nowH) { //鼠标当前在某个网格中，那么不需要扫描其他网格了
                this.dropInRegionParent.set(region);//保存父级网格
                region.y = nowY; region.h = nowH;
                return loopChilds(dockData.grids[i], region);//递归扫描子网格
              } 
              nowY += nowH;
            }
          } else if(dockData.currentDirection === 'horizontal') {
            let nowX = region.x, nowW = 0, nowS = 0;
            for(let i = 0; i < gridLen; i++) {
              nowS = dockData.grids[i].size;
              nowW = (nowS <= 0 ? (1 / gridLen) : (nowS / 100)) * region.w;
              if(x >= nowX && x <= nowX + nowW) { //鼠标当前在某个网格中，那么不需要扫描其他网格了
                this.dropInRegionParent.set(region);//保存父级网格
                region.x = nowX; region.w = nowW;
                return loopChilds(dockData.grids[i], region);//递归扫描子网格
              }
              nowX += nowW;
            }
          }
        } else { //没有子级
          this.dropCurrentRegion = dockData;//当前网格
          //扫描当前是否在Tab区域内
          this.dropIsTabMove = false;
          //console.log(`x:${x},y:${y},region:${region}`);
          if(x >= region.x && x < region.getRight() && y >= region.y && y < region.y + this.tabHeight) {
            //获取鼠标悬浮的Tab元素
            if(this.lastHoverTabUid != dockData.uid) {
              this.lastHoverTab = document.getElementById('dock-tab-contol-uid-'+dockData.uid);
              this.lastHoverTabUid = dockData.uid;
            }
            
            let tab = this.lastHoverTab;
            if(tab) {
              let scroll = tab.scrollLeft;
              let xref = x - region.x;

              this.dropIsTabMove = true;
              this.dropTabMoveTargetIndex = -1;
              this.dropStyleRegionInTab.set(0, region.y, 30, tab.offsetHeight+3);

              //直接获取所有子tab条目，计算出将要插入到哪个位置
              for(let i = 0; i < tab.children.length; i++) {
                const item = tab.children[i] as HTMLElement;
                if(xref >= item.offsetLeft - 30 - scroll && xref <= item.offsetLeft + item.offsetWidth - 30 - scroll) {
                  this.dropTabMoveTargetIndex = i;
                  this.dropStyleRegionInTab.x = region.x + item.offsetLeft - 14 - scroll + 32;
                  break;
                }
              }
              if(this.dropTabMoveTargetIndex == -1) {
                let item = tab.children[tab.children.length - 1] as HTMLElement;
                if(xref >= item.offsetLeft + item.offsetWidth - 30 - scroll) {
                  this.dropTabMoveTargetIndex = tab.children.length;
                  this.dropStyleRegionInTab.x = region.x + item.offsetLeft - 14 + item.clientWidth - scroll + 32;
                } else {
                  this.dropStyleRegionInTab.w = 0;
                }
              }

              //设置高亮区域
              this.dropStyleRegion.set(this.dropStyleRegionInTab as Rect);
            } 
            return true;
          }
          return false;
        }
        return false;
      };

      this.dropCurrentRegion = null;
      this.dropInRegionParent.set(region);

      if(!loopChilds(this.dockData as DockData, region)) {
        if(this.dropCurrentRegionDirection === 'float') {
          this.flushFloatDragLightBox();
        }
      }

      //强制刷新一次
      if(lastRegion != this.dropCurrentRegion)
        this.flushDragDirectionRegion();

      //通过递归扫描，当前region里面就是鼠标位置的网格了，现在设置到主变量上
      this.dropInRegion.set(region);
    },

    onStartDrag () {
      setTimeout(() => this.flushDragDirectionRegion(), 100);
    },
    onEndDrag () {
      //
    },

    //#endregion

    //#region 数据操作

    /**
    * 获取界面网格数据
    */
    getSaveData() : IDockGridData {
      return this.dockData.toJSON();
    },
    /**
    * 设置界面网格数据
    */
    setData(data : IDockGridData) {
      this.lastBuildSlotCount = 0;
      this.loadDockData(this.dockData as DockData, data, this.startVerticalDirection ? 'vertical' : 'horizontal');
      //强制刷新
      this.bulidAllSlots();
      this.loadDockDataPanels(this.dockData as DockData, data);
      this.dataSetFinished = true;
      this.$forceUpdate();
    },

    loadDockData(data : DockData, src : IDockGridData, direction : DockDirection) {
      data.currentDirection = direction;
      data.size = src.size;
      data.name = src.name || '';
      data.alwaysVisible = src.alwaysVisible || false;
      data.noPanelViewSlotName = src.noPanelViewSlotName || '';
      data.acceptPanelTags = src.acceptPanelTags || [];

      src.grids.forEach((g) => {
        let newData = new DockData();
        g.uid = newData.uid;
        this.loadDockData(newData, g, direction === 'vertical' ? 'horizontal' : 'vertical');
        data.addGrid(newData, undefined, true);
      });
    },
    loadDockDataPanels(data : DockData, src : IDockGridData) {
      src.grids.forEach((g) => {
        let childData : DockData|null = null;
        for(let i = 0; i < data.grids.length; i++)
          if(data.grids[i].uid === g.uid) {
            childData = data.grids[i];
            break;
          }
        if(childData)
          this.loadDockDataPanels(childData, g);
      });
      src.panels.forEach((p) => {
        let panel = this.dockPanels.get(p.key); 
        if(panel) {
          if(panel.parent)
            panel.parent.removePanel(panel);
          data.addPanel(panel);
        }
      });
    },

    /**
    * 激活指定的面板
    */
    activePanel(key : string) {
      const panel = this.dockPanels.get(key);
      if(panel) {
        const parent = panel.parent;
        if(parent) {
          const last = parent.activeTab;
          parent.activeTab = panel;
          this.onActiveTabChange(this.dockData as DockData, last, panel);
        }
      }
    },

    //#endregion

  },
  mounted() {
    setTimeout(() => {
      this.checkSizeChangedTimer = setInterval(this.checkSizeChangedTick, 1000) as unknown as number;
      this.dockHost = this;
      this.host = this.$refs.host as HTMLDivElement;
      this.lastSize.x = this.host.clientWidth;
      this.lastSize.y = this.host.clientHeight;
      this.mainLayout = this.$refs.mainLayout as ComponentPublicInstance;
      this.dropLayout = this.$refs.dropLayout as HTMLDivElement;
      this.dockData.currentDirection = this.startVerticalDirection ? "vertical" : "horizontal";
      this.$forceUpdate();
    }, 300);
  },
  beforeUnmount() {
    clearInterval(this.checkSizeChangedTimer);
  },
  render() {
    const allNodes = this.dataSetFinished ? this.bulidAllSlots() : [];

    return h('div', {
      class: 'dock-host',
      ref: 'host',
      onDragover: ($event : DragEvent) => this.onDragOver($event),
      onDragenter: ($event : DragEvent) => this.onDragEnter($event),
      onDragleave: ($event : DragEvent) => this.onDragLeave($event),
      onDrop: ($event : DragEvent) => this.onDrop($event),
    }, [
      allNodes,
      //主区域
      h(DockGrid, {
        ref: 'mainLayout',
        dockData: this.dockData as DockData,
        dockHost: this.dockHost as DockHostData
      }),
      //拖放区域
      h(DockDropLayout, {
        showDropLayout: this.showDropLayout,
        showDropTop: this.showDropTop,
        showDropBottom: this.showDropBottom,
        showDropLeft: this.showDropLeft,
        showDropRight: this.showDropRight,
        showDropMiddle: this.showDropMiddle,
        showDropLeftDep: this.showDropLeftDep,
        showDropRightDep: this.showDropRightDep,
        showDropTopDep: this.showDropTopDep,
        showDropBottomDep: this.showDropBottomDep,
        dropInRegion: this.dropInRegion as Rect,
        dropStyleRegion: this.dropStyleRegion as Rect,
      }),
    ]);
  }
})
</script>
