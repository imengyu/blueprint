<script lang="ts">
import { SaveableTypes } from '@/model/BluePrintEditorBase';
import { BluePrintFlowPort, BluePrintFlowPortCreateEditorFunction } from '@/model/Flow/BluePrintFlowPort';
import { defineComponent, h, PropType, resolveComponent, VNode } from 'vue'

export default defineComponent({
  name: 'PortCustomEditorWrapper',
  emits: [
    'update-value'
  ],
  props: {
    createEditorFunction: {
      type: Function as PropType<BluePrintFlowPortCreateEditorFunction>,
    },
    createTypeEditorFunction: {
      type: Function as PropType<BluePrintFlowPortCreateEditorFunction>,
    },
    port: {
      type: Object as PropType<BluePrintFlowPort>,
      default: null,
    },
    value: Object,
    noTypeEditor: Boolean,
  },
  render() {
    const childs = new Array<VNode>();

    //自定义编辑器
    if(typeof this.$props.createEditorFunction === 'function') {
      const ret = this.$props.createEditorFunction(h, this.$props.port);
      switch(ret.type) {
        case 'vnode': childs.push(ret.ret as VNode); break;
        case 'nameComponent':
          childs.push(
            h(
              resolveComponent(ret.ret as string) as string,
              { 
                customData: this.$props.port.parent.options[`port_${this.$props.port.guid}_custom_data`] || {},
                port: this.$props.port,
                onUpdateCustomData: (v : SaveableTypes) => this.$props.port.parent.options[`port_${this.$props.port.guid}_custom_data`] = v,
              },
            )
          )
          break;
      }  
    }
    //类型编辑器
    if(!this.$props.noTypeEditor && typeof this.$props.createTypeEditorFunction === 'function') {
      const ret = this.$props.createTypeEditorFunction(h, this.$props.port);
      switch(ret.type) {
        case 'vnode': childs.push(ret.ret as VNode); break;
        case 'nameComponent':
          childs.push(
            h(
              resolveComponent(ret.ret as string) as string,
              { 
                customData: this.$props.port.parent.options[`port_${this.$props.port.guid}_editor_data`] || {},
                value: this.$props.value,
                onUpdateValue: (v : SaveableTypes) => this.$emit('update-value', v),
                onUpdateCustomData: (v : SaveableTypes) => this.$props.port.parent.options[`port_${this.$props.port.guid}_editor_data`] = v,
              },
            )
          )
          break;
      }  
    }

    return h('div', {
      class: 'custom-editor'
    }, childs);
  },
})
</script>
