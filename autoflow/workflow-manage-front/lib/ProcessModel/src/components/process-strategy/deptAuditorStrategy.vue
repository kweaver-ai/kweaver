<template>
  <div>
    <el-form-item>
      <el-form-item class="ruleIdTips">
      <div class="red-zs">
        <rule-properties-template :ruleId="rule_id" ref="ruleProperties"  style="max-height: 462px;margin-bottom: 15px"></rule-properties-template>
      </div>
    </el-form-item>
      <label class="font-bold">{{ $t('deptAuditorRule.strategyType4') }}</label>
      <div style="margin-top: 5px">
        <el-radio-group v-model="strategy_type" style="display:block" @change="strategyTypeChange">
          <el-radio label="dept_auditor">{{ $t('deptAuditorRule.strategyType5') }}
            <el-tooltip effect="light" popper-class="strategyTooltip" placement="top" >
              <div slot="content" class="sm-box1" style="width: 320px">
                <p class="title">{{ $t('deptAuditorRule.assignAuditorExplainTitle') }}</p>
                <p>{{ $t('deptAuditorRule.assignAuditorExplain1') }}</p>
              </div>
              <span style="cursor: pointer"><i class="icon-state" style="top:-8px;margin-left:8px" /></span>
            </el-tooltip>
          </el-radio>
          <el-radio label="multilevel" style="margin-left: 36px">{{ $t('deptAuditorRule.strategyType3') }}
            <el-tooltip effect="light" placement="top" :popper-class="'custom_class'" ref="strategyType3ToolTip">
              <div slot="content" class="sm-box1">
                <i  v-if="$i18n.locale === 'zh-tw'" class="icon-title-tw"/>
                <i  v-if="$i18n.locale === 'en-us'" class="icon-title-en"/>
                <i  v-if="$i18n.locale === 'zh-cn'" class="icon-title-cn"/>
              </div>
              <span style="cursor: pointer"><i class="icon-state" style="top:-8px;margin-left:8px" /></span>
            </el-tooltip>
          </el-radio>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item>
      <label class="font-bold">{{levelTypeLabel}}
        <el-tooltip effect="light" popper-class="strategyTooltip" placement="top" v-if="strategy_type === 'multilevel'">
          <div slot="content" class="sm-box1" style="width: 320px">
            <p class="title">{{ $t('deptAuditorRule.auditEndPointTitle') }}</p>
            <p>{{ $t('deptAuditorRule.auditEndPoint1') }}</p>
          </div>
          <span style="cursor: pointer"><i class="icon-state" style="top:-4px;margin-left:4px" /></span>
        </el-tooltip>
      </label>
      <div>
        <el-select v-model="level_type" :placeholder="$t('deptAuditorRule.choose')" style="width: 50%;" clearable>
          <el-option-group v-for="group in options" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value"/>
          </el-option-group>
        </el-select>
        <el-tooltip effect="light" popper-class="strategyTooltip" placement="top" v-if="strategy_type === 'dept_auditor'">
          <div slot="content" class="sm-box1" style="width: 320px">
            <p class="title">{{ $t('deptAuditorRule.levelTypeExplainTitle') }}</p>
            <p>{{ $t('deptAuditorRule.levelTypeExplain1') }}</p>
          </div>
          <span style="cursor: pointer"><i class="icon-state" style="margin-left:8px"/></span>
        </el-tooltip>
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
  <!-- 希望将tooltip的弹出部分内容的dom放在这里面 -->
</template>

<script>
import { getDeptAuditorRulePage } from '@/api/deptAuditorRule.js'
import rulePropertiesTemplate  from '@/views/dept-auditor-rule/rulePropertiesTemplate'
import {getInfoByTypeAndIds } from '@/api/user-management'
import dialogMixin from '@/mixins/dialog-mixin'
export default {
  name: 'deptAuditorStrategy',
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
      own_auditor_type:'auto_reject',
      level_type: '',
      rule_id: '',
      strategy_type:'',
      ruleSelectScrollLoad: true,
      deptAuditorRuleList: [],
      options:[],
      levelTypeLabel:'',
      noAuditorTypeLabel:'',
      ruleScrollLoad: true,
      auditModelLabel:'',
      queryDeptAuditorRule: {
        offset: 0,
        // process_client: 1,
        limit: 20
      },
      deptOptions: [{
        options: [{
          value: 'directlyLevel',
          label: this.$i18n.tc('deptConfig.directlyLevel')
        }, {
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
      }],
      multileveloptions: [{
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
      }],
    }
  },
  computed: {
    deptAuditorRuleUrl(){
      return this.$store.getters.context?.deptAuditorRuleUrl || '#/home/widget-workflow-manage-front-deptAuditorRule'
    }
  },
  created () {
    this.initDeptAuditorRule()
    this.strategy_type = 'dept_auditor'

  },
  mounted(){
    // 绑定滚动条事件
    this.$nextTick(() => {
      setTimeout(() => {
        const dom = document.querySelector('div[name=scrollWrap]')
        if(dom){
          dom.addEventListener('scroll', this.ruleSelectHandleScroll)
        }
      }, 1000)
    })
  },
  methods: {
    /**
     * 初始化表单
     */
    initForm () {
      const _this = this
      _this.audit_model = 'tjsh'
      _this.no_auditor_type = 'auto_reject'
      _this.own_auditor_type = 'auto_reject'
      if(_this.strategy_type === 'multilevel'){
        _this.level_type = 'highestLevel'
      }else{
        _this.level_type = 'directlyLevel'
      }
    },
    /**
     * 初始化审核策略
     */
    initStrtegyAuditor (_config, strategyList,flag) {
      const _this = this
      if(typeof flag === 'undefined'){
        _this.initForm()
      }else{
        _this.rule_id = ''
      }
      strategyList.forEach(strategy => {
        if (strategy.act_def_id === _config.nodeId && (strategy.strategy_type === 'dept_auditor' || strategy.strategy_type === 'multilevel')) {
          _this.audit_model = strategy.audit_model
          _this.no_auditor_type = strategy.no_auditor_type
          _this.own_auditor_type = strategy.own_auditor_type
          _this.level_type = strategy.level_type
          _this.$refs.ruleProperties.deptAuditorSetResult = strategy.dept_auditor_rule_list
          if(strategy.dept_auditor_rule_list === null) {
            _this.$refs.ruleProperties.deptAuditorSetResult = []
          }
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
    confirmProperties () {
      const _this = this
      _this.checkAuditorExistence(_this.$refs.ruleProperties.deptAuditorSetResult);
    },
    goDeptAuditRule () {
      window.open(this.deptAuditorRuleUrl)
    },
    loadDeptAuditorRuleOption (obj) {
      if (obj === true) {
        const _this = this
        _this.ruleScrollLoad = true
        getDeptAuditorRulePage({ offset: 0, limit: _this.queryDeptAuditorRule.offset === 0 ? _this.queryDeptAuditorRule.limit : _this.queryDeptAuditorRule.offset  }).then(response => {
          _this.deptAuditorRuleList = response.entries
          if (_this.rule_id === '') {
            return
          }
          const _array = this.deptAuditorRuleList.filter(item => item.rule_id === _this.rule_id)
          if (_array.length === 0) {
            _this.initStrtegyAuditor(_this.approver_config, _this.doc_audit_strategy_data,true)
          }
        }).catch(() => { })
      }
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
    closeProperties () {
      this.$emit('closeProperties')
    },
    initStrategyTypeItem(){
      const _this = this
      _this.options = _this.deptOptions
      _this.levelTypeLabel = _this.$t('deptAuditorRule.levelTypeLabel')
      _this.noAuditorTypeLabel = _this.$t('deptAuditorRule.noAuditorTypeLabel')
      _this.auditModelLabel = _this.$t('deptAuditorRule.auditModelLabel')
      if(_this.strategy_type === 'multilevel'){
        _this.options = _this.multileveloptions
        _this.levelTypeLabel = _this.$t('deptAuditorRule.multilevelTypeLabel')
        _this.noAuditorTypeLabel = _this.$t('deptAuditorRule.multiNoAuditorTypeLabel')
        _this.auditModelLabel = _this.$t('deptAuditorRule.multiAuditModelLabel')
      }
    },
    strategyTypeChange(){
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
</style>
