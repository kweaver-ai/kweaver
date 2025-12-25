import ShareSelector from './src/index'
ShareSelector.install = function(Vue) {
  Vue.component(ShareSelector.name, ShareSelector)
}

// 默认导出组件
export default ShareSelector
