<script lang="ts">
import { defineComponent, h, VNode } from "@vue/runtime-core";

export default defineComponent({
  name: 'PropTab',
  data() {
    return {
      currentTab: 0
    }
  },
  methods: {
    onTabItemMouseDown(e : MouseEvent, index : number) {
      this.$emit('on-tab-click', index);
      this.currentTab = index;
    },
    onTabItemMouseWhell(e : WheelEvent) {
      let el = e.target as HTMLElement;
      if(el) {
        if(e.deltaY < 0) {
          if(el.scrollLeft > 0) el.scrollLeft -= 10;
          else el.scrollLeft = 0;
        } else if(e.deltaY > 0) {
          if(el.scrollLeft < el.scrollWidth) el.scrollLeft += 10;
          else el.scrollLeft = el.scrollWidth;
        }
      }
    },
  },
  render() {

    const childrens = new Array<VNode>();
    const tabs = new Array<VNode>();

    const defSlot = this.$slots.default ? this.$slots.default() : [];
    if(defSlot.length > 0) {

      for(let i = 0; i < defSlot.length; i++) {
        const v = defSlot[i];
        const propsDataData = v.props || null;
        if(!propsDataData) continue;

        tabs.push(h('div', {
          class: 'item '+(this.currentTab === i ? 'active' : ''),
          key: i,  
          title: propsDataData['title'],
          onMousedown: ($event : MouseEvent) => {
            this.onTabItemMouseDown($event, i)
          },
          onWhell: ($event : WheelEvent) => {
            this.onTabItemMouseWhell($event)
          }
        }, [
          h('i', { class:'icon ' + propsDataData['iconClass'] })
        ]));

        if(v.props)
          v.props.style = {
            display: this.currentTab === i ? '' : 'none'
          };
        childrens.push(v);
      }
    }

    return h('div', { class: 'horz-tab' }, [
      h('div', { class: 'tabs' }, tabs),
      h('div', { class: 'content' }, childrens),
    ]);
  }
})
</script>