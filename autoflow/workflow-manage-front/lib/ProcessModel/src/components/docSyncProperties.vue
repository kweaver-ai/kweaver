<template>
  <div class="basicProperties no-border-bottom">
    <div class="no-border">
      <div class="card-body">
        <el-form ref="syncPropertiesForm" :model="form" label-position="left" :label-width="$i18n.locale === 'en-us'?'145px':'120px'" size="small" :rules="rules">
          <template>
            <el-form-item prop="name">
              <template slot="label"><label class="font-bold"><span class="red"> * </span>{{ $t('modeler.nodeName') }}：</label></template>
              <el-input v-model="form.name" style="width: 300px;" :disabled="processDisable" @change="dealFormName"/>
            </el-form-item>
            <el-form-item>
              <template slot="label"><label class="font-bold">{{ $t('modeler.auditMode') }}：</label></template>
              <el-select v-model="audit_model" :disabled="processDisable" style="width: 300px;">
                <el-option :label="$t('modeler.dealTypeTips.tjsh')" value="tjsh"/>
                <el-option :label="$t('modeler.dealTypeTips.hqsh')" value="hqsh"/>
                <el-option :label="$t('modeler.dealTypeTips.zjsh')" value="zjsh"/>
              </el-select>
            </el-form-item>
            <el-form-item>
              <template slot="label"><label class="font-bold" >{{ $t('sync.chooseAuditor') }}：</label></template>
            </el-form-item>
          </template>
        </el-form>
        <div>
          <SynceSelect ref="syncSelect" v-if="showSyncSelect" @output="confirmProperties" @closeProperties="closeDrawer" :audit_model="audit_model" :checkedUserIds="auditorIds" :processDisable="processDisable"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SynceSelect from './sync-selector/index'
export default {
  name: 'DocSyncProperties',
  components: { SynceSelect },
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
  data() {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if(/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)){
        callback(new Error(this.$i18n.tc('modeler.illegalCharacterPrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 20){
        callback(new Error(this.$i18n.tc('modeler.linkNameLengthErrorBack')))
      } else {
        callback()
      }
    }
    return {
      showSyncSelect: true,
      form: {},
      audit_model: 'tjsh',
      approverConfig:{},
      auditorIds:[],
      strategyList:[],
      rules: {
        name: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'change' },
          { required: true, trigger: 'change', validator: validateName }
        ]
      }
    }
  },
  watch: {
    form: {
      deep: true,
      handler: function(nVal) {
        let approverConfig = {...this.approverConfig}
        approverConfig.nodeName = nVal.name
        this.$emit('updateApproverConfig', approverConfig)
      }
    }
  },
  created(){
    this.approverConfig = this.approver_config
    this.initForm(this.approverConfig)
    this.initStrtegyAuditor(this.approverConfig, this.doc_audit_strategy_data)
  },
  methods: {
    /**
       * 初始化表单
       */
    initForm(_config){
      this.approverConfig = _config
      this.form = {
        ...this.form,
        id: _config.nodeId,
        name: _config.nodeName
      }
    },
    /**
       * 初始化审核策略
       */
    initStrtegyAuditor(_config, strategyList){
      const _this = this
      let auditorIds = []
      _this.audit_model = 'tjsh'
      _this.reloadShowSyncSelect()
      strategyList.forEach(strategy => {
        if(strategy.act_def_id === _config.nodeId){
          _this.audit_model = strategy.audit_model
          strategy.auditor_list.forEach(auditor => {
            auditorIds.push(auditor.user_id)
          })
          _this.setApproverConfigUsers(strategy)
        }
      })
      _this.auditorIds = auditorIds
      _this.strategyList = strategyList
    },
    /**
       * 确认属性配置
       * @param _obj
       */
    confirmProperties(_obj) {
      const _this = this
      _obj.doc_id = ' '
      _obj.doc_type = ' '
      _obj.act_def_id = _this.form.id
      _obj.act_def_name = _this.form.name
      _obj.audit_model = _this.audit_model

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
    },
    /**
       * 设置审核环节审核员（用于校验）
       * @param _obj
       */
    setApproverConfigUsers(_obj){
      const _this = this
      let approverConfig = {..._this.approverConfig}
      approverConfig.nodeName = _this.form.name
      _obj.auditor_list.length > 0 ? approverConfig.nodeUserList.push(_obj.auditor_list[0].user_id) : ''
      _this.$emit('updateApproverConfig', approverConfig)
    },
    /**
       * 表单检验
       */
    checkValidate(){
      let result = true
      this.$refs['syncPropertiesForm'].validate(valid => {
        result = valid
      })
      return result
    },
    /**
       * 重新加载组件
       */
    reloadShowSyncSelect(){
      const _this = this
      _this.showSyncSelect = false
      _this.$nextTick(function () {
        _this.showSyncSelect = true
      })
    },
    /**
       * 处理环节名称
       */
    dealFormName(){
      this.form.name = this.form.name.replace(/(^\s*)|(\s*$)/g, '')
    },
    /**
       * 关闭抽屉
       */
    closeDrawer(){
      this.$emit('closeDrawer')
    }
  }
}
</script>

<style lang="scss" scoped>
  .el-table-column--selection >>> .cell{
    padding-left:0px !important;
  }
</style>
