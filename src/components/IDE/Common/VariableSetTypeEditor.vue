<template>
  <div class="position-relative display-inline-block">
    <div class="flow-float-set-typedot" v-tooltip data-title="更改集合类型" @click="switchShow" :style="{ color: color }">
      <i v-if="!canChooseType || value=='variable'" class="iconfont icon-sphere"></i>
      <i v-else-if="value=='array'" class="iconfont icon-port-array-full"></i>
      <i v-else-if="value=='set'" class="iconfont icon-port-set"></i>
      <span v-else-if="value=='dictionary'" >
        <i class="iconfont icon-port-dictionary-left" :style="{ color: color2 }"></i>
        <i class="iconfont icon-port-dictionary-right" style="margin-left: -9px;"></i>
      </span>
      <i v-else class="iconfont icon-sphere"></i>
    </div>
    <div v-show="show" class="flow-float-set-selector">
      <div class="iconfont icon-sphere" v-tooltip data-title="变量" @click="switchType('variable')"></div>
      <div class="iconfont icon-port-array-full" v-tooltip data-title="数组" @click="switchType('array')"></div>
      <div class="iconfont icon-port-set" v-tooltip data-title="集合" @click="switchType('set')"></div>
      <div class="iconfont icon-port-dictionary-full" v-tooltip data-title="映射" @click="switchType('dictionary')"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { BluePrintParamSetType, BluePrintParamType } from '@/model/Flow/BluePrintParamType';
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    type: {
      type: Object as PropType<BluePrintParamType>,
      default: null
    },
    value: {
      type: String as PropType<BluePrintParamSetType>,
      default: null
    },
    color: {
      type: String,
      default: null
    },
    color2: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      show: false,
      canChooseType: false,
    }
  },
  watch: {
    type() {
      this.onTypeChange();
    }
  },
  methods: {
    switchType(newType : string) {
      this.show = false;
      this.$emit('change-set-type', newType);
    },
    switchShow() {
      if(this.canChooseType)
        this.show = !this.show;
    },
    onTypeChange() {
      this.canChooseType = this.type && !this.type.isExecute();
    }
  },
  mounted() {
    this.onTypeChange();
  }
})
</script>

<style lang="scss">
.flow-float-set-typedot {
  display: inline-block;
  cursor: pointer;
  padding: 2px 5px;
  text-shadow: 0px 0px 3px rgb(0, 0, 0);
}
.flow-float-set-selector {
  position: absolute;
  top: 20px;
  border: 1px solid #000;
  background: #fff;
  z-index: 200;

  > div {
    cursor: pointer;
    display: block;
    width: 20px;
    height: 20px;
    text-align: center;
    padding-top: 5px;

    &:hover, &:active {
      background-color: #6b6b6b;
      color: #fff;
    }
  }
}
</style>