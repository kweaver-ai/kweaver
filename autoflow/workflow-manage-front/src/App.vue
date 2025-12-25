<template>
  <div id="app">
    <router-view />
    <div id="element-ui-mount-content"></div>
  </div>
</template>

<script>
import '../public/css/process-style.css'
import '../public/css/common.css'
import '../public/css/iconfont.css'
import { secretInfo } from '@/api/processDefinition'
import store from './store'
export default {
  name: 'App',
  data() {
    return {}
  },
  created(){
    this.getdd()
  },
  methods:{
    getdd(){
      return new Promise((resolve, reject) => {
        secretInfo().then(res => {
          store.dispatch('app/setSecret', res)
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    }
  }
}
</script>
