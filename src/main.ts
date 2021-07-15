import { createApp } from 'vue'
import MyApp from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus';
import ContextMenu from '@imengyu/vue3-context-menu'
import vfmPlugin from 'vue-final-modal'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import 'element-plus/lib/theme-chalk/index.css';
import './assets/css/iconfont.css'
import './assets/scss/index.scss'
import './model/Utils/ExtendsUtils'
import ToolTipUtils from './components/Common/ToolTipUtils';
import BooleanEditor from './components/Editor/TypeEditor/BooleanEditor.vue'
import StringEditor from './components/Editor/TypeEditor/StringEditor.vue'
import NumberEditor from './components/Editor/TypeEditor/NumberEditor.vue'
import BigIntEditor from './components/Editor/TypeEditor/BigIntEditor.vue'

const app = createApp(MyApp)
app.use(store)
app.use(router)
app.use(ContextMenu)
app.use(ToolTipUtils)
app.use(ElementPlus)
app.use(vfmPlugin)
app.mount('#app')

app.component('boolean-editor', BooleanEditor);
app.component('string-editor', StringEditor);
app.component('number-editor', NumberEditor);
app.component('bigint-editor', BigIntEditor);

export default app
