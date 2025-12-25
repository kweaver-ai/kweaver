<!-- 爱数插件化集成入口 -->
<template>
  <div id="app">
    <div class="fa-preview-box">
      <div style="background:#f5f5f5;width: 590px;height: 520px">
        <processModel :tenant_id="tenant_id" :proc_def_key="process_def_key" :proc_def_id="process_def_id" :proc_type="'process_view'" />
      </div>
    </div>
  </div>
</template>

<script>
import processModel from 'ebpm-process-modeler-client'
import {tenantId} from '@/utils/config'

export default {
  name: 'ArbitrailyAuditPreviewIntegration',
  components: { processModel },
  data () {
    return {
      tenant_id: tenantId,// 创建人ID
      process_def_key: '',// 流程定义key
      process_def_id: ''// 流程定义ID
    }
  },
  computed: {
    arbitrailyAuditPreviewVal () {
      return this.$store.state.app.arbitrailyAuditPreview
    }
  },
  created () {
    if (JSON.stringify(this.arbitrailyAuditPreviewVal) !== '{}') {
      this.process_def_id = this.arbitrailyAuditPreviewVal.process_def_id
      this.process_def_key = this.arbitrailyAuditPreviewVal.process_def_key
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

<style>
.fa-preview-box {
  background: #f5f5f5;
  position: relative;
}
.fa-preview-box .zoom {
  background: #f5f5f5;
  top: auto;
  position: absolute;
  bottom: 0;
}
</style>
