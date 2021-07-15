<template>
  <div v-if="doc" class="prop-list pl-3">
    <div v-for="(childGraph,i) in doc.graphs" :key="i" class="prop-list-item">
      <div class="prop-list-dragger" @dragstart="onGraphChildGraphDrag(childGraph, $event)" draggable="true" v-tooltip data-title="可拖拽此箭头来添加此函数的调用至图表中">
        <i class="iconfont icon-arrow-left-"></i>
      </div>
      <div class="prop-item">
        <span>
          <div class="display-inline-block p-1 cursor-pointer" v-tooltip="'编辑图表'" @click="onOpenGraph(childGraph)">
            <i class="iconfont icon-edit-1"></i>
          </div>

          函数名称
        </span>
        <InputCanCheck type="text" 
          v-model="childGraph.name" placeholder="输入函数名称" 
          :checkCallback="(o, n) => (o != n && checkChildGraphExists(n)) ? '已存在相同名称的函数':true"></InputCanCheck>
        <IconChoiceDropdown
          :choices="functionStaticChoices"
          :value="childGraph.static ? 1 : 0"
          @update:value="(v) => childGraph.static = v == 1"
          title="设置当前函数是否是静态的" />
      </div>
      <div class="prop-item">
        <span>函数注释</span>
        <textarea v-model="childGraph.description" placeholder="这个函数的说明文字...">
        </textarea>
        <div style="width:23.5px">
        </div>
      </div>
      <el-popconfirm title="确定删除函数吗？" @confirm="onDeleteChildGraph(childGraph)">
        <template #reference>
          <a href="javascript:;" class="prop-delete" v-tooltip="'删除函数'">
            <i class="iconfont icon-close-1"></i>
          </a>
        </template>
      </el-popconfirm>
    </div>
    <div class="prop-list-item flex-center cursor-pointer" @click="onAddChildGraph">
      <i class="iconfont icon-pluss-2 mr-3"></i> 添加函数
    </div>
  </div>
</template>

<script lang="ts">
import { BluePrintFlowDoc, BluePrintFlowGraph } from '@/model/Flow/BluePrintFlowDoc'
import { BluePrintParamType } from '@/model/Flow/BluePrintParamType';
import HtmlUtils from '@/model/Utils/HtmlUtils';
import { defineComponent, PropType } from 'vue'
import InputCanCheck from '../../Common/InputCanCheck.vue'
import IconChoiceDropdown from '../../Common/IconChoiceDropdown.vue'

export default defineComponent({
  name: 'PropDocFunctions',
  emits: [
    "on-open-graph",
    "on-delete-graph",
  ],
  components: {
    InputCanCheck,
    IconChoiceDropdown,
  },
  props: {
    doc: {
      type: Object as PropType<BluePrintFlowDoc>,
      default: null
    }
  },
  methods: {
    checkChildGraphExists(name : string) {
      for(let i = this.doc.graphs.length - 1; i >= 0; i--)
        if(this.doc.graphs[i].name == name)
          return true;
      return false;
    },
    onGraphChildGraphDrag(v : BluePrintFlowGraph, e : DragEvent) {
      if(HtmlUtils.isEventInControl(e) || (v.type != 'function' && v.type != 'static')) e.preventDefault();
      else (e.dataTransfer as DataTransfer).setData('text/plain', 'drag:graph:' + v.name);
    },
    onAddChildGraph() {
      const doc = new BluePrintFlowGraph(this.doc);
      doc.name = this.doc.getUseableGraphName('新图表');
      doc.inputPorts.push({
        name: '进入',
        guid: 'PI0',
        direction: 'input',
        type: new BluePrintParamType('execute'),
      });
      doc.outputPorts.push({
        name: '退出',
        guid: 'PO0',
        direction: 'output',
        type: new BluePrintParamType('execute'),
      });
      this.doc.graphs.push(doc);
    },
    onDeleteChildGraph(g : BluePrintFlowGraph) {
      this.doc.graphs.splice(this.doc.graphs.indexOf(g), 1);
      this.$emit('on-delete-graph', g);
    },
    onOpenGraph(g : BluePrintFlowGraph) {
      this.$emit('on-open-graph', g);
    }
  },
  data() {
    return {
      functionStaticChoices: [
        {
          title: '普通函数',
          icon: 'icon-moon'
        },
        {
          title: '静态函数',
          icon: 'icon-ssun'
        },
      ]
    }
  }
})
</script>
