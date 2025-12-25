<template>
  <div>
    <el-form-item v-if="strategy_type === 'predefined_auditor'">
      <label class="font-bold" style="margin-top: 16px;">{{ $t('modeler.auditMode') }}：</label>
      <div> 
        <el-radio-group v-model="audit_model">
          <p><el-radio label="tjsh">{{$t('modeler.dealTypeTips.tjsh')}}</el-radio></p>
          <p><el-radio label="hqsh">{{$t('modeler.dealTypeTips.hqsh')}}</el-radio></p>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'n'">
      <label class="font-bold">{{$t('deptAuditorRule.namedNoAuditorTypeLabel')}}</label>
      <v-popover  effect="light" placement="bottom" offset="24" container="#workflow-client-ui-content" trigger="hover" openclass="strategyTooltip"  class="strategyTooltip" 
       :style="($i18n.locale === 'en-us'? 'left: 288px;': $i18n.locale === 'zh-cn'? 'left: 108px;' :'left: 118px;')
       + 'cursor: pointer;position: absolute;top: -4px;display: inline-block;width: 32px;height: 32px;'">
        <div slot="popover" class="sm-box1" style="width: 320px">
          <p class="title">{{$t('deptAuditorRule.namedNoAuditorTypeExplainTitle')}}</p>
          <p>{{$t('deptAuditorRule.namedNoAuditorTypeExplain2')}}</p>
          <p>{{$t('deptAuditorRule.namedNoAuditorTypeExplain4')}}</p>
        </div>
        <span style="cursor: pointer"><i class="icon-state" /></span>
      </v-popover>

      <div>
        <el-radio-group v-model="no_auditor_type">
          <el-radio label="auto_reject">{{$t('deptAuditorRule.autoReject')}}</el-radio>
          <el-radio label="auto_pass">{{$t('deptAuditorRule.autoPass')}}</el-radio>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'n'">
      <label class="font-bold">{{$t('deptAuditorRule.namedOwnAuditorTypeLabel')}}</label>
        <el-radio-group v-model="own_auditor_type">
          <el-radio label="auto_reject">{{$t('deptAuditorRule.autoReject')}}</el-radio>
          <el-radio label="auto_pass">{{$t('deptAuditorRule.autoPass')}}</el-radio>
          <el-radio label="self_audit">{{$t('deptAuditorRule.selfAudit')}}</el-radio>
        </el-radio-group>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'y' && strategy_type === 'predefined_auditor'">
      <p style="color: rgba(0, 0, 0, 0.45)">{{$t('deptAuditorRule.autoRejectSecretTip')}}</p>
    </el-form-item>
    <!-- 希望将tooltip的弹出部分内容的dom放在这里面 -->
    <div ref="elementUiMount"></div>
  </div>
</template>

<script>
export default {
  name: 'predefinedAuditorStrategy',
  components: { },
  props: {
    wikiRole: {
      required: true,
      type: Object
    },
    strategy_type: {
      required: true,
      type: String
    },
    approver_config: {
      required: true,
      type: Object
    },
    doc_audit_strategy_data: {
      required: true,
      type: Array
    }
  },
  data () {
    return {
      audit_model: 'tjsh',
      no_auditor_type: 'auto_reject',
      own_auditor_type:'auto_reject'
    }
  },
  created () {
    // this.initStrtegyAuditor(this.approver_config, this.doc_audit_strategy_data)
  },
  mounted () {
    // 在mounted的时候只需要使用这句话。
    // if(this.$store.state.app.secret.status === 'n'){
    //   this.$refs.elementUiMount.appendChild(this.$refs.namedNoAuditorTypeLabelToolTip.popperVM.$el)
    // }
  },
  watch: {
    strategy_type: {
      handler(newVal) {
        this.handleStrategyChange(newVal);
      },
      immediate: true
    }
  },
  methods: {
    handleStrategyChange(type) {
      // 审核员类型改变
      this.initStrtegyAuditor(this.approver_config, this.doc_audit_strategy_data)
    },
    /**
     * 初始化审核策略
     */
    initStrtegyAuditor (_config, strategyList) {
      const _this = this
      _this.initForm()
      strategyList.forEach(strategy => {
        if (strategy.act_def_id === _config.nodeId  && strategy.strategy_type === _config.strategyType) {
          _this.audit_model = strategy.audit_model
          _this.no_auditor_type = strategy.no_auditor_type
          _this.own_auditor_type = strategy.own_auditor_type
        }
      })
    },
    initForm () {
      this.audit_model = 'tjsh'
      this.no_auditor_type = 'auto_reject'
      this.own_auditor_type = 'auto_reject'
    },
    /**
     * 确认配置
     */
    confirm () {
      const _this = this

      const predefinedData = {
        audit_model: _this.audit_model,
        no_auditor_type: _this.no_auditor_type,
        own_auditor_type:_this.own_auditor_type,
        strategy_type: this.strategy_type,
        auditor_list: _this.wikiRole.snow_id ? [{
          user_id: _this.wikiRole.snow_id,
          user_name: _this.wikiRole.title,
          user_code: _this.wikiRole.title,
          org_type: 'kc_admin'
        }] : []
      }

      _this.$emit('output', predefinedData)
    },
    /**
     * 关闭配置
     */
    closeProperties () {
      this.$emit('closeProperties')
    }
  }
}
</script>
<style scoped>
</style>
