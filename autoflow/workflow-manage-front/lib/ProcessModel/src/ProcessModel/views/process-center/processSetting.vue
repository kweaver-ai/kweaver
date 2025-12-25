<!-- 流程中心，流程设置-->
<template>
  <div>
    <el-container>
      <div class="fd-nav-content" v-loading="loading">
        <section class="dingflow-design">
          <div v-if="is_show && nodeConfig.nodeId">
            <div id="box-scale" :style="'transform: scale('+nowVal/100+'); transform-origin: 50% 0px 0px;'" class="box-scale">
              <el-button v-if="!isTemplate" plain style="min-width: 144px;margin: 0 0 0 38px;padding: 15px 10px;font-size: 13px;border:none;position: absolute;z-index: 99;top:34px;box-shadow: 0 0 10px 0 rgb(0 0 0 / 20%);" @click="openTemplate">
                {{ $t('modeler.common.templateSelection') }}>>
              </el-button>
              <nodeWrap
                :node-config.sync="nodeConfig"
                :flow-permission.sync="flowPermission"
                :addNodeDisabled.sync="addNodeDisabled"
                :node-list="getProcessNodeList"
                :proc-type="proc_type"
                v-if="nodeWrapShow"
                @openPropertiesDrawer="openPropertiesDrawer"
                @updateIsChange="updateIsChange"
                @setFirstNodeNoAuditorType="setFirstNodeNoAuditorType"
              />
              <nodeEnd></nodeEnd>
            </div>
          </div>
        </section>
      </div>
    </el-container>
    <div>
      <el-drawer
        :visible.sync="propertiesDrawer"
        :custom-class="'no-header'"
        append-to-body
        modal-append-to-body
        :wrapperClosable="false"
        @mousedown.native="handleWrapperMousedown($event)"
        @mouseup.native="handleWrapperMouseup($event)"
        size="50%"
      >
        <process-properties
          ref="processProperties"
          :current_proc_obj.sync="current_proc_obj"
          :proc_def_key="proc_def_key"
          :approver_config.sync="approver_config"
          :doc_audit_strategy_data="current_proc_obj.docShareStrategyList"
          :processDisable="processDisable"
          :allowAddSign="allowAddSign"
          :allowDynamicAuditor="allowDynamicAuditor"
          :allowExecutingAuditor="allowExecutingAuditor"
          :allowUserGroup="allowUserGroup"
          :externalUserSelect="externalUserSelect"
          :allowOwnerAuditor="allowOwnerAuditor"
          :onlyOwnerAuditor="onlyOwnerAuditor"
          @confirmProperties="confirmProperties"
          @updateApproverConfig="updateApproverConfig"
          @closeDrawer="propertiesDrawer = false"
        />
      </el-drawer>
    </div>
    <div class="template-drawer">
      <el-drawer
         :visible.sync="templateDrawer"
         :custom-class="'no-header drawer-1'"
         :modal="false"
         :title="$t('modeler.common.templateSelection')"
         :direction="'ltr'"
         :before-close="closeView"
         size="400px">
          <process-template ref="processTemplate" :time="new Date()" @useTheTemplate="useTheTemplate"></process-template>
      </el-drawer>
    </div>
    <warnMsg :warnMsgList="warnMsgList" :msgVisible="msgVisible" @closeWarnMsg="closeWarnMsg"></warnMsg>
    <processForm ref="stepProcessForm" :process_obj='current_proc_obj' :template="template" :isTemplate="isTemplate" @output="stepProcessFormCall"></processForm>
  </div>
</template>
<script>
import nodeWrap from '../../../components/nodeWrap'
import nodeEnd from '../../../components/nodeEnd'
import processProperties from '../../../components/processProperties'
import processTemplate from '../../../components/processTemplate'
import processSetting from '../../../mixins/processSetting'
import processForm from './processForm'
import warnMsg from '../../../components/warnMsg'
import {
  procDefInfo,
  savePro,
  processEffective
} from '@/api/processDefinition.js'
import { getInfoByTypeAndIds } from '@/api/user-management'
import { isShowTooltip } from '@/utils/common'
import { uuid8 } from '../../../utils/uuid.js'
export default {
  name: 'ProcessSetting',
  components: { processForm, nodeWrap, nodeEnd, warnMsg, processProperties, processTemplate },
  mixins: [processSetting],
  props: {
    tenant_id: {
      type: String,
      required: true
    },
    process_obj: {
      type: Object,
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
    proc_copy_name: {
      type: String,
      required: false
    },
    visit: {
      type: String
    },
    is_setting_change: {
      type: Boolean
    },
    allowAddSign: {
      type: Boolean,
      required: false,
      default: true
    },
    allowDynamicAuditor: {
      type: Boolean,
      require: false,
      default: true
    },
    allowExecutingAuditor: {
      type: Boolean,
      required: false,
      default: false
    },
    allowUserGroup: {
      type: Boolean,
      required: false,
      default: true
    },
    externalUserSelect: {
      type: Function,
      required: false
    },
    isTemplate:{
      type: Boolean,
      default:false
    },
    isArbitraly:{
      type: Boolean,
      default:false
    },
    arbitrailyVal:{
      type: Object,
      required: false
    }
  },
  data() {
    return {
      nodeWrapShow: true,
      msgVisible: false,
      loading: false,
      initLoading: false,
      tooltipDisabled: false,
      propertiesDrawer: false,
      templateDrawer: false,
      processDisable:false,
      template:'',
      showDropdown:true,
      classmodel:false,
      process_list:[],
      warnMsgList:[],
      current_proc_obj:{},
      approver_config: {},
      save_audit_flow:{},
      advancedSetup: {},
      flow_xml: '',
      nowVal: 100
    }
  },
  computed: {
    is_show() {
      if (this.visit !== 'new') {
        return this.process_obj.proc_def_key !== ''
      }
      return true
    },
    getProcessNodeList: {
      get() {
        let nodeList = this.getNodeList(this.processConfig)
        return nodeList
      }
    },
    allowOwnerAuditor(){
        if(this.$store.state.app.arbitraily && typeof this.$store.state.app.arbitraily.allowOwnerAuditor === 'boolean'){
          return this.$store.state.app.arbitraily.allowOwnerAuditor
        }
        return false
    },
    onlyOwnerAuditor(){
        if(this.$store.state.app.arbitraily && typeof this.$store.state.app.arbitraily.onlyOwnerAuditor === 'boolean'){
          return this.$store.state.app.arbitraily.onlyOwnerAuditor
        }
        return false
    },
  },
  created() {
    this.addNodeDisabled = false
    if (this.visit === 'new') {
      this.newProcess()
    } else if (this.visit === 'copy') {
      this.copyProcess()
    } else {
      this.current_proc_obj = this.process_obj
      this.processDisable = this.visit === 'preview'
      // eslint-disable-next-line no-unused-vars
      this.initProcessConfig(
        this.process_obj.flow_xml,
        this.proc_def_key,
        this.process_obj.name
      ).then((res) => {
        this.initSetApproverConfigUsers()
        this.loadNodeWrapUsersView()
      })
    }
  },
  methods: {
    /**
     * 获取流程建模信息
     * @param _procDefId
     */
    getProcessInfo(_procDefId) {
      return new Promise((resolve, reject) => {
        procDefInfo(_procDefId)
          .then((res) => {
            resolve(res)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    /**
     * 插件保存流程时回调
     */
    saveAuditFlow (){
      const _this = this
      if(!['', 'null', 'undefined'].includes(_this.arbitrailyVal + '') && JSON.stringify(_this.arbitrailyVal) !== '{}'){
          _this.arbitrailyVal.onSaveAuditFlow({..._this.save_audit_flow, generateKey:()=>{
            const uuid = 'Process_' + uuid8(8,62)
            return uuid
          }})
      }
    },
    /**
     * 判断该流程是否失效
     * @param _procDefId
     */
    async processEffective(_procDefId) {
      const _this = this
      return new Promise((resolve, reject) => {
        processEffective(_procDefId)
          .then(res => {
            if(res.effectivity === 1){
              const tip = _this.isTemplate ?
               _this.$i18n.tc('sync.processEffectiveModel'):
               _this.$i18n.tc('sync.processEffective')
              _this.$alert(tip, '', {
                confirmButtonText: _this.$i18n.tc('button.confirm'),
                iconClass: 'warning-blue',
                type: 'warning'
              }).then(() => {
                _this.$emit('change', false)
                _this.$emit('goBack')
                resolve(false)
              }).catch(() => {})
            }else{
              resolve(true)
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    /**
     * 新建流程
     */
    newProcess() {
      const _this = this
      let process_id = 'Process_' + uuid8(8, 62)
      let newProcess = {
        name: '',
        key: process_id,
        tenant_id: _this.tenant_id,
        type: _this.process_obj.type,
        type_name: _this.process_obj.type_name,
        docShareStrategyList: []
      }
      _this.setProcessAssemble('new', newProcess)
    },
    /**
     * 复制流程
     */
    copyProcess() {
      const _this = this
      let process_id = 'Process_' + uuid8(8, 62)
      let copyProcess = _this.process_obj
      copyProcess.key = process_id
      copyProcess.id = ''
      _this.setProcessAssemble('copy', copyProcess)
    },
    /**
     * 使用模板
     */
    initTemplate (_process_obj) {
      const _this = this
      if(_this.is_edit() === 'new'){
        let process_id = 'Process_' + uuid8(8, 62)
        _process_obj.key = process_id
        _process_obj.id = ''
      }else{
        _process_obj.key = _this.current_proc_obj.key
        _process_obj.id =  _this.current_proc_obj.id
      }
      _this.setProcessAssemble('copy', _process_obj)
    },
    /**
     * 点击保存并生成模板
     */
    generateTemplate (_process_obj) {
      const _this = this
      let process_id = 'Process_' + uuid8(8, 62)
      let templateProcess = _process_obj
      templateProcess.key = process_id
      templateProcess.id = ''
      _this.setProcessAssemble('template', templateProcess)
    },
    /**
     * 是否修改
     */
    is_edit() {
      if(this.arbitrailyVal && this.arbitrailyVal.visit === 'update') {
        return true
      }
      return !['', 'null', 'undefined'].includes(this.current_proc_obj.id + '')
    },
    /**
     * 更新流程变更状态
     */
    updateIsChange() {
      this.$emit('change', true)
    },
    /**
     * 设置第一个节点的未匹配审核的审核类型
     */
    setFirstNodeNoAuditorType() {
      let obj = {
        nodeConfig: this.nodeConfig,
        firstNodeId: ''
      }
      const resultItem = this.getFirstNodeId(obj)
      let strategyList = this.current_proc_obj.docShareStrategyList
      strategyList.forEach((strategy) => {
        if (strategy.act_def_id === resultItem.firstNodeId) {
          strategy.no_auditor_type = 'auto_reject'
        }
      })
      this.current_proc_obj.docShareStrategyList = strategyList
    },
    /**
     * 新建编辑流程信息回调
     * @param _opt
     * @param _procObj
     */
    setProcessAssemble(_opt, _procObj) {
      const _this = this
      if (_opt === 'new') {
        _this.initProcessConfig(null, _procObj.key, _procObj.name)
      } else if (_opt === 'copy') {
        // eslint-disable-next-line no-unused-vars
        _this.initProcessConfig(_procObj.flow_xml, _procObj.key, _procObj.name).then(res => {
          _this.initSetApproverConfigUsers()
          _this.loadNodeWrapUsersView()
        })
        _this.$emit("updateAdvancedSetup",_procObj.advancedSetup)
      }else if(_opt === 'template') {
        // 保存并生成模板重新渲染数据
        _this.initProcessConfig(_procObj.flow_xml, _procObj.key, _procObj.name).then(() => {
          _this.current_proc_obj.template = 'Y'
          // 保存并生成模板重新复制流程名称（解决第二次点击保存模板名称不更新的问题）
          _this.processConfig.workFlowDef.name = _procObj.name
          _this.initSetApproverConfigUsers()
          _this.loadNodeWrapUsersView()
          _this.saveProTemplate('new')
        })
      } else{
        _this.processConfig.workFlowDef.name = _procObj.name
        if (!['', 'null', 'undefined'].includes(_procObj.flow_xml + '')) {
          _this.save('updateName')
        }
      }
      _this.current_proc_obj = _procObj
      _this.$emit('change', true)
    },
    /**
     * 新建编辑流程信息回调
     * @param _opt
     * @param _procObj
     */
    stepProcessFormCall(_opt, _procObj) {
      const _this = this
      _this.current_proc_obj = _procObj
      _this.processConfig.workFlowDef.name = _procObj.name
      let opt = _this.is_edit() ? 'update' : 'new'
      return new Promise((resolve) => {
        _this.deployPre(opt, resolve)
      }).then(() => {
          if (_this.template === 'Y') {
            _this.generateTemplate(_procObj)
          }
        })
    },
    /**
     * 初始化审核环节审核员（用于校验）
     */
    initSetApproverConfigUsers() {
      const _this = this
      const strategyList = !['', 'null', 'undefined'].includes(
        _this.current_proc_obj.docShareStrategyList + ''
      )
        ? _this.current_proc_obj.docShareStrategyList
        : []
      let initObj = {
        nodeConfig: _this.nodeConfig
      }
      const initResult = _this.initNodeUsers(initObj, strategyList)
      _this.nodeConfig = initResult.nodeConfig
    },
    /**
     * 检查审核策略是否存在环节（环节删除移除审核策略）
     */
    checkApproverConfigStrategy() {
      const _this = this
      const strategyList = !['', 'null', 'undefined'].includes(
        _this.current_proc_obj.docShareStrategyList + ''
      )
        ? _this.current_proc_obj.docShareStrategyList
        : []
      // 过滤审核策略集合中，环节已被删除在的策略
      let approverConfigStrategyList = []
      strategyList.forEach((strategy) => {
        let checkObj = {
          nodeConfig: _this.nodeConfig,
          strategy: strategy,
          result: false
        }
        const checkResult = _this.checkNodeStrategy(checkObj)
        if (checkResult.result) {
          approverConfigStrategyList.push(checkResult.strategy)
        }
      })
      // 根据环节节点的顺序对审核策略进行排序
      let sortedConfigStrategyList = []
      let sortObj = {
        nodeConfig: _this.nodeConfig,
        approverConfigStrategyList: approverConfigStrategyList,
        sortedConfigStrategyList: sortedConfigStrategyList
      }
      const sortedResult = _this.sortNodeStrategy(sortObj)
      _this.current_proc_obj.docShareStrategyList =
        sortedResult.sortedConfigStrategyList
    },
    /**
     * 开启环节属性配置界面
     */
    openPropertiesDrawer(_config) {
      const _this = this
      _this.approver_config = _config
      if (_this.$refs.processProperties !== undefined) {
        const strategyList = !['', 'null', 'undefined'].includes(
          _this.current_proc_obj.docShareStrategyList + ''
        )
          ? _this.current_proc_obj.docShareStrategyList
          : []
        _this.$refs.processProperties.initForm(_config)
        _this.$refs.processProperties.initApproverConfig(_config, strategyList)
        _this.$refs.processProperties.initStrategy(_config, strategyList)
      }
      _this.propertiesDrawer = true
    },
    /**
     * 更新审核环节配置信息
     * @param _config
     */
    updateApproverConfig(_config) {
      const _this = this
      let configObj = {
        nodeConfig: _this.nodeConfig,
        nodeId: _config.nodeId,
        node: _config
      }
      const checkResult = _this.settingNodeName(configObj)
      _this.nodeConfig = checkResult.nodeConfig
    },
    /**
     * 校验流程环节审核员配置
     */
    checkNodeConfigUsers(nodeId) {
      const _this = this
      const strategyList = !['', 'null', 'undefined'].includes(
        _this.current_proc_obj.docShareStrategyList + ''
      )
        ? _this.current_proc_obj.docShareStrategyList
        : []
      let checkObj = {
        nodeConfig: _this.nodeConfig,
        strategyList: strategyList,
        result: true
      }
      const checkResult = _this.checkNodeSetStrategy(checkObj, nodeId)
      _this.nodeConfig = checkResult.nodeConfig
      return checkResult.result
    },
    /**
     * 确认环境配置参数
     * @param _objArr
     */
    confirmProperties(_objArr, nodeId) {
      this.current_proc_obj.docShareStrategyList = _objArr
      this.checkNodeConfigUsers(nodeId)
      this.propertiesDrawer = false
      this.$emit('change', true)
      this.loadNodeWrapUsersView()
    },
    /**
     * 加载环节审核员显示
     */
    loadNodeWrapUsersView() {
      const _this = this
      let viewAuditors = _this.getViewAuditors()
      let viewObj = {
        nodeConfig: _this.nodeConfig
      }
      const viewResult = _this.loadNodeUsersView(viewObj, viewAuditors)
      _this.nodeConfig = viewResult.nodeConfig
      _this.nodeWrapShow = false
      _this.$nextTick(() => {
        _this.nodeWrapShow = true
      })
    },
    /**
       * 流程保存前置处理（设置流程名称）
       * @param command
       */
    async saveProcessPre(_template) {
      const _this = this
      // 判断该流程是否存在(排除传入configData修改的场景)
      if(_this.is_edit() && (!_this.arbitrailyVal || typeof _this.arbitrailyVal.configData !== "object")){
        try {
          const flag = await _this.processEffective(_this.current_proc_obj.key)
          if(flag === false){
            this.$message.warning(this.$tc("sync.processNotFound"))
            return
          }
        } catch (error) {
          this.$message.warning(error.response.data.message)
          return
        }
        
      }
      // 判断是保存模板还是保存流程
      _this.template = _template === 'Y' ? 'Y' : ''
      // 流程中心直接创建模板
      if (_this.isTemplate) {
        _this.current_proc_obj.template = 'Y'
      }

      if (_this.visit === 'copy') {
        _this.processConfig.workFlowDef.name = _this.proc_copy_name
        _this.current_proc_obj.name = _this.proc_copy_name
      }
      _this.save()
    },
    /**
     * 保存流程
     * @param rqType
     * @returns {Promise<any>}
     */
    save() {
      const _this = this
      let valid = true
      let opt = _this.is_edit() ? 'update' : 'new'
      if (_this.$refs.processProperties !== undefined) {
        valid = _this.$refs.processProperties.checkValidate()
      }
      return new Promise(resolve => {
        if(valid && _this.checkNodeConfigUsers(null)){
          _this.checkUserAutitor().then(result => {
            if(result){
              // 检查审核策略是否存在环节（环节删除移除审核策略）
              _this.checkApproverConfigStrategy()
              if(this.visit === 'copy'){
                _this.deployPre(opt, resolve)
              } else {
                // 插件参数定义不需要编辑名称时跳过确定名称步骤
                if(!['', 'null', 'undefined'].includes(_this.arbitrailyVal + '') 
                && JSON.stringify(_this.arbitrailyVal) !== '{}'
                && _this.arbitrailyVal.allowEditName === false
                && _this.template !== 'Y'){
                  if(!_this.current_proc_obj.name){
                    _this.current_proc_obj.name = this.$i18n.tc('modeler.newProcess')
                  }
                  this.$refs['stepProcessForm'].openProcessTitle('skip', this.current_proc_obj)
                }else {
                  this.$refs['stepProcessForm'].openProcessTitle('update', this.current_proc_obj)
                }
              }
            }
          })
            .catch(() => {})
        }
      })
    },
    /**
     * 保存模板
     */
    saveProTemplate(opt) {
      const _this = this
      return new Promise(resolve => {
        _this.deployPre(opt, resolve)
      })
    },
    deployPre(opt, resolve) {
      const _this = this
      _this
        .getBpmnXml()
        .then((res) => {
          // encodeURIComponent(encodeURIComponent(ckeditData)
          _this.flow_xml = res
          _this
            .deploy(opt)
            .then((res) => {
              resolve(res)
            })
            .catch(() => {})
        })
        .catch(() => {})
    },
    /**
     * 部署流程
     * @param opt
     * @returns {Promise<*>}
     */
    async deploy(type) {
      const _this = this
      const _saveObj = {
        ..._this.current_proc_obj,
        is_copy: _this.visit === 'copy' ? 1 : 0,
        advanced_setup:  _this.advancedSetup,
        flow_xml: _this.encode(_this.flow_xml),
        audit_strategy_list: _this.current_proc_obj.docShareStrategyList
      }
      _this.loading = true
      return new Promise((resolve, reject) => {
        // 插件配置了saveFlow，仅保存流程时返回所有流程信息，不调用接口
        if(!['', 'null', 'undefined'].includes(_this.arbitrailyVal + '')
        && JSON.stringify(_this.arbitrailyVal) !== '{}'
        && _this.arbitrailyVal.saveFlow === false
        && (_this.template !== 'Y' || (_this.template === 'Y' && _this.current_proc_obj.template !== 'Y'))
        ){
          _this.save_audit_flow = {
            process_def_key: _saveObj.key, 
            process_def_name: _saveObj.name,
            process_data:{
              type: type,
              configData:_saveObj
            }
          }
          _this.saveAuditFlow()
          _this.current_proc_obj.flow_xml = _this.flow_xml
          _this.current_proc_obj.id = ""

          if(_this.template !== 'Y'){
            _this.$message.success(_this.$i18n.tc('modeler.common.saveTip'))
            _this.$emit('change', false)
            _this.loading = false
            _this.$emit('goBack')
          }
          
          resolve("")
        }else {
          savePro(_saveObj,{type})
          .then(res => {
            _this.current_proc_obj.flow_xml = _this.flow_xml
            _this.current_proc_obj.id = res.id

            const callback = ()=>{
              _this.$emit('change', false)
              _this.loading = false
              _this.$emit('goBack', res.id)
            }
            const goBack = ()=>{
              if(_this.isArbitraly){
                  setTimeout(()=>{
                  callback()
                  },500)
                }else {
                  callback()
                }
            }
            // 保存为模板时等两次都成功后再提示
            if(_this.template === 'Y') {
              if(_this.current_proc_obj.template === 'Y') {
                _this.$message.success(_this.$i18n.tc('modeler.common.saveTemplateTip'))
                goBack()
              }else {
                _this.save_audit_flow = {
                  process_def_id: res.id, 
                  process_def_key: _saveObj.key, 
                  process_def_name: _saveObj.name
                }
                _this.saveAuditFlow()
              }
            }else {
              _this.$message.success(_this.$i18n.tc('modeler.common.saveTip'))
              _this.save_audit_flow = {
                process_def_id: res.id, 
                process_def_key: _saveObj.key, 
                process_def_name: _saveObj.name
              }
              _this.saveAuditFlow()
              goBack()
            }
            resolve(res)
          })
          .catch(function (error) {
            reject(error)
            _this.loading = false
          })
        }
      })
    },
    /**
     * 校验审核员用户是否存在
     **/
    checkUserAutitor() {
      const _this = this
      const userIds = []
      const groupIds = []
      // let ids = []
      let auditorList = []
      _this.warnMsgList = []
      _this.current_proc_obj.docShareStrategyList.forEach((strategy) => {
        strategy.auditor_list.forEach(auditor => {
          let checkArray = userIds.filter(userId => userId === auditor.user_id)
          if (checkArray.length === 0 && (!auditor.org_type || auditor.org_type === 'user')) {
            userIds.push(auditor.user_id)
          }else if(auditor.org_type === 'group') {
            groupIds.push(auditor.user_id)
          }
          auditorList.push(auditor)
        })
      })
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        let hasError = false
        // 用户组
        try {
          const result = await getInfoByTypeAndIds('group',groupIds)
          _this.current_proc_obj.docShareStrategyList.forEach(strategy => {
            strategy.auditor_list.forEach(auditor => {
              let findUserList = result.filter(user => user.id === auditor.user_id)
              auditor.user_name = findUserList.length > 0 ? findUserList[0].name : auditor.user_name
            })
          })
        } catch (error) {
          console.log('error',error,error.response)
          if (error.response.data.code === 400019003) {
            const detail = JSON.parse(error.response.data.detail)
            auditorList.forEach(user => {
              if (detail.ids.indexOf(user.user_id) > -1) {
                const warnMsg = user.user_name + _this.$i18n.tc('modeler.strategyWarnMsgFix') + _this.$i18n.tc('modeler.strategyAuditorWarnMsg2')
                _this.warnMsgList.push(warnMsg)
              }
            })
            hasError = true
          }
        }

        // 用户
        try {
          const res = await getInfoByTypeAndIds('user', userIds)
          const userList = res
          _this.current_proc_obj.docShareStrategyList.forEach(strategy => {
          strategy.auditor_list.forEach(auditor => {
            let findUserList = userList.filter(user => user.id === auditor.user_id)
            auditor.user_name = findUserList.length > 0 ? findUserList[0].name : auditor.user_name
            })
         })
        } catch (error) {
           if (error.response.data.code === 400019001) {
            const detail = JSON.parse(error.response.data.detail)
            auditorList.forEach(user => {
              if (detail.ids.indexOf(user.user_id) > -1) {
                const warnMsg = user.user_name + _this.$i18n.tc('modeler.strategyWarnMsgFix') + _this.$i18n.tc('modeler.strategyAuditorWarnMsg')
                _this.warnMsgList.push(warnMsg)
              }
            })
            hasError = true
          }
        }
        if(hasError) {
          // eslint-disable-next-line require-atomic-updates
          _this.msgVisible = true
          resolve(false)
        }else {
          resolve(true)
        }
      })
    },
    /**
     * 关闭异常警告提示
     */
    closeWarnMsg() {
      this.msgVisible = false
    },
    /**
     * 是否开启悬浮提示
     */
    checkShowTooltip(e) {
      this.tooltipDisabled = isShowTooltip(e)
    },
    /**
     * 字符串转base64
     * @param str
     * @returns {string}
     */
    encode(str) {
      const encode = encodeURI(str)
      const base64 = btoa(encode)
      return base64
    },
    /**
     * 获取审核策略所有环节审核员显示对象
     */
    getViewAuditors() {
      const _this = this
      let viewAuditors = []
      if (this.current_proc_obj.docShareStrategyList) {
        this.current_proc_obj.docShareStrategyList.forEach((e) => {
          let item = {}
          let separator = '、'
          if (this.$i18n.locale === 'en-us') {
            separator = ','
          }
          item['strategyType'] = e.strategy_type
          item['actDefId'] = e.act_def_id
          item['auditModel'] = this.type_name(e.audit_model)
          item['noAuditorType'] = e.no_auditor_type
          let auditorNames = ''
          if (e.audit_model === 'zjsh') {
            e.auditor_list.forEach((d, index) => {
              auditorNames === ''
                ? (auditorNames =
                    '（' +
                    (index + 1) +
                    this.$i18n.tc('modeler.level') +
                    '）' +
                    d.user_name +
                    '（' +
                    d.user_code +
                    '）')
                : (auditorNames +=
                    separator +
                    '（' +
                    (index + 1) +
                    this.$i18n.tc('modeler.level') +
                    '）' +
                    d.user_name +
                    '（' +
                    d.user_code +
                    '）')
            })
          } else {
            const getCode = (item)=>{
              if(item.org_type && item.org_type==='group'){
                return _this.$t('sync.group')
              }
              return item.user_code
            }
            e.auditor_list.forEach((d) => {
              auditorNames === ''
                ? (auditorNames = d.user_name + '（' + getCode(d) + '）')
                : (auditorNames +=
                    separator + d.user_name + '（' + getCode(d) + '）')
            })
          }

          item['auditorNames'] = auditorNames
          viewAuditors.push(item)
        })
      }
      return viewAuditors
    },
    type_name(type) {
      const map = {
        tjsh: this.$i18n.tc('flow.auditTypes.tjsh'),
        hqsh: this.$i18n.tc('flow.auditTypes.hqsh'),
        zjsh: this.$i18n.tc('flow.auditTypes.zjsh')
      }
      return map[type]
    },
    // 监测抽屉鼠标事件
    handleWrapperMousedown(e) {
      // 如果为true，则表示点击发生在遮罩层
      this.classmodel = !!e.target.classList.contains('el-drawer__container')
    },
    handleWrapperMouseup(e) {
      if (
        e.target.classList.contains('el-drawer__container') &&
        this.classmodel
      ) {
        this.propertiesDrawer = false
      } else {
        this.propertiesDrawer = true
      }
      this.classmodel = false
    },
    /**
     * 打开流程模板弹窗
     */
    openTemplate(){
      this.templateDrawer = true
    },
    /**
     * 初始化模板
     */
    useTheTemplate(_process_obj){
      _process_obj.name = this.current_proc_obj.name
      if(this.proc_type) {
        // 避免选择模板后type被覆盖
        _process_obj.type = this.proc_type
      }
      this.initTemplate(_process_obj)
      this.templateDrawer = false
    },
    /**
     * 关闭模板弹窗
     */
    close(){
      this.templateDrawer = false
    },
    /**
     * 关闭模板详情
     */
    async closeView(){
      await this.$refs.processTemplate.close()
      this.templateDrawer = false
    }
  }
}
</script>
<style>
@import '../../../../public/css/workflow.css';
</style>
