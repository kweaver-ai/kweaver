import './public-path'
import './redirect'
import 'element-ui/lib/theme-chalk/index.css'
import Vue from 'vue'
import routes from './router'
import {initRoutes} from '@/router/index'
import store from './store'
import ElementUi from 'element-ui'
import jquery from 'jquery'
import App from './App.vue'
import Router from 'vue-router'
import i18n from './assets/lang'
import XEUtils from 'xe-utils'
import VXEUtils from 'vxe-utils'
import {setToken} from '@/utils/auth'
import {dialog_alert, dialog_confirm, dialog_error, toast} from './utils/message.js'
import VTooltip from 'v-tooltip'
import titleDirective from './utils/title-directive.js'
import { addOemStyle, removeOemStyle } from './oemConfig.js'
import { setTenantId, setIsSafari } from './utils/config'
import '@/icons/index.js'

Vue.use(VTooltip)
Vue.use(VXEUtils, XEUtils)
window.jQuery = jquery
Vue.use(ElementUi)
Vue.use(Router)
Vue.use(titleDirective)

Vue.prototype.$dialog_alert = dialog_alert
Vue.prototype.$dialog_confirm = dialog_confirm
Vue.prototype.$dialog_error = dialog_error
Vue.prototype.$toast = toast
Vue.prototype.$store = store
Vue.config.productionTip = false

Vue.prototype.anyshareUrl = process.env.VUE_APP_ANYSHARE_URL
if (process.env.VUE_APP_ENV === 'anyshare') {
  const parseUrl = XEUtils.parseUrl(window.location.href)
  Vue.prototype.anyshareUrl = parseUrl.protocol + '//' + parseUrl.host
}
let isElectron = false
let instance = null
let router = null
function render (props = {})
{
  const { container, microWidgetProps } = props
  let base = isElectron ? microWidgetProps.history.getBasePath.split('#')[0] + '/' : typeof microWidgetProps === 'undefined' ? process.env.VUE_APP_CONTEXT_PATH : microWidgetProps.history.getBasePath
  let model = isElectron ? 'hash' : 'history'
  if (typeof microWidgetProps !== 'undefined' && microWidgetProps.history.getBasePath.indexOf('docflowmgnt') !== -1) {
    model = 'hash'
  }

  router = new Router({
    base,
    mode: model, 
    routes
  })

  instance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  setIsSafari()
  render()
  addOemStyle()
}

/**
 * bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
 * 通常我们可以在这里做一些全局变量的初始化，比如不会在 unmount 阶段被销毁的应用级别的缓存等。
 */
export async function bootstrap () {
}

/**
 * 应用每次进入都会调用 mount 方法，通常我们在这里触发应用的渲染方法
 */
export async function mount (context) {
  // applicationType 申请类型参数
  store.dispatch('app/setContext', context)
  if(typeof context.tenantId === 'string'){
    setTenantId(context.tenantId)
  }
  let { microWidgetProps, lang, token } = context
  if (microWidgetProps) {
    let platform = microWidgetProps.config.systemInfo.platform
    if (platform === 'electron') {
      isElectron = true
      // 富客户端添加路由绝对地址前缀
      let realRouterPrefix = microWidgetProps.history.getBasePath.split('#')[1]
      initRoutes(routes, realRouterPrefix)

      store.dispatch('app/setIsElectron', isElectron)
    }

    store.dispatch('app/setMicroWidgetProps', microWidgetProps)
    Vue.prototype.$toast = (type, msg, closePreviousToast = true)=> {
      toast(type, msg, closePreviousToast, microWidgetProps)
    }

    // 任意审核流程日志查看入参
    store.dispatch('app/setArbitrailyAuditLog', context.arbitrailyAuditLog)

    lang = microWidgetProps.language.getLanguage
    token = microWidgetProps.token.getToken.access_token
    setToken(token)
    i18n.locale = lang
  }
  setIsSafari()
  render(context)
  addOemStyle('doc-audit-client-oem', context.microWidgetProps)
}

/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount (props) {
  instance.$destroy()
  instance.$el.innerHTML = ''
  instance = null
  removeOemStyle('doc-audit-client-oem')
}

/**
 * 可选生命周期钩子，仅使用 loadMicroApp 方式加载微应用时生效
 */
export async function update (props) {
}
