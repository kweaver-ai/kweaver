import Vue from 'vue'
const MyDirective = {}
export default MyDirective.install = function (vue, options) {
  Vue.directive('loadmore', {
    bind(el, binding) {
      const selectDom = el.querySelector('.el-scrollbar .el-scrollbar__wrap')
      selectDom.addEventListener('scroll', function () {
        const isEnd = this.scrollHeight - this.scrollTop <= this.clientHeight
        if (isEnd) {
          binding.value()
        }
      })
    }
  })

  Vue.directive('loadmoresss', {
    bind (el, binding) {
      const SELECTWRAP_DOM = el.querySelector('.el-select-dropdown .el-scrollbar .el-select-dropdown__wrap .el-scrollbar__view')
      SELECTWRAP_DOM.addEventListener('scroll', function () {
        const CONDITION = this.scrollHeight - this.scrollTop <= this.clientHeight
        if (CONDITION) {
          binding.value()
        }
      })
    }
  })
}
