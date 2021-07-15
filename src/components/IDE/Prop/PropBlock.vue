<template>
  <div class="prop">
    <CollapsePropHeader title="单元属性">
      <div class="prop-item">
        <span>断点状态: </span>
        <select class="prop-item-editor"  v-model="block.breakpoint">
          <option value="none">无断点</option>
          <option value="disable">禁用断点</option>
          <option value="enable">启用断点</option>
        </select>
      </div>
      <div class="prop-item">
        <span>注释: </span>
        <textarea class="prop-item-editor"  v-model="block.markContent">
        </textarea>
      </div>

    </CollapsePropHeader>
    <CollapsePropHeader title="调试属性" :defaultOpen="false">
      <div class="prop-item">
        <span>GUID: </span>
        <input class="prop-item-editor" type="text" v-model="block.guid" disabled="disabled" />
      </div>
      <div class="prop-item">
        <span>UID: </span>
        <input class="prop-item-editor" type="text" v-model="block.uid" disabled="disabled" />
      </div>
    </CollapsePropHeader>
  </div>
</template>

<script lang="ts">
import { BluePrintFlowBlock } from '@/model/Flow/BluePrintFlowBlock'
import { defineComponent, PropType } from 'vue'
import CollapsePropHeader from './CollapsePropHeader.vue'

export default defineComponent({
  name: 'PropBlock',
  components: {
    CollapsePropHeader
  },
  props: {
    block: {
      type: Object as PropType<BluePrintFlowBlock>,
      default: null
    }
  },
})
</script>
