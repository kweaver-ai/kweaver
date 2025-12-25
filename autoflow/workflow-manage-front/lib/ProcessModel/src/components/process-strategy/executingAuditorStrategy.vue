<template>
  <div>
    <el-form-item>
      <el-form-item prop="strategy_tag" class="strategyTagTips">
        <label class="font-bold">
          {{ $t('deptAuditorRule.auditorStrategy') }}：
        </label>
        <div class="red-zs">
          <span class="red">* </span>
          <el-select v-model="strategy_tag">
            <template slot="empty">
              <span class="select-sm">{{
                $t('deptAuditorRule.noRuleTip')
              }}</span>
            </template>
            <div style="overflow: auto; max-height: 141px">
              <el-option
                v-for="item in strategyList"
                :key="item.key"
                :value="item.key"
                :label="item.label[$i18n.locale]"
              >
              </el-option>
            </div>
          </el-select>
        </div>
      </el-form-item>
    </el-form-item>
    <el-form-item style="margin-top: 16px">
      <label class="font-bold">{{ $t('modeler.auditMode') }}：</label>
      <div>
        <el-radio-group v-model="audit_model">
          <p>
            <el-radio label="tjsh">{{
              $t('modeler.dealTypeTips.tjsh')
            }}</el-radio>
          </p>
          <p>
            <el-radio label="hqsh">{{
              $t('modeler.dealTypeTips.hqsh')
            }}</el-radio>
          </p>
          <p>
            <el-radio label="zjsh">{{
              $t('modeler.dealTypeTips.zjsh')
            }}</el-radio>
          </p>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item>
      <label class="font-bold">{{
        $t('deptAuditorRule.namedNoAuditorTypeLabel')
      }}</label>
      <div>
        <el-radio-group v-model="no_auditor_type">
          <el-radio label="auto_reject">{{
            $t('deptAuditorRule.autoReject')
          }}</el-radio>
          <el-radio label="auto_pass">{{
            $t('deptAuditorRule.autoPass')
          }}</el-radio>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item>
      <label class="font-bold">{{
        $t('deptAuditorRule.namedOwnAuditorTypeLabel')
      }}</label>
      <el-radio-group v-model="own_auditor_type">
        <el-radio label="auto_reject">{{
          $t('deptAuditorRule.autoReject')
        }}</el-radio>
        <el-radio label="auto_pass">{{
          $t('deptAuditorRule.autoPass')
        }}</el-radio>
        <el-radio label="self_audit">{{
          $t('deptAuditorRule.selfAudit')
        }}</el-radio>
      </el-radio-group>
    </el-form-item>
    <div class="foot_button" v-if="!processDisable">
      <el-button
        type="primary"
        size="mini"
        @click="confirmProperties"
        style="width: 80px"
        :disabled="!strategy_tag"
        >{{ $t('button.confirm') }}</el-button
      >
      <el-button size="mini" @click="closeProperties" style="width: 80px">{{
        $t('button.cancel')
      }}</el-button>
    </div>
  </div>
</template>

<script>
import { getStrategyList } from '@/api/deptAuditorRule.js'

export default {
  name: 'exceutingAuditorStrategy',
  props: {
    approver_config: {
      required: true,
      type: Object
    },
    doc_audit_strategy_data: {
      required: true,
      type: Array
    },
    processDisable: {
      type: Boolean
    }
  },
  data() {
    return {
      strategy_tag: undefined,
      audit_model: 'zjsh',
      no_auditor_type: 'auto_reject',
      own_auditor_type: 'auto_reject',
      strategyList: []
    }
  },
  created() {
    this.initStrategyList()
    this.initStrtegyAuditor(this.approver_config, this.doc_audit_strategy_data)
  },
  methods: {
    initStrategyList() {
      getStrategyList().then((response) => {
        this.strategyList = response
      })
    },
    initStrtegyAuditor(config, strategyList) {
      const strategy = strategyList.find(
        (item) =>
          item.act_def_id === config.nodeId &&
          item.strategy_type === 'excuting_auditor'
      )
      if (strategy) {
        this.audit_model = strategy.audit_model
        this.no_auditor_type = strategy.no_auditor_type
        this.own_auditor_type = strategy.own_auditor_type
        this.strategy_tag = strategy.strategy_tag
      } else {
        this.audit_model = 'zjsh'
        this.no_auditor_type = 'auto_reject'
        this.own_auditor_type = 'auto_reject'
        this.strategy_tag = undefined
      }
    },
    confirmProperties() {
      const item = {
        auditor_list: [],
        audit_model: this.audit_model,
        strategy_type: 'excuting_auditor',
        strategy_tag: this.strategy_tag,
        no_auditor_type: this.no_auditor_type,
        own_auditor_type: this.own_auditor_type
      }
      this.$emit('output', item)
    },
    closeProperties() {
      this.$emit('closeProperties')
    }
  }
}
</script>
<style>
.strategyTagTips .el-form-item__error {
  top: 28px;
  left: 200px!important;
}
</style>
