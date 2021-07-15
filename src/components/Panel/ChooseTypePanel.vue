<template>
  <div v-show="show" ref="chooseTypePanel" class="blueprint-editor-panel blueprint-float-panel" 
    :style="{ left: (showPos != null ? showPos.x : 0) + 'px', top: (showPos != null ? showPos.y : 0) + 'px' }"
    @click="onClick($event)">
    <div class="text-center">选择类型</div>

    <div class="input">
      <input class="small-input" type="text" v-model="searchValue" placeholder="搜索类型..." />
      <a href="javascript:;" class="small-button" v-tooltip data-title="清空">
        <i class="iconfont icon-close-2"></i>
      </a>
    </div>

    <div v-if="allBaseTypes" class="blueprint-block-list">
      <div class="item" v-for="(item, index) in allBaseTypes" :key="'D'+index" @click="onItemClick(item)" v-show="searchValue==''||item.name.contains(searchValue)">
        <i class="iconfont icon-sphere" :style="{ marginRight: '5px', color: item.color }"></i>
        {{ item.nameString }}
      </div>
      <div class="item" v-for="(item, index) in allCustomTypes" :key="'C'+index" @click="onItemClick(item)" v-show="searchValue==''||item.name.contains(searchValue)">
        <i :class="'iconfont ' + (item.prototypeName == 'enum' ? 'icon-layers' : 'icon-sphere')" :style="{ marginRight: '5px', color: item.color }"></i>
        {{ item.nameString }}
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import ParamTypeService from '@/model/Services/ParamTypeService';
import { Vector2 } from '@/model/Base/Vector2';
import { BluePrintParamBaseType, BluePrintParamType, BluePrintParamTypeDefine } from '@/model/Flow/BluePrintParamType';
import StringUtils from '@/model/Utils/StringUtils';
import { defineComponent, onMounted, PropType, ref, toRefs, watch } from 'vue'

interface CustomTypeData {
  nameString: string,
  name: string,
  prototypeName?: string,
  color: string,
  isBaseType: boolean,
  type: BluePrintParamType,
}

export default defineComponent({
  name: 'ChooseTypePanel',
  emits: [ 'itemClick', 'close' ],
  props: {
    showPos: {
      type: Object as PropType<Vector2>,
      default: null,
    }, 
    show: {
      type: Boolean,
      default: false,
    },
    canBeExecute: {
      type: Boolean,
      default: false,
    },
    canBeAny: {
      type: Boolean,
      default: false,
    }
  },
  setup(props, context) {

    const chooseTypePanel = ref<HTMLElement>();
    const searchValue = ref('');
    const { show, canBeExecute, canBeAny  } = toRefs(props);

    function onDocClick() {
      context.emit('close');
      document.removeEventListener('click', onDocClick);
    }
    function onClick(e : MouseEvent) {
      e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
    }
    function onItemClick(item : CustomTypeData) {
      context.emit('itemClick', item.type, item.isBaseType)
    }

    watch(show, (newV : boolean) => {
      if(newV) { setTimeout(() => {
        document.addEventListener('click', onDocClick);
      }, 100); } 
      else document.removeEventListener('click', onDocClick);
    });
    onMounted(() => {
      setTimeout(() => loadCustomTypes('full'), 2000);

      ParamTypeService.onTypeChanged.addListener(this, (act, name, reg) => loadCustomTypes(act, name, reg));
      ParamTypeService.getAllBaseTypes().forEach(type => {
        if(type == 'execute' && !canBeExecute.value) 
          return;
        if(type == 'any' && !canBeAny.value) 
          return;
        allBaseTypes.value.push({
          nameString: ParamTypeService.getTypeNameString(type),
          name: type,
          color: ParamTypeService.getTypeColor(type),
          isBaseType: true,
          type: new BluePrintParamType(type as BluePrintParamBaseType),
        })
    });
    })

    const allCustomTypes = ref(new Array<CustomTypeData>());
    const allBaseTypes = ref(new Array<CustomTypeData>());

    function loadCustomTypes(act : 'full'|'add'|'remove', typeName ?: string, reg ?: BluePrintParamTypeDefine) {
      const _allCustomTypes = allCustomTypes.value;
      const map = ParamTypeService.getAllCustomTypes();

      if(act == 'full') {
        _allCustomTypes.clear();
        map.forEach((value) => {
          _allCustomTypes.push({
            nameString: StringUtils.isNullOrEmpty(value.nameString) ? value.name : value.nameString,
            name: value.name,
            prototypeName: value.prototypeName,
            color: ParamTypeService.getTypeColor(value.name),
            isBaseType: false,
            type: new BluePrintParamType(value.prototypeName as BluePrintParamBaseType, value.name)
          })
        });
      }
      else if(act == 'remove') {
        for(let i = _allCustomTypes.length - 1; i >= 0; i--) {
          if(_allCustomTypes[i].name == typeName) {
            _allCustomTypes.removeIndex(i);
            break;
          }
        }
      }
      else if(act == 'add' && reg) {
        _allCustomTypes.push({
          nameString: StringUtils.isNullOrEmpty(reg.nameString) ? reg.name : reg.nameString,
          name: reg.name,
          prototypeName: reg.prototypeName,
          color: ParamTypeService.getTypeColor(reg.name),
          isBaseType: false,
          type: new BluePrintParamType(reg.prototypeName as BluePrintParamBaseType, reg.name)
        })
      }
    }

    function focus() {
      setTimeout(() => {
        if(chooseTypePanel.value) 
          chooseTypePanel.value.focus();
      }, 50);
    }

    return {
      chooseTypePanel,
      searchValue,
      allCustomTypes,
      allBaseTypes,
      onDocClick,
      onClick,
      onItemClick,  
      focus,
    }
  },
})
</script>