<!-- 流程中心，流程列表 -->
<template>
  <div>
    <el-row>
      <el-col :span="10" class="align-left">
        <el-button type="primary" size="mini" icon="el-icon-plus" @click="newProcess" style="font-size: 13px">{{$t('button.addAuditProc')}}</el-button>
        <el-button size="mini" icon="el-icon-delete" @click="delProcessBatch" style="font-size: 13px" v-if="showHandelBtn">{{$t('button.delete')}}</el-button>
      </el-col>
      <el-col :span="14" class="align-right">
        <MultiChoice ref="multiChoice" v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')" />
      </el-col>
    </el-row>
    <el-table
      :data="processList"
      element-loading-text=""
      v-loading="loading"
      :height="tableHeight"
      :append-to-body="false"
      @row-click="handleRowClick"
      ref="multipleTable"
      style="margin-top: 10px; margin-bottom: 10px"
      border
      fit
      class="flowTable checkbox-table table-ellip"
      highlight-current-row
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="32"></el-table-column>
      <el-table-column :label="$t('table.procName')">
        <template slot-scope="scope">
          <span v-title :title="scope.row.name" style="white-space:pre;">{{ scope.row.name }}</span>
          <el-tag type="danger" v-if="scope.row.effectivity === 1">{{$t('processCenter.expiredTips')}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="240" :label="$t('common.operation.name')">
        <template slot-scope="scope">
          <el-button type="text" icon="icon-rename" :title="$t('button.rename')" @click="renameProcess(scope.row)" />
          <el-button type="text" icon="el-icon-edit-outline" :title="$t('button.edit')" @click="edit(scope.row)" />
          <el-button type="text" icon="el-icon-copy-document icon-copy" :title="$t('button.copy')" @click="copyProcess(scope.row)" />
          <el-button type="text" icon="icon-delete" :title="$t('button.delete')" @click="deleteProcess(scope.row)" />
          <workflowPopover
            placement="left-start"
            width="590"
            trigger="click"
            :class="tableStartHrPopoversClass"
            :popper-class="'view-process-popover'"
            :append-to-body="true"
          >
            <div style="background-color:#f5f5f5 !important;width: 590px;height: 520px">
              <processModel
                v-if="viewProcessVisible && viewProcessObj.procDefId === scope.row.id"
                :tenant_id="viewProcessObj.tenantId"
                :proc_def_key="viewProcessObj.procDefKey"
                :proc_def_id="viewProcessObj.procDefId"
                :proc_type="'process_view'"
                :visit="visit"
                :isTemplate="true"
                :multiChoiceSearch="searchParams"
              />
            </div>
            <el-button slot="reference" type="text" icon="icon-view" :title="$t('button.view')" @click="viewProcess(scope.row, scope.$index)"style="margin-left: 10px"></el-button>
          </workflowPopover>
        </template>
      </el-table-column>
      <div slot="empty" class="empty-box">
        <div v-if="searchParams.names.length > 0 || searchParams.auditors.length > 0">
          <div class="no-seach"></div>
          <p class="text">{{$t('message.noSeachTableTips')}}</p>
        </div>
        <div v-else>
          <template v-if="!loading">
            <div class="empty-text"></div>
            <p class="text">{{$t('message.noDataTableTips')}}</p>
          </template>
        </div>
      </div>
    </el-table>
    <div class="el-pagination" style="float: left">
      <workflowPagination
        :current-page="query.offset"
        :page-sizes="pagination.page_sizes"
        :page-size="query.limit"
        :layout="pagination.layout"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <workflowDialog
      :visible="designProcessVisible"
      :close-on-click-modal="false"
      :show-close="false"
      fullscreen
      z-index="999"
      :modal-append-to-body="false"
      :custom-class="'no-header el-dialog-white'"
      :modal="false">
      <div element-loading-text="">
        <processModel
          v-if="designProcessVisible"
          :is_change.sync="bpmnIsChange"
          :tenant_id="processModelObj.tenantId"
          :proc_def_key="processModelObj.procDefKey"
          :proc_def_id="processModelObj.procDefId"
          :proc_copy_name="processCopyName"
          :proc_type="procType"
          :visit="visit"
          :isTemplate="true"
          @close="closeDialog"
          @refresh="loadProcessTableData"
        />
      </div>
    </workflowDialog>
    <processCopyForm ref="setProcessCopyForm" @output="copyProcessCall"></processCopyForm>
    <processRenameForm ref="processRename" @output="loadProcessTableData"></processRenameForm>
  </div>
</template>
<script>
import processModel from 'ebpm-process-modeler-client'
import { getList, deleteBatchProcDef } from '@/api/processDefinition.js'
import { tenantId } from '@/utils/config'
import processCopyForm from './processCopyForm'
import processRenameForm from './processRenameForm'
import MultiChoice from '@/components/MultiChoice'
let bpmnIsChangeOpen = false
export default {
  name: 'list',
  components: { processModel, processCopyForm, MultiChoice,processRenameForm },
  props: {
    roles: {
      type: String,
      required: false
    }
  },
  data () {
    // 初始化搜索下拉框模板
    const multic_hoice_types = [
      { label: this.$i18n.tc('table.procName'), value: 'names' },// 流程名称
      { label: this.$i18n.tc('table.creator'), value: 'create_users' },// 流程创建者
      { label: this.$i18n.tc('modeler.multicTypeLabel.auditor'), value: 'auditors' },// 审核员
      { label: this.$i18n.tc('deptAuditorRule.deptAuditorRuleLabel2'), value: 'rules' }// 审核员规则名称
    ]
    return {
      multic_hoice_types,// 下拉模板数据
      viewProcessVisible: false,// 是否打开流程详情弹窗
      designProcessVisible: false,// 是否打开流程设计弹窗
      bpmnIsChange: false,
      loading: true,// 列表加载
      showHandelBtn: false,// 编辑按钮是否显示
      tableStartHrPopoversClass: '',
      tableStartHrClick: false,// 判断列表第一条流程数据是否被点击
      visit: 'new',// 新建流程
      procType: 'process_center',
      tableHeight: 580,// 列表高度
      processList: [],// 流程列表
      multiChoiceSearch: [],// 搜索参数数组
      multipleSelection: [],// 选中的流程列表
      // 搜索框对象
      searchParams: {
        names: [],
        create_users: [],
        auditors: [],
        rules: []
      },
      // 流程列表搜索条件对象
      query: {
        name: '',// 流程名称
        filter_share: 1,
        type_id: '',
        offset: 1,
        limit: 50,
        template: 'Y'
      },
      // 页数对象数组
      pagination: {
        page_sizes: [50, 100, 200],
        total: 0,
        layout: 'total, prev, pager, next, sizes '
      },
      processModelObj: { tenantId: tenantId, procDefKey: '', procDefId: '' },// 新建流程对象
      viewProcessObj: { tenantId: tenantId, procDefKey: '', procDefId: '' },// 流程详情对象
      processCopyName: '' // 复制的流程名称
    }
  },
  computed: {
    microWidgetPropsVal () {
      return this.$store.state.app.microWidgetProps
    }
  },
  filters: {
    /**
       * @description 格式化字符串
       * @author xiashneghui
       * @param value 值
       * @param len 截取长度
       * @updateTime 2022/3/2
       * */
    ellipsis (value, len) {
      if (!value) return ''
      if (value.length > len) {
        return value.slice(0, len) + '...'
      }
      return value
    }
  },
  created () {
    // 加载列表数据
    this.loadProcessTableData()
  },
  mounted () {
    let _this = this
    _this.$nextTick(function () {
      // 初始化窗口高度
      _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 155
      if(_this.microWidgetPropsVal !== null && !_this.microWidgetPropsVal.config.systemInfo.isInElectronTab){
        _this.tableHeight = _this.tableHeight - 35
      }
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 155
        if(_this.microWidgetPropsVal !== null && !_this.microWidgetPropsVal.config.systemInfo.isInElectronTab){
          _this.tableHeight = _this.tableHeight - 35
        }
      })
    })
  },
  watch: {
    multiChoiceSearch: {
      deep: true,
      handler (val) {
        Object.keys(this.searchParams).forEach(item => {
          this.searchParams[item] = []
        })
        val.forEach(el => {
          this.searchParams[el.type].push(el.val)
        })
        this.query.offset = 1
        this.loadProcessTableData()
      }
    }
  },
  methods: {
    /**
       * @description 加载流程列表数据
       * @updateTime 2022/3/2
       * */
    loadProcessTableData () {
      const _this = this
      _this.loading = true
      const query = { ..._this.query, ..._this.searchParams, roles: _this.roles, offset: (_this.query.offset - 1) * _this.query.limit }
      getList(query).then(response => {
        _this.processList = response.entries
        _this.pagination.total = response.total_count
        _this.loading = false
        if(_this.query.type_id === '' && _this.searchParams.names.length === 0 && _this.searchParams.create_users.length === 0 &&
          _this.searchParams.auditors.length === 0 && _this.searchParams.rules.length === 0){
          _this.$emit('showType', _this.processList)
        }
      }).catch(() => { })
    },
    /**
       * @description 关闭流程设计弹窗
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    closeDialog () {
      const _this = this
      if (_this.bpmnIsChange) {
        // 关闭弹窗
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
        // 初始化流程相关参数
        _this.searchParams['names'] = []
        _this.searchParams['create_users'] = []
        _this.searchParams['auditors'] = []
        _this.searchParams['rules'] = []
        _this.multiChoiceSearch = []
        _this.$refs.multiChoice.clearValues()
        _this.designProcessVisible = false
        _this.loadProcessTableData()
      }
    },
    /**
       * @description 新建流程
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    newProcess () {
      this.visit = 'new'
      this.designProcessVisible = true
    },
    /**
       * @description 编辑流程
       * @param row 流程信息
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    edit (_row) {
      this.visit = 'update'
      const key = _row.id.split(':')[0]
      this.processModelObj.tenantId = _row.tenant_id // 创建人ID
      this.processModelObj.procDefKey = key // 流程定义key
      this.processModelObj.procDefId = _row.id // 流程定义ID
      this.designProcessVisible = true // 打开流程设计弹窗
    },
    /**
       * @description 删除流程
       * @param row 流程信息
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    deleteProcess (_row) {
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('processCenter.deleteProcessTips'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        _this.loading = true
        let idArr = []
        idArr.push(_row.id)
        deleteBatchProcDef(idArr).then(res => {
          _this.$toast('success', _this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadProcessTableData()
        }).catch(() => { })
      }).catch(() => {
      })
    },
    /**
       * @description 批量删除流程
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    delProcessBatch () {
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('processCenter.deleteProcessTips'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        _this.loading = true
        let idArr = [] // 流程ID数组
        _this.multipleSelection.forEach(select => {
          idArr.push(select.id)
        })
        deleteBatchProcDef(idArr).then(res => {
          _this.$toast('success', _this.$i18n.tc('processCenter.deleteBatchPreTips1') + idArr.length + _this.$i18n.tc('processCenter.deleteBatchPreTips2'))
          _this.reloadProcessTableData()
        }).catch(() => { })
      }).catch(() => { })
    },
    /**
       * @description 复制流程（打开流程名称设置）
       * @param row 流程详情
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    copyProcess (_row) {
      this.$refs['setProcessCopyForm'].openProcessName(_row)
    },
    /**
       * @description 修改流程名称（打开流程名称设置）
       * @param row 流程详情
       * @author xiashneghui
       * @updateTime 2022/8/10
       * */
    renameProcess(_row){
      this.$refs['processRename'].openProcessName(_row)
    },
    /**
       * @description 复制流程（流程名称设置）回调
       * @param _process 流程信息
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    copyProcessCall (_process) {
      this.visit = 'copy'
      const key = _process.id.split(':')[0]
      this.processModelObj.procDefId = _process.id
      this.processModelObj.procDefKey = key
      this.processCopyName = _process.name
      this.designProcessVisible = true
    },
    /**
       * @description 查看流程
       * @param _process 流程信息、
       * @param _index 流程下标
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    viewProcess (_row, _index) {
      this.viewProcessObj.tenantId = _row.tenant_id
      this.viewProcessObj.procDefKey = _row.id.split(':')[0]
      this.viewProcessObj.procDefId = _row.id
      this.tableStartHrPopoversClass = ''
      // 判断该流程是否是第一个，如果是话修改详情弹框距离顶部高度
      if (_index === 0) {
        this.tableStartHrPopoversClass = this.tableStartHrClick ? 'top-popovers-0' : 'top-popovers-45'
        this.tableStartHrClick = true
      }
      this.viewReload()
    },
    /**
       * @description 查看流程组件重载
       * @author xiashneghui
       * @updateTime 2022/8/2
       * */
    viewReload () {
      this.viewProcessVisible = false
      this.$nextTick(() => {
        this.viewProcessVisible = true
      })
    },
    /**
       * @description 重新加载流程列表数据
       * @updateTime 2022/3/2
       * */
    reloadProcessTableData () {
      this.query.offset = 1
      this.loadProcessTableData()
    },
    /**
       * @descriptio 判断是否选中复选框，显示编辑按钮
       * @param val 选中的数据集合
       * @author xiashneghui
       * @updateTime 2022/3/2
       * */
    handleSelectionChange (val) {
      this.multipleSelection = val
      if (this.multipleSelection.length > 0) {
        this.showHandelBtn = true
      } else {
        this.showHandelBtn = false
      }
    },
    /**
       * @descriptio 根据搜索框的值加载列表
       * @param val 值
       * @author xiashneghui
       * @updateTime 2022/3/2
       * */
    handleSizeChange (val) {
      this.query.offset = 1
      this.query.limit = val
      this.loadProcessTableData()
    },
    handleCurrentChange (val) {
      this.query.offset = val
      this.loadProcessTableData()
    }, handleRowClick (row, column, event) {
      // 从已选中数据中 判断当前点击的是否被选中
      const selected = this.multipleSelection.some(item => item.id === row.id)  // 是取消选择还是选中
      if (!selected) { // 不包含   代表选择
        this.multipleSelection.push(row)
        this.$refs['multipleTable'].toggleRowSelection(row, true)
      } else { // 取消选择
        let finalArr = this.multipleSelection.filter((item) => {
          return item.id !== row.id
        })
        this.multipleSelection = finalArr  // 取消后剩余选中的
        this.$refs['multipleTable'].toggleRowSelection(row, false)
      }
    }
  }
}
</script>
