<template>
  <tooltip v-model:show="tooltipActive" trigger="hover">
    <!--端口-->
    <div 
      v-if="instance" 
      :class="'flow-port '+instance.state"
      @contextmenu="onContextMenu($event)"
      @mouseenter="onPortMouseEnter"
      @mouseleave="onPortMouseLeave"
      @mousedown="onPortMouseDown($event)"
    >
      <div class="editor" v-if="instance.direction === 'output' && instance.define.forceEditorControlOutput" >
        <port-custom-editor-wrapper 
          v-show="editorVisible"
          :port="instance"
          :createEditorFunction="customEditorFunction" 
          :createTypeEditorFunction="editor && editor.editorCreate ? editor.editorCreate : null" 
          :noTypeEditor="instance.define.forceNoEditorControl"
          :value="instance.initialValue"
          @update-value="onValueUpdate"
        />
      </div>
      <div class="port">
        <!--删除端口按扭-->
        <a class="port-delete iconfont icon-close" v-show="instance.dyamicAdd" v-tooltip="'删除参数'" @click="onDeleteParam"></a>
        <!--标题-->
        <span v-if="instance.direction === 'output'">
          {{ instance.define.name }}
        </span>
        <!--异步图标-->
        <img v-show="instance.define.isAsync" class="port-dot-async" src="@/assets/images/Icon/async.svg" />
        <!--连接图标-->
        <i v-show="instance.state==='error'" class="port-dot iconfont icon-close-" />
        <i v-show="instance.state==='success'" class="port-dot iconfont icon-check-" />
        <i v-show="instance.state==='normal'||instance.state==='active'" ref="portDot" :class="'port-dot iconfont '+portIcon" :style="{ color: portColor } ">
          <!--映射的左右图标-->
          <i v-show="instance.define.type.setType === 'dictionary'" class="iconfont icon-port-dictionary-left" :style="{ color: portDLeftColor } "></i>
          <i v-show="instance.define.type.setType === 'dictionary'" class="iconfont icon-port-dictionary-right" :style="{ color: portDRightColor } "></i>
        </i>
        <span v-if="instance.direction === 'input'">
          {{ instance.define.name }}
        </span>
        
      </div>
      <div class="editor" v-if="instance.direction === 'input'" >
        <port-custom-editor-wrapper 
          v-show="editorVisible"
          :port="instance"
          :createEditorFunction="customEditorFunction" 
          :createTypeEditorFunction="editor && editor.editorCreate ? editor.editorCreate : null" 
          :noTypeEditor="instance.define.forceNoEditorControl"
          :value="instance.initialValue"
          @update-value="onValueUpdate"
        />
      </div>
    </div>
    <!--工具提示-->
    <template #content>
      <h5>{{ (instance.define.name === '') ? (instance.define.direction == 'input' ? '入口' : '出口') : instance.define.name }}</h5>
      <span class="text-secondary">
        <small v-html="instance.define.description"></small>
      </span>
      <span><br>类型：<span v-html="instance.define.type.getNameString()"></span></span>
      <span v-if="instance.define.isAsync">
        <br>
        <i class="mr-1 iconfont icon-shuffle"></i>该端口执行是异步调用的
      </span>
    </template>
  </tooltip>
</template>

<script lang="ts">
import { VoidDelegate } from '@/model/Base/EventHandler';
import { Vector2 } from '@/model/Base/Vector2';
import { BluePrintEditorInstance } from '@/model/BluePrintEditor';
import { BluePrintFlowPort, BluePrintFlowPortCreateEditorFunction } from '@/model/Flow/BluePrintFlowPort';
import HtmlUtils from '@/model/Utils/HtmlUtils';
import { defineComponent, PropType } from 'vue'
import Tooltip from '../Common/Tooltip.vue';
import PortCustomEditorWrapper from '../Editor/PortCustomEditorWrapper.vue';
import { BluePrintParamEditorDefine } from '@/model/Flow/BluePrintParamType';
import { SaveableTypes } from '@/model/BluePrintEditorBase';

export default defineComponent({
  components: { Tooltip, PortCustomEditorWrapper },
  name: 'FlowBlockPort',
  emits: [ 'on-delete-port' ],
  props: {
    instance: {
      type: Object as PropType<BluePrintFlowPort>,
      default: null,
    }
  },
  computed: {
    portIcon() : string {
      if(this.instance.define.type.isExecute()) 
        return this.instance.state === 'active' ? 'icon-port-exe-active' : 'icon-port-exe';
      else if(this.instance.define.type.setType === 'array') 
        return this.instance.state === 'active' ? 'icon-port-array-full' : 'icon-port-array';
      return this.instance.state === 'active' ? 'icon-port-active' : 'icon-port';
    },
    portColor() : string {
      if(this.instance.define.type.isDictionary()) 
        return 'rgb(250, 250, 250)';
      return this.instance.define.type.getTypeColor() || 'rgb(250, 250, 250)';
    },
    portDLeftColor() : string {
      if(this.instance.define.type.isDictionary()) {
        const dtype = this.instance.define.type.dictionaryKeyType;
        return (dtype ? dtype.getTypeColor() : undefined) || 'rgb(250, 250, 250)';
      }
      return '';
    },
    portDRightColor() : string {
      if(this.instance.define.type.isDictionary()) 
        return this.instance.define.type.getTypeColor() || 'rgb(250, 250, 250)';
      return '';
    },
  },
  data() {
    return {
      tooltipActive: false,
      mouseEnter: false,
      fnOnPortMouseUp: null as VoidDelegate|null,
      fnOnPortMouseMove: null as ((e : MouseEvent) => void)|null,
      dotPos: new Vector2(),
      editor: null as BluePrintParamEditorDefine|null,
      editorCanUse: false,
      editorVisible: true,
      customEditorFunction: null as BluePrintFlowPortCreateEditorFunction|null,
    }
  },
  mounted() {
    this.fnOnPortMouseUp = this.onPortMouseUp.bind(this);
    this.fnOnPortMouseMove = this.onPortMouseMove.bind(this);
    const instance = this.instance;
    instance.getPortPositionRelative = this.getPortPosition.bind(this);
    instance.updateEditor = this.updateTypeEditor.bind(this);

    this.customEditorFunction = instance.parent.define.events.onCreatePortCustomEditor || null;
    this.updateTypeEditor()
  },
  methods: {

    //#region 鼠标事件
    onPortMouseEnter() {
      if(!this.mouseEnter) {
        this.mouseEnter = true;
        (this.instance.parent.editor as BluePrintEditorInstance).updateCurrentHoverPort(this.instance as BluePrintFlowPort, true); 
      } 
    },
    onPortMouseLeave() {
      if(this.mouseEnter) {
        this.mouseEnter = false;
        (this.instance.parent.editor as BluePrintEditorInstance).updateCurrentHoverPort(this.instance as BluePrintFlowPort, false); 
      }
    },
    onPortMouseMove(e : MouseEvent) {
      if(e.button == 0) {
        const parent = this.instance.parent;
        const editor = parent.editor as BluePrintEditorInstance;
        parent.mouseConnectingPort = true;
        editor.updateConnectEnd(new Vector2(e.x, e.y));
      }
      return true;
    },
    onPortMouseDown(e : MouseEvent) {
      if(!this.testIsDownInControl(e)) {
        const parent = this.instance.parent;
        const editor = parent.editor as BluePrintEditorInstance;
        
        parent.mouseDownInPort = true;
        parent.mouseConnectingPort = false;
        if(e.button == 0) {
          editor.startConnect(this.instance);
          editor.updateConnectEnd(new Vector2(e.x, e.y));
        }

        if(this.fnOnPortMouseUp)
          document.addEventListener('mouseup', this.fnOnPortMouseUp);
        if(this.fnOnPortMouseMove)
          document.addEventListener('mousemove', this.fnOnPortMouseMove);

        e.stopPropagation();
      }
    },
    onPortMouseUp() {
      const parent = this.instance.parent;
      parent.mouseDownInPort = false;
      parent.mouseConnectingPort = false;
      (parent.editor as BluePrintEditorInstance).endConnect(this.instance);
      
      if(this.fnOnPortMouseUp)
        document.removeEventListener('mouseup', this.fnOnPortMouseUp);
      if(this.fnOnPortMouseMove)
        document.removeEventListener('mousemove', this.fnOnPortMouseMove);
    },
    onContextMenu(e : MouseEvent) {
      e.stopPropagation();
      e.preventDefault();
      this.instance.parent.editor?.showPortRightMenu(this.instance, new Vector2(e.x, e.y));
      return false;
    },  
    testIsDownInControl(e : MouseEvent) {
      let target = e.target as HTMLElement;
      return (HtmlUtils.isEventInControl(e)
        || target.classList.contains('flow-block-no-move') 
        || target.classList.contains('param-editor') 
        || target.classList.contains('port-delete') 
        || target.classList.contains('port')
        || target.classList.contains('custom-editor'));
    },
    //#endregion 

    //#region 回调

    getPortPosition() {
      const dot = (this.$refs.portDot as HTMLElement);
      this.dotPos.set(
        HtmlUtils.getLeft(dot, 'flow-block') + dot.offsetWidth / 2,  
        HtmlUtils.getTop(dot, 'flow-block') + dot.offsetHeight / 2 + 2
      );
      return this.dotPos;
    },
    updateTypeEditor() {
      this.editor = this.instance.getTypeEditor();
      this.editorVisible = !this.instance.isConnected();
      this.editorCanUse = this.editor !== null && typeof this.editor.editorCreate === 'function' && this.editor.useInSetType.includes(this.instance.define.type.setType);
    },

    //#endregion 

    onValueUpdate(v : SaveableTypes) {
      // eslint-disable-next-line vue/no-mutating-props
      this.instance.initialValue = v;
    },
    onDeleteParam() { 
      this.$emit('on-delete-port', this.instance);
    },


  }
})
</script>
