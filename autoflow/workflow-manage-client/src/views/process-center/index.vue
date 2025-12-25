<!-- 流程中心首页 -->
<template>
  <div id="app" style="padding: 32px !important;">
    <div class="el-main_cont">
      <el-tabs v-model="activeName" @tab-click="tabChange" class="as-tabs">
        <el-tab-pane :label="$t('modeler.CreatedByMe')" name="anyShare">
          <div class="process_center" v-if="showGuide">
            <div class="process_center_left">
              <div class="create-process-title">
                <p>{{ $t('processCenter.guideTitle') }}</p>
              </div>
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
                <img src="../../../public/images/start-guide.gif"    v-else>
              </div>
            </div>
          </div>
          <div v-if="showList">
            <list @showType="changeIndexShow" :roles="rolesVal"></list>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('modeler.DeptApproverManagement')" name="deptAuditorRule">
          <dept-audit-rule-list v-if="showDeptAuditRuleList"></dept-audit-rule-list>
        </el-tab-pane>
      </el-tabs>
      <el-dialog :visible="designProcessVisible" :close-on-click-modal="false" :modal="false" :show-close="false" fullscreen :custom-class="'no-header el-dialog-white'">
        <div element-loading-text="">
          <processModel
            v-if="designProcessVisible"
            :is_change.sync="bpmnIsChange"
            :tenant_id="processModelObj.tenantId"
            :proc_def_key="processModelObj.procDefKey"
            :proc_def_id="processModelObj.procDefId"
            :visit="visit"
            :proc_type="procType"
            :isTemplate="isTemplate"
            @close="closeDialog"
          />
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import processModel from 'ebpm-process-modeler-client'
import { tenantId } from '@/utils/config'
import list from './list'
import deptAuditRuleList from '../dept-auditor-rule/list'
import { getList } from '@/api/processDefinition.js'
let bpmnIsChangeOpen = false
export default {
  name: 'index',
  components: { processModel, list, deptAuditRuleList },
  data () {
    return {
      showGuide: false,// 是否显示引导图
      showList: false,// 是否显示流程列表
      designProcessVisible: false,// 是否打开新建流程弹窗
      bpmnIsChange: false,
      showDeptAuditRuleList: true,// 是否暂时审核员规则组件
      activeName: 'anyShare',// 默认展开的tab页
      visit: 'new',
      isTemplate:true,
      procType: 'process_center',
      processModelObj: { tenantId: tenantId, procDefKey: '', procDefId: '' }
    }
  },
  computed: {
    rolesVal: {
      get () {
        let roles = ''
        this.$store.state.app.roles.forEach(e => {
          roles === '' ? roles = e.id : roles += ',' + e.id
        })
        return roles
      }
    }
  },
  created () {
    if (typeof this.$route.query.name !== 'undefined') {
      this.activeName = this.$route.query.name
    }
    this.loadProcessCenter()
  },
  methods: {
    /**
     * @descriptio 加载流程中心
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    loadProcessCenter () {
      const _this = this
      _this.showList = false
      _this.showGuide = false
      const query = { filter_share: 1, roles: _this.rolesVal, process_client: 1, offset: 1, limit: 10,template: 'Y',tenantId:tenantId}
      getList(query).then(response => {
        response.entries.length > 0 ? _this.showList = true : _this.showGuide = true
      }).catch(() => { })
    },
    /**
     * @descriptio 关闭流程设计弹窗
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    closeDialog () {
      const _this = this
      if (_this.bpmnIsChange) {
        if (!bpmnIsChangeOpen) {
          bpmnIsChangeOpen = true
          _this.$dialog_confirm(_this.$i18n.tc('field.modelDialogQuit'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
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
     * @descriptio 新建流程
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    newProcess () {
      this.visit = 'new'
      this.designProcessVisible = true
    },
    /**
     * @descriptio 切换当前展现内容
     * @param processList 列表数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    changeIndexShow (processList) {
      this.showList = false
      this.showGuide = false
      processList.length > 0 ? this.showList = true : this.showGuide = true
    },
    /**
     * @descriptio 加载审核规则组件
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    reloadDeptAuditRuleList () {
      this.showDeptAuditRuleList = false
      this.$nextTick(function () {
        this.showDeptAuditRuleList = true
      })
    },
    /**
     * @descriptio  切换当前展现内容
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    tabChange (value) {
      let name = value.name
      this.$router.options.routes.forEach(e => {
        if (e.name === 'index') {
          e.query = { name: name }
          this.$router.push(e)
        }
      })
      if (this.activeName === 'deptAuditorRule') {
        this.reloadDeptAuditRuleList()
      } else {
        this.loadProcessCenter()
      }
    }
  }
}
</script>
