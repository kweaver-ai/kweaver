<template>
  <div>
    <el-form-item class="sm_item1">
      <label class="font-bold">{{ $t('sync.chooseAuditor') }}：</label>
    </el-form-item>
    <div>
      <ProcessSelect
         ref="processSelect"
         v-if="showProcessSelect"
         @output="confirmProperties"
         @closeProperties="closeProperties"
         @onChangeCheckUser="handleChangeCheckUser"
         :audit_model="audit_model"
         :checkedUsers="auditorIds"
         :processDisable="processDisable"
      />
    </div>
    <el-form-item>
      <label class="font-bold" style="margin-top: 16px;">{{ $t('modeler.auditMode') }}：</label>
      <div>
        <el-radio-group v-model="audit_model">
          <p><el-radio label="tjsh">{{$t('modeler.dealTypeTips.tjsh')}}</el-radio></p>
          <p><el-radio label="hqsh">{{$t('modeler.dealTypeTips.hqsh')}}</el-radio></p>
          <p v-if="!selectGroup"><el-radio label="zjsh">{{$t('modeler.dealTypeTips.zjsh')}}</el-radio></p>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'n'">
      <label class="font-bold">{{$t('deptAuditorRule.namedNoAuditorTypeLabel')}}</label>
      <v-popover  effect="light" placement="bottom" offset="24" container="#workflow-client-ui-content" trigger="hover" openclass="strategyTooltip"  class="strategyTooltip" 
       :style="($i18n.locale === 'en-us' ||$i18n.locale === 'vi-vn' ? 'left: 288px;': $i18n.locale === 'zh-cn'? 'left: 108px;' :'left: 118px;')
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
    <el-form-item v-if="$store.state.app.secret.status === 'y'">
      <p style="color: rgba(0, 0, 0, 0.45)">{{$t('deptAuditorRule.autoRejectSecretTip')}}</p>
    </el-form-item>
    <!-- 希望将tooltip的弹出部分内容的dom放在这里面 -->
    <div ref="elementUiMount"></div>
  </div>
</template>

<script>
import ProcessSelect from '../process-selector/index'
import { getInfoByTypeAndIds } from '@/api/user-management'
export default {
  name: 'namedAuditorStrategy',
  components: { ProcessSelect },
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
  data () {
    return {
      showProcessSelect: true,
      auditorIds: [],
      audit_model: 'zjsh',
      selectGroup:false,
      no_auditor_type: 'auto_reject',
      own_auditor_type:'auto_reject'
    }
  },
  created () {
    this.initStrtegyAuditor(this.approver_config, this.doc_audit_strategy_data)
  },
  mounted () {
    // 在mounted的时候只需要使用这句话。
    // if(this.$store.state.app.secret.status === 'n'){
    //   this.$refs.elementUiMount.appendChild(this.$refs.namedNoAuditorTypeLabelToolTip.popperVM.$el)
    // }
  },
  methods: {
    /**
     * 初始化审核策略
     */
    initStrtegyAuditor (_config, strategyList) {
      const _this = this
      let auditorIds = []
      _this.initForm()
      _this.reloadShowprocessSelect()
      strategyList.forEach(strategy => {
        if (strategy.act_def_id === _config.nodeId  && strategy.strategy_type === 'named_auditor') {
          _this.audit_model = strategy.audit_model
          _this.no_auditor_type = strategy.no_auditor_type
          _this.own_auditor_type = strategy.own_auditor_type
          strategy.auditor_list.forEach(auditor => {
            auditorIds.push(auditor)
          })
        }
      })
      _this.auditorIds = auditorIds
    },
    initForm () {
      this.audit_model = 'zjsh'
      this.no_auditor_type = 'auto_reject'
      this.own_auditor_type = 'auto_reject'
    },
    /**
     * 重新加载组件
     */
    reloadShowprocessSelect () {
      const _this = this
      _this.showProcessSelect = false
      _this.$nextTick(function () {
        _this.showProcessSelect = true
      })
    },
    handleConfirm() {
      this.$refs.processSelect.confirm()
    },
    /**
     * 确认配置
     */
    confirmProperties (_obj) {
      const _this = this
      _obj.audit_model = _this.audit_model
      _obj.no_auditor_type = _this.no_auditor_type
      _obj.own_auditor_type = _this.own_auditor_type
      _obj.strategy_type = 'named_auditor'
      const auditorList = _obj.auditor_list
      let ids = []
      const groups = []
      auditorList.forEach(user => {
        if(user.type === 'user') {
          ids.push(user.user_id)
        } else if(user.type === 'group') {
          groups.push(user)
        }
      })
      // 显示名重新赋值，防止确认前，用户显示名变更
      getInfoByTypeAndIds('user', ids).then(res => {
        const userList = res
        auditorList.forEach(e => {
          let findUserList = userList.filter(user => user.id === e.user_id)
          e.user_name = findUserList.length > 0 ? findUserList[0].name : e.user_name
        })
        _obj.auditor_list = auditorList
        _this.$emit('output', _obj)
      })
    },
    /**
     * 关闭配置
     */
    closeProperties () {
      this.$emit('closeProperties')
    },
    handleChangeCheckUser(data) {
      const group = data.filter((i)=>i.type ==='group' || i.org_type === 'group')
      if(group.length > 0) {
        this.selectGroup = true
        if(this.audit_model === 'zjsh') {
          this.audit_model = 'tjsh'
        }
      }else {
        this.selectGroup = false
      }
    }
  }
}
</script>

<style scoped>
</style>
