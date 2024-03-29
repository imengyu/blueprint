<template>
  <textarea 
    :value="value" 
    @update-value="(v) => $emit('update-value', v)" 
    ref="editor"
    class="custom-editor param-editor" 
    :style="{
      minHeight: '20px',
      minWidth: '40px',
      resize: 'both',
      display: 'inline-block',
    }"
    @mouseup="onEditorMouseUp">
  </textarea>
</template>

<script lang="ts">
import { CustomStorageObject } from '@/model/BluePrintEditorBase';
import { defineComponent, onMounted, PropType, ref, toRefs } from 'vue'

export default defineComponent({
  name: 'StringEditor ',
  emits: [ 'update-value', 'update-custom-data'  ],
  props: {
    value: String,
    customData: Object as PropType<CustomStorageObject>,
  },
  setup(props, context) {
    const { customData } = toRefs(props);

    const editor = ref<HTMLTextAreaElement>();

    onMounted(() => {
      const _editor = editor.value;
      if(customData?.value && parent && _editor) {
        _editor.style.width = (customData.value[`editor_w`] as number || 80) + 'px';
        _editor.style.height = (customData.value[`editor_h`] as number || 20) + 'px';
      }
    });

    function onEditorMouseUp() {
      const _editor = editor.value;
      if(customData?.value && _editor) {
        customData.value[`editor_w`] = _editor.offsetWidth;
        customData.value[`editor_h`] = _editor.offsetHeight;
        context.emit('update-custom-data', customData.value);
      }
    }

    return {
      editor,
      onEditorMouseUp,
    }
  }
})
</script>
