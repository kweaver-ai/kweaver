import UserSelector from './src/index'
UserSelector.install = function (Vue) {
  Vue.component(UserSelector.name, UserSelector)
}

// 默认导出组件
export default UserSelector
