import axios from 'axios'
import { dialog_alert, toast } from './message.js'
import { getLang } from './auth.js'
import i18n from '../assets/lang'
import router from '../router'
import XEUtils from 'xe-utils'
import store from '@/store'
const qs = require('qs')

const langMap = {
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  'en-us': 'en-US',
  'vi-vn': 'en-US'
}

// create an axios vue
let baseUrl = ''
if (process.env.VUE_APP_ENV === 'development') {
  baseUrl = process.env.VUE_APP_ANYSHARE_PROXY_URL
}
if (process.env.VUE_APP_ENV === 'anyshare') { // 如果是
  const parseUrl = XEUtils.parseUrl(window.location.href)
  baseUrl = parseUrl.protocol + '//' + parseUrl.host
  // ipv6地址访问处理
  if (window.location.href.indexOf('[') !== -1 && window.location.href.indexOf(']') !== -1) {
    baseUrl = parseUrl.protocol + '//' + window.location.href.substring(window.location.href.indexOf('[') + 1, window.location.href.indexOf(']'))
  }
}
// 适配URL前缀
let urlPrefix = XEUtils.cookie('X-Forwarded-Prefix')
if (!urlPrefix || urlPrefix === '/' || urlPrefix === 'undefined') {
  urlPrefix = ''
}
// 获取插件集成参数体
if (store.getters.microWidgetProps) {
  // 获取插件绝对地址与token信息
  const realLocation = store.getters.microWidgetProps.config.systemInfo.realLocation
  baseUrl = realLocation.origin
}
const service = axios.create({
  baseURL: baseUrl + urlPrefix, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 30000 // request timeout
})

service.interceptors.request.use(
  config => {
    config.headers.common['Authorization'] = 'Bearer ' + getOauth2Token()
    config.headers.common['X-Language'] = langMap[getLang()] || 'zh-CN'
    if (config.method === 'get') { // 解决IE11 GET请求缓存问题
      config.params = config.params || {}
      config.params.time = (Date.parse(new Date()) / 1000) + '' + getRandomSixDigit()
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
    return response
  },
  async error => {
    if (!navigator.onLine) {
      toast('warning', i18n.t('message.noNetwork'))
      return Promise.reject(error)
    }
    if (error.response.status === 401) {
      if (store.getters.microWidgetProps) {

        const newToken = await refreshToken()

        if (null !== newToken) {
          if (!store.getters.microWidgetProps) {
            XEUtils.cookie('client.oauth2_token', newToken)
          }
          error.config.headers['Authorization'] = 'Bearer ' + newToken
          // window.location.reload()
          return service(error.config)
        }
      } else {
        toast('warning', i18n.t('message.authorized'))
      }
      if (process.env.VUE_APP_ENV === 'anyshare' && store.getters.microWidgetProps) {
        store.getters.microWidgetProps.token.onTokenExpired()
      }

    } else if (error.response.status === 500) {
      toast('warning', i18n.t('message.serverError'))
    } else if (error.response.status === 503) {
      toast('warning', i18n.t('message.serviceUnavailable'))
    }
    return Promise.reject(error)
  }
)

export function getOauth2Token() {
  let token = XEUtils.cookie('client.oauth2_token')
  if (store.getters.microWidgetProps) {
    return store.getters.microWidgetProps.token.getToken.access_token
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
      // 跳转登录页
      store.getters.microWidgetProps.token.onTokenExpired()
      resolve(access_token)
      Promise.reject(error)
    })
  })
}

function getRandomSixDigit() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += parseInt(Math.random() * 10)
  }
  return code
}

export default service
