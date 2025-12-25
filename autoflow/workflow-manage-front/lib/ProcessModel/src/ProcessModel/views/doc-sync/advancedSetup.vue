<!-- 同步流程，流程高级设置页面（同流程中心一致，这里为了以后可扩展） -->
<template>
  <div class="gjsz-box">
    <div class="padding-bottom-10">
      <el-form label-position="left" hide-requied-aterisk  label-width="0px" size="small">
        <el-form-item>
          <label class="font-bold">{{ $t('deptAuditorRule.advancedLabel1') }}</label>
          <div>
            <el-radio-group v-model="repeatAuditRule" @change="repeatAuditRuleChange">
              <p><el-radio label="once">{{ $t('deptAuditorRule.advancedLabel2') }}</el-radio></p>
              <p><el-radio label="always">{{ $t('deptAuditorRule.advancedLabel3') }}</el-radio></p>
            </el-radio-group>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script>
export default {
  name: 'AdvancedSetup',
  props:{
    process_obj: { type: Object, required: true }
  },
  data() {
    return {
      repeatAuditRule: 'once'
    }
  },
  created(){
    this.initRepeatAuditRule()
  },
  methods: {
    initRepeatAuditRule(){
      const _this = this
      if(_this.process_obj.advancedSetup && _this.process_obj.advancedSetup.repeat_audit_rule){
        _this.repeatAuditRule = _this.process_obj.advancedSetup.repeat_audit_rule
      }
    },
    repeatAuditRuleChange() {
      this.$emit('change', true)
      this.$emit('saveAdvancedSetup', this.repeatAuditRule)
    }
  }
}
</script>

