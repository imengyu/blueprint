<template>
  <div class="prop">
    <CollapsePropHeader title="文档属性">
      <div class="prop-item">
        <span>文档名称: </span>
        <input class="prop-item-editor" type="text" v-model="doc.name" placeholder="文档的名称" />
      </div>
      <div class="prop-item">
        <span>文档注释: </span>
        <textarea class="prop-item-editor" v-model="doc.description" placeholder="文档的注释...">
        </textarea>
      </div>
      <div class="prop-item">
        <span>文档版本: </span>
        <input class="prop-item-editor" type="text" v-model="doc.version" />
      </div>
      <div class="prop-item">
        <span>文档作者: </span>
        <input class="prop-item-editor"  type="text" v-model="doc.author" />
      </div>
    </CollapsePropHeader>
    <CollapsePropHeader title="函数">
      <PropDocFunctions :doc="doc" />
    </CollapsePropHeader>
    <CollapsePropHeader title="全局变量">
      <PropDocVariables :doc="doc" />
    </CollapsePropHeader>
    <CollapsePropHeader title="调试属性" :defaultOpen="false">
      <div class="prop-item">
        <span>UID: </span>
        <input class="prop-item-editor" type="text" v-model="doc.uid" disabled="disabled" />
      </div>
    </CollapsePropHeader>
  </div>
</template>

<script lang="ts">
import { BluePrintFlowDoc } from '@/model/Flow/BluePrintFlowDoc'
import { defineComponent, PropType } from 'vue'
import CollapsePropHeader from './CollapsePropHeader.vue'
import PropDocFunctions from './Doc/PropDocFunctions.vue'
import PropDocVariables from './Doc/PropDocVariables.vue'

export default defineComponent({
  name: 'PropDoc',
  components: {
    CollapsePropHeader,
    PropDocFunctions,
    PropDocVariables,
  },
  props: {
    doc: {
      type: Object as PropType<BluePrintFlowDoc>,
      default: null
    }
  },
})
</script>