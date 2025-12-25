<template>
  <div class="basicProperties no-border-bottom processProperties" :style="{overflowY: 'auto',height: propertiesHeight + 'px'}">
    <div class="no-border" style="height:100%">
      <div class="card-body" style="height:100%">
        <el-form ref="propertiesForm" :model="form" label-position="left" label-width="0px" size="small" :rules="rules"  class="process" style="height:100%">
          <el-form-item prop="name" class="linkNameTips">
            <div>
              <label class="font-bold">{{ $t('modeler.nodeName') }}：</label>
              <div class="red-zs">
                <span class="red">*</span>
                <el-input v-model="form.name"  style="width: 50%;" :disabled="processDisable" @change="dealFormName" />
              </div>
            </div>
          </el-form-item>
          <el-tabs v-model="settingType" class="setting-type-tabs">
            <el-tab-pane :label="$t('auditorSettings')" name="auditor">
              <el-form-item>
                <!-- <label class="font-bold">{{ $t('deptAuditorRule.strategyTypeLabel') }}</label> -->
                <div>
                  <el-radio-group v-model="setStrategyType" class="workflow-radio-group">
                    <el-radio label="named_auditor">{{ $t('deptAuditorRule.strategyType1') }}</el-radio>
                    <el-radio v-if="this.$store.state.app.custom.showAdmin" label="predefined_auditor">{{ $t('predefinedAuditor.predefinedAuditor') }}</el-radio>
                    <el-radio label="dept_auditor" class="workflow-radio">{{$t('deptAuditorRule.strategyType2')}}
                      <v-popover effect="light" placement="top" offset="16" container="#workflow-client-ui-content" trigger="hover" openclass="strategyTooltip"  class="strategyTooltip">
                        <div slot="popover" class="sm-box1" style="width: 320px">
                          <p class="title">{{ $t('deptAuditorRule.deptAuditorExplainTitle') }}</p>
                          <p>{{ $t('deptAuditorRule.deptAuditorExplain1') }}</p>
                        </div>
                        <span style="cursor: pointer">
                          <i class="icon-state"  v-if="$i18n.locale === 'en-us'"  style="top: -8px;left: 132px;" />
                          <i class="icon-state" v-else-if="$i18n.locale === 'zh-tw' "   style="top: -8px;left: 102px;" />
                          <i class="icon-state" v-else   style="top: -8px;left: 102px;" />
                        </span>
                      </v-popover>
                    </el-radio>
                    <el-radio v-if="this.$store.state.app.custom.showManager" label="manager">
                      {{ $t('deptAuditorRule.leader') }}
                    </el-radio>
                    <el-radio v-if="this.$store.state.app.custom.showKCAdmin" label="kc_admin">
                      {{ $t('deptAuditorRule.knowledgeManagerRole') }}
                    </el-radio>
                  </el-radio-group>
                </div>
              </el-form-item>
              <div v-if="setStrategyType === 'kc_admin'">
                <wiki-admin-role
                  @change="handleRoleChange"
                  :approver_config="approver_config"
                  :doc_audit_strategy_data="doc_audit_strategy_data"
                  :isEdit="is_edit()"
                />
              </div>
              <template v-if="setStrategyType === 'named_auditor'">
                <named-auditor-strategy
                  ref="namedAuditorStrategy"
                  :approver_config="approver_config"
                  :doc_audit_strategy_data="doc_audit_strategy_data"
                  :processDisable="processDisable"
                  @output="confirmProperties"
                  @closeProperties="closeDrawer"
                />
              </template>
              <template v-else-if="setStrategyType === 'dept_auditor'">
                <div>
                  <dept-auditor-strategy
                    ref="deptAuditorStrategy"
                    :approver_config="approver_config"
                    :doc_audit_strategy_data="doc_audit_strategy_data"
                    :processDisable="processDisable"
                    @output="confirmProperties"
                    @closeProperties="closeDrawer"
                  />
                </div>
              </template>
              <template v-else-if="['manager','predefined_auditor', 'kc_admin'].includes(setStrategyType)">
                <div>
                  <predefined-auditor-strategy
                    ref="predefinedAuditorStrategy"
                    :strategy_type="setStrategyType"
                    :approver_config="approver_config"
                    :doc_audit_strategy_data="doc_audit_strategy_data"
                    :wikiRole="wikiRole"
                    @output="confirmProperties"
                    @closeProperties="closeDrawer"
                />
                </div>
              </template>
              <template v-else>
                <div>
                  {{setStrategyType}} not found
                </div>
              </template>
            </el-tab-pane>
            <el-tab-pane :label="$t('approvalControl')" name="operation">
              <!-- <label class="font-bold property-label">{{ $t('deptAuditorRule.strategyType8') }}</label> -->
              <el-form-item>
                <div>
                  <el-checkbox v-model="countersignSwitch" true-label="Y" false-label="N" size="small" class="check"><span style="margin-left:-5px;font-size: 13px;color: #444">{{ $t('countersign.ruleText1') }}</span></el-checkbox>
                  <span style="margin-left: 5px;font-size: 13px;color: #444">
                    <span style="display: inline-block;position: relative;">
                      <el-input :disabled="countersignSwitch !== 'Y'" size="mini" style="width: 50px" :maxlength="2" v-model="countersignCount" @input="countersignCount = countersignCount.replace(/\D|^0/g,'')"></el-input>
                      <span style="color: red;display: block;position: absolute;width: 150px;font-size: 13px;top:24px">
                        <span v-if="countersignSwitch === 'Y' && countersignCount > 10">{{ $t('countersign.maxExceedCount') }}</span>
                        <span v-if="countersignSwitch === 'Y' && countersignCount < 1">{{ $t('countersign.notEmpty') }}</span>
                      </span>
                    </span>
                    {{ $t('countersign.ruleText2') }}{{ $t('countersign.ruleText3') }}
                    <span style="display: inline-block;position: relative;">
                      <el-input :disabled="countersignSwitch !== 'Y'" size="mini" style="width: 50px" :maxlength="2" v-model="countersignAuditors" @input="countersignAuditors = countersignAuditors.replace(/\D|^0/g,'')"></el-input>
                      <span style="color: red;display: block;position: absolute;width: 150px;font-size: 13px;top:24px">
                        <span  v-if="countersignSwitch === 'Y' && countersignAuditors > 10">{{ $t('countersign.maxExceedAuditors') }}</span>
                        <span  v-if="countersignSwitch === 'Y' && countersignAuditors < 1">{{ $t('countersign.notEmpty') }}</span>
                      </span>
                    </span>
                    {{ $t('countersign.ruleText4') }}
                  </span>
                  <p style="color:#999;padding-top: 5px;margin-bottom:-5px">{{ $t('countersign.tips') }}</p>
                </div>
              </el-form-item>
              <el-divider class="dash-divider"></el-divider>
              <!-- 转审配置 -->
              <el-form-item>
                <div>
                  <el-checkbox v-model="transferSwitch" true-label="Y" false-label="N" size="small" class="check"><span style="margin-left:-5px;font-size: 13px;color: #444">{{ $t('transfer.ruleText1') }}</span></el-checkbox>
                  <span style="margin-left: 5px;font-size: 13px;color: #444">
                    <span style="display: inline-block;position: relative;">
                      <el-input :disabled="transferSwitch !== 'Y'" size="mini" style="width: 50px" :maxlength="2"  v-model="transferCount" @input="transferCount = transferCount.replace(/\D|^0/g,'')"></el-input>
                      <span style="color: red;display: block;position: absolute;width: 150px;font-size: 13px;top:24px">
                        <span v-if="transferSwitch === 'Y' && transferCount > 10">{{ $t('transfer.maxExceedCount') }}</span>
                        <span v-if="transferSwitch === 'Y' && transferCount < 1">{{ $t('transfer.notEmpty') }}</span>
                      </span>
                    </span>
                    {{ $t('transfer.ruleText2') }}
                  </span>
                  <p style="color:#999;padding-top: 5px;margin-bottom:-5px">{{ $t('transfer.tips') }}</p>
                </div>
              </el-form-item>
              <el-divider class="dash-divider"></el-divider>
              <!-- 退回设置 -->
              <el-form-item v-show="allowSendback">
                <div>
                  <el-checkbox v-model="sendback_switch" true-label="Y" false-label="N" size="small" class="check">
                    <span style="margin-left:-5px;font-size: 13px;color: #444">{{ $t('sendback.label') }}</span>
                  </el-checkbox>
                  <p style="color:#999;padding-top: 5px;margin-bottom:-5px">{{ $t('sendback.tips') }}</p>
                </div>
              </el-form-item>
              <el-divider class="dash-divider" v-if="allowSendback"></el-divider>
            </el-tab-pane>
          </el-tabs>
          <div class="foot_button" v-if="!processDisable">
            <el-button type="primary" size="mini" @click="handleConfirm" style="width: 80px">{{ $t('button.confirm') }}</el-button>
            <el-button size="mini" @click="closeDrawer" style="width: 80px">{{ $t('button.cancel') }}</el-button>
          </div>
        </el-form>
      </div>
    </div>
    <!-- 希望将tooltip的弹出部分内容的dom放在这里面 -->
    <div ref="elementUiMount"></div>
  </div>
</template>

<script>
import NamedAuditorStrategy from './process-strategy/namedAuditorStrategy'
import PredefinedAuditorStrategy from './process-strategy/predefinedAuditorStrategy'
import DeptAuditorStrategy from './process-strategy/deptAuditorStrategy'
import WikiAdminRole from './wiki-admin-role/wikiAdminRole'

export default {
  name: 'ProcessProperties',
  components: { NamedAuditorStrategy, DeptAuditorStrategy, PredefinedAuditorStrategy, WikiAdminRole },
  props: {
    current_proc_obj: {
      required: true,
      type: Object
    },
    proc_def_key: {
      type: String,
      required: true
    },
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
  data () {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)) {
        callback(new Error(this.$i18n.tc('modeler.illegalCharacterPrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 20) {
        callback(new Error(this.$i18n.tc('modeler.linkNameLengthErrorBack')))
      } else if (value.trim().length > 0) {
        // eslint-disable-next-line no-empty
      } else {
        callback()
      }

    }
    let validateRuleId = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (!this.checkRuleId()) {
        callback(new Error(this.$i18n.tc('deptAuditorRule.ruleIdTips1')))
      } else if (this.ruleIsNotExist) {
        this.ruleIsNotExist = false
        callback(new Error(this.$i18n.tc('deptAuditorRule.ruleIdTips2')))
      } else {
        callback()
      }
    }
    return {
      form: {},
      audit_model: 'tjsh',
      va:true,
      after:0,
      manual:true,
      setStrategyType: 'named_auditor',
      settingType: 'auditor',
      approverConfig: {},
      strategyList: [],
      propertiesHeight: 600,
      countersignSwitch: false,
      countersignCount: '1',
      countersignAuditors: '1',
      transferSwitch: false,
      transferCount: '1',
      sendback_switch: false,
      ruleIsNotExist: false,
      rules: {
        name: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'change' },
          { required: true, trigger: 'change', validator: validateName }
        ],
        rule_id: [
          { required: true, trigger: 'change', validator: validateRuleId }
        ]
      },
      wikiRole: {},
    }
  },
  computed: {
    arbitrailyAuditTemplateVal() {
      return this.$store.state.app.arbitrailyAuditTemplate
    },
    allowSendback(){
      if(this.arbitrailyAuditTemplateVal && this.arbitrailyAuditTemplateVal.process_type){
        if(this.arbitrailyAuditTemplateVal.process_type === 'doc_flow'
          && this.arbitrailyAuditTemplateVal.apply_type !== 'doccollect') {
            return true
        }
        return false
      }
      return true
    },
  },
  watch: {
    form: {
      deep: true,
      handler: function (nVal) {
        let approverConfig = { ...this.approverConfig }
        approverConfig.nodeName = nVal.name
        this.$emit('updateApproverConfig', approverConfig)
      }
    }
  },
  created () {
    this.approverConfig = this.approver_config
    this.initForm(this.approverConfig)
    this.initApproverConfig(this.approverConfig, this.doc_audit_strategy_data)
  },
  mounted () {
    this.$nextTick(function () {
      this.propertiesHeight = window.innerHeight - 90 - (this.arbitrailyAuditTemplateVal.flowHackHeight || 0)
      // 监听窗口大小变化
      let _this = this
      window.addEventListener('resize', () => {
        _this.propertiesHeight = window.innerHeight - 90 - (_this.arbitrailyAuditTemplateVal.flowHackHeight || 0)
      })
    })
  },
  methods: {
    /**
     * 初始化表单
     */
    initForm (_config) {
      this.approverConfig = _config
      this.form = {
        ...this.form,
        id: _config.nodeId,
        name: _config.nodeName
      }
    },
    /**
     * 初始化环节配置
     */
    initApproverConfig (_config, strategyList) {
      const _this = this
      _this.setStrategyType = 'named_auditor'
      _this.settingType = 'auditor'
      strategyList.forEach(strategy => {
        if (strategy.act_def_id === _config.nodeId) {
          _this.setStrategyType = (strategy.strategy_type === 'dept_auditor' || strategy.strategy_type === 'multilevel') ? 'dept_auditor' : strategy.strategy_type
          _this.setApproverConfigUsers(strategy)
        }
      })
      _this.strategyList = strategyList
      _this.countersignCount = '1'
      _this.countersignAuditors = '1'
      _this.countersignSwitch = 'N'
      _this.transferSwitch = 'N'
      _this.transferCount = '1'
      _this.sendback_switch = 'N'
      strategyList.forEach(strategy => {
        if(strategy.act_def_id === _config.nodeId){
          _this.countersignCount = strategy.countersign_count ? strategy.countersign_count : '1'
          _this.countersignAuditors = strategy.countersign_auditors ? strategy.countersign_auditors : '1'
          _this.countersignSwitch = strategy.countersign_switch ? strategy.countersign_switch : 'N'
          _this.transferSwitch = strategy.transfer_switch ? strategy.transfer_switch : 'N'
          _this.transferCount = strategy.transfer_count ? strategy.transfer_count : '1'
          if(_this.allowSendback){
            _this.sendback_switch = strategy.sendback_switch ? strategy.sendback_switch : 'N'
          }

        }
      })
    },
    /**
     * 初始化审核策略
     */
    initStrategy (_config, strategyList) {
      const _this = this
      if (_this.setStrategyType === 'named_auditor') {
        _this.$refs.namedAuditorStrategy !== undefined ? _this.$refs.namedAuditorStrategy.initStrtegyAuditor(_config, strategyList) : null
      } else if (_this.setStrategyType === 'dept_auditor') {
        _this.$refs.deptAuditorStrategy !== undefined ? _this.$refs.deptAuditorStrategy.initStrtegyAuditor(_config, strategyList) : null
      }
    },
    // 调用子组件方法，完成确认前校验
    handleConfirm () {
      const type = this.setStrategyType
      if(type === "named_auditor") {
        this.$refs.namedAuditorStrategy.handleConfirm()
      } else if (type === "dept_auditor") {
        this.$refs.deptAuditorStrategy.confirmProperties()
      } else {
        this.$refs.predefinedAuditorStrategy.confirm()
      }
    },
    /**
     * 确认属性配置
     * @param _obj
     */
    confirmProperties(_obj) {
      const _this = this
      _this.ruleIsNotExist = false
      if (_this.checkValidate()) {
        _obj.doc_id = ' '
        _obj.doc_type = ' '
        _obj.act_def_id = _this.form.id
        _obj.act_def_name = _this.form.name
        if(_this.countersignSwitch === 'Y' && (_this.countersignCount < 1 || _this.countersignCount > 10 || _this.countersignAuditors < 1 || _this.countersignAuditors > 10)){
          return
        } else if(_this.countersignCount < 1 || _this.countersignCount > 10 || _this.countersignAuditors < 1 || _this.countersignAuditors > 10){
          _obj.countersign_switch = _this.countersignSwitch
          _this.strategyList.forEach(strategy => {
            if(strategy.act_def_id === _this.form.id){
              _obj.countersign_count = strategy.countersign_count ? strategy.countersign_count : '1'
              _obj.countersign_auditors = strategy.countersign_auditors ? strategy.countersign_auditors : '1'
            }
          })
        } else if ( (_this.transferCount < 1 || _this.transferCount > 10)){
          if(_this.transferSwitch === 'Y') {
            return
          } else {
            _obj.transfer_switch = _this.transferSwitch
            _this.strategyList.forEach(strategy => {
            if(strategy.act_def_id === _this.form.id){
              _obj.transfer_count = strategy.transfer_count ? strategy.transfer_count : '1'
            }
          })
          }
        } else {
          _obj.countersign_switch = _this.countersignSwitch
          _obj.countersign_count = _this.countersignCount
          _obj.countersign_auditors = _this.countersignAuditors
          _obj.transfer_switch = _this.transferSwitch
          _obj.transfer_count = _this.transferCount
          _obj.sendback_switch = _this.sendback_switch
        }
        let checkArray = _this.strategyList.filter(data => _obj.act_def_id === data.act_def_id)
        if (checkArray.length === 0) {
          _this.strategyList.push(_obj)
        } else {
          for (let i = 0, len = _this.strategyList.length; i < len; i++) {
            if (_this.strategyList[i].act_def_id === _obj.act_def_id) {
              _this.strategyList[i] = _obj
            }
          }
        }
        _this.setApproverConfigUsers(_obj)
        _this.$emit('confirmProperties', _this.strategyList, _obj.act_def_id)
      }
    },
    /**
     * 设置审核环节审核员（用于校验）
     * @param _obj
     */
    setApproverConfigUsers (_obj) {
      const _this = this
      let approverConfig = { ..._this.approverConfig }
      approverConfig.nodeName = _this.form.name
      _obj.auditor_list.length > 0 ? approverConfig.nodeUserList.push(_obj.auditor_list[0].user_id) : ''
      _this.$emit('updateApproverConfig', approverConfig)
    },
    /**
     * 表单检验
     */
    checkValidate () {
      let result = true
      this.$refs['propertiesForm'].validate(valid => {
        result = valid
      })
      return result
    },
    /**
     * 处理环节名称
     */
    dealFormName () {
      this.form.name = this.form.name.replace(/(^\s*)|(\s*$)/g, '')
    },
    /**
     * 关闭抽屉
     */
    closeDrawer () {
      this.$emit('closeDrawer')
    },
    /**
     * 处理角色选择
     * @param val
     */
    handleRoleChange(val) {
      this.wikiRole = val || {}
    },
    is_edit () {
      return !['', 'null', 'undefined'].includes(this.current_proc_obj.id + '')
    },
  }
}
</script>

<style lang="scss">
.el-table-column--selection >>> .cell {
  padding-left: 0px !important;
}
.custom_class {
  border: none !important;
  padding: 0px !important;
  max-width: 100% !important;
}
.linkNameTips .el-form-item__error {
  top: 30px;
  left: calc(50% + 10px) !important;
}
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>

<style>
.dash-divider {
  margin: 18px 0;
  background-image: linear-gradient(to right, #DCDFE6 0%, #DCDFE6 50%, transparent 50%);
  background-size: 6px 1px;
  background-repeat: repeat-x;
  background-color: transparent;
}
.setting-type-tabs {
  height: calc(100% - 60px);
}

/*.setting-type-tabs > .el-tabs__header > .el-tabs__nav-wrap {
  margin-bottom: 16px;
}*/
.setting-type-tabs .el-tabs__content {
  height: calc(100% - 40px);
  overflow: auto;
  margin-top: 16px;
  margin-right: -32px;
  padding-right: 32px;
}
.property-label {
  display: block;
  line-height: 24px;
  margin: 0 0 4px 0;
}
.workflow-radio-group{
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.el-radio.workflow-radio .el-radio__label {
  width: 130px !important;
}
</style>
