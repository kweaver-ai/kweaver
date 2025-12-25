<!-- 部门审核员规则管理 -->
<template>
  <div id="app">
    <div class="el-main_cont">
      <list @showType="changeIndexShow" :roles="rolesVal"></list>
      <el-dialog
        :visible="designProcessVisible"
        :close-on-click-modal="false"
        :modal="false"
        :show-close="false"
        fullscreen
        :custom-class="'no-header el-dialog-white'">
        <div element-loading-text="">
          <processModel
            v-if="designProcessVisible"
            :is_change.sync="bpmnIsChange"
            :tenant_id="processModelObj.tenantId"
            :proc_def_key="processModelObj.procDefKey"
            :proc_def_id="processModelObj.procDefId"
            :visit="visit"
            :proc_type="procType"
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
import { getList } from '@/api/processDefinition.js'
let bpmnIsChangeOpen = false
export default {
  name: 'index',
  components: { processModel, list },
  data () {
    return {
      showGuide: false,
      showList: false,
      designProcessVisible: false,
      bpmnIsChange: false,
      activeName: 'anyShare',
      visit: 'new',
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
    this.loadProcessCenter()
  },
  methods: {
    /**
     * 加载流程中心
     */
    loadProcessCenter () {
      const _this = this
      _this.showList = false
      _this.showGuide = false
      const query = { filter_share: 1, roles: _this.rolesVal, offset: 1, limit: 10 }
      getList(query).then(response => {
        response.entries.length > 0 ? _this.showList = true : _this.showGuide = true
      }).catch(() => { })
    },
    /**
     * 关闭流程设计弹窗
     */
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
     * 新建流程
     */
    newProcess () {
      this.visit = 'new'
      this.designProcessVisible = true
    },
    /**
     * 切换当前展现内容
     */
    changeIndexShow (processList) {
      this.showList = false
      this.showGuide = false
      processList.length > 0 ? this.showList = true : this.showGuide = true
    }
  }
}
</script>
