<!-- 实名共享首页 -->
<template>
  <div class="audit-subf">
    <div :class="['audit-text no-padding', status?'':'disabled-box']">
      <process-list ref="process" :proc_type="proc_type" />
    </div>
  </div>
</template>

<script>

import ProcessList from './process-list'
export default {
  name: 'Integration',
  components: { ProcessList },
  props: {
    proc_type: {
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      required: true
    }
  },
  watch: {
    status(val) {
      this.$refs.process.disabled = !val
    }
  },
  mounted() {
    this.$refs.process.disabled = !this.status
  },
  methods: {
  }
}
</script>
