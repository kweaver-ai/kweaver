import StepSelector from './src/index'
StepSelector.install = function(Vue) {
  Vue.component(StepSelector.name, StepSelector)
}

// 默认导出组件
export default StepSelector
