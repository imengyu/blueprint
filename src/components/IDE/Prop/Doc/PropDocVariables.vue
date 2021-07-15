<template>
  <div class="prop-list pl-3">
    <div v-for="(variable,i) in doc.variables" :key="i" class="prop-list-item">
      <div class="prop-list-dragger" @dragstart="onDocVariableDrag(variable, $event)" draggable="true"
        v-tooltip data-title="可直接拖拽此箭头以添加变量至图表中">
        <i class="iconfont icon-arrow-left-"></i>
      </div>
      <div class="prop-item">
        <span>变量名称</span>
        <InputCanCheck 
          type="text" class="prop-item-editor" 
          :value="variable.name" placeholder="请输入变量名称" 
          :checkCallback="(o, n) => (o!=n && checkDocVariableExists(n)) ? '已存在相同名称的变量':true"
          @update="(o,n) => {variable.name=n}"></InputCanCheck>
      </div>
      <div class="prop-item">
        <span>变量类型</span>
        <div class="prop-item-editor">

          <span v-if="variable.setType=='dictionary'" v-tooltip data-title="映射键类型">
            {{ variable.type.dictionaryKeyType ? variable.type.dictionaryKeyType.getTypeNameString() : 'null' }}
            <a class="ml-2 iconfont icon-arrow-down-1 cursor-pointer" @click="onChooseDocVariableKeyType(variable, $event)" v-tooltip data-title="选择映射键类型"></a>
          </span> 

          <VariableSetTypeEditor class="prop-item-editor" 
            :value="variable.setType" 
            :type="variable.type"
            :color="variable.type.getTypeColor()"
            :color2="variable.type.dictionaryKeyType ? variable.type.dictionaryKeyType.getTypeColor() : 'rgb(233,233,233)'" 
            @change-set-type="(v) => variable.setType = v"></VariableSetTypeEditor>

          <span>
            {{ variable.type.getTypeNameString() }}
            <a class="ml-2 iconfont icon-arrow-down-1 cursor-pointer" @click="onChooseDocVariableType(variable, $event)" v-tooltip data-title="选择变量类型"></a>
          </span>

        </div>
      </div>
      <div class="prop-item">
        <span>变量默认值</span>
        
      </div>
      <el-popconfirm title="确定删除变量吗？" @confirm="onDeleteDocVariable(variable)">
        <template #reference>
          <a href="javascript:;" class="prop-delete" v-tooltip data-title="删除变量">
            <i class="iconfont icon-close-1"></i>
          </a>
        </template>
      </el-popconfirm>
    </div>
    <div class="prop-list-item flex-center cursor-pointer" @click="onAddDocVariable">
      <i class="iconfont icon-pluss-2 mr-3"></i> 添加图表变量
    </div>
  </div>
</template>

<script lang="ts">
import { Vector2 } from '@/model/Base/Vector2'
import { BluePrintFlowDoc } from '@/model/Flow/BluePrintFlowDoc'
import { BluePrintFlowVariable } from '@/model/Flow/BluePrintFlowVariable'
import { BluePrintParamType } from '@/model/Flow/BluePrintParamType'
import ParamTypeService from '@/model/Services/ParamTypeService'
import HtmlUtils from '@/model/Utils/HtmlUtils'
import { defineComponent, PropType } from 'vue'
import InputCanCheck from '../../Common/InputCanCheck.vue'
import VariableSetTypeEditor from '../../Common/VariableSetTypeEditor.vue'

export default defineComponent({
  name: 'PropDocVariables',
  components: {
    InputCanCheck,
    VariableSetTypeEditor,
  },
  props: {
    doc: {
      type: Object as PropType<BluePrintFlowDoc>,
      default: null
    }
  },
  methods: {
    onDocVariableDrag(v : BluePrintFlowVariable, e : DragEvent) {
      if(HtmlUtils.isEventInControl(e)) e.preventDefault();
      else (e.dataTransfer as DataTransfer).setData('text/plain', 'drag:doc-variable:' + v.name);
    },
    checkDocVariableExists(name : string) {
      for(let i = this.doc.variables.length - 1; i >= 0; i--)
        if(this.doc.variables[i].name == name)
          return true;
      return false;
    },
    onAddDocVariable() {
      const variable = new BluePrintFlowVariable();
      variable.name = this.doc.getUseableVariableName('变量');
      this.doc.variables.push(variable);
    },
    onDeleteDocVariable(g : BluePrintFlowVariable) {
      this.doc.variables.splice(this.doc.variables.indexOf(g), 1);
    },
    onChooseDocVariableType(variable : BluePrintFlowVariable, e : MouseEvent) {
      const ide = this.doc.activeEditor?.getIde();
      if(ide) {
        ide.panels.showChooseTypePanel(
          new Vector2(e.x - ((e.target as HTMLElement).parentNode as HTMLElement).offsetWidth, e.y + 10),
          false,
          true,
          (type: BluePrintParamType) => {
            variable.type.setTypeName(type);
          },
        )
      }
    },
    onChooseDocVariableKeyType(variable : BluePrintFlowVariable, e : MouseEvent) {
      const ide = this.doc.activeEditor?.getIde();
      if(ide) {
        ide.panels.showChooseTypePanel(
          new Vector2(e.x - ((e.target as HTMLElement).parentNode as HTMLElement).offsetWidth, e.y + 10),
          false,
          true,
          (type: BluePrintParamType) => {
            if(!ParamTypeService.checkTypeCanBeDictionaryKey(type)) {
              ide.panels.showAlert('提示', '类型 ' + type.getNameString() + ' 不可作为键值，键值类型必须含有 getHashCode 函数', 'warning');
              return;
            }
            variable.type.dictionaryKeyType = type;
          },
        )
      }
    },
  }
})
</script>
