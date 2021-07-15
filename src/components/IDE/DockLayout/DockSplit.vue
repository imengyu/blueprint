<script lang="ts">
import HtmlUtils from '@/model/Utils/HtmlUtils';
import { defineComponent, h, PropType, VNode } from 'vue'
import { DockData, DockHostData } from './DockData'

export default defineComponent({
  name: 'DockSplit',
  props: {
    dockHost: {
      type: Object as PropType<DockHostData>,
      default: null
    },
    direction: {
      type: String as PropType<'vertical'|'horizontal'|'unknow'>,
      default: 'unknow'
    },
  },
  data() {
    return {
      host : null as HTMLDivElement|null,
      currentSizeingPanelData : null as DockData|null,
      currentSizeingPanelDataNext : null as DockData|null,
      
      currentSizeingPanelDataStartSize: 0,
      currentSizeingPanelDataAndNextOldSize: 0,
      currentSizeingPanel: false,

      currentHostLeft: 0,
      currentHostTop: 0,

      currentSlots: [] as VNode[],
    }
  },
  render() {
    const childrens = new Array<VNode>();
    const defaultSlot = this.$slots.default;
    if(defaultSlot) {
      //绘制出所有VNode
      this.currentSlots = defaultSlot()[0]['children'] as VNode[];

      let nowSize = 0, thisSize = 0, v : VNode|null = null;
      for(let i = 0; i < this.currentSlots.length; i++) { 
        v = this.currentSlots[i];
        let dockData = v.props ? v.props.dockData as DockData : null;
        if(dockData) {

          dockData.startSize = nowSize;
          thisSize = dockData.size;

          //绘制容器
          childrens.push(h('div', {
            class: 'dock-split-host',
            style: {
              width: this.direction === 'vertical' ? '100%' : thisSize + '%',
              height: this.direction === 'horizontal' ? '100%' : thisSize + '%',
              left: this.direction === 'horizontal' ? nowSize + '%' : 0,
              top: this.direction === 'vertical' ? nowSize + '%' : 0,
            }
          }, [
            v
          ]));

          nowSize += thisSize;

          //绘制分割线
          if(i < this.currentSlots.length - 1) {
            childrens.push(h('div', { 
              class: 'dock-split-dragger ' + this.direction,
              style: {
                left: this.direction === 'vertical' ? undefined : nowSize + '%',
                top: this.direction === 'horizontal' ? undefined : nowSize + '%',
                draggable: 'false',
              },
              //分割线拖动事件
              onMousedown: ($event : MouseEvent) => {
                this.onSplitDraggerMouseDown($event, i);
              }
            }, []));
          }
        }
        
      }
      
    }

    return h('div', { 
      class: 'dock-split', 
      ref: 'host',
    }, childrens);
  },
  methods: {
    onSplitDraggerMouseDown(e : MouseEvent, index : number) {
      if(e.button == 0) {         
        if(this.currentSlots && this.currentSlots.length > 0) {
          //获取拖拽的目标插槽
          let v = this.currentSlots[index];
          if(v.props) {
            this.currentSizeingPanelData = v.props.dockData as DockData;
            if(this.currentSizeingPanelData)
              this.currentSizeingPanelDataAndNextOldSize = this.currentSizeingPanelData.size;
          }
          //获取紧挨着的下一个
          if(index < this.currentSlots.length - 1) {
            v = this.currentSlots[index + 1];
            if(v.props) {
              this.currentSizeingPanelDataNext = v.props.dockData as DockData;
              this.currentSizeingPanelDataAndNextOldSize += this.currentSizeingPanelDataNext ? this.currentSizeingPanelDataNext.size : 0;
            }
          }
          //保存下当前容器绝对坐标，在移动事件中要用
          this.currentHostLeft = HtmlUtils.getLeft(this.host as HTMLElement);
          this.currentHostTop = HtmlUtils.getTop(this.host as HTMLElement);
        }

      }
      this.currentSizeingPanel = true;
      
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', this.onSplitDraggerMouseMove);
      document.addEventListener('mouseup', this.onSplitDraggerMouseUp);
    },
    onSplitDraggerMouseMove(e : MouseEvent) {

      if(this.currentSizeingPanel && this.currentSizeingPanelData &&  this.host && this.currentSizeingPanelDataNext) {
        if(this.direction === 'vertical') {
          let h = this.host.offsetHeight, minh = 80 / h * 100;
          let nh = (e.clientY - this.currentHostTop - (this.currentSizeingPanelData.startSize / 100 * h)) / h * 100;
          if(this.currentSizeingPanelDataNext)
            nh = this.currentSizeingPanelDataAndNextOldSize - nh < minh ? this.currentSizeingPanelDataAndNextOldSize - minh : nh;
          else
            nh = 100 - nh < minh ? 100 - minh : nh;
          this.currentSizeingPanelData.size = nh < minh ? minh : nh; 
        } else if(this.direction === 'horizontal') {
          let w = this.host.offsetWidth, minw = 80 / w * 100;
          let nw = (e.clientX - this.currentHostLeft - (this.currentSizeingPanelData.startSize / 100 * w)) / w * 100;
          if(this.currentSizeingPanelDataNext)
            nw = this.currentSizeingPanelDataAndNextOldSize - nw < minw ? this.currentSizeingPanelDataAndNextOldSize - minw : nw;
          else
            nw = 100 - nw < minw ? 100 - minw : nw;
          this.currentSizeingPanelData.size = nw < minw ? minw : nw;
        }
        if(this.currentSizeingPanelDataNext)
          this.currentSizeingPanelDataNext.size = this.currentSizeingPanelDataAndNextOldSize - this.currentSizeingPanelData.size;
        this.onSplitChange(this.currentSizeingPanelData as DockData, this.currentSizeingPanelDataNext as DockData);
      }
    },
    onSplitDraggerMouseUp() {
      this.currentSizeingPanelData = null;
      this.currentSizeingPanelDataNext = null;
      this.currentSizeingPanel = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', this.onSplitDraggerMouseMove);
      document.removeEventListener('mouseup', this.onSplitDraggerMouseUp);
    },
    onSplitChange(thisGrid : DockData, nextGrid : DockData) {
      this.dockHost.onGridDrag(thisGrid, nextGrid);
    },
  },  
  mounted() {
    this.onSplitDraggerMouseDown = this.onSplitDraggerMouseDown.bind(this);
    this.onSplitDraggerMouseMove = this.onSplitDraggerMouseMove.bind(this);
    this.onSplitDraggerMouseUp = this.onSplitDraggerMouseUp.bind(this);
    setTimeout(() => {
      this.host = this.$refs.host as HTMLDivElement;
    }, 300);
  }
})
</script>

