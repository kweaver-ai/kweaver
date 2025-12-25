<!-- 爱数插件化集成入口 -->
<template>
  <div>
    <component :is="dashboard"/>
  </div>
</template>

<script>
export default {
  name: 'index',
  data () {
    return {
      dashboard: null,
      type: ''
    }
  },
  computed: {
    shareVal() {
      return this.$store.state.app.share
    },
    syncVal() {
      return this.$store.state.app.sync
    },
    arbitrailyVal() {
      return this.$store.state.app.arbitraily
    },
    plugrouterVal() {
      return this.$store.state.app.plugrouter
    }
  },
  created(){
    this.type = JSON.stringify(this.shareVal) !== '{}' && 'doc-share-audit' || JSON.stringify(this.syncVal) !== '{}' && 'doc-sync-audit' || JSON.stringify(this.arbitrailyVal) !== '{}' && 'arbitraily'
    if(!['', 'null', 'undefined'].includes(this.plugrouterVal + '')){
      this.type = this.plugrouterVal === 'processCenter' && 'process-center' || this.plugrouterVal === 'deptAuditorRule' && 'dept-auditor-rule'
    }
  },
  mounted () {
    this.loader()
  },
  methods:{
    loader(){
      switch(this.type) {
      case 'doc-share-audit':
        this.dashboard = () => import('../doc-share-audit/integration.vue')
        break
      case 'doc-sync-audit':
        this.dashboard = () => import('../doc-sync-audit/integration.vue')
        break
      case 'arbitraily':
        this.dashboard = () => import('../arbitraily-audit/integration.vue')
        break
      case 'dept-auditor-rule':
        this.dashboard = () => import('../dept-auditor-rule/integration.vue')
        break
      default:
        this.dashboard = () => import('../process-center/index.vue')
      }
    }
  }
}
</script>
