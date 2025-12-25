<!-- 同步流程集成-->
<template>
  <div id="app">
    <el-dialog :visible="true" :close-on-click-modal="false" :modal="false" :show-close="false" fullscreen custom-class="no-header el-dialog-white" v-if="visit === 'new' || visit === 'edit'">
      <div element-loading-text="">
        <processModel is_change.sync="false" :tenant_id="tenant_id" :proc_def_key="process_def_key" :proc_def_id="process_def_id" :visit="visit" :proc_type="proc_type" @close="closeDialog" @refresh="fetchData" @setCurrentStep="setCurrentStep" />
      </div>
    </el-dialog>
    <div class="fa-preview-box">
      <div style="background:#f5f5f5;width: 590px;height: 520px" v-if="visit === 'preview'">
        <processModel
          :tenant_id="tenant_id"
          :proc_def_key="process_def_key"
          :proc_def_id="process_def_id"
          :proc_type="'process_view'"
          :visit="visit"
        />
      </div>
    </div>
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
      proc_type:'doc_sync',
      visit:'new'
    }
  },
  computed: {
    syncVal() {
      return this.$store.state.app.sync
    }
  },
  watch: {
    shareVal(val) {
      this.status = val.status
    }
  },
  created() {
    if(JSON.stringify(this.shareVal) !== '{}'){
      this.visit = this.syncVal.visit
      this.process_def_id = this.syncVal.process_def_id
      this.process_def_key = this.syncVal.process_def_key
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
