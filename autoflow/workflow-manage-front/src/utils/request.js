import store from '@/store'
import { getToken, getLang } from '@/utils/auth'
import axios from 'axios'
import { Message } from 'element-ui'
import i18n from '@/lang'
import XEUtils from 'xe-utils'
import { setToken } from '@/utils/auth'
const qs = require('qs')

const langMap = {
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  'en-us': 'en-US',
  'vi-vn': 'en-US'
}
const parseUrl = XEUtils.parseUrl(window.location.href)
let baseUrl = ''
if (process.env.VUE_APP_ENV === 'development') {
  baseUrl = process.env.VUE_APP_AS_PROXYURL
}
if (process.env.VUE_APP_ENV === 'anyshare') { // 如果是
  baseUrl = parseUrl.protocol + '//' + parseUrl.hostname
}

// 适配URL前缀
let prefix = XEUtils.cookie.get('X-Forwarded-Prefix')
if (!prefix || prefix === '/' || prefix === 'undefined') {
  prefix = ''
}
// create an axios instance
const service = axios.create({
  baseURL: baseUrl + prefix,
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 30000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    if (config.method === 'get') {
      // 如果是get请求，且params是数组类型如arr=[1,2]，则转换成arr=1&arr=2
      config.paramsSerializer = function (params) {
        return qs.stringify(params, { arrayFormat: 'repeat' })
      }
    }
    if (process.env.VUE_APP_ENV === 'anyshare') {
      const publicPort = store.getters.port
      if (publicPort !== '' && publicPort !== undefined) {
        config.baseURL = baseUrl + ':' + publicPort + prefix
      }
    }
    // do something before request is sent
    // let each request carry token
    // ['X-Token'] is a custom headers key
    // please modify it according to the actual situation
    config.headers['Authorization'] = 'Bearer ' + getToken()
    config.headers['X-Language'] = langMap[getLang()] || 'zh-CN'
    // Fix IE11 browser GET request mode cache clearance issues
    if (config.method === 'get') { // 判断get请求
      config.params = config.params || {}
      config.params.t = Date.parse(new Date()) / 1000
    }
    return config
  },
  error => {
    // do something with request error
    return Promise.reject(error)
  }
)
/** 避免同时多次refreshToken */
let refreshPromise = null

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data
    if (res.code) {
      Message({
        message: res.message,
        type: 'error'
      })
      return Promise.reject(res.message || 'Error')
    }
    return res
  },
  async error => {
    if (error.code === 'ECONNABORTED') {
      Message({
        message: '接口超时未响应',
        duration: 1000,
        forbidClick: true
      })
      return Promise.reject(error)
    }
    if (error.response.status === 401) {
      const context = store.getters.context
      if (context && JSON.stringify(context) !== '{}') {
        if (typeof context.refreshToken === 'function') {
          try {
            const oldToken = context.getToken()
            if (!refreshPromise) {
              refreshPromise = context.refreshToken()
            }
            await refreshPromise
            const newToken = context.getToken()
            // eslint-disable-next-line no-console
            console.log('refreshToken', oldToken !== newToken)
            if (oldToken !== newToken) {
              setToken(newToken)
              error.config.headers['Authorization'] = 'Bearer ' + newToken
              return service(error.config)
            } else {
              context.onTokenExpired()
            }
          } catch (_) {
            context.onTokenExpired()
          } finally {
            refreshPromise = null
          }
        } else {
          context.onTokenExpired()
        }
      } else {
        Message({
          message: '您的登录已失效',
          duration: 1000,
          forbidClick: true
        })
      }
    } else if (error.response.status === 503) {
      Message({
        message: i18n.tc('message.serviceUnavailable'),
        duration: 1000,
        forbidClick: true,
        type: 'warning'
      })
    }
    return Promise.reject(error)
  }
)

export default service
