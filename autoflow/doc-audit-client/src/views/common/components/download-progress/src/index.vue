<template>
  <div>
    <el-dialog style="top: 20%" title="" :visible="visible" :close-on-click-modal="false" :append-to-body="true" custom-class="new-dialog progressbar-dialog" width="628px" :show-close="false">
      <div class="block">
        <div style="font-size: 16px;color: rgb(0, 0, 0);margin: 0px 0px 0 0;font-weight: bold;">正在下载：{{ progress }}%</div>
        <div style="display: block;color: #333;font-size: 14px;margin: 0 0 8px 0;">正在下载文件夹：{{ docName }}</div>
        <div><el-progress :stroke-width="15" :percentage="progress" color="#7897d2" :show-text="false"></el-progress></div>
        <div style="text-align: left">
          <span style="color: red;display: block;">注：等待过程中，切勿关闭此页面，关闭后任务会中断。</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: 'download-progress',
  props: {
    percentage: {
      type: Number,
      default: 0
    },
    docName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      visible: false,
      progress: 0
    }
  },
  created(){
    this.progress = 0
  },
  watch:{
    percentage: {
      immediate: true,
      deep: true,
      handler(val) {
        this.progress = val
        if(val === 100){
          setTimeout(() => {
            this.visible = false
            this.progress = 0
          }, 500)
        }
      }
    }
  },
  methods:{
    async openSelector() {
      this.visible = true
    }
  }
}
</script>
<style>
</style>
