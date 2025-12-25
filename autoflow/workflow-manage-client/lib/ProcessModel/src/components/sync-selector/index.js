import SyncSelector from './src/index'
SyncSelector.install = function(Vue) {
  Vue.component(SyncSelector.name, SyncSelector)
}

// 默认导出组件
export default SyncSelector
