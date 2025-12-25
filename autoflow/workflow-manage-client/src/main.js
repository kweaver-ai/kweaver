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
import ElementUI from 'element-ui'
import Router from 'vue-router'
import routes from './router'
import { initRoutes } from '@/router/index'
import { getLang, setToken } from '@/utils/auth'
import loadDirective from './utils/load-directive.js'
import titleDirective from './utils/title-directive.js'
import preventReClick from './utils/prevent-re-click.js'
import i18n from '@/lang'
import VueIntro from '@/components/vue-introjs/src'
import VTooltip from 'v-tooltip'
import workflowDialog from '@/components/dialog'
import workflowPopover from '@/components/popover'
import workflowPagination from '@/components/pagination'
import request from '@/utils/request'
import XEUtils from 'xe-utils'
import { dialog_alert, dialog_confirm, dialog_error, toast, dialog_confirm_user_not_exist } from './utils/message.js'
import { addOemStyle, removeOemStyle } from './oemConfig.js'

let path = require('path')
Vue.use(VTooltip)
Vue.use(VueIntro)
Vue.use(ElementUI)
Vue.use(loadDirective)
Vue.use(titleDirective)
Vue.use(preventReClick)
Vue.use(Router)
Vue.use(workflowDialog)
Vue.use(workflowPopover)
Vue.use(workflowPagination)

Vue.prototype.$dialog_alert = dialog_alert
Vue.prototype.$dialog_confirm = dialog_confirm
Vue.prototype.$dialog_error = dialog_error
Vue.prototype.$toast = toast
Vue.prototype.$dialog_confirm_user_not_exist = dialog_confirm_user_not_exist
Vue.config.productionTip = false

let isElectron = false
let instance = null
let router = null
function render (props = {}) {
  const { container, microWidgetProps } = props
  // 适配URL前缀
  let prefix = XEUtils.cookie.get('X-Forwarded-Prefix') || microWidgetProps?.config?.systemInfo?.as_access_prefix
  if(!prefix || prefix === '/' || prefix === 'undefined') {
    prefix = ''
  }
  let base = isElectron ? microWidgetProps?.history?.getBasePath.split('#')[0] + '/' : path.resolve(prefix,process.env.VUE_APP_CONTEXT_PATH)
  router = new Router({
    base: base,
    mode: 'hash',
    routes
  })
  // 当富客户端上其他插件加载审核时
  if(microWidgetProps && microWidgetProps?.config?.systemInfo?.platform === 'electron') {
    router = new Router({
      base: '/',
      mode: 'abstract',
      routes
    })

    router.push('/')
  }

  instance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

function setUpparameters (context) {
  let { microWidgetProps } = context
  if (microWidgetProps) {
    if (microWidgetProps?.config?.systemInfo?.platform === 'electron') {
      // 富客户端添加路由绝对地址前缀
      initRoutes(routes, microWidgetProps?.history?.getBasePath?.split('#')[1])
    }
    // 确保富客户端baseURL正确
    const realLocation = microWidgetProps?.config?.systemInfo?.realLocation
    if(realLocation){
      // 适配URL前缀
      let prefix = XEUtils.cookie.get('X-Forwarded-Prefix') || microWidgetProps?.config?.systemInfo?.as_access_prefix
      if(!prefix || prefix === '/') {
        prefix = ''
      }
      request.defaults.baseURL = realLocation.origin + prefix
    }

    /**
     * 自定义配置
     * showAdmin - 是否显示仓库管理员选项
     * onlyProcess - kc 审核流程管理： 仅创建、编辑流程。 屏蔽 【从已有模板中选择】【完成并生成模板】,名称重复检测
     */
    store.dispatch('app/setCustom', context.custom)

    // 任意审核流程查看入参
    store.dispatch('app/setArbitrailyAuditPreview', context.arbitrailyAuditPreview)

    // 任意审核流程新建编辑入参
    store.dispatch('app/setArbitrailyAuditTemplate', context.arbitrailyAuditTemplate)
    if(context.arbitrailyAuditTemplate && context.arbitrailyAuditTemplate.process_type !== 'doc_flow') {
      const advanceSetup = {
        allowEditPerm: false
      }
      store.dispatch('app/setAdvanceSetup', advanceSetup)
    }

    // 设置插件集成参数对象
    store.dispatch('app/setMicroWidgetProps', microWidgetProps)

    if(context.adaptToElectron) {
      // 设置插件是否需workflow适配富客户端
      store.dispatch('app/setAdaptToElectron', context.adaptToElectron === true ? true : false)
    }
    
    // 重新渲染页面
    store.dispatch('app/setTimestamp',new Date())

    // 设置租户ID和全局token
    store.dispatch('user/initTenantId')
    setToken(microWidgetProps?.token?.getToken?.access_token)

    // 设置国际化语言
    i18n.locale = microWidgetProps?.language?.getLanguage
  }
  render(context)
}


// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  const lang = getLang()
  if (lang) {
    i18n.locale = lang
  }
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
  setUpparameters(context)
  addOemStyle('workflow-manage-client-oem', context.microWidgetProps)
}

/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount () {
  instance.$destroy()
  instance.$el.innerHTML = ''
  instance = null
  removeOemStyle('workflow-manage-client-oem')
}

/**
 * 可选生命周期钩子，仅使用 loadMicroApp 方式加载微应用时生效
 */
export async function update (context) {
  // 任意审核流程新建编辑入参
  store.dispatch('app/setArbitrailyAuditTemplate', context.arbitrailyAuditTemplate)
  store.dispatch('app/setTimestamp',new Date())
}

