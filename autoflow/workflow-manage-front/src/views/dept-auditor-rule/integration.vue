<!-- 部门审核员规则集成 -->
<template>
  <div id="app">
    <index/>
  </div>
</template>

<script>
import index from './index'
import { tenantId } from '@/utils/config'
export default {
  name: 'Integration',
  components: { index },
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
