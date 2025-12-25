<template>
  <div>
    <div class="fd-nav-content">
      <section class="dingflow-design">
        <div id="box-scale" :style="'transform: scale('+nowVal/100+'); transform-origin: 50% 0px 0px;'" class="box-scale">
          <nodeWrap
            :node-config.sync="nodeConfig"
            :flow-permission.sync="flowPermission"
            :addNodeDisabled.sync="addNodeDisabled"
            :proc-type="proc_type"
            @openPropertiesDrawer="openPropertiesDrawer"
          />
          <nodeEnd></nodeEnd>
        </div>
      </section>
    </div>
    <div>
      <el-drawer
        append-to-body
        modal-append-to-body
        :wrapperClosable="false"
        @mousedown.native="handleWrapperMousedown($event)"
        @mouseup.native="handleWrapperMouseup($event)"
        size="80%"
        :visible.sync="propertiesDrawer"
        :custom-class="'no-header'">
        <doc-share-properties
          ref="docShareProperties"
          :doc_audit_strategy_data.sync="doc_audit_strategy_data"
          :process_obj.sync="process_obj"
          :proc_def_key="proc_def_key"
          :approver_config="approver_config"
          @updateApproverConfig="updateApproverConfig"
          @processSave="save"
          @submitAuditStrategy="submitAuditStrategy"
        ></doc-share-properties>
      </el-drawer>
    </div>
  </div>
</template>
<script>
import nodeWrap from '../../../components/nodeWrap'
import nodeEnd from '../../../components/nodeEnd'
import docShareProperties from '../../../components/docShareProperties'
import processSetting from '../../../mixins/processSetting'
import { savePro } from '@/api/processDefinition.js'
export default {
  name: 'ProcessShareSetting',
  components: { nodeWrap, nodeEnd, docShareProperties },
  mixins: [processSetting],
  props: {
    process_obj: { type: Object, required: true },
    proc_type: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      flow_xml:'',
      propertiesDrawer: false,
      classmodel:false,
      approver_config: {},
      nowVal: 100,
      anonymity_switch:'',
      rename_switch:'',
      doc_audit_strategy:[]
    }
  },
  computed: {
    is_edit() {
      return !['', 'null', 'undefined'].includes(this.proc_def_key + '')
    },
    doc_audit_strategy_data: {
      get() {
        return this.process_obj.audit_strategy_list || []
      },
      set(value) {
        this.$set(this.process_obj, 'audit_strategy_list', value)
      }
    }
  },
  created() {
    this.addNodeDisabled = true
  },
  mounted(){
    this.initProcessConfig(this.process_obj.flow_xml, this.process_obj.key)
  },
  methods: {
    /**
     * 更新赋值审核策略
     * @param act_def_id
     * @param list
     */
    submitAuditStrategy(act_def_id, list) {
      const _this = this
      let data = []
      _this.doc_audit_strategy_data.forEach(item => {
        if (item.act_def_id !== act_def_id) {
          data.push(item)
        }
      })
      list.forEach(item => {
        data.push(item)
      })
      _this.doc_audit_strategy_data = data
    },
    /**
     * 保存流程
     * @returns {Promise<any>}
     */
    save() {
      const _this = this
      let valid = true
      let opt = _this.is_edit ? 'update' : 'new'
      if(_this.$refs.docShareProperties !== undefined){
        valid = _this.$refs.docShareProperties.checkValidate()
      }
      return new Promise(resolve => {
        if(valid){
          _this.getBpmnXml().then(res => {
            _this.flow_xml = res
            resolve(res)
            _this.deploy(opt).then(res => {
              resolve(res)
            }).catch(() => {})
          }).catch(() => {})
        }
      })
    },
    /**
     * 部署流程
     * @param opt
     * @returns {Promise<*>}
     */
    async deploy(type) {
      const _this = this
      const _saveObj = {
        ..._this.process_obj,
        advanced_setup: {
          anonymity_switch: _this.anonymity_switch,
          rename_switch: _this.rename_switch
        },
        flow_xml: _this.encode(_this.flow_xml),
        audit_strategy_list: _this.doc_audit_strategy
      }
      return new Promise((resolve, reject) => {
        savePro(_saveObj,{type})
          .then(res => {
            _this.process_obj.flow_xml = _this.flow_xml
            _this.process_obj.id = _this.process_obj.id || res.id
            resolve(res)
          })
          .catch(function (error) {
            reject(error)
          })
      })
    },
    /**
     * 开启环节参数配置界面
     */
    openPropertiesDrawer(_config){
      const _this = this
      _this.approver_config = _config
      if(_this.$refs.docShareProperties !== undefined){
        _this.$refs.docShareProperties.initForm(_config)
      }
      _this.propertiesDrawer = true
    },
    /**
     * 更新审核环节配置信息
     * @param _config
     */
    updateApproverConfig(_config){
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
     * 确认环境配置参数
     * @param _objArr
     */
    confirmProperties(_objArr){
      this.doc_audit_strategy = _objArr
      this.propertiesDrawer = false
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
    // 监测抽屉鼠标事件
    handleWrapperMousedown(e) {
      // 如果为true，则表示点击发生在遮罩层
      this.classmodel = !!e.target.classList.contains('el-drawer__container')
    },
    handleWrapperMouseup(e) {
      if((e.target.classList.contains('el-drawer__container')) && this.classmodel){
        this.propertiesDrawer = false
      }else{
        this.propertiesDrawer = true
      }
      this.classmodel = false
    }
  }
}
</script>
<style>
  @import "../../../../public/css/workflow.css";
  .error-modal-list {
    width: 455px;
  }
</style>
