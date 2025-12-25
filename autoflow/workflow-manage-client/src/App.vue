<template>
  <div
    id="app"
    name="workflow-manage-client-entrance"
    :class="isAdaptToElectron === true ? 'workflow-adapt-header' : ''"
    v-if="showApp"
  >
    <router-view />
    <div id="workflow-client-ui-content"></div>
  </div>
</template>

<script>
import { loadingCss } from '@/utils/dynamicLoading'
import { getSecretInfo } from '@/api/processDefinition'
import store from './store'
import XEUtils from 'xe-utils'
export default {
  name: 'App',
  data() {
    return {
      showApp: true
    }
  },
  computed: {
    timestampVal() {
      return this.$store.state.app.timestamp
    },
    isAdaptToElectron() {
      return this.$store.state.app.adaptToElectron
    }
  },
  watch: {
    timestampVal: {
      handler() {
        this.reloadApp()
      },
      immediate: true
    }
  },
  mounted() {
    this.getSecretConfig()
  },
  methods: {
    chooseCss() {
      // 动态加载 CSS 文件
      this.$nextTick(() => {
        // 适配URL前缀
        let prefix = XEUtils.cookie.get('X-Forwarded-Prefix') || store?.getters?.microWidgetProps?.config?.systemInfo?.as_access_prefix
        if (!prefix || prefix === '/') {
          prefix = ''
        }
        loadingCss(
          prefix + process.env.VUE_APP_CONTEXT_PATH + '/theme-chalk/index.css'
        )
      })
    },
    reloadApp() {
      const _this = this
      _this.showApp = false
      _this.$nextTick(() => {
        _this.showApp = true
        if (window.__POWERED_BY_QIANKUN__) {
          _this.chooseCss()
        }
      })
    },
    getSecretConfig() {
      return new Promise((resolve, reject) => {
        getSecretInfo()
          .then((res) => {
            store.dispatch('app/setSecret', res)
            resolve(res)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
}
</script>
<style lang="css">
@import '../public/css/process-style.css';
@import '../public/css/common.css';
@import '../public/css/iconfont.css';
</style>
