<template>
  <input 
    v-model="numberStringValue"
    type="text" 
    :class="'param-editor'+(numberIsOk?'':' input-border input-warn')" 
    style="display: inline-block;; width: 88px">
  <span v-if="!numberIsOk" v-tooltip="'输入数字格式不正确'">
    <i class="iconfont icon-error-1 text-warning"></i>
  </span>
</template>

<script lang="ts">
import { CustomStorageObject } from '@/model/BluePrintEditorBase';
import StringUtils from '@/model/Utils/StringUtils'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'NumberEditor',
  emits: [ 'update-value', 'update-custom-data' ],
  props: {
    value: Object as PropType<BigInt>,
    customData: Object as PropType<CustomStorageObject>,
  },
  data() {
    return {
      numberIsOk: true,
      numberStringValue: '',
    }
  },
  mounted() {
    this.numberStringValue = '' + this.value;
  },
  watch: {
    numberStringValue(newV: string) {
      this.checkNumber(newV);
    },
  },
  methods: {
    checkNumber(v : string) {
      if(StringUtils.isInteger(v)) {
        this.$emit('update-value', BigInt(parseInt(v)));
        this.numberIsOk = true;
      }
      else this.numberIsOk = false;
    }
  }
})
</script>
