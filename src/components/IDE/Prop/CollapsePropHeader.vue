<template>
  <div>
    <div class="prop-header">
      <a href="javascript:;" :title="show?'折叠':'展开'" @click="show=!show" class="mr-2">
        <i :class="'iconfont ' + (show?'icon-arrow-down-1':'icon-arrow-right-')"></i>
      </a>
      {{title}}
    </div>
    <div v-show="show">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'CollapsePropHeader',
  props: {
    title: {
      type: String,
      default: '',
    },
    defaultOpen: {
      type: Boolean,
      default: true,
    }
  },
  data() {
    return {
      show: true
    }
  },
  mounted() {
    this.show = this.defaultOpen
  }
})
</script>