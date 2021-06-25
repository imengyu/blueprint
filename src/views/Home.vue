<template>
  <div class="home">
    <BluePrintEditor />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BluePrintEditor from '@/components/BluePrintEditor.vue'; // @ is an alias to /src

export default defineComponent({
  name: 'Home',
  components: {
    BluePrintEditor,
  },
});
</script>

<style lang="scss">
.home {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
