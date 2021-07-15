<template>
  <div class="about">
    <BluePrintIDE />
  </div>
</template>

<script lang="ts">
import BluePrintIDE from '@/components/IDE/BluePrintIDE.vue';
import { defineComponent } from 'vue'

export default defineComponent({
  components: { BluePrintIDE },
  setup() {
    return {
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.about {
  display: block;
  height: 100%;
}
</style>

