import StepProgress from './src/index'
StepProgress.install = function(Vue) {
  Vue.component(StepProgress.name, StepProgress)
}

// 默认导出组件
export default StepProgress
