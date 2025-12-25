<template>
  <div id="app" name="doc-audit-client-entrance" style="margin: 32px !important;" :class="platform">
    <router-view/>
    <div id="element-ui-mount-content"></div>
  </div>
</template>
<script>
import { loadingCss } from '@/utils/dynamicLoading'
import { secretInfo } from '@/api/workflow'
import store from './store'
import XEUtils from 'xe-utils'
export default {
  name: 'App',
  mounted(){
    // 判断当前登录系统是移动端还是pc端
    if (this._isMobile()) {
      this.$router.replace('/moveIndex')
    }
    if(window.__POWERED_BY_QIANKUN__){
      this.chooseCss()
      const devConfig = sessionStorage.getItem("anyshare.audit.devTool.config")
      if(devConfig === null) {
        sessionStorage.setItem("anyshare.audit.devTool.config",undefined)
      }
    }
    this.getdd()
  },
  computed:{
    platform() {
      const val = this.$store.state.app.microWidgetProps
      if(!val) {
        return ""
      }
      if(val.config.systemInfo.isInElectronTab) {
        return "electron"
      }else if(val.config.systemInfo.platform === "browser") {
        return "web"
      }
      return "web"
    }
  },
  methods: {
    chooseCss(){
      // 适配URL前缀
      let urlPrefix = XEUtils.cookie('X-Forwarded-Prefix')
      if(!urlPrefix || urlPrefix === '/' || urlPrefix === 'undefined') {
        urlPrefix = ''
      }
      // 动态加载 CSS 文件
      loadingCss(urlPrefix + process.env.VUE_APP_CONTEXT_PATH + '/theme-chalk/index.css')
    },
    // App.vue
    _isMobile() {
      let flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
      return flag
    },
    getdd(){
      return new Promise((resolve, reject) => {
        secretInfo().then(res => {
          store.dispatch('app/setSecret', res.data)
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    }
  }
}
</script>
<style lang="css">
  @import "../public/fonts/iconfont.css";
  @import "../public/css/rzsj_style.css";
</style>
