<!-- 流程中心首页 -->
<template>
  <div id="app">
    <el-tabs v-model="activeName" :class="tabClass">
      <el-tab-pane :label="tabLabel" name="anyShare">
        <div class="process_center" v-if="showGuide">
          <div class="process_center_left">
            <div class="create-process-title"><p>{{ $t('processCenter.guideTitle') }}</p></div>
            <div class="create-process-prompt">
              <p>{{ $t('processCenter.guideExplain1') }}</p>
              <p>{{ $t('processCenter.guideExplain2') }}</p>
            </div>
            <div>
              <el-button type="primary" size="mini" @click="newProcess">{{ $t('button.addNow') }}</el-button>
            </div>
          </div>
          <div class="process_center_right">
            <div class="create-process-guide">
              <img src="../../../public/images/start-guide-us.gif" v-if="$i18n.locale === 'en-us' || $i18n.locale === 'vi-vn'">
              <img src="../../../public/images/start-guide-tw.gif" v-else-if="$i18n.locale === 'zh-tw'">
              <img src="../../../public/images/start-guide.gif" v-else>
            </div>
          </div>
        </div>
        <div v-if="showList">
           <list @showType="changeIndexShow" :roles="rolesVal"></list>
        </div>
      </el-tab-pane>
    </el-tabs>
    <el-dialog :visible="designProcessVisible" :close-on-click-modal="false" :show-close="false" fullscreen :custom-class="'no-header el-dialog-white'">
      <div element-loading-text="">
        <processModel
           v-if="designProcessVisible"
           :is_change.sync="bpmnIsChange"
           :tenant_id="processModelObj.tenantId"
           :proc_def_key="processModelObj.procDefKey"
           :proc_def_id="processModelObj.procDefId"
           :visit="visit"
           :isTemplate="isTemplate"
           :proc_type="procType"
           :allowAddSign="allowAddSign"
           :allowDynamicAuditor="allowDynamicAuditor"
           :allowExecutingAuditor="allowExecutingAuditor"
           :allowUserGroup="allowUserGroup"
           :externalUserSelect="externalUserSelect"
           @close="closeDialog"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import processModel from 'ebpm-process-modeler-front'
import { tenantId } from '@/utils/config'
import list from './list'
import { getList } from '@/api/processDefinition.js'
let bpmnIsChangeOpen = false
export default {
  name: 'index',
  components: { processModel, list },
  data() {
    return {
      showGuide: false,// 是否显示新手指南
      showList: false,// 是否显示流程列表
      designProcessVisible: false,// 是否显示流程设计器
      bpmnIsChange: false,// 流程对象变更标识
      activeName: 'anyShare',// 当前选中
      visit: 'new',// 显示类型（new 新建，privew 预览）
      isTemplate: true,
      procType: 'process_center',// 流程类型
      processModelObj: { // 流程建模对象
        tenantId: tenantId,
        procDefKey: '',
        procDefId: ''
      }
    }
  },
  computed: {
    rolesVal:{
      get() {
        let roles = ''
        this.$store.state.app.roles.forEach(e => {
          roles === '' ?  roles = e.id :  roles += ',' + e.id
        })
        return roles
      }
    },
    // 仅有一个分类tab时，默认隐藏
    tabClass(){
      return {
        'hide-header': true
      }
    },
    tabLabel(){
      return this.$store.getters.context?.tabLabel || 'AnyShare'
    },
    allowAddSign() {
      if(typeof this.$store.getters.context?.allowAddSign === 'boolean'){
        return this.$store.getters.context?.allowAddSign
      }
      return true
    },
    allowDynamicAuditor(){
      if(typeof this.$store.getters.context?.allowDynamicAuditor === 'boolean'){
        return this.$store.getters.context?.allowDynamicAuditor
      }
      return true
    },
    allowExecutingAuditor(){
      if(typeof this.$store.getters.context?.allowExecutingAuditor === 'boolean'){
        return this.$store.getters.context?.allowExecutingAuditor
      }
      return false
    },
    allowUserGroup(){
      if(typeof this.$store.getters.context?.allowUserGroup === 'boolean'){
        return this.$store.getters.context?.allowUserGroup
      }
      return true
    },
    externalUserSelect(){
      if(typeof this.$store.getters.context?.externalUserSelect === 'function'){
        return this.$store.getters.context?.externalUserSelect
      }
      return undefined
    }
  },
  created() {
    this.loadProcessCenter()
  },
  methods: {
    /**
     * 加载流程中心
     */
    loadProcessCenter() {
      const _this = this
      _this.showList = false
      _this.showGuide = false
      const query = { filter_share: 1, roles: _this.rolesVal, offset: 1, limit: 10, template: 'Y' }
      getList(query).then(response => {
        response.entries.length > 0 ?  _this.showList = true : _this.showGuide = true
      }).catch(() => {})
    },
    /**
     * 关闭流程设计弹窗
     */
    closeDialog() {
      const _this = this
      if (_this.bpmnIsChange) {
        if (!bpmnIsChangeOpen) {
          bpmnIsChangeOpen = true
          _this.$confirm(_this.$i18n.tc('field.modelDialogQuit'), '', {
            confirmButtonText: _this.$i18n.tc('button.confirm'),
            cancelButtonText: _this.$i18n.tc('button.cancel'),
            iconClass: 'warning-blue',
            type: 'warning'
          }).then(() => {
            _this.designProcessVisible = false
            bpmnIsChangeOpen = false
          }).catch(() => {
            bpmnIsChangeOpen = false
          })
        }
      } else {
        _this.loadProcessCenter()
        _this.designProcessVisible = false
      }
    },
    /**
     * 新建流程
     */
    newProcess() {
      this.visit = 'new'
      this.designProcessVisible = true
    },
    /**
     * 切换当前展现内容
     */
    changeIndexShow(_processList){
      const _this = this
      _this.showList = false
      _this.showGuide = false
      _processList.length > 0 ?  _this.showList = true : _this.showGuide = true
    }
  }
}
</script>

<style scoped>
.hide-header >>> .el-tabs__header.is-top {
  display: none;
}
</style>
