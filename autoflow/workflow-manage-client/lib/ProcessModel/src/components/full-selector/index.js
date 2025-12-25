import FullSelector from './src/index'
FullSelector.install = function(Vue) {
  Vue.component(FullSelector.name, FullSelector)
}

// 默认导出组件
export default FullSelector
