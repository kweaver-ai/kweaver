<!-- 爱数插件化集成入口 -->
<template>
  <div>
    <component :is="dashboard" />
  </div>
</template>

<script>
import { getUserInfo } from '@/api/efast'
import { setTenantId } from '@/utils/config'
export default {
  name: 'index',
  data () {
    return {
      dashboard: null,
      type: null
    }
  },
  computed: {
    plugrouterVal() {
      return this.$store.state.app.plugrouter
    },
    arbitrailyAuditPreviewVal() {
      return this.$store.state.app.arbitrailyAuditPreview
    },
    arbitrailyAuditTemplateVal() {
      return this.$store.state.app.arbitrailyAuditTemplate
    }
  },
  created () {
    if(!['', 'null', 'undefined'].includes(this.plugrouterVal + '')){
      this.type = this.plugrouterVal === 'processCenter' && 'process-center' || this.plugrouterVal === 'deptAuditorRule' && 'dept-auditor-rule'
    }else if(JSON.stringify(this.arbitrailyAuditPreviewVal) !== '{}'){
      this.type =  'arbitraily-audit-preview'
    }else{
      this.type = JSON.stringify(this.arbitrailyAuditTemplateVal) !== '{}' && 'arbitraily-audit-template'
    }
  },
  mounted () {
    this.initTenantId()
  },
  methods: {
    loader () {
      switch (this.type) {
      case 'arbitraily-audit-preview':
        this.dashboard = () => import('../arbitraily-audit-preview/integration.vue')
        break
      case 'arbitraily-audit-template':
        this.dashboard = () => import('../arbitraily-audit-template/integration.vue')
        break
      case 'dept-auditor-rule':
        this.dashboard = () => import('../dept-auditor-rule/integration.vue')
        break
      default:
        this.dashboard = () => import('../process-center/index.vue')
      }
    },
    initTenantId () {
      getUserInfo().then((res) => {
        setTenantId(res.userid)
        this.loader()
      }).catch(() => { })
    }
  }
}
</script>
