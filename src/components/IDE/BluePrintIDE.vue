<template>
  <div class="node-blueprint-root">
    <div class="top-bar">
      <menu-bar :items="mainMenuItems">
        <img class="node-blueprint-header-text" src="../../assets/images/Logo/logo-huge-light.svg" />
      </menu-bar>

    </div>
    <!--主停靠容器-->
    <DockHost 
      class="node-blueprint-main" 
      ref="dockLayout"
      @active-tab-change="onEditorMainActiveTabChange"
    >
      <!--空页-->
      <template #mainEmptyView>
        <div class="editor-blank-page" style="font-size:72px;color:#fff">
          空页
        </div>
      </template>

      <!--属性编辑器-->
      <DockPanel key="Props" title="属性" iconClass="iconfont icon-new_custom19" :tabLeftOffset="31" tag="prop">
        <PropTab>
          <PropTabPanel title="单元属性" iconClass="iconfont icon-vector" class="prop-host">
            <PropBlock v-if="currentGraphSelectBlocks && currentGraphSelectBlocks.length == 1" :block="currentGraphSelectBlocks[0]"  />
            <PropNotAvailable v-else title="未选中单元" />
          </PropTabPanel>
          <PropTabPanel title="图表属性" iconClass="iconfont icon-board" class="prop-host">
            <PropNotAvailable title="未打开图表" />
          </PropTabPanel>
        </PropTab>
      </DockPanel>
      <DockPanel key="DocProps" title="文档" iconClass="iconfont icon-file-" class="prop-host" tag="prop">
        <PropDoc v-if="currentDocunment" :doc="currentDocunment" />
        <PropNotAvailable v-else title="未打开文档" />
      </DockPanel>

      <!--主编辑器-->
      <DockPanel
        v-for="doc in openedDocunments"
        :key="'Doc_' + doc.uid"
        :title="doc.name"
        :closeable="true"
        :tabLeftOffset="56"
        iconClass="iconfont icon-edit-"
        insertTo="areaMain"
        tag="doc"
        @on-close="onEditorMainTabClose"
      >
        <BluePrintDocEditor
          :doc="doc"
          :ide="ide"
          :activeGraph="doc.activeGraph"
          :settings="settings"
          @select-block-changed="onSelectBlockChanged"
        />
      </DockPanel>

      <!--控制台-->
      <DockPanel
        tag="console"
        key="console"
        title="Console"
        iconClass="iconfont icon-develop"
        insertTo="areaMainBottom"
      >
        <Console />
      </DockPanel>

    </DockHost>
    
    <!--弹出窗口-->
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
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import { getIOMapping } from '../../model/IO/IOMappingForIDE'
import MenuBar from '../Common/MenuBar.vue'
import PropNotAvailable from './Prop/PropNotAvailable.vue'
import BluePrintDocEditor from '../Editor/BluePrintDocEditor.vue'
import DockHost from './DockLayout/DockHost.vue'
import DockPanel from './DockLayout/DockPanel.vue'
import PropTab from './Tab/PropTab.vue'
import PropTabPanel from './Tab/PropTabPanel.vue'
import PropDoc from './Prop/PropDoc.vue'
import PropBlock from './Prop/PropBlock.vue'
import Console from './Console/Console.vue'
import BuiltinRuntimeBlocks from '@/model/Blocks/Builtin/BuiltinRuntimeBlocks'
import { BluePrintIDEInstance, BluePrintIDEPanels } from './Base/IDEDefine'
import { useIDEMainMenuControl } from './Base/IDEMainMenuControl'
import { useIDEMainSettingsControl } from './Base/IDEMainSettingsControl'
import { useIDEMainDocControl } from './Base/IDEMainDocControl'
import ChooseTypePanel from '../Panel/ChooseTypePanel.vue'
import { useChooseTypeControl } from './Common/ChooseTypeControl'
import { ElMessageBox } from 'element-plus'

export default defineComponent({
  components: { 
    MenuBar, 
    PropNotAvailable, 
    BluePrintDocEditor,
    DockHost,
    DockPanel,
    PropTab,
    PropTabPanel,
    PropBlock,
    PropDoc,
    Console,
    ChooseTypePanel,
  },
  name: 'BluePrintIDE',
  setup() {

    const dockLayout = ref();

    const { 
      instanceChooseTypePanel,
      chooseTypePanel,
      onTypeItemClick,
      showChooseTypePanel,
      closeChooseTypePanel 
    } = useChooseTypeControl();

    const ioMapping = getIOMapping();
    const ide = {
      getDockLayout: () => dockLayout.value,
      ioMapping: ioMapping,
      panels: {
        showChooseTypePanel: showChooseTypePanel,
        closeChooseTypePanel: closeChooseTypePanel,
        showAlert: (title, text, type) => { ElMessageBox.alert(text, title, { type: type }); },
        showConfirm: (title, text, type ) => { return ElMessageBox.confirm(text, title, { type: type }); },
      } as BluePrintIDEPanels,
    } as BluePrintIDEInstance;

    const { mainMenuItems } = useIDEMainMenuControl(ide as BluePrintIDEInstance);
    const { settings } = useIDEMainSettingsControl(ide as BluePrintIDEInstance);
    const { 
      openedDocunments, currentDocunment, onEditorMainTabClose, onEditorMainActiveTabChange ,
      currentGraphSelectBlocks, currentGraph, onSelectBlockChanged,
    } = useIDEMainDocControl(ide as BluePrintIDEInstance);

    onMounted(() => {
      BuiltinRuntimeBlocks.registerAll();
    });

    return {
      ide,
      dockLayout,
      mainMenuItems,
      openedDocunments,
      currentDocunment,
      settings,
      currentGraphSelectBlocks,
      currentGraph,
      instanceChooseTypePanel,
      chooseTypePanel,
      onTypeItemClick,
      onSelectBlockChanged,
      onEditorMainTabClose,
      onEditorMainActiveTabChange,
    }
  },
})
</script>
