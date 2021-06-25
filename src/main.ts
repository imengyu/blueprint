import { App, createApp } from 'vue'
import MyApp from './App.vue'
import router from './router'
import store from './store'
import './model/Utils/ExtendsUtils'
import './assets/css/iconfont.css'
import './assets/scss/index.scss'
import ToolTipUtils from './components/Common/ToolTipUtils';
import BooleanEditor from './components/Editor/TypeEditor/BooleanEditor.vue'
import StringEditor from './components/Editor/TypeEditor/StringEditor.vue'
import NumberEditor from './components/Editor/TypeEditor/NumberEditor.vue'
import BigIntEditor from './components/Editor/TypeEditor/BigIntEditor.vue'

const app = createApp(MyApp)
app.use(store)
app.use(router)
app.mount('#app')

app.component('boolean-editor', BooleanEditor);
app.component('string-editor', StringEditor);
app.component('number-editor', NumberEditor);
app.component('bigint-editor', BigIntEditor);

ToolTipUtils.createVueDirective(app as unknown as App);
ToolTipUtils.createTooltip('body');

export default app
