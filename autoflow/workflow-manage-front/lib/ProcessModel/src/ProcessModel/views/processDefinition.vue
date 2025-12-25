<!-- 流程建模，流程定义首页 -->
<template>
  <div>
    <component
      v-if="isShow"
      :is="dashboard"
      :tenant_id="tenant_id"
      :proc_def_key="proc_def_key"
      :proc_def_id="proc_def_id"
      :proc_type="proc_type"
      :proc_copy_name="proc_copy_name"
      :visit="visit"
      :multiChoiceSearch="multiChoiceSearch"
      :allowAddSign="allowAddSign"
      :allowDynamicAuditor="allowDynamicAuditor"
      :allowExecutingAuditor="allowExecutingAuditor"
      :allowUserGroup="allowUserGroup"
      :externalUserSelect="externalUserSelect"
      :isTemplate="isTemplate"
      :isTemplateView="isTemplateView"
      @close="postClose"
      @output="useTheTemplate"
    />
  </div>
</template>

<script>
export default {
  name: 'ProcessDefinition',
  props: {
    tenant_id: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    },
    proc_def_id: {
      type: String,
      required: true
    },
    proc_type: {
      type: String,
      required: true
    },
    proc_copy_name: {
      type: String,
      required: false
    },
    visit: {
      type: String
    },
    multiChoiceSearch: {
      type: Object
    },
    allowAddSign: {
      type: Boolean,
      required: false,
      default: true
    },
    allowDynamicAuditor: {
      type: Boolean,
      require: false,
      default: true
    },
    allowExecutingAuditor: {
      type: Boolean,
      required: false,
      default: false
    },
    allowUserGroup: {
      type: Boolean,
      required: false,
      default: true
    },
    externalUserSelect: {
      type: Function,
      required: false
    },
    isTemplateView:{
      type:Boolean
    },
    isTemplate:{
      type: Boolean
    },
    isArbitraily:{
      type:Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      dashboard: null,
      process_obj: {},
      isShow: false,
      type_disabled: false,
      loading: false,
      old_name: ''
    }
  },
  async created() {
    this.loader()
  },
  methods: {
    loader(){
      switch(this.proc_type) {
      case !this.isArbitraily && 'doc_realname_share':
      case !this.isArbitraily && 'doc_anonymity_share':
        this.dashboard = () => import('./doc-share/shareDefinition.vue')
        break
      case 'process_center':
        this.dashboard = () => import('./process-center/processDefinition.vue')
        break
      case 'process_view':
        this.dashboard = () => import('./process-center/processView.vue')
        break
      default:
        this.dashboard = () => import('./arbitraily/arbitrailyDefinition.vue')
      }
      this.reload()
    },
    reload() {
      this.isShow = false
      this.$nextTick(() => {
        this.isShow = true
      })
    },
    postClose() {
      this.$emit('close')
    },
    useTheTemplate(){
      this.$emit('output')
    }
  }
}
</script>
