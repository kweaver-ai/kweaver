<template>
  <div id="app">
    <Audit></Audit>
  </div>
</template>
<script src="../public/AnyShare/js/anyshare.sdk.js"></script>
<script>
  import Vue from 'vue'
  import Audit from './views/audit/index.vue'
  import i18n from './assets/lang'
  import store from './store'
  import 'element-ui/lib/theme-chalk/index.css'
  import XEUtils from 'xe-utils'
  import VXEUtils from 'vxe-utils'
  Vue.use(VXEUtils, XEUtils)
  Vue.prototype.$store = store
  Vue.prototype.anyshareUrl = process.env.VUE_APP_ANYSHARE_URL
  if (process.env.VUE_APP_ENV === 'anyshare') { 
    const parseUrl = XEUtils.parseUrl(window.location.href)
    Vue.prototype.anyshareUrl = parseUrl.protocol + '//' + parseUrl.host
  }
  export default {
    i18n,
    name: 'App',
    components: { Audit }
  }
</script>
<style lang="css">
  @import "../public/fonts/iconfont.css";
  @import "../public/css/rzsj_style.css";
  @import "../public/AnyShare/css/anyshare.sdk.css";
</style>
