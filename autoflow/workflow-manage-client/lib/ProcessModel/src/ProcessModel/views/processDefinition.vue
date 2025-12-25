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
      :visible="visible"
      :isTemplate="isTemplate"
      :multiChoiceSearch="multiChoiceSearch"
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
    multiChoiceSearch:{
      type: Object
    },
    visible:{
      type: Boolean
    },//  是否展示流程详情页面使用此模板按钮
    isTemplate:{
      type: Boolean
    }
  },
  data() {
    return {
      dashboard: null,
      process_obj: {},
      isShow:false,
      type_disabled: false,
      loading: false,
      old_name:''
    }
  },
  async created() {
    this.loader()
  },
  methods: {
    loader(){
      switch(this.proc_type) {
      case 'process_view':
        this.dashboard = () => import('./process-center/processView.vue')
        break
      default:
        this.dashboard = () => import('./process-center/processDefinition.vue')
      }
      this.reload()
    },
    reload(){
      this.isShow = false
      this.$nextTick(() => {
        this.isShow = true
      })
    },
    postClose() {
      this.$emit('close')
    },
    /**
     * @description 使用模板
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    useTheTemplate(){
      this.$emit('output')
    }
  }
}
</script>
