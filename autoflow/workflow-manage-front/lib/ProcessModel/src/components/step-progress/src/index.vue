<template>
  <div style="padding-bottom: 200px">
    <el-dialog
      style="top: 20%"
      :title="$t('stepProgress.createStrategy')"
      :visible="visible"
      :close-on-click-modal="false"
      :append-to-body="true"
      v-dialogDrag
      custom-class="new-dialog"
      width="628px"
      :show-close="false">
      <div class="block">
        <div style="font-size: 14px;color: #000;margin: 0 0 12px 0;">{{$t('stepProgress.createStrategyTip')}}</div>
        <div><el-progress :stroke-width="15" :percentage="progress" color="rgb(154,187,239)"></el-progress></div>
        <div style="text-align: left">
          <span style="color: red;display: block;margin: 50px 0 0 0;">{{$t('stepProgress.createStrategyNote')}}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: 'step-progress',
  props: {
    percentage: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      visible: false,
      progress: 0
    }
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
