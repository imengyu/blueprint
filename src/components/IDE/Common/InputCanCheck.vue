<template>
  <div :class="'display-inline-block check-input'+(valueError!=null?' error':'')">
    <input :type="type" v-model="valueThis" :placeholder="placeholder" @blur="onBlur" />
    <div class="error-text">{{valueError}}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InputCanCheck',
  props: {
    value: {
      type: String,
      default:''
    },
    checkCallback: {
      type: Function,
      default: null
    },
    placeholder: {
      type: String,
      default:''
    },
    type: {
      type: String,
      default: 'text'
    },
  },
  data() {
    return {
      valueThis: '',
      valueChangeLock: false,
      valueError: '' as string|null,
    }
  },
  watch: {
    value(newV : string) {
      this.valueChangeLock = true;
      this.valueThis = newV;
    },
    valueThis() {
      this.checkInput();
    },
  },
  methods: {
    onBlur() {
      this.$emit('update', this.value, this.valueThis)
    },
    checkInput() {
      let rs = this.checkCallback(this.value, this.valueThis)
      if(rs == true) {
        this.valueError = null;
        this.$emit('input', this.valueThis);
      }else {
        this.valueError = rs;
      }
    }
  },
  mounted() {
    this.valueChangeLock = true;
    this.valueThis = this.value;
  }
})
</script>