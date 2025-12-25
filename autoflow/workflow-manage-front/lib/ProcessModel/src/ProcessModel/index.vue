<template>
  <div class="containers" ref="content" :style="{background: visit === 'preview' ? $store.state.app.previewBox.background : '' }">
    <div class="topButtonGroup group-card" v-if="visit !== 'preview'">
      <div class="cell-right"></div>
    </div>
    <processDefinition
      v-on="$listeners"
      v-bind="$attrs"
      @change="hasChange"
      @currentStep="hasCurrentStep"
      :tenant_id="tenant_id"
      :proc_def_key="proc_def_key"
      :proc_type="proc_type"
      :processName="processName"
      :visit="visit"
      :multiChoiceSearch="multiChoiceSearch"
      :allowAddSign="allowAddSign"
      :allowDynamicAuditor="allowDynamicAuditor"
      :allowExecutingAuditor="allowExecutingAuditor"
      :allowUserGroup="allowUserGroup"
      :externalUserSelect="externalUserSelect"
      :isTemplate="isTemplate"
      :isTemplateView="isTemplateView"
      :isArbitraily="isArbitraily"
    >
    </processDefinition>
  </div>
</template>

<script>
import processDefinition from './views/processDefinition'
export default {
  name: 'ProcessModel',
  components: { processDefinition },
  props: {
    tenant_id: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    },
    proc_type: {
      type: String,
      required: true
    },
    processName: {
      type: String
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
      type:Boolean,
      required: false,
      default: false
    },
    isArbitraily:{
      type:Boolean,
      required: false,
      default: false
    }
  },
  methods: {
    postClose() {
      this.$emit('close')
    },
    hasChange(value) {
      this.$emit('update:is_change', value)
    },
    hasCurrentStep(value) {
      this.$emit('setCurrentStep', value)
    }
  },
}
</script>

<style lang="scss" scoped>
@import '~ebpm-process-modeler-front/public/css/common.css';
@import '~ebpm-process-modeler-front/public/fonts/iconfont.css';
.topButtonGroup {
  text-align: left;
  width: 100%;
  background: #f3f5fb;
  color: #333;
  padding: 10px;
  height: 48px;
  border: 1px solid #e6e9ed;
}
.containers {
  position: absolute;
  background-color: #ffffff;
  /**
  width: 99%;
  height: calc(100% - 16px);
  **/
  width: 100%;
  height: 100%;
}
</style>
