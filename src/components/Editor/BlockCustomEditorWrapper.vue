<script lang="ts">
import { BluePrintFlowBlock, BluePrintFlowBlockCreateEditorFunction } from '@/model/Flow/BluePrintFlowBlock';
import { defineComponent, h, PropType, resolveComponent, VNode } from 'vue'

export default defineComponent({
  name: 'BlockCustomEditorWrapper',
  props: {
    createEditorFunction: {
      type: Function as PropType<BluePrintFlowBlockCreateEditorFunction>,
    },
    block: {
      type: Object as PropType<BluePrintFlowBlock>,
    }
  },
  render() {
    const childs = new Array<VNode>();

    if(typeof this.$props.createEditorFunction === 'function') {
      const ret = this.$props.createEditorFunction(h, this.$props.block);
      switch(ret.type) {
        case 'vnode': childs.push(ret.ret as VNode); break;
        case 'vnodes': (ret.ret as VNode[]).forEach((v) => childs.push(v)); break;
        case 'nameComponent':
          childs.push(
            h(
              resolveComponent(ret.ret as string) as string,
              { block: this.$props.block }
            )
          )
          break;
        case 'nameComponents': 
          (ret.ret as string[]).forEach((v) => childs.push(
            h(
              resolveComponent(v) as string,
              { block: this.$props.block }
            )
          ));
          break;
      }  

      return h('div', {
        class: 'flow-block-custom-editor custom-editor'
      }, childs);
    } else {
      return h('div');
    }
  },
})
</script>
