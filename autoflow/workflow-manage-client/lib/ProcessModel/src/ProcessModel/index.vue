<template>
  <div class="containers" ref="content" :style="{background: visit === 'preview' ? '#f5f5f5' : '' }" style="height: 100%">
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
       :visible="visible"
       :isTemplate="isTemplate"
       :multiChoiceSearch="multiChoiceSearch"
    />
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
    visible:{
      type:Boolean
    },
    isTemplate:{
      type:Boolean
    }
  },
  methods: {
    postClose () {
      this.$emit('close')
    },
    hasChange (value) {
      this.$emit('update:is_change', value)
    },
    hasCurrentStep (value) {
      this.$emit('setCurrentStep', value)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~ebpm-process-modeler-client/public/css/common.css";
@import "~ebpm-process-modeler-client/public/fonts/iconfont.css";
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
  /*background-color: #ffffff;*/
  width: 99%;
  height: calc(100% - 16px);
}
</style>
