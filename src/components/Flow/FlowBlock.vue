<template>
  <div v-if="instance" 
    ref="block"
    :class="'flow-block ' + 
      (instance.selected ? 'selected ' : '') + 
      (instance.define.style.customClassNames ? instance.define.style.customClassNames : '') + 
      (twinkleActive ? ' actived' : '')"
    :style="{
      left: `${instance.position.x}px`,
      top: `${instance.position.y}px`,
      width: (instance.define.style.userResize == 'width' || instance.define.style.userResize == 'all') ? (`${instance.customSize.x}px`) : 'auto',
      height: (instance.define.style.userResize == 'height' || instance.define.style.userResize == 'all') ? (`${instance.customSize.y}px`) : 'auto',
      minWidth: instance.define.style.minWidth > 0 ? `${instance.define.style.minWidth}px` : '',
      minHeight: instance.define.style.minHeight > 0 ? `${instance.define.style.minHeight}px` : '',
      maxWidth: instance.define.style.maxWidth > 0 ? `${instance.define.style.maxWidth}px` : '',
      maxHeighth: instance.define.style.maxHeight > 0 ? `${instance.define.style.maxHeight}px` : '',
      cursor: cursor,
    }"
    @mousedown="onMouseDown($event)"
    @mouseenter="onMouseEnter($event)"
    @mouseleave="onMouseLeave($event)"
    @mousemove="onMouseMove($event)"
    @mousewheel="onMouseWhell($event)"
    @mouseup="onMouseUp($event)"
    @contextmenu="onContextmenu($event)">
    <!--注释区域-->
    <div class="flow-block-comment flow-block-no-move" 
      v-show="instance.markOpen && !instance.define.style.noComment"
      :style="{ top: commentTop }">
      <span class="flow-block-comment-place-holder" ref="commentInputPlaceHolder" @click="onCommentInputPlaceHolderClick">点击添加注释</span>
      <div 
        ref="commentInput"
        class="flow-block-comment-text flow-block-no-move" 
        contenteditable="true"
        @input="onCommentInputInput"
        @blur="onCommentInputBlur">
      </div>
      <a class="iconfont icon-close-" v-tooltip="'隐藏注释气泡'" @click="closeComment"></a>
    </div>
    <a 
      v-show="!instance.markOpen && !instance.define.style.noComment"
      class="flow-block-comment-open iconfont icon-qipao" 
      v-tooltip="'打开注释气泡'"
      @click="openComment"
    ></a>
    <!--标题和图标-->
    <div 
      :class="'flow-header state-'+(instance.define.style.titleState)"
      :style="{
        color: instance.define.style.titleColor,
        backgroundColor: instance.define.style.titleBakgroundColor,
      }"
      v-tooltip="`<h5>${instance.define.name}</h5>${instance.define.description}`" 
      :data-no-tooltip="instance.define.style.noTooltip" >
      <div class='logo' v-show="!instance.define.style.noLogo" :style="{ backgroundImage: `url('${instance.define.style.logo}')` }" />
      <div class='title'>{{ instance.define.name }}</div>
      <div class="logo-right" :style="{ display: 'inline-block', backgroundImage: `url('${instance.define.style.logoRight}')` }"></div>
      <div class="logo-bottom" :style="{ display: 'inline-block', backgroundImage: `url('${instance.define.style.logoBottom}')` }"></div>
    </div>
    <div 
      v-show="instance.breakpoint!=='none'"
      :class="'breakpoint-status iconfont'+
        (instance.breakpoint==='enable'?' icon-breakpoint-active':'')+
        (instance.breakpoint==='disable'?' icon-breakpoint':'')"
    ></div>
    <div 
      v-show="instance.breakpointTriggered"
      class="breakpoint-arrow iconfont icon-arrow-down-"></div>
    <!--背景-->
    <div 
      class="background"
      :style="{
        background: (typeof instance.define.style.logoBackground==='string' && !instance.define.style.logoBackground.startsWith('title:')) ? `url(${instance.define.style.logoBackground})` : '',
      }">
      <span class="big-title" v-if="typeof instance.define.style.logoBackground==='string'&&instance.define.style.logoBackground.startsWith('title:')">
        {{ instance.define.style.logoBackground.substr(6) }}
      </span>
    </div>
    <!--自定义编辑器区域-->
    <block-custom-editor-wrapper
      :block="instance"
      :createEditorFunction="instance.define.events.onCreateCustomEditor">
    </block-custom-editor-wrapper>
    <!--主区域-->
    <div v-if="instance.inputPortCount > 0 || instance.outputPortCount > 0" class='flow-block-base'>
      <div class='flow-block-ports'>
        <div class='left'>
          <flow-block-port v-for="port in instance.inputPorts" :key="port.guid" :instance="port" @on-delete-port="(p) => $emit('on-delete-port', p)" />
          <small-button v-if="instance.define.userCanAddInputExecute" icon="icon-add-behavor-port" @click="onUserAddPort('input', 'execute')">添加引脚</small-button>
          <small-button v-if="instance.define.userCanAddInputParam" icon="icon-pluss-2" @click="onUserAddPort('input', 'param')">添加参数</small-button>
        </div>
        <div class='right'>
          <flow-block-port v-for="port in instance.outputPorts" :key="port.guid" :instance="port" @on-delete-port="(p) => $emit('on-delete-port', p)" />
          <small-button v-if="instance.define.userCanAddOutputExecute" icon="icon-add-behavor-port" iconPlace="after" @click="onUserAddPort('output', 'execute')">添加引脚</small-button>
          <small-button v-if="instance.define.userCanAddOutputParam" icon="icon-pluss-2" iconPlace="after" @click="onUserAddPort('output', 'param')">添加参数</small-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref, toRefs } from 'vue'
import { ChunkedPanel, ChunkInstance } from '@/model/Cast/ChunkedPanel';
import { Vector2 } from '@/model/Base/Vector2';
import { BluePrintEditorInstance } from '@/model/BluePrintEditor';
import { BluePrintFlowBlock } from '@/model/Flow/BluePrintFlowBlock';
import { BluePrintFlowPortDefine, BluePrintFlowPortDirection } from '@/model/Flow/BluePrintFlowPort';
import HtmlUtils from '@/model/Utils/HtmlUtils';
import StringUtils from '@/model/Utils/StringUtils';
import CommonUtils from '@/model/Utils/CommonUtils';
import FlowBlockPort from './FlowBlockPort.vue';
import SmallButton from '../Common/SmallButton.vue';
import BlockCustomEditorWrapper from '../Editor/BlockCustomEditorWrapper.vue';

export const SIZE_LEFT = 0x1;
export const SIZE_RIGHT = 0x2;
export const SIZE_TOP = 0x4;
export const SIZE_BOTTOM = 0x8;

export default defineComponent({
  components: { 
    FlowBlockPort,
    SmallButton,
    BlockCustomEditorWrapper,
  },
  name: 'FlowBlock',
  emits: [ 
    'on-delete-port',
  ],
  props: {
    instance: {
      type: Object as PropType<BluePrintFlowBlock>,
      default: null,
    },
    chunkedPanel : {
      type: Object as PropType<ChunkedPanel>,
      default: null,
    },
  },
  setup(props) {
    const { instance, chunkedPanel } = toRefs(props);
    const block = ref<HTMLDivElement>();
    
    //#region 回调

    let timerTwinkle = 0;
    const twinkleActive = ref(false);

    instance.value.callbackGetRealSize = getRealSize;  
    instance.value.callbackGetCurrentSizeType = getCurrentSizeType;
    instance.value.callbackUpdateRegion = updateRegion;
    instance.value.callbackTwinkle = (time) => {
      //闪烁
      if(timerTwinkle > 0) clearInterval(timerTwinkle);
      timerTwinkle = setInterval(() => twinkleActive.value = !twinkleActive.value, 300);
      setTimeout(() => {
        twinkleActive.value = false;
        clearInterval(timerTwinkle);
        timerTwinkle = 0;
      }, time);
    };
     
    function updateRegion() {
      const _instance = instance.value;
      if(_instance.chunkInfo) {
        _instance.chunkInfo.rect.set(_instance.getRealRect());
        chunkedPanel.value.updateInstance(_instance.chunkInfo as ChunkInstance);
      }
    }
    function getRealSize() {
      if(block.value)
        return new Vector2(block.value.offsetWidth, block.value.offsetHeight);
      return new Vector2();
    }

    //#endregion

    //#region 注释操作

    const commentTop = ref('');
    const commentInput = ref<HTMLDivElement>();
    const commentInputPlaceHolder = ref<HTMLDivElement>();

    function updateComment() {
      if(instance.value.define.style.noComment) 
        return;
      if(commentInput.value && commentInputPlaceHolder.value) {
        commentInput.value.innerText = instance.value.markContent;
        commentInputPlaceHolder.value.style.display = StringUtils.isNullOrBlank(instance.value.markContent) ? '' : 'none';
      }
      onCommentInputInput();
    }
    function onCommentInputPlaceHolderClick() {
      if(commentInputPlaceHolder.value) commentInputPlaceHolder.value.style.display = 'none';
      if(commentInput.value) commentInput.value.focus();
    }
    function onCommentInputInput() {
      if(commentInput.value) 
        commentTop.value = -(commentInput.value.offsetHeight - 23 + 40) + 'px';
    }
    function onCommentInputBlur() {
      if(commentInput.value && instance.value) {
        instance.value.markContent = commentInput.value.innerText;
        updateComment();
      }
    }
    function closeComment() {
      instance.value.markOpen = false;
      updateComment();
    }
    function openComment() {
      instance.value.markOpen = true;
      updateComment();
    }

    //#endregion

    //#region 调整大小
  
    let lastResized = false;
    let currentSizeType = 0;

    function updateCursor() {
      if(currentSizeType > 0) {
        if(
          (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_TOP) == SIZE_TOP))
          || (((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT))
        )
          cursor.value = 'nwse-resize';
        else if(
          (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM))
          || (((currentSizeType & SIZE_TOP) == SIZE_TOP) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT))
        )
          cursor.value = 'nesw-resize';
        else if(((currentSizeType & SIZE_TOP) == SIZE_TOP) || ((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM))
          cursor.value = 'ns-resize';
        else if(((currentSizeType & SIZE_LEFT) == SIZE_LEFT) || ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT))
          cursor.value = 'ew-resize';
        else 
          cursor.value = 'default';
      }else if(instance.value.mouseDown) {
        cursor.value = 'move';
      }else {
        cursor.value = 'default';
      }
    }
    function testInResize(e : MouseEvent) {

      const _instance = instance.value;
      const pos = new Vector2();
      const size = getRealSize();

      _instance.editor?.getViewPort().screenPointToViewportPoint(new Vector2(e.x, e.y), pos);
      pos.substract(_instance.position);

      currentSizeType = 0;
      if(pos.x >= 0 && pos.y >= 0 && pos.x <= size.x + 3 && pos.y <= size.y + 3) {
        if(pos.x <= 6) currentSizeType |= SIZE_LEFT;
        else if(pos.x > size.x - 6) currentSizeType |= SIZE_RIGHT;
        if(pos.y <= 6) currentSizeType |= SIZE_TOP;
        else if(pos.y > size.y - 6) currentSizeType |= SIZE_BOTTOM;

        if(pos.x >= size.x - 20 && pos.y >= size.y - 20)
          currentSizeType |= (SIZE_BOTTOM | SIZE_RIGHT);
      }

      updateCursor();

      return currentSizeType > 0;
    }
    function getCurrentSizeType() { return currentSizeType; }

    function onMouseResize(e : MouseEvent) {
      if(currentSizeType) { 

        const _instance = instance.value; 
        const size = new Vector2(_instance.customSize.x, _instance.customSize.y);
        const mousePos = new Vector2();
        (_instance.editor as BluePrintEditorInstance).getViewPort().screenPointToViewportPoint(new Vector2(e.x, e.y), mousePos);

        if (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_TOP) == SIZE_TOP)) {
          //左上
          size.x = (_instance.lastBlockPos.x + _instance.lastBlockSize.x - mousePos.x);
          size.y = (_instance.lastBlockPos.y + _instance.lastBlockSize.y - mousePos.y);
          _instance.position = mousePos;
        }
        else if(((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT)) {
          //右下
          size.x = (mousePos.x - _instance.lastBlockPos.x);
          size.y = (mousePos.y - _instance.lastBlockPos.y);
        }
        else if (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM)) {
          //左下
          size.x = (_instance.lastBlockPos.x + _instance.lastBlockSize.x - mousePos.x);
          size.y = (mousePos.y - _instance.lastBlockPos.y);
          _instance.position = new Vector2(mousePos.x, _instance.position.y);
        }
        else if (((currentSizeType & SIZE_TOP) == SIZE_TOP) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT)) {
          //右上
          size.x = (mousePos.x - _instance.lastBlockPos.x);
          size.y = (_instance.lastBlockPos.y + _instance.lastBlockSize.y - mousePos.y);
          _instance.position = new Vector2(_instance.position.x, mousePos.y);
        }
        else if((currentSizeType & SIZE_TOP) == SIZE_TOP)  {
          //上
          size.y = (_instance.lastBlockPos.y + _instance.lastBlockSize.y - mousePos.y);
          _instance.position = new Vector2(_instance.position.x, mousePos.y);
        }
        else if((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM) {
          //下
          size.y = (mousePos.y - _instance.lastBlockPos.y);
        }
        else if((currentSizeType & SIZE_LEFT) == SIZE_LEFT) {
          //左
          size.x = (_instance.lastBlockPos.x + _instance.lastBlockSize.x - mousePos.x);
          _instance.position = new Vector2(mousePos.x, _instance.position.y);
        }
        else if((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT) {
          //右
          size.x = (mousePos.x - _instance.lastBlockPos.x);
        }            
        
        if(size.x < _instance.define.style.minWidth) size.x = _instance.define.style.minWidth;
        if(size.y < _instance.define.style.minHeight) size.y = _instance.define.style.minHeight;

        _instance.customSize = size;
        lastResized = true;

        return true;
      }
      return false;
    }

    //#endregion

    //#region 鼠标事件

    const cursor = ref('');

    function testIsDownInControl(e : MouseEvent) {
      const classList = (e.target as HTMLElement).classList;
      return (HtmlUtils.isEventInControl(e)
        || classList.contains('flow-block-no-move')
        || classList.contains('flow-port') 
        || classList.contains('port-delete') 
        || classList.contains('param-editor') 
        || classList.contains('custom-editor'));
    }
    function onMouseDown(e : MouseEvent) {
      if(testIsDownInControl(e)) 
        return;

      const _instance = instance.value;

      if(typeof _instance.define.events.onBlockMouseEvent === 'function' 
        && _instance.define.events.onBlockMouseEvent(_instance as BluePrintFlowBlock, 'down', e)) 
        return;

      _instance.mouseDown = true;
      _instance.mouseLastDownPos.set(e.x, e.y);
      _instance.lastMovedBlock = false;
      _instance.lastBlockPos.set(_instance.position);
      _instance.lastBlockSize.set(getRealSize());

      lastResized = false;

      if(_instance.define.style.userResize) 
        testInResize(e);

      updateCursor();

      document.addEventListener('mousemove', onDocunmentMouseMove);
      document.addEventListener('mouseup', onDocunmentMouseUp);

      e.stopPropagation();
    }
    function onMouseEnter(e : MouseEvent) {
      const _instance = instance.value;
      _instance.hover = true;
      if(typeof _instance.define.events.onBlockMouseEvent === 'function')
        _instance.define.events.onBlockMouseEvent(_instance as BluePrintFlowBlock, 'enter', e);
    }
    function onMouseLeave(e : MouseEvent) {
      const _instance = instance.value;
      _instance.hover = false;
      if(typeof _instance.define.events.onBlockMouseEvent === 'function')
        _instance.define.events.onBlockMouseEvent(_instance as BluePrintFlowBlock, 'leave', e);
    }
    function onMouseMove(e : MouseEvent) {
      const _instance = instance.value; 
      if(!_instance.mouseDown) {
        if(typeof _instance.define.events.onBlockMouseEvent === 'function' 
          && _instance.define.events.onBlockMouseEvent(_instance as BluePrintFlowBlock, 'move', e)) 
          return;
        if(_instance.define.style.userResize) 
          testInResize(e);
        return;
      }
    }
    function onDocunmentMouseMove(e : MouseEvent) {

      const _instance = instance.value; 
      const _editor = _instance.editor as BluePrintEditorInstance;

      if(!_instance.mouseDown)
        return;
      if(typeof _instance.define.events.onBlockMouseEvent === 'function' 
        && _instance.define.events.onBlockMouseEvent(_instance as BluePrintFlowBlock, 'move', e)) 
        return;
      
    
      if(e.buttons == 1){ 
        if(!onMouseResize(e) //Handle mouse resize
          && !_instance.mouseDownInPort && !_instance.mouseConnectingPort) { 
          let zoom = _editor.getViewPort().scale;
          let pos = new Vector2(
            _instance.lastBlockPos.x + (e.x * zoom - _instance.mouseLastDownPos.x * zoom),
            _instance.lastBlockPos.y + (e.y * zoom - _instance.mouseLastDownPos.y * zoom)
          );
          if(pos.x != _instance.position.x || pos.y != _instance.position.y) {

             //如果当前块没有选中，在这里切换选中状态
            if(!_instance.selected) {
              let multiSelectBlocks = _editor.getSelectBlocks();
              if(multiSelectBlocks.length == 0 || !multiSelectBlocks.contains(_instance as BluePrintFlowBlock)) 
                _editor.selectBlock(_instance as BluePrintFlowBlock, false);
              else 
                _editor.selectBlock(_instance as BluePrintFlowBlock, true);
            }

            //移动
            _instance.lastMovedBlock = true;
            _instance.position = pos;
            _editor.onMoveBlock(
              _instance as BluePrintFlowBlock, 
              new Vector2(e.x - _instance.mouseLastDownPos.x, e.y - _instance.mouseLastDownPos.y).multiply(zoom)
            );
          }
        }
        return true;
      }
    }
    function onDocunmentMouseUp(e : MouseEvent) {

      const _instance = instance.value;
      const _editor = _instance.editor as BluePrintEditorInstance;

      if(_instance.mouseDown) {
        _instance.mouseDown = false;

        if(typeof _instance.define.events.onBlockMouseEvent === 'function' 
          && _instance.define.events.onBlockMouseEvent(_instance as BluePrintFlowBlock, 'up', e)) 
          return;
        if(!testIsDownInControl(e)) {
          if(_instance.lastMovedBlock) 
            _editor.onMoveBlockEnd(_instance as BluePrintFlowBlock);
          else if(_editor.getSelectBlockCount() == 0 || e.button == 0)   
            _editor.selectBlock(_instance as BluePrintFlowBlock, false);
        }
        updateCursor();

        if(lastResized)
          _editor.onMoveBlockEnd(_instance as BluePrintFlowBlock);
      }

      document.removeEventListener('mousemove', onDocunmentMouseMove);
      document.removeEventListener('mouseup', onDocunmentMouseUp);
    }
    function onMouseWhell(e : WheelEvent) {
      if(testIsDownInControl(e)) 
        e.stopPropagation();
    }
    function onMouseUp(e : WheelEvent) {
      if(testIsDownInControl(e)) {
        const _instance = instance.value;
        //大小更改
        if(!_instance.getRealSize().equal(_instance.lastBlockSize))
          _instance.updateRegion();
      }
    }

    //#endregion

    //#region 添加端口

    function onUserAddPort(direction : BluePrintFlowPortDirection, type : 'execute'|'param') {
      const _instance = instance.value;
      if(typeof _instance.define.events.onUserAddPort !== 'function')
        return;
      const v = _instance.define.events.onUserAddPort(_instance as BluePrintFlowBlock, direction, type);
      if(CommonUtils.isArray(v)) {
        let arr = v as BluePrintFlowPortDefine[];
        arr.forEach((p) => _instance.addPort(p, true));
      } else {
        _instance.addPort(v as BluePrintFlowPortDefine, true)
      }
      return v;
    }
    //#endregion 

    //#region 右键菜单

    function onContextmenu(e : MouseEvent) {
      e.preventDefault();
      instance.value.editor?.showBlockRightMenu(instance.value as BluePrintFlowBlock, new Vector2(e.x, e.y));
      return false;
    }

    //#endregion

    onMounted(() => {
      setTimeout(() => {
        const _instance = instance.value;
        const size = getRealSize();

        if(_instance.shouldMoveToSelfCenter) {
          _instance.position.set(
            _instance.position.x - size.x / 2,
            _instance.position.y - size.y / 2,
          );
          _instance.editor?.updateBlockForMoveEnd(_instance as BluePrintFlowBlock);
        }

        updateComment();
      }, 100)
    })

    return {
      block,
      cursor,
      commentTop,
      commentInput,
      commentInputPlaceHolder,
      twinkleActive,
      updateComment,
      updateRegion,
      closeComment,
      openComment,
      onCommentInputPlaceHolderClick,
      onCommentInputInput,
      onCommentInputBlur,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseMove,
      onMouseWhell,
      onMouseUp,
      onUserAddPort,
      onContextmenu,
    }
  }
})
</script>
