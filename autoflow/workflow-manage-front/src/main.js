import './public-path'
import 'normalize.css/normalize.css'
import 'element-ui/lib/theme-chalk/index.css'
import '@/styles/index.scss'
import '@/icons'
import './utils/directives.js'
import '@/components/intro.js/introjs.css'
import Vue from 'vue'
import App from './App'
import store from './store'
import router from './router'
import ElementUI from 'element-ui'
import loadDirective from './utils/load-directive.js'
import preventReClick from './utils/prevent-re-click.js'
import titleDirective from './utils/title-directive.js'
import i18n from '@/lang'
import VueIntro from '@/components/vue-introjs/src'
import VTooltip from 'v-tooltip'
import { setToken, setLang, getLang } from '@/utils/auth'
import { addOemStyle, removeOemStyle } from './oemConfig.js'
import { dialog_confirm } from './utils/message.js'
import { setTenantId } from './utils/config'

Vue.use(VTooltip)
Vue.use(VueIntro)
Vue.use(ElementUI)
Vue.use(loadDirective)
Vue.use(preventReClick)
Vue.use(titleDirective)
Vue.config.productionTip = false

Vue.prototype.$dialog_confirm = dialog_confirm

let instance = null
function render(props = {}) {
  const { container } = props
  instance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

/**
 * bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
 * 通常我们可以在这里做一些全局变量的初始化，比如不会在 unmount 阶段被销毁的应用级别的缓存等。
 */
export async function bootstrap() {
}

/**
 * 应用每次进入都会调用 mount 方法，通常我们在这里触发应用的渲染方法
 */
export async function mount(context) {
  if (typeof context.tenantId === 'string') {
    setTenantId(context.tenantId)
  }
  store.dispatch('app/setContext', context)
  store.dispatch('app/setPort', context.port)
  setToken(context.getToken())
  setLang(context.lang)
  i18n.locale = context.lang

  // 用户角色信息
  store.dispatch('app/setRoles', context.getUserInfo().user.roles)

  // 文档共享插件入参
  store.dispatch('app/setShare', context.workflowSwitching)

  // 文档同步插件入参
  store.dispatch('app/setSync', context.docSyncAudit)

  // 任意审核插件入参
  store.dispatch('app/setArbitraily', context.arbitrailyAudit)
  if (context.arbitrailyAudit && typeof context.arbitrailyAudit.previewBox !== 'undefined') {
    store.dispatch('app/setPreviewBox', context.arbitrailyAudit.previewBox)
  }

  // 插件路由参数
  if (Object.keys(context).indexOf('getRouter') !== -1) {
    store.dispatch('app/setPlugrouter', context.getRouter())
    context.onGlobalStateChange(({ router }) => {
      store.dispatch('app/setPlugrouter', router)
      render(context)
    })
  }
  render(context)
  addOemStyle('workflow-manage-front-oem', context.theme)
}

/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount() {
  instance.$destroy()
  instance.$el.innerHTML = ''
  instance = null
  removeOemStyle('workflow-manage-front-oem')
}

/**
 * 可选生命周期钩子，仅使用 loadMicroApp 方式加载微应用时生效
 */
export async function update(context) {
  store.dispatch('app/setShare', context.workflowSwitching)
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  const lang = getLang()
  if (lang) {
    i18n.locale = lang
  }
  let arbitrailyAudit = {
    visit: 'new',
    process_type: 'security_classification_approval',
    // allowOwnerAuditor: true,
    // onlyOwnerAuditor: true,
    // process_def_key: 'Process_4IzXACfh',
    // process_def_id: 'Process_k6IIS15T:1:02e9a1af-6670-11ee-a997-72c036768547',
    saveFlow: false,
    // allowEditName: false,
    // previewBox: {
    //   height: 600,
    //   background: '#fff'
    // },
    onSaveAuditFlow: ({
      process_def_id = '',
      process_def_key = '',
      process_def_name = '',
      process_data = {},
      generateKey
    }) => {
      // eslint-disable-next-line no-console
      console.log(
        'onSaveAuditFlow:',
        process_def_id,
        process_def_key,
        process_def_name
      )
      // eslint-disable-next-line no-console
      console.log('process_data:', process_data)
      // if(generateKey){
      //   // eslint-disable-next-line no-console
      //   console.log('generateKey---:',generateKey())
      // }
    },
    onCloseAuditFlow: () => {
      // eslint-disable-next-line no-console
      console.log('---onCloseAuditFlow---')
    }
  }
  store.dispatch('app/setArbitraily', arbitrailyAudit)
  if (arbitrailyAudit.previewBox) {
    store.dispatch('app/setPreviewBox', arbitrailyAudit.previewBox)
  }
  render()
  addOemStyle('workflow-manage-front-oem')
}