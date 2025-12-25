<!-- 流程预览页面 -->
<template>
    <div :style="boxStyle">
      <viewSetting
        v-if="!loading"
        ref="viewSetting"
        :tenant_id="tenant_id"
        :process_obj.sync="process_obj"
        :proc_def_key="proc_def_key"
        :proc_type="proc_type"
        :isTemplateView="isTemplateView"
        @close="close"
        @output="useTheTemplate"
        :multiChoiceSearch="multiChoiceSearch">
      </viewSetting>
    </div>
</template>

<script>
import viewSetting from './viewSetting'
import { procDefInfo } from '@/api/processDefinition'
export default {
  name: 'SyncDefinition',
  components: { viewSetting },
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
    isTemplateView:{
      type:Boolean
    },
    multiChoiceSearch:{
      type: Object
    }
  },
  data() {
    return {
      process_obj: {},
      loading: true
    }
  },
  computed :{
    previewBox() {
      return this.$store.state.app.previewBox
    },
    boxStyle(){
      return {
        height: (this.previewBox.height - 40) + 'px',
        background: this.previewBox.background,
      }
    }
  },
  async created() {
    this.loading = true
    await this.init()
    this.loading = false
  },
  methods: {
    /**
       * 初始化
       */
    async init() {
      this.process_obj = await this.openProcessInit()
    },
    /**
       * 打开流程初始化
       */
    openProcessInit() {
      const _this = this
      if (['', 'null', 'undefined'].includes(_this.proc_def_key + '')) {
        return { tenant_id: _this.tenant_id, type: 'doc_sync', type_name: _this.$i18n.tc('modeler.procType.DOC_SYNC') }
      }
      return new Promise((resolve, reject) => {
        procDefInfo(_this.proc_def_id)
          .then(res => {
            const result = res
            result.tenant_id = _this.tenant_id
            resolve(result)
          }).catch(error => {
            _this.$message.warning(error.getMessage)
            reject(error)
          })
      })
    },
    /**
     * 使用此模板
     */
    useTheTemplate(){
      this.$emit('output')
    },
    /**
     * 关闭弹窗
     */
    close(){
      this.$emit('close')
    }
  }
}
</script>
