import axios from 'axios'
import { dialog_alert, toast } from './message.js'
import { getLang } from './auth.js'
import i18n from '@/lang'
import XEUtils from 'xe-utils'
import store from '@/store'
const qs = require('qs')

// create an axios vue
let baseUrl = ''

const langMap = {
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  'en-us': 'en-US',
  'vi-vn': 'en-US'
}

if (process.env.VUE_APP_ENV === 'development') {
  baseUrl = process.env.VUE_APP_AS_PROXYURL
}
if (process.env.VUE_APP_ENV === 'anyshare') { // 如果是
  const parseUrl = XEUtils.parseUrl(window.location.href)
  baseUrl = parseUrl.protocol + '//' + parseUrl.host
}
// 适配URL前缀

let prefix = XEUtils.cookie.get('X-Forwarded-Prefix')
  || store?.getters?.microWidgetProps ?
  store?.getters?.microWidgetProps?.config?.systemInfo?.as_access_prefix
  : ''
if (!prefix || prefix === '/' || prefix === 'undefined') {
  prefix = ''
}
// 获取插件集成参数体
if (store.getters.microWidgetProps) {
  // 获取插件绝对地址与token信息
  const realLocation = store?.getters?.microWidgetProps?.config?.systemInfo?.realLocation
  baseUrl = realLocation.origin
}
export const service = axios.create({
  baseURL: baseUrl + prefix, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  timeout: 30000 // request timeout
})

service.interceptors.request.use(
  config => {
    config.headers.common['Authorization'] = 'Bearer ' + getOauth2Token()
    config.headers.common['X-Language'] = langMap[getLang()] || 'zh-CN'
    if (config.method === 'get') { // 解决IE11 GET请求缓存问题
      config.params = config.params || {}
      config.params.time = Date.parse(new Date()) / 1000 // 添加时间戳
      // 如果是get请求，且params是数组类型如arr=[1,2]，则转换成arr=1&arr=2
      config.paramsSerializer = function (params) {
        return qs.stringify(params, { arrayFormat: 'repeat' })
      }
    }
    return config
  }, error => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  async error => {
    if (error.response.status === 401) {
      if (store.getters.microWidgetProps) {
        // eslint-disable-next-line consistent-return
        refreshToken().then(newToken => {
          if (null !== newToken) {
            if (!store.getters.microWidgetProps) {
              XEUtils.cookie('client.oauth2_token', newToken)
            }
            error.config.headers['Authorization'] = 'Bearer ' + newToken
            window.location.reload()
            return service(error.config)
          }
        })
      } else {
        toast('warning', i18n.t('message.authorized'))
      }
      if (process.env.VUE_APP_ENV === 'anyshare' && store.getters.microWidgetProps) {
        store.getters.microWidgetProps.token.onTokenExpired()
      }
    } else if (error.response.status === 500) {
      dialog_alert(i18n.t('message.info'), error.response.data.message, i18n.t('message.confirm'))
    } else if (error.response.status === 503) {
      toast('error', i18n.t('message.serviceUnavailable'))
    }
    return Promise.reject(error)
  }
)

function getOauth2Token() {
  let token = XEUtils.cookie('client.oauth2_token')
  if (store.getters.microWidgetProps) {
    if (store.getters.microWidgetProps) {
      return store.getters.microWidgetProps.token.getToken.access_token
    }
  }
  return token
}

function refreshToken() {
  return new Promise((resolve) => {
    let access_token = null
    store.getters.microWidgetProps.token.refreshOauth2Token().then(res => {
      if (res.access_token) {
        access_token = res['access_token']
      }
      resolve(access_token)
    }).catch((error) => {
      store.getters.microWidgetProps.token.onTokenExpired()
      resolve(access_token)
      Promise.reject(error)
    })
  })
}

export default service
