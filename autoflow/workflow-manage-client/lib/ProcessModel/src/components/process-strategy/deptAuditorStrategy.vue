<template>
  <div>
    <el-form-item class="ruleIdTips">
      <div class="red-zs">
        <rule-properties-template :ruleId="rule_id" ref="ruleProperties"  style="max-height: 462px;margin-bottom: 15px"></rule-properties-template>
      </div>
    </el-form-item>
    <el-form-item>
      <label class="font-bold">{{ $t('deptAuditorRule.strategyType4') }}</label>
      <el-radio-group v-model="strategy_type" style="display:block" @change="strategyTypeChange">
        <el-radio label="dept_auditor" class="workflow-radio-dep">{{ $t('deptAuditorRule.strategyType5') }}
          <v-popover effect="light" placement="top" offset="16" container="#workflow-client-ui-content" trigger="hover" openclass="strategyTooltip" style="width:220px" class="strategyTooltip">
            <div slot="popover" class="sm-box1" style="width: 320px">
              <p class="title">{{ $t('deptAuditorRule.assignAuditorExplainTitle') }}</p>
              <p>{{ $t('deptAuditorRule.assignAuditorExplain1') }}</p>
            </div>
            <span style="cursor: pointer">
              <!-- 越南语 -->
              <i class="icon-state"  v-if="$i18n.locale === 'vi-vn'"  style="top: -8px;left: 200px;" /> 
              <i class="icon-state"  v-else-if="$i18n.locale === 'en-us'"  style="top: -8px;left: 313px;" />
              <i class="icon-state" v-else-if="$i18n.locale === 'zh-tw' "   style="top: -8px;left: 102px;" />
              <i class="icon-state" v-else   style="top: -8px;left: 102px;" />
            </span>
          </v-popover>
        </el-radio>
        <el-radio label="multilevel"  class="workflow-radio-dep">{{ $t('deptAuditorRule.strategyType3') }}
          <v-popover effect="light" placement="top"
                     offset="16"
                     openClass="custom_class"
                     container="#workflow-client-ui-content"
                     trigger="hover">
            <div slot="popover" class="sm-box1">
              <i  v-if="$i18n.locale === 'zh-tw'" class="icon-title-tw"/>
              <i  v-if="$i18n.locale === 'en-us'" class="icon-title-en"/>
              <i  v-if="$i18n.locale === 'zh-cn'" class="icon-title-cn"/>
              <i  v-if="$i18n.locale === 'vi-vn'" class="icon-title-vn"/>
            </div>
            <span style="cursor: pointer">
                <i class="icon-state"  v-if="['en-us', 'vi-vn'].includes($i18n.locale)"  style="top: -9px;left: 214px;" />
                <i class="icon-state"  v-else   style="top: -9px;left: 88px;" />
            </span>
          </v-popover>
        </el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item>
      <label class="font-bold"> {{levelTypeLabel}}
        <v-popover effect="light" placement="top" offset="16" v-show="strategy_type === 'multilevel'" container="#workflow-client-ui-content" trigger="hover" openclass="strategyTooltip" style="width:220px" class="strategyTooltip">
          <div slot="popover" class="sm-box1" style="width: 320px">
            <p class="title">{{ $t('deptAuditorRule.strategyType6') }}</p>
            <p>{{ $t('deptAuditorRule.strategyType7') }}</p>
          </div>
          <span style="cursor: pointer">
            <!-- 越南语 -->
            <i class="icon-state"  v-if="$i18n.locale === 'vi-vn'"  style="top: -5px;left: 110px;" />
            <i class="icon-state"  v-else-if="$i18n.locale === 'en-us'"  style="top: -5px;left: 25px;" />
            <i class="icon-state" v-else-if="$i18n.locale === 'zh-tw'"   style="top: -5px;left: 55px;" />
            <i class="icon-state" v-else   style="top: -5px;left: 60px;" />
          </span>
        </v-popover>
      </label>
      <div>
        <el-select
          v-model="level_type"
          :placeholder="$t('deptAuditorRule.choose')"
          clearable
          :style="{ width: $i18n.locale === 'vi-vn' ? '62%' : '50%' }"
          class="elpover-select"
          :popper-append-to-body="false">
          <el-option-group
            v-for="group in options"
            :key="group.label"
            :label="group.label"
            >
            <el-option
              v-for="item in group.options"
              :key="item.value"
              :label="item.label"
              :value="item.value"/>
          </el-option-group>
        </el-select>
        <v-popover effect="light" placement="top" offset="16" container="#workflow-client-ui-content" trigger="hover" openclass="strategyTooltip" class="strategyTooltip" v-if="strategy_type === 'dept_auditor'">
          <div slot="popover" class="sm-box1" style="width: 320px">
            <p class="title">{{ $t('deptAuditorRule.levelTypeExplainTitle') }}</p>
            <p>{{ $t('deptAuditorRule.levelTypeExplain1') }}</p>
          </div>
          <span style="cursor: pointer">
            <i 
              class="icon-state" 
              :style="{ top: '27px', left: $i18n.locale === 'vi-vn' ? '63%' : '51%' }"
            />
          </span>
        </v-popover>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'n'">
      <label class="font-bold">{{noAuditorTypeLabel}}</label>
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
    <el-form-item>
      <label class="font-bold">{{auditModelLabel}}</label>
      <div>
        <el-radio-group v-model="audit_model">
          <p><el-radio label="tjsh">{{$t('modeler.dealTypeTips.tjsh')}}</el-radio></p>
          <p><el-radio label="hqsh">{{$t('modeler.dealTypeTips.hqsh')}}</el-radio></p>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'y'">
      <p style="color: rgba(0, 0, 0, 0.45)">{{$t('deptAuditorRule.autoRejectSecretTip')}}</p>
    </el-form-item>
    <!-- <div class="foot_button" v-if="!processDisable">
      <el-button type="primary" size="mini" @click="confirmProperties" style="width: 80px">{{ $t('button.confirm') }}</el-button>
      <el-button size="mini" @click="closeProperties" style="width: 80px">{{ $t('button.cancel') }}</el-button>
    </div> -->
  </div>
</template>

<script>
import { getDeptAuditorRulePage } from '@/api/deptAuditorRule.js'
import rulePropertiesTemplate  from '@/views/dept-auditor-rule/rulePropertiesTemplate'
import {getInfoByTypeAndIds } from '@/api/user-management'
import dialogMixin from '@/mixins/dialog-mixin'
export default {
  name: 'deptAuditorStrategy',
  // eslint-disable-next-line vue/no-unused-components
  components:{rulePropertiesTemplate},
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
  mixins:[dialogMixin],
  data () {
    return {
      audit_model: 'tjsh',
      no_auditor_type: 'auto_reject',
      own_auditor_type: 'auto_reject',
      level_type: '',
      va:true,
      after:0,
      manual:true,
      strategy_type:'',
      options:[],
      levelTypeLabel:'',
      noAuditorTypeLabel:'',
      auditModelLabel:'',
      rule_id: '',
      ruleSelectScrollLoad: true,
      deptAuditorRuleList: [],
      queryDeptAuditorRule: {
        offset: 0,
        process_client: 1,
        limit: 20
      },
      deptOptions: [{
        options: [{
          value: 'directlyLevel',
          label: this.$i18n.tc('deptConfig.directlyLevel')
        },{
          value: 'belongUp1',
          label: this.$i18n.tc('deptConfig.belongUp1')
        }, {
          value: 'belongUp2',
          label: this.$i18n.tc('deptConfig.belongUp2')
        }, {
          value: 'belongUp3',
          label: this.$i18n.tc('deptConfig.belongUp3')
        }, {
          value: 'belongUp4',
          label: this.$i18n.tc('deptConfig.belongUp4')
        }, {
          value: 'belongUp5',
          label: this.$i18n.tc('deptConfig.belongUp5')
        }, {
          value: 'belongUp6',
          label: this.$i18n.tc('deptConfig.belongUp6')
        }, {
          value: 'belongUp7',
          label: this.$i18n.tc('deptConfig.belongUp7')
        }, {
          value: 'belongUp8',
          label: this.$i18n.tc('deptConfig.belongUp8')
        }, {
          value: 'belongUp9',
          label: this.$i18n.tc('deptConfig.belongUp9')
        }, {
          value: 'belongUp10',
          label: this.$i18n.tc('deptConfig.belongUp10')
        }, {
          value: 'highestLevel',
          label: this.$i18n.tc('deptAuditorRule.highestLevel')
        }]
      }, {
        options: [{
          value: 'highestDown1',
          label: this.$i18n.tc('deptAuditorRule.highestDown1')
        }, {
          value: 'highestDown2',
          label: this.$i18n.tc('deptAuditorRule.highestDown2')
        }, {
          value: 'highestDown3',
          label: this.$i18n.tc('deptAuditorRule.highestDown3')
        }, {
          value: 'highestDown4',
          label: this.$i18n.tc('deptAuditorRule.highestDown4')
        }, {
          value: 'highestDown5',
          label: this.$i18n.tc('deptAuditorRule.highestDown5')
        }, {
          value: 'highestDown6',
          label: this.$i18n.tc('deptAuditorRule.highestDown6')
        }, {
          value: 'highestDown7',
          label: this.$i18n.tc('deptAuditorRule.highestDown7')
        }, {
          value: 'highestDown8',
          label: this.$i18n.tc('deptAuditorRule.highestDown8')
        }, {
          value: 'highestDown9',
          label: this.$i18n.tc('deptAuditorRule.highestDown9')
        }, {
          value: 'highestDown10',
          label: this.$i18n.tc('deptAuditorRule.highestDown10')
        }]
      }], multileveloptions: [{
        options: [{
          value: 'highestLevel',
          label: this.$i18n.tc('deptConfig.highestLevel')
        },{
          value: 'highestDown1',
          label: this.$i18n.tc('deptAuditorRule.highestDown1')
        }, {
          value: 'highestDown2',
          label: this.$i18n.tc('deptAuditorRule.highestDown2')
        }, {
          value: 'highestDown3',
          label: this.$i18n.tc('deptAuditorRule.highestDown3')
        }, {
          value: 'highestDown4',
          label: this.$i18n.tc('deptAuditorRule.highestDown4')
        }, {
          value: 'highestDown5',
          label: this.$i18n.tc('deptAuditorRule.highestDown5')
        }, {
          value: 'highestDown6',
          label: this.$i18n.tc('deptAuditorRule.highestDown6')
        }, {
          value: 'highestDown7',
          label: this.$i18n.tc('deptAuditorRule.highestDown7')
        }, {
          value: 'highestDown8',
          label: this.$i18n.tc('deptAuditorRule.highestDown8')
        }, {
          value: 'highestDown9',
          label: this.$i18n.tc('deptAuditorRule.highestDown9')
        }, {
          value: 'highestDown10',
          label: this.$i18n.tc('deptAuditorRule.highestDown10')
        }]
      }, {
        options: [{
          value: 'belongUp1',
          label: this.$i18n.tc('deptAuditorRule.belongUp1')
        }, {
          value: 'belongUp2',
          label: this.$i18n.tc('deptAuditorRule.belongUp2')
        }, {
          value: 'belongUp3',
          label: this.$i18n.tc('deptAuditorRule.belongUp3')
        }, {
          value: 'belongUp4',
          label: this.$i18n.tc('deptAuditorRule.belongUp4')
        }, {
          value: 'belongUp5',
          label: this.$i18n.tc('deptAuditorRule.belongUp5')
        }, {
          value: 'belongUp6',
          label: this.$i18n.tc('deptAuditorRule.belongUp6')
        }, {
          value: 'belongUp7',
          label: this.$i18n.tc('deptAuditorRule.belongUp7')
        }, {
          value: 'belongUp8',
          label: this.$i18n.tc('deptAuditorRule.belongUp8')
        }, {
          value: 'belongUp9',
          label: this.$i18n.tc('deptAuditorRule.belongUp9')
        }, {
          value: 'belongUp10',
          label: this.$i18n.tc('deptAuditorRule.belongUp10')
        }]
      }]
    }
  },
  created () {
    this.initDeptAuditorRule()
    this.strategy_type = 'dept_auditor'
  },
  mounted(){
    this.computedDialogTop()
  },
  methods: {
    /**
       * 初始化表单
       */
    initForm() {
      this.audit_model = 'tjsh'
      this.no_auditor_type = 'auto_reject'
      this.own_auditor_type = 'auto_reject'
      if(this.strategy_type === 'multilevel'){
        this.level_type = 'highestLevel'
      }else{
        this.level_type = 'directlyLevel'
      }
    },

    /**
       * 初始化审核策略
       */
    initStrtegyAuditor(_config, strategyList, flag) {
      const _this = this
      if (typeof flag === 'undefined') {
        _this.initForm()
      } else {
        _this.rule_id = ''
      }
      strategyList.forEach(strategy => {
        if (strategy.act_def_id === _config.nodeId && (strategy.strategy_type === 'dept_auditor' || strategy.strategy_type === 'multilevel')) {
          _this.audit_model = strategy.audit_model
          _this.no_auditor_type = strategy.no_auditor_type
          _this.own_auditor_type = strategy.own_auditor_type
          _this.level_type = strategy.level_type
          _this.$refs.ruleProperties.deptAuditorSetResult = strategy.dept_auditor_rule_list
          _this.strategy_type = strategy.strategy_type
          let _array = _this.deptAuditorRuleList.filter((item) => item.rule_id === strategy.rule_id)
          if (_array.length > 0) {
            _this.rule_id = strategy.rule_id
          }
        }
      })
      _this.initStrategyTypeItem()
    },
    /**
       * 初始化部门审核员规则下拉选项
       */
    initDeptAuditorRule() {
      const _this = this
      getDeptAuditorRulePage(_this.queryDeptAuditorRule).then(response => {
        _this.deptAuditorRuleList = response.entries
        _this.initStrtegyAuditor(_this.approver_config, _this.doc_audit_strategy_data)
      }).catch(() => {
      })
    },
    ruleSelectHandleScroll() {
      const _this = this
      _this.queryDeptAuditorRule.offset += _this.queryDeptAuditorRule.limit
      getDeptAuditorRulePage(_this.queryDeptAuditorRule).then(response => {
        _this.deptAuditorRuleList = _this.deptAuditorRuleList.concat(response.entries)
      }).catch(() => {
      })
    },

    /**
       * 确认配置
       */
    confirmProperties() {
      const _this = this
      _this.checkAuditorExistence(_this.$refs.ruleProperties.deptAuditorSetResult);
    },

    /**
     * 校验审核员是否存在
     */
    checkAuditorExistence(deptAuditorSetResult){
      const  _this = this
      let warnMsgStr = ''
      let userIds = this.jointUserId(deptAuditorSetResult)
      const item = {
        auditor_list: [],
        audit_model: _this.audit_model,
        level_type: _this.level_type,
        rule_type: 'role',
        dept_auditor_rule_list: deptAuditorSetResult,
        rule_id: _this.rule_id,
        no_auditor_type: _this.no_auditor_type,
        own_auditor_type: _this.own_auditor_type,
        strategy_type: _this.strategy_type
      }
      getInfoByTypeAndIds('user', userIds).then(() => {
        item.dept_auditor_rule_list = deptAuditorSetResult
        this.$emit('output', item)
      }).catch((res) => {
        if (res.response.data.code === 400019001) {
          const detail = JSON.parse(res.response.data.detail)
          let delUserIdArr = []
          deptAuditorSetResult.forEach(result=> {
            result.auditor_list.forEach(auditor =>{
              if (detail.ids.indexOf(auditor.user_id) > -1) {
                if(delUserIdArr.filter(userId => auditor.user_id === userId).length === 0) {
                  if (warnMsgStr === '') {
                    warnMsgStr = '“' + auditor.user_name + '”'
                  } else {
                    warnMsgStr += '、“' + auditor.user_name + '”'
                  }
                }
                delUserIdArr.push(auditor.user_id)
              }
            })
          })
          // 移除已配置的审核员
          delUserIdArr.forEach(userId => {
            deptAuditorSetResult.forEach(result=> {
              let index = result.auditor_list.findIndex((data) => userId === data.user_id)
              if(index !== -1){
               let auditor_names =  result.auditor_names.split('、')
                auditor_names.splice(index,1)
                result.auditor_names= auditor_names.join('、')
                result.auditor_list.splice(index,1)

              }
            })
          })
            _this.$dialog_confirm_user_not_exist('', _this.$i18n.tc('sync.userHasTip1') +  warnMsgStr , _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), false).then(() => {
            _this.$refs.ruleProperties.deptAuditorSetResult = deptAuditorSetResult
            item.dept_auditor_rule_list = deptAuditorSetResult
            this.$emit('output', item)
          }).catch(() => { })
        }
      })
    },
  /**
   * 拼接审核员ID
   */
  jointUserId(deptAuditorSetResult){
    let userIds = []
    for(let i = 0 ; i < deptAuditorSetResult.length ; i++){
      let auditor_list = deptAuditorSetResult[i].auditor_list
      for(let k = 0 ; k < auditor_list.length; k++){
        userIds.push(auditor_list[k].user_id)
      }
    }
    return userIds
  },
    /**
       * 关闭配置
       */
    closeProperties() {
      this.$emit('closeProperties')
    },
    initStrategyTypeItem() {
      const _this = this
      _this.options = _this.deptOptions
      _this.levelTypeLabel = _this.$t('deptAuditorRule.levelTypeLabel')
      _this.noAuditorTypeLabel = _this.$t('deptAuditorRule.noAuditorTypeLabel')
      _this.auditModelLabel = _this.$t('deptAuditorRule.auditModelLabel')
      if (_this.strategy_type === 'multilevel') {
        _this.options = _this.multileveloptions
        _this.levelTypeLabel = _this.$t('deptAuditorRule.multilevelTypeLabel')
        _this.noAuditorTypeLabel = _this.$t('deptAuditorRule.multiNoAuditorTypeLabel')
        _this.auditModelLabel = _this.$t('deptAuditorRule.multiAuditModelLabel')
      }
    },
    strategyTypeChange() {
      const _this = this
      _this.initStrategyTypeItem()
      _this.initForm()
    }
  }
}
</script>

<style>
  .ruleIdTips .el-form-item__error {
    top: 30px;
    left: calc(50% + 10px) !important;
  }
  .elpover-select {
    position: relative;
  }
  .elpover-select .el-select-dropdown.el-popper {
    position: absolute !important;
    left: 0 !important;
    top: 34px !important;
    width: 100%;
    word-wrap: break-word;
    word-break: normal;
  }
</style>
