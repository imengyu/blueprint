<template>
  <textarea ref="editor" class="custom-editor comment-editor" @mouseup="onMouseUp" placeholder="输入注释..."></textarea>
</template>

<script lang="ts">
import { BluePrintFlowBlock } from '@/model/Flow/BluePrintFlowBlock';
import { defineComponent, onMounted, onUnmounted, PropType, ref, toRefs } from 'vue'

export default defineComponent({
  name: 'DocCommentBlockInner',
  props: {
    block: {
      type: Object as PropType<BluePrintFlowBlock>,
      default: null,
    }
  },
  setup(props) {
    const { block } = toRefs(props);
    const editor = ref<HTMLTextAreaElement>();
    const _block = block.value;

    onMounted(() => {
      _block.onSave.addListener(null, onBlockSave);

      if(editor.value) {
        const _editor = editor.value;
        _editor.value = _block.options['content'] ? _block.options['content'] as string : '';
        _editor.style.width = (typeof _block.options['width'] === 'number' ? _block.options['width'] : 210) + 'px';
        _editor.style.height = (typeof _block.options['height'] === 'number' ? _block.options['height'] : 122) + 'px';
        _editor.onchange = () => { 
          _block.options['content'] = _editor.value; 
          _block.editorInfo?.markUpFileChanged();
        };
        _editor.oncontextmenu = (e) => {
          //_block.editor.showInputRightMenu(new Vector2(e.x, e.y), <HTMLInputElement>e.target);     
          //TODO: showInputRightMenu
          e.stopPropagation();
          e.preventDefault();
        };
        _block.updateRegion();
      }
    });
    onUnmounted(() => {
      _block.onSave.removeListener(onBlockSave);
    })

    function onMouseUp() {
      _block.updateRegion();
    }
    function onBlockSave(block : BluePrintFlowBlock) {
      if(editor.value) {
        const _editor = editor.value;

        block.options['width'] = _editor.offsetWidth;
        block.options['height'] = _editor.offsetHeight;
        block.options['content'] = _editor.value;
      }
    }

    return {
      editor,
      onMouseUp,
    }
  },
})
</script>
