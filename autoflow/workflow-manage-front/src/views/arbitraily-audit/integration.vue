<!-- 任意审核流程集成-->
<template>
  <div id="app">
    <div class="fa-preview-box" v-if="visit === 'preview'">
      <div :style="boxStyle" v-if="visit === 'preview'">
        <processModel
          :tenant_id="tenant_id"
          :proc_def_key="process_def_key"
          :proc_def_id="process_def_id"
          :proc_type="'process_view'"
          :visit="visit"
        />
      </div>
    </div>
    <el-dialog v-else :visible="true" :close-on-click-modal="false" :modal="false" :show-close="false" fullscreen custom-class="no-header el-dialog-white">
      <div element-loading-text="">
        <processModel is_change.sync="false" :tenant_id="tenant_id" :proc_def_key="process_def_key" :proc_def_id="process_def_id" :visit="visit" :proc_type="process_type"
          isArbitraily="true"
          @close="closeDialog" 
          @refresh="fetchData" 
          @setCurrentStep="setCurrentStep"   />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import processModel from 'ebpm-process-modeler-front'
import { tenantId } from '@/utils/config'
export default {
  name: 'Integration',
  components: { processModel },
  data() {
    return {
      tenant_id: tenantId,
      process_def_key:'',
      process_def_id:'',
      process_type:'',
      visit:'new'
    }
  },
  computed: {
    arbitrailyVal() {
      return this.$store.state.app.arbitraily
    },
    previewBox() {
      return this.$store.state.app.previewBox
    },
    boxStyle(){
      return {
        width: '590px',
        height: this.previewBox.height + 'px',
        background: this.previewBox.background
      }
    }
  },
  created() {
    if(JSON.stringify(this.arbitrailyVal) !== '{}'){
      this.visit = this.arbitrailyVal.visit
      if(this.arbitrailyVal.visit === 'edit') {
        this.visit = 'update'
      }
      this.process_type = this.arbitrailyVal.process_type
      this.process_def_id = this.arbitrailyVal.process_def_id
      this.process_def_key = this.arbitrailyVal.process_def_key
    }
  },
  methods:{
    closeDialog(){
    },
    setCurrentStep(){
    },
    fetchData(){
    }
  }
}
</script>

<style>
.fa-preview-box{
  background:#f5f5f5;
  position: relative;
}
.fa-preview-box  .zoom{
  background:#f5f5f5;
  top: auto;
  position: absolute;
  bottom: 0;
  }
</style>
