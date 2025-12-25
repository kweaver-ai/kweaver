<!-- 爱数插件化集成入口 -->
<template>
  <div class="processTemplate">
    <processModel
      :is_change.sync="bpmnIsChange"
      :tenant_id="tenant_id"
      :proc_def_key="process_def_key"
      :proc_def_id="process_def_id"
      :proc_type="process_type"
      :visit="visit"
    />
  </div>
</template>

<script>
import processModel from 'ebpm-process-modeler-client'
import { tenantId } from '@/utils/config'
export default {
  name: 'ArbitrailyAuditTemplateIntegration',
  components: { processModel },
  data () {
    return {
      tenant_id: tenantId,// 创建人ID
      process_def_key: '',// 流程定义key
      process_def_id: '',// 流程定义ID
      process_type:'',
      visit: 'new',
      bpmnIsChange:false
    }
  },
  computed: {
    arbitrailyAuditTemplateVal () {
      return this.$store.state.app.arbitrailyAuditTemplate
    }
  },
  created () {
    if (JSON.stringify(this.arbitrailyAuditTemplateVal) !== '{}') {
      this.visit = this.arbitrailyAuditTemplateVal.visit
      if(this.arbitrailyAuditTemplateVal.process_data){
        this.visit = 'update'
      }
      this.process_def_id = this.arbitrailyAuditTemplateVal.process_def_id
      this.process_def_key = this.arbitrailyAuditTemplateVal.process_def_key
      this.process_type = this.arbitrailyAuditTemplateVal.process_type
    }
  },
  methods: {
    closeDialog () {
    },
    setCurrentStep () {
    },
    fetchData () {
    }
  }
}
</script>
