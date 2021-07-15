<template>
  <!--单元连接弹出提示-->
  <div class="tooltip"
    v-if="connectingInfo"
    v-show="connectingInfo.isConnecting && !connectingInfo.isConnectingToNew"
    :style="{ left: (connectingInfo.endPos.x - viewPort.position.x + 10) + 'px', top:  (connectingInfo.endPos.y - viewPort.position.y + 10) + 'px' }">
    <span v-if="connectingInfo.currentHoverPort==null"><i class="iconfont icon-calendar-1 mr-1"></i>连接至新的单元</span>
    <span v-else-if="connectingInfo.canConnect"><i class="iconfont icon-check- text-success"></i><span v-html="connectingInfo.successText"></span></span>
    <span v-else><i class="iconfont icon-close- text-danger mr-1"></i><span v-html="connectingInfo.failedText"></span></span>
  </div>
  <!--小信息提示-->
  <div 
    class="centertip"
    v-show="isShowSmallTip"
    v-html="smallTipText">
  </div>
  <!--添加单元弹出窗口-->
  <add-panel
    ref="instanceAddBlockPanel"
    v-show="addBlockPanelShow"
    :style="{ maxHeight: '460px' }"
    :show="addBlockPanelShow"
    :allBlocksGrouped="allBlocksGrouped"
    :showPos="addBlockPanel.pos"
    :isAddDirectly="false"
    :filterByPortDirection="addBlockPanel.filterByPortDirection"
    :filterByPortType="addBlockPanel.filterByPortType"
    @addBlock="onBlockAddItemClick"
    @close="addBlockPanelShow = false" />
  <!--添加单元选择类型弹出窗口-->
  <choose-type-panel 
    ref="instanceChooseTypePanel"
    v-show="chooseTypePanel.show"
    :show="chooseTypePanel.show"
    :showPos="chooseTypePanel.pos"
    :canBeAny="chooseTypePanel.canBeAny"
    :canBeExecute="chooseTypePanel.canBeExecute"
    @close="chooseTypePanel.show=false"
    @itemClick="onTypeItemClick"
  />
</template>

<script lang="ts">
import { Vector2 } from '@/model/Base/Vector2';
import { BluePrintEditorInstance, ChooseTypePanelCallback, IConnectingInfo } from '@/model/BluePrintEditor';
import { BluePrintEditorViewport } from '@/model/BluePrintEditorBase';
import { BluePrintFlowBlockDefine } from '@/model/Flow/BluePrintFlowBlock';
import { BluePrintFlowPortDirection } from '@/model/Flow/BluePrintFlowPort';
import { BluePrintParamType } from '@/model/Flow/BluePrintParamType';
import { defineComponent, PropType, reactive, ref, toRefs } from 'vue'
import BlockRegisterService, { CategoryData } from '@/model/Services/BlockRegisterService';
import AddPanel from '@/components/Panel/AddPanel.vue';
import ChooseTypePanel from '@/components/Panel/ChooseTypePanel.vue';
import { useChooseTypeControl } from '@/components/IDE/Common/ChooseTypeControl';

export interface IBasePanels {
  /**
   * 显示选择类型菜单
   * @param screenPos 显示位置（屏幕坐标） 
   * @param canbeExecute 是否可以选择执行类型  
   * @param canbeAny 是否可以选择any类型 
   * @param callback 用户选择完成后的回调
   */
  showChooseTypePanel: (screenPos: Vector2, canbeExecute: boolean, canbeAny: boolean, callback: ChooseTypePanelCallback) => void;
  /**
   * 关闭选择类型菜单
   */
  closeChooseTypePanel: () => void;
  /**
   * 显示添加单元菜单
   * @param screenPos 显示位置（屏幕坐标） 
   * @param filterByPortType 按单元端口的类型进行筛选 
   * @param filterByPortDirection 按单元端口的方向进行筛选
   * @param addBlockPos 设置添加单元的坐标
   * @param showAddDirectly 是否显示直接添加和拖动添加两个模式，否则只有直接添加一个模式，默认为 true
   */
  showAddBlockPanel: (screenPos: Vector2, filterByPortType ?: BluePrintParamType|null, filterByPortDirection ?: BluePrintFlowPortDirection|null, addBlockPos ?: Vector2, showAddDirectly ?: boolean) => void;
  /**
   * 关闭添加单元菜单
   */
  closeAddBlockPanel: () => void;
  /**
   * 显示小信息提示
   * @param text 显示文字 
   * @param time 显示时长（毫秒），默认1300 
   */
  showSmallTip: (text : string, time ?: number) => void;
  /**
   * 关闭小信息提示
   */
  closeSmallTip: () => void;
}

export default defineComponent({
  components: { 
    AddPanel ,
    ChooseTypePanel
  },
  name: 'BasePanels',
  props: {
    connectingInfo: {
      type: Object as PropType<IConnectingInfo>,
      default: null
    },
    editor: {
      type: Object as PropType<BluePrintEditorInstance>,
      default: null
    },
    viewPort: {
      type: Object as PropType<BluePrintEditorViewport>,
      default: null
    }
  },
  setup(props) {

    const { viewPort, editor, connectingInfo } = toRefs(props);

    const _editor = (editor.value as BluePrintEditorInstance);
    
    const instanceAddBlockPanel = ref();

    const { 
      instanceChooseTypePanel,
      chooseTypePanel,
      onTypeItemClick,
      showChooseTypePanel,
      closeChooseTypePanel 
    } = useChooseTypeControl(viewPort.value);
   
    const addBlockPanelShow = ref(false);
    const addBlockPanel = reactive({
      pos: new Vector2(),
      addDirectly: false,
      filterByPortType: null as BluePrintParamType|null,
      filterByPortDirection: null as BluePrintFlowPortDirection|null,
    });

    const allBlocksGrouped = ref(new Array<CategoryData>());
    BlockRegisterService.setAllBlocksGrouped(allBlocksGrouped.value);

    function onBlockAddItemClick(blockDefine : BluePrintFlowBlockDefine) {
      addBlockPanelShow.value = false;
      const block = _editor.userAddBlock(blockDefine) || undefined;
      if(connectingInfo.value.isConnectingToNew)
        _editor.endConnectToNew(block);
    }

    /**
     * 关闭添加单元菜单
     */
    function closeAddBlockPanel() {
      addBlockPanelShow.value = false;
    }
    /**
     * 显示添加单元菜单
     */
    function showAddBlockPanel(screenPos: Vector2, filterByPortType ?: BluePrintParamType|null, filterByPortDirection ?: BluePrintFlowPortDirection|null, addBlockPos ?: Vector2, showAddDirectly = true) {
      
      addBlockPanel.pos.set(screenPos);
      addBlockPanel.addDirectly = showAddDirectly;
      addBlockPanel.filterByPortType = filterByPortType || null;
      addBlockPanel.filterByPortDirection = filterByPortDirection || null;
      addBlockPanelShow.value = true;
      if(addBlockPos)
        _editor.setAddBlockInpos(addBlockPos);
      else
        _editor.setNoAddBlockInpos()
      instanceAddBlockPanel.value.focus();
    }

    //#region 小信息提示

    const isShowSmallTip = ref(false);
    const smallTipText = ref('');

    function showSmallTip(text : string, time = 1300) {
      smallTipText.value = text;
      isShowSmallTip.value = true;
      setTimeout(() => {
        isShowSmallTip.value = false;
      }, time)
    }
    function closeSmallTip() {
      isShowSmallTip.value = false;
    }

    //#endregion

    return {
      showSmallTip,
      showChooseTypePanel,
      showAddBlockPanel,
      closeChooseTypePanel,
      closeAddBlockPanel,
      closeSmallTip,
      onBlockAddItemClick,
      onTypeItemClick,
      isShowSmallTip,
      smallTipText,
      addBlockPanelShow,
      instanceAddBlockPanel,
      addBlockPanel,
      instanceChooseTypePanel,
      chooseTypePanel,
      allBlocksGrouped,
    }
  },
})
</script>
