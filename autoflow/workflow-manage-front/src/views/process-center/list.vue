<!-- 流程中心，流程列表 -->
<template>
  <div>
    <el-row class="list-top">
      <el-col :span="6" class="align-left">
        <el-button
          type="primary"
          size="mini"
          icon="el-icon-plus"
          @click="newProcess"
          style="font-size: 13px"
          >{{ $t('button.addAuditProc') }}</el-button
        >
        <el-button
          size="mini"
          icon="el-icon-delete"
          @click="delProcessBatch"
          style="font-size: 13px"
          v-if="showHandelBtn"
          >{{ $t('button.delete') }}</el-button
        >
      </el-col>
      <el-col :span="18" class="align-right">
        <!-- <el-select
          v-model="query.type_id"
          class="autoWidth"   
          @change="loadProcessTableData()">
            <template slot="prefix" >
              {{ prefixText }}
            </template>
            <div style="overflow: auto;max-height: 141px;">
              <el-option :label="$t('field.All')" value=""></el-option>
              <el-option 
                v-for="(item, index) in processCategoryList"
                :key="index"
                :label="item.label[$i18n.locale]"
                :value="item.category">
                  <template scop="label">
                    <el-tooltip 
                      class="item"
                      effect="light"
                      placement="top-start"
                      :content="item.label[$i18n.locale]"
                      :open-delay="500">
                        <div style="width: 120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">{{item.label[$i18n.locale]}}</div>
                    </el-tooltip>
                  </template>
              </el-option>
            </div>
        </el-select> -->
        <MultiChoice ref="multiChoice" v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')"/>
      </el-col>
    </el-row>
    <el-table
      :data="processList"
      element-loading-text=""
      v-loading="loading"
      :height="tableHeight"
      ref="multipleTable"
      style="margin-top: 10px; margin-bottom: 10px; min-height:180px;"
      border
      fit
      highlight-current-row
      class="checkbox-table table-ellip"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="32"></el-table-column>
      <el-table-column :label="$t('table.procName')" show-overflow-tooltip>
        <template slot-scope="scope">
          <span style="white-space: pre">{{ scope.row.name }}</span
          ><el-tag type="danger" v-if="scope.row.effectivity === 1">{{
            $t('processCenter.expiredTips')
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.creator')">
        <template slot-scope="scope">
          <span>{{
            scope.row.create_user_name ? scope.row.create_user_name : '- -'
          }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation.name')">
        <template slot-scope="scope">
          <el-button type="text" :title="$t('button.rename')" @click="renameProcess(scope.row)" >
            <svg-icon iconClass="rename" className="list-ops-icon" />
          </el-button>
          <el-button type="text" :title="$t('button.edit')" @click="edit(scope.row)" >
            <svg-icon iconClass="edit" className="list-ops-icon" />
          </el-button>
          <el-button type="text" :title="$t('button.copy')" @click="copyProcess(scope.row)">
            <svg-icon iconClass="copy" className="list-ops-icon" />
          </el-button>
          <el-button type="text" :title="$t('button.delete')" @click="deleteProcess(scope.row)">
            <svg-icon iconClass="delete" className="list-ops-icon" />
          </el-button>
          <el-popover
            placement="left-start"
            width="590"
            trigger="click"
            :popper-class="'view-process-popover'"
          >
            <div :style="boxStyle">
              <processModel
                v-if="
                  viewProcessVisible &&
                  viewProcessObj.procDefId === scope.row.id
                "
                :tenant_id="viewProcessObj.tenantId"
                :proc_def_key="viewProcessObj.procDefKey"
                :proc_def_id="viewProcessObj.procDefId"
                :proc_type="'process_view'"
                :visit="visit"
                :isTemplate="true"
                :multiChoiceSearch="searchParams"
              />
            </div>
            <el-button slot="reference" type="text" :title="$t('button.view')" @click="viewProcess(scope.row)" style="margin-left: 10px">
              <svg-icon iconClass="view" className="list-ops-icon" />
            </el-button>
          </el-popover>
        </template>
      </el-table-column>
      <div slot="empty" class="empty-box">
        <div>
          <div class="no-seach"></div>
          <p class="text">{{ $t('message.noSeachTableTips') }}</p>
        </div>
      </div>
    </el-table>
    <div class="el-pagination" style="float: left">
      <el-pagination
        :current-page="query.offset"
        :page-sizes="pagination.page_sizes"
        :page-size="query.limit"
        :layout="pagination.layout"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog
      :visible="designProcessVisible"
      :close-on-click-modal="false"
      :show-close="false"
      fullscreen
      :custom-class="'no-header el-dialog-white'"
    >
      <div :element-loading-text="$t('common.loading')">
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
          :allowAddSign="allowAddSign"
          :allowDynamicAuditor="allowDynamicAuditor"
          :allowExecutingAuditor="allowExecutingAuditor"
          :allowUserGroup="allowUserGroup"
          :externalUserSelect="externalUserSelect"
          @close="closeDialog"
          @refresh="loadProcessTableData"
        />
      </div>
    </el-dialog>
    <processCopyForm ref="setProcessCopyForm" @output="copyProcessCall"></processCopyForm>
    <processRenameForm ref="processRename" @output="loadProcessTableData"></processRenameForm>
  </div>
</template>
<script>
import processModel from 'ebpm-process-modeler-front'
import {
  getList,
  deleteBatchProcDef,
  categoryList
} from '@/api/processDefinition.js'
import { tenantId } from '@/utils/config'
import processCopyForm from './processCopyForm'
import processRenameForm from './processRenameForm'
import MultiChoice from '@/components/MultiChoice'
let bpmnIsChangeOpen = false
export default {
  name: 'list',
  components: { processModel, processCopyForm, MultiChoice, processRenameForm },
  props: {
    roles: {
      type: String,
      required: false
    }
  },
  data() {
    const multic_hoice_types = [
      { label: this.$i18n.tc('table.procName'), value: 'names' },
      { label: this.$i18n.tc('table.creator'), value: 'create_users' },
      {
        label: this.$i18n.tc('modeler.multicTypeLabel.auditor'),
        value: 'auditors'
      }
    ]
    if (this.$store.getters.context?.allowDynamicAuditor !== false) {
      // 筛选部门审核员
      multic_hoice_types.push({
        label: this.$i18n.tc('deptAuditorRule.deptAuditorRuleLabel'),
        value: 'rules'
      })
    }
    return {
      multic_hoice_types,
      viewProcessVisible: false, // 是否显示流程建模组件
      designProcessVisible: false, // 是否显示流程设计器
      bpmnIsChange: false, // 流程对象变更标识
      loading: true,
      showHandelBtn: false, // 是否显示操作按钮
      visit: 'new', // 显示类型（new 新建，privew 预览）
      procType: 'process_center', // 流程类型
      tableHeight: 600, // 流程列表表格高度
      processList: [], // 流程列表表格数据集合
      processCategoryList: [], // 流程分类集合
      multiChoiceSearch: [], // 筛选器搜索条件集合
      multipleSelection: [], // 筛选器搜索条件选中集合
      searchParams: {
        // 筛选器搜索条件查询参数对象
        names: [],
        create_users: [],
        auditors: [],
        rules: []
      },
      query: {
        // 流程列表表格数据查询参数对象
        name: '',
        filter_share: 1,
        type_id: '',
        offset: 1,
        limit: 50,
        template: 'Y'
      },
      pagination: {
        // 分页对象
        page_sizes: [50, 100, 200],
        total: 0,
        layout: 'total, prev, pager, next, sizes '
      },
      processModelObj: {
        // 流程建模，流程属性对象
        tenantId: tenantId,
        procDefKey: '',
        procDefId: ''
      },
      viewProcessObj: {
        // 预览流程，流程属性对象
        tenantId: tenantId,
        procDefKey: '',
        procDefId: ''
      },
      processCopyName: '' // 流程名称（复制流程）
    }
  },
  created() {
    this.loadProcessTableData()
    this.loadProcessCategory()
  },
  computed: {
    allowAddSign() {
      if (typeof this.$store.getters.context?.allowAddSign === 'boolean') {
        return this.$store.getters.context?.allowAddSign
      }
      return true
    },
    allowDynamicAuditor() {
      if (
        typeof this.$store.getters.context?.allowDynamicAuditor === 'boolean'
      ) {
        return this.$store.getters.context?.allowDynamicAuditor
      }
      return true
    },
    allowExecutingAuditor() {
      if (
        typeof this.$store.getters.context?.allowExecutingAuditor === 'boolean'
      ) {
        return this.$store.getters.context?.allowExecutingAuditor
      }
      return false
    },
    allowUserGroup() {
      if (typeof this.$store.getters.context?.allowUserGroup === 'boolean') {
        return this.$store.getters.context?.allowUserGroup
      }
      return true
    },
    externalUserSelect() {
      if (
        typeof this.$store.getters.context?.externalUserSelect === 'function'
      ) {
        return this.$store.getters.context?.externalUserSelect
      }
      return undefined
    },
    prefixText(){
      const _this = this
      const select = _this.processCategoryList.find(item => item.category === _this.query.type_id)
      if(select){
        return select.label[_this.$i18n.locale]
      }
      return _this.$t('field.All')
    },
    previewBox() {
      return this.$store.state.app.previewBox
    },
    boxStyle(){
      return {
        width: '590px',
        height: this.previewBox.height + 'px',
        background: this.previewBox.background + ' !important'
      }
    }
  },
  mounted() {
    let _this = this
    _this.$nextTick(function () {
      if(_this.$refs.multipleTable) {
        _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 133
        if(_this.tableHeight < 540) {
          _this.tableHeight = 540
        }
      }
      // 监听窗口大小变化
      window.addEventListener('resize', _this.adaptTableHeight)
    })
  },
  beforeDestroy(){
    const _this = this
    window.removeEventListener('resize', _this.adaptTableHeight)
  },
  watch:{
    multiChoiceSearch: {
      deep: true,
      handler(val) {
        Object.keys(this.searchParams).forEach((item) => {
          this.searchParams[item] = []
        })
        val.forEach((el) => {
          this.searchParams[el.type].push(el.val)
        })
        this.query.offset = 1
        this.loadProcessTableData()
      }
    }
  },
  methods: {
    adaptTableHeight(){
      const _this = this
      if(_this.$refs.multipleTable) {
        _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 133
        if(_this.tableHeight < 540) {
          _this.tableHeight = 540
        }
      }
    },
    /**
     * 加载流程列表数据
     */
    loadProcessTableData() {
      const _this = this
      _this.loading = true
      const query = {
        ..._this.query,
        ..._this.searchParams,
        roles: _this.roles,
        offset: (_this.query.offset - 1) * _this.query.limit
      }
      getList(query)
        .then((response) => {
          _this.processList = response.entries
          _this.pagination.total = response.total_count
          _this.loading = false
          if (
            _this.query.type_id === '' &&
            _this.searchParams.names.length === 0 &&
            _this.searchParams.create_users.length === 0 &&
            _this.searchParams.auditors.length === 0 &&
            _this.searchParams.rules.length === 0
          ) {
            _this.$emit('showType', _this.processList)
          }
        })
        .catch((e) => {console.error(e)})
    },
    loadProcessCategory() {
      categoryList().then((res) => {
        if (tenantId === 'af_workflow') {
          this.processCategoryList = res
        } else {
          this.processCategoryList = res.filter(
            (e) => e.category_belong === 'control'
          )
        }
      })
    },
    getTypeName(type) {
      let selectedCategoryList = this.processCategoryList.filter(
        (e) => e.category === type
      )
      return selectedCategoryList[0].label[this.$i18n.locale]
    },
    /**
     * 关闭流程设计弹窗
     */
    closeDialog() {
      const _this = this
      if (_this.bpmnIsChange) {
        if (!bpmnIsChangeOpen) {
          bpmnIsChangeOpen = true
          _this
            .$confirm(_this.$i18n.tc('field.modelDialogQuit'), '', {
              confirmButtonText: _this.$i18n.tc('button.confirm'),
              cancelButtonText: _this.$i18n.tc('button.cancel'),
              iconClass: 'warning-blue',
              type: 'warning'
            })
            .then(() => {
              _this.designProcessVisible = false
              bpmnIsChangeOpen = false
            })
            .catch(() => {
              bpmnIsChangeOpen = false
            })
        }
      } else {
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
     * 新建流程
     */
    newProcess() {
      this.visit = 'new'
      this.processModelObj.procDefKey = ''
      this.processModelObj.procDefId = ''
      this.designProcessVisible = true
    },
    /**
     * 编辑流程
     * @param row
     */
    edit(row) {
      this.visit = 'update'
      const key = row.id.split(':')[0]
      const tenant_id = row.tenant_id
      this.processModelObj.tenantId = tenant_id
      this.processModelObj.procDefKey = key
      this.processModelObj.procDefId = row.id
      this.designProcessVisible = true
    },
    /**
     * 删除流程
     * @param row
     */
    deleteProcess(row) {
      const _this = this
      // let warningStr = _this.$i18n.tc('processCenter.deleteProcessTips2') + _this.getTypeName(row.type) + _this.$i18n.tc('processCenter.deleteProcessTips4')
      let warningStr = _this.$i18n.tc('processCenter.deleteProcessTips')
      _this.$confirm(warningStr, '', {
        confirmButtonText: _this.$i18n.tc('button.confirm'),
        cancelButtonText: _this.$i18n.tc('button.cancel'),
        iconClass: 'warning-yellow',
        type: 'warning'
      }).then(() => {
        _this.loading = true
        let idArr = []
        idArr.push(row.id)
        deleteBatchProcDef(idArr).then(res => {
          _this.$message.success(_this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadProcessTableData()
        }).catch(() => {})
      }).catch(() => {
      })
    },
    /**
     * 批量删除流程
     */
    delProcessBatch() {
      const _this = this
      // let typeNames = []
      // _this.multipleSelection.forEach(select => {
      //   const typeName = _this.getTypeName(select.type)
      //   const filterTypeNames = typeNames.filter(e => e === typeName)
      //   if(filterTypeNames.length === 0){
      //     typeNames.push(typeName)
      //   }
      // })
      // let warningStr = _this.$i18n.tc('processCenter.deleteProcessTips3') + typeNames.join('/') + _this.$i18n.tc('processCenter.deleteProcessTips4')
      let warningStr = _this.$i18n.tc('processCenter.deleteProcessTips')
      _this.$confirm(warningStr, '', {
        confirmButtonText: _this.$i18n.tc('button.confirm'),
        cancelButtonText: _this.$i18n.tc('button.cancel'),
        iconClass: 'warning-yellow',
        type: 'warning'
      }).then(() => {
        _this.loading = true
        let idArr = []
        _this.multipleSelection.forEach(select => {
          idArr.push(select.id)
        })
        deleteBatchProcDef(idArr).then(res => {
          _this.$message.success(_this.$i18n.tc('processCenter.deleteBatchPreTips1') + idArr.length + _this.$i18n.tc('processCenter.deleteBatchPreTips2'))
          _this.reloadProcessTableData()
        }).catch(() => {})
      }).catch(() => {})
    },
    renameProcess(_row){
      this.$refs['processRename'].openProcessName(_row)
    },
    /**
     * 复制流程（打开流程名称设置）
     */
    copyProcess(row) {
      this.$refs['setProcessCopyForm'].openProcessName(row)
    },
    /**
     * 复制流程（流程名称设置）回调
     */
    copyProcessCall(_process) {
      this.visit = 'copy'
      const key = _process.id.split(':')[0]
      this.processModelObj.procDefId = _process.id
      this.processModelObj.procDefKey = key
      this.processCopyName = _process.name
      this.designProcessVisible = true
    },
    /**
     * 查看流程
     */
    viewProcess(row) {
      const key = row.id.split(':')[0]
      const tenant_id = row.tenant_id
      this.viewProcessObj.tenantId = tenant_id
      this.viewProcessObj.procDefKey = key
      this.viewProcessObj.procDefId = row.id
      this.viewReload()
    },
    /**
     * 查看流程组件重载
     */
    viewReload() {
      this.viewProcessVisible = false
      this.$nextTick(() => {
        this.viewProcessVisible = true
      })
    },
    /**
     * 搜索
     */
    search() {
      this.loadProcessTableData()
    },
    /**
     * 重新加载
     */
    reloadProcessTableData() {
      this.query.offset = 1
      this.loadProcessTableData()
    },
    /**
     * 复选框change
     * @param val
     */
    handleSelectionChange(val) {
      this.multipleSelection = val
      if (this.multipleSelection.length > 0) {
        this.showHandelBtn = true
      } else {
        this.showHandelBtn = false
      }
    },
    handleSizeChange(val) {
      this.query.limit = val
      this.loadProcessTableData()
    },
    handleCurrentChange(val) {
      this.query.offset = val
      this.loadProcessTableData()
    }
  }
}
</script>

<style lang="css" scoped>
.list-top {
  padding: 2px 0;
}

.list-top >>> input.el-input__inner{
  border-radius: 4px 0 0 4px;
}

.list-top >>> .gol-search{
  position: relative;
  /*border-radius: 0 4px 4px 0;*/
  border-radius: 4px;
}

.list-ops-icon {
  font-size: 16px;
  color:rgb(51, 51, 51);
}

.autoWidth {
  min-width: 100px;   
  text-align: start;
}

.autoWidth >>> .el-input:not(.is-focus) .el-input__inner {
  border-right-color: transparent;
}

.autoWidth >>> .el-input:not(.is-focus) .el-input__inner:hover,
.autoWidth >>> .el-input:not(.is-focus) .el-input__inner:focus {
  border-right-color: #126fe3;
}

.autoWidth >>> .el-input--prefix .el-input__inner {
  padding: 0 8px;
  user-select: none;
} 

.autoWidth >>> .el-input__prefix { 
  position: relative;
  margin-right: 32px;
  height: 30px;
  line-height: 30px;
  visibility: hidden;
}
.autoWidth >>> .el-input__inner {
  position: absolute;
  left: 0;
}

.autoWidth >>> .el-input__icon {
  height: 30px;
  line-height: 30px;
}
</style>
