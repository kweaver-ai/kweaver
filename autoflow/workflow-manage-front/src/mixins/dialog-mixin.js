export default {
  methods: {
    computedDialogTop(){
      const dragDom = this.$el.querySelector('.el-dialog')
      this.$nextTick(function () {
        if(window.innerHeight < 600){
          dragDom.style.top = '-70px'
        }
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
          if(window.innerHeight < 600){
            dragDom.style.top = '-70px'
          } else {
            dragDom.style.top = ''
          }
        })
      })
    }
  }
}
