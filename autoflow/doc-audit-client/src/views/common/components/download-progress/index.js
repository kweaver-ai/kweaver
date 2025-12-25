import DownloadProgress from './src/index'
DownloadProgress.install = function(Vue) {
  Vue.component(DownloadProgress.name, DownloadProgress)
}

// 默认导出组件
export default DownloadProgress
