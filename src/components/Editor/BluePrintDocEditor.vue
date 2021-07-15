<template>
  <div class="">
    <div class="">
      
    </div>
    <blue-print-graph-editor
      v-for="(graph, i) in openedGraphs"
      v-show="activeGraph === graph"
      :settings="settings"
      :graph="graph"
      :key="i"
      @file-updated="$emit('file-updated')"
      @select-block-changed="(v, e) => $emit('select-block-changed', v, e)"
      @select-connector-changed="(v, e) => $emit('select-connector-changed', v, e)"
    />
  </div>
</template>

<script lang="ts">
import { BluePrintFlowDoc, BluePrintFlowGraph } from '@/model/Flow/BluePrintFlowDoc';
import { defineComponent, onBeforeMount, onMounted, PropType, ref, toRefs } from 'vue';
import BluePrintGraphEditor from './BluePrintGraphEditor.vue';
import { BluePrintIDEInstance, BluePrintIDESettings } from '../IDE/Base/IDEDefine';

//文档编辑器，用于编辑多个图表
export default defineComponent({
  name: 'BluePrintDocEditor',
  components: {
    BluePrintGraphEditor
  },
  emits: [ 
    'update:activeGraph',
    'file-updated',
    'select-block-changed',
    'select-connector-changed',
  ],
  props: {
    activeGraph: {
      type: Object as PropType<BluePrintFlowGraph>,
      default: null
    },
    doc: {
      type: Object as PropType<BluePrintFlowDoc>,
      reqired: true,
      default: null
    },
    ide: {
      type: Object as PropType<BluePrintIDEInstance>,
      default: null
    },
    settings: {
      type: Object as PropType<BluePrintIDESettings>,
      default: () => {
        return {
          gridShow: true,
          drawDebugInfo: false,
        } as BluePrintIDESettings
      }
    },
  },
  setup(props, context) {

    const { doc, activeGraph, ide } = toRefs(props);
    const openedGraphs = ref<BluePrintFlowGraph[]>([]);

    function openGraph(graph: BluePrintFlowGraph, active ?: boolean) {
      const _openedGraphs = openedGraphs.value;
      if(!_openedGraphs.contains(graph)) {
        _openedGraphs.addOnce(graph);

        if(active)
          context.emit('update:activeGraph', graph);
      }
    }
    function closeGraph(graph: BluePrintFlowGraph) {
      const _openedGraphs = openedGraphs.value;
      if(_openedGraphs.contains(graph)) {

        const index = _openedGraphs.indexOf(graph);
        _openedGraphs.removeIndex(index);

        if(activeGraph.value === graph) {
          context.emit('update:activeGraph',
            _openedGraphs[index <_openedGraphs.length ? index : index - 1]
          );
        }
      }
    }

    onMounted(() => {
      doc.value.activeEditor = {
        openGraph,
        closeGraph,
        getIde: () => ide.value || null
      };
      if(activeGraph.value)
        openGraph(activeGraph.value as BluePrintFlowGraph);
    });
    onBeforeMount(() => {
      doc.value.activeEditor = null;
    })

    return {
      openedGraphs,
    }
  },
});
</script>
