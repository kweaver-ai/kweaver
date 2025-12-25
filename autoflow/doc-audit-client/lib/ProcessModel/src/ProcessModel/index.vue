<template>
  <div class="containers" ref="content">
    <div class="topButtonGroup group-card">
      <div class="cell-title">{{ ["null", "", "undefined"].includes(proc_def_key + "") ? $t('modeler.newProcess') : $t('modeler.updateProcess') }}</div>
      <div class="cell-right">
        <el-button type="text" @click="postClose()">
          <i class="el-icon-close" />
        </el-button>
      </div>
    </div>
    <processDefinition v-on="$listeners" :app_id="app_id" :is_change="is_change" v-bind="$attrs" @change="hasChange" :proc_def_key="proc_def_key"></processDefinition>
  </div>
</template>

<script>
import processDefinition from "./views/processDefinition";
export default {
  name: "ProcessModel",
  components: { processDefinition },
  props: {
    app_id: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    },
    is_change: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    postClose() {
      this.$emit("close");
      console.log("close");
    },
    hasChange(value) {
      this.$emit("update:is_change", value);
    }
  }
};
</script>

<style lang="scss" scoped>
@import '~ebpm-process-modeler-client/public/css/common.css';
@import '~ebpm-process-modeler-client/public/fonts/iconfont.css';
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
  width: 99%;
  height: calc(100% - 16px);
}
</style>
