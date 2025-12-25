import Vue from 'vue'
import SvgIcon from '@/components/SvgIcon'

// icons图标自动加载
const req = require.context('./svg', false, /\.svg$/)
req.keys().map(req)

// 全局注册svg-icon组件
Vue.component('svg-icon', SvgIcon)
