<!-- 部门审核员规则列表 -->
<template>
  <div>
    <el-row>
      <el-col :span="9" class="align-left">
        <el-button type="primary" size="mini" icon="el-icon-plus" @click="newRule" style="font-size: 13px">{{$t('button.addDeptAuditorRule')}}</el-button>
        <el-button size="mini" icon="el-icon-delete" @click="delRuleBatch" style="font-size: 13px" v-if="showHandelBtn" >{{$t('button.delete')}}</el-button>
      </el-col>
      <el-col :span="15" class="align-right">
        <MultiChoice ref="multiChoice" v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')"/>
      </el-col>
    </el-row>
    <el-table
      :data="deptAuditorRuleList"
      element-loading-text=""
      v-loading="loading"
      :height="tableHeight"
      tooltip-effect="light"
      ref="multipleTable"
      style="margin-top: 10px; margin-bottom: 10px; min-height:180px;"
      border
      fit
      highlight-current-row
      @selection-change="handleSelectionChange"
      class="checkbox-table"
    >
      <el-table-column type="selection" width="35"></el-table-column>
      <el-table-column :label="$t('table.ruleName')" show-overflow-tooltip  min-width="50%">
        <template slot-scope="scope">
          <span style="white-space:pre;">{{ scope.row.rule_name }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.auditor')">
        <template slot-scope="scope">
          <el-popover
            placement="bottom-start"
            :title="auditorNamesPopover?$t('strategy.table.auditor'):''"
            width="200"
            trigger="click">
            <div class="popo-list" v-if="auditorNamesPopover">
              <ul>
                <template v-for="(item, index) in getAuditorNameList(scope.row.auditor_names)" >
                  <el-tooltip :key="index" class="item" effect="light" placement="top-start">
                    <div slot="content">{{item}}</div>
                    <li style="width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">{{item}}</li>
                  </el-tooltip>
                </template>
              </ul>
            </div>
            <span slot="reference" onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'" onmouseleave="this.style.color='',this.style.opacity=''">
                <el-tooltip placement="top-start" effect="light" :offset="0" :visible-arrow="false" :content="auditorNamesTransform(scope.row.auditor_names)">
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;" @click="auditorNamesPopover = true">{{auditorNamesTransform(scope.row.auditor_names)}}</span>
                </el-tooltip>
            </span>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation.name')" min-width="20%">
        <template slot-scope="scope">
          <el-button type="text" :title="$t('button.edit')" @click="edit(scope.row)" >
            <svg-icon iconClass="edit" className="list-ops-icon" />
          </el-button>
          <el-button type="text" :title="$t('button.delete')" @click="deleteRule(scope.row)">
            <svg-icon iconClass="delete" className="list-ops-icon" />
          </el-button>
        </template>
      </el-table-column>
      <div slot="empty" class="empty-box">
        <div v-if="searchParams.names.length > 0 || searchParams.auditors.length > 0">
          <div class="no-seach"></div>
          <p class="text">{{$t('message.noSeachTableTips')}}</p>
        </div>
        <div v-else>
          <div class="empty-text"></div>
          <p class="text">{{$t('message.noDataTableTips')}}</p>
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
    <div>
      <el-drawer
        :visible.sync="visibleDrawer"
        :custom-class="'no-header'"
        append-to-body
        modal-append-to-body
        :wrapperClosable="false"
        @mousedown.native="handleWrapperMousedown($event)"
        @mouseup.native="handleWrapperMouseup($event)"
        size="80%">
        <rule-properties v-if="visibleDrawer" ref="ruleProperties" :ruleId="ruleId" @close="closeDrawer"></rule-properties>
      </el-drawer>
    </div>
  </div>
</template>
<script>
import processModel from 'ebpm-process-modeler-front'
import ruleProperties from './ruleProperties'
import { getDeptAuditorRulePage, deleteDeptAuditorRule } from '@/api/deptAuditorRule.js'
import MultiChoice from '@/components/MultiChoice'
export default {
  name: 'list',
  components: { processModel, ruleProperties, MultiChoice },
  props: {
    roles: {
      type: String,
      required: false
    }
  },
  data() {
    const multic_hoice_types = [
      { label: this.$i18n.tc('table.ruleName'), value: 'names' },
      { label: this.$i18n.tc('modeler.multicTypeLabel.auditor'), value: 'auditors' }
    ]
    return {
      multic_hoice_types,
      visibleDrawer: false,
      classmodel:false,
      designProcessVisible: false,
      bpmnIsChange: false,
      loading: true,
      showHandelBtn: false,
      auditorNamesPopover:false,
      visit: 'new',
      procType: 'process_center',
      tableHeight: 590,
      ruleId:'',
      deptAuditorRuleList: [],
      multiChoiceSearch: [],
      multipleSelection: [],
      searchParams:{
        names: [],
        auditors: []
      },
      query: {
        name: '',
        filter_share: 1,
        type_id: '',
        offset: 1,
        limit: 50,
        template: 'Y'
      },
      pagination: {
        page_sizes: [50, 100, 200],
        total: 0,
        layout: 'total, prev, pager, next, sizes '
      }
    }
  },
  created() {
    this.loadRuleTableData()
  },
  mounted(){
    this.$nextTick(function () {
      const _this = this
      this.tableHeight = window.innerHeight - this.$refs.multipleTable.$el.offsetTop - 110
      if(_this.tableHeight < 540) {
        _this.tableHeight = 540
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
        Object.keys(this.searchParams).forEach(item => {
          this.searchParams[item] = []
        })
        val.forEach(el => {
          this.searchParams[el.type].push(el.val)
        })
        this.query.offset = 1
        this.loadRuleTableData('search')
      }
    }
  },
  methods: {
    adaptTableHeight(){
      const _this = this
      if(_this.$refs.multipleTable) {
        _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 110
        if(_this.tableHeight < 540) {
          _this.tableHeight = 540
        }
      }
    },
    /**
     * 加载部门审核员规则列表数据
     */
    loadRuleTableData(type) {
      const _this = this
      _this.loading = true
      const query = { ..._this.query, ..._this.searchParams, offset: (_this.query.offset - 1) * _this.query.limit }
      getDeptAuditorRulePage(query).then(response => {
        _this.deptAuditorRuleList = response.entries
        _this.pagination.total = response.total_count
        _this.loading = false
        if(type !== 'search'){
          _this.$emit('showType', _this.deptAuditorRuleList)
        }
      }).catch(() => {})
    },
    /**
     * 新建部门审核员规则
     */
    newRule() {
      const _this = this
      _this.ruleId = ''
      _this.visibleDrawer = true
    },
    /**
     * 编辑部门审核员规则
     * @param row
     */
    edit(row) {
      const _this = this
      _this.ruleId = row.rule_id
      _this.visibleDrawer = true
    },
    /**
     * 删除部门审核员规则
     * @param row
     */
    deleteRule(row){
      const _this = this
      _this.$confirm(_this.$i18n.tc('deptAuditorRule.deleteDeptAuditorRuleTip'), '', {
        confirmButtonText: _this.$i18n.tc('button.confirm'),
        cancelButtonText: _this.$i18n.tc('button.cancel'),
        iconClass: 'warning-blue',
        type: 'warning'
      }).then(() => {
        _this.loading = true
        let idArr = []
        idArr.push(row.rule_id)
        deleteDeptAuditorRule(idArr).then(res => {
          _this.$message.success(_this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadRuleTableData()
        }).catch(() => {})
      }).catch(() => {
      })
    },
    /**
     * 批量删除部门审核员规则
     */
    delRuleBatch(){
      const _this = this
      _this.$confirm(_this.$i18n.tc('deptAuditorRule.deleteDeptAuditorRuleTip'), '', {
        confirmButtonText: _this.$i18n.tc('button.confirm'),
        cancelButtonText: _this.$i18n.tc('button.cancel'),
        iconClass: 'warning-blue',
        type: 'warning'
      }).then(() => {
        _this.loading = true
        let idArr = []
        _this.multipleSelection.forEach(select => {
          idArr.push(select.rule_id)
        })
        deleteDeptAuditorRule(idArr).then(res => {
          _this.$message.success(_this.$i18n.tc('deptAuditorRule.deleteBatchPreTips1') + idArr.length + _this.$i18n.tc('deptAuditorRule.deleteBatchPreTips2'))
          _this.reloadRuleTableData()
        }).catch(() => {})
      }).catch(() => {})
    },
    /**
     * 分解获取审核员列表
     * @param auditorNames
     */
    getAuditorNameList(auditor_names){
      return this.auditorNamesTransform(auditor_names).split('、')
    },
    /**
     * 搜索
     */
    search() {
      this.loadRuleTableData()
    },
    reloadRuleTableData(){
      this.query.offset = 1
      this.loadRuleTableData()
    },
    closeDrawer(_obj) {
      const _this = this
      _this.visibleDrawer = false
      if (!_obj) {
        _this.multiChoiceSearch = []
        _this.$refs.multiChoice.clearValues()
      }
      _this.loadRuleTableData()
    },
    auditorNamesTransform(auditor_names){
      let audit_names = ''
      if(this.$i18n.locale === 'en-us'){
        audit_names = auditor_names.replaceAll('、', ', ')
      }
      const auditArr = auditor_names.split('、')
      auditArr.forEach((item) => {
        if(audit_names.indexOf(item) === -1){
          audit_names += item + '、'
        }
      })
      return audit_names.substr(0,audit_names.length - 1)
    },
    /**
     * 复选框change
     * @param val
     */
    handleSelectionChange(val){
      this.multipleSelection = val
      if(this.multipleSelection.length > 0){
        this.showHandelBtn = true
      } else {
        this.showHandelBtn = false
      }
    },
    // 监测抽屉鼠标事件
    handleWrapperMousedown(e) {
      // 如果为true，则表示点击发生在遮罩层
      this.classmodel = !!e.target.classList.contains('el-drawer__container')
    },
    handleWrapperMouseup(e) {
      if((e.target.classList.contains('el-drawer__container')) && this.classmodel){
        this.visibleDrawer = false
      }else{
        this.visibleDrawer = true
      }
      this.classmodel = false
    },
    handleSizeChange(val) {
      this.query.limit = val
      this.loadRuleTableData()
    },
    handleCurrentChange(val) {
      this.query.offset = val
      this.loadRuleTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
.list-ops-icon {
  font-size: 16px;
  color:rgb(51, 51, 51);
}
</style>
