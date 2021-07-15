<script lang="ts">
import { defineComponent, h, PropType } from 'vue'

export interface SideTabItem {
  key: string|number,
  title: string,
  icon: string,
}

export default defineComponent({
  name: 'SideTab',
  emits: [ 
    'update:open',
    'update:activeItem',
  ],
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Object as PropType<Array<SideTabItem>>,
      default: null
    },
    iconFontClassName: {
      type: String,
      default: 'iconfont',
    },
    activeItem: {
      type: Object as PropType<SideTabItem>,
      default: null
    }
  },
  methods: {
    onItemClick(item : SideTabItem) {
      if(item === this.activeItem) 
        this.$emit('update:open', !this.open)
      else 
        this.$emit('update:activeItem', item)
    }
  },
  render() {
    
    const activeItem = this.$props.activeItem;
    const sideItems = this.$props.items ? this.$props.items.map((item, index) => {
      return h('div', {
        class: 'item'+(activeItem==item?' active':''),
        key: index,
        title: item.title,
      }, [
        h('i', { class: this.$props.iconFontClassName+''+item.icon })
      ])
    }) : [];
    const sidePanels = (this.$slots.default ? this.$slots.default() : []).map((item, index) => {
      return h('div', {
        style: { display: activeItem.key === item.key ? '' : 'none' },
        key: index 
      }, item)
    });

    return h('div', {
      class: "side-tab",
      style: {
        maxWidth: this.$props.open ? '' : '55px',
      }
    }, [
      h('div', { class: 'side' }, sideItems),
      h('div', { class: 'area', style: { display: this.$props.open ? '' : 'none' } }, sidePanels),
    ])
  }
})
</script>

<style lang="scss">
@import '@/assets/scss/root.scss';

.side-tab {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 55px;

  .side { 
    width: 55px;
    background-color: $side-bar-background-color;
    
    .item {
      width: 55px;
      height: 55px;
      color: $side-bar-color;
      text-align: center;

      i {
        display: inline-block;
        font-size: 25px;
        vertical-align: middle;
      }

      &:hover, &:active, &.active {
        color: $side-bar-active-color;
      }
    }
  }

  .area {
    position: relative;
    display: block;
    background-color: $side-panel-background-color;

    > div {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
    }
  }
}
</style>
