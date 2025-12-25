<!-- 共享流程集成 -->
<template>
  <div id="app">
    <realname v-if="proc_type === 'doc_realname_share'" :proc_type="proc_type" :status="shareVal.status" />
    <anonymity v-if="proc_type === 'doc_anonymity_share'" :proc_type="proc_type" :status="shareVal.status" />
  </div>
</template>

<script>
import realname from './realname'
import anonymity from './anonymity'
export default {
  name: 'Integration',
  components: { realname, anonymity },
  data() {
    return {
      proc_type: ''
    }
  },
  computed: {
    shareVal() {
      return this.$store.state.app.share
    }
  },
  watch: {
    shareVal(val) {
      this.status = val.status
    }
  },
  created() {
    this.proc_type = this.shareVal.shareType === 1 && 'doc_anonymity_share' || 'doc_realname_share'
  }
}
</script>

<style scoped>

</style>
