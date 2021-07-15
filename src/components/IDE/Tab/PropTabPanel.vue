<template>
  <div class="tab-panel">
    <slot />
  </div>
</template>

<script lang="ts">
export default {
  name: 'PropTabPanel',
  props: {
    iconClass: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  }
}
</script>