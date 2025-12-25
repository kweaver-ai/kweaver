<!-- 部门审核员规则列表 -->
<template>
  <div>
    <el-row>
      <el-col :span="11" class="align-left">
        <el-button type="primary" size="mini" icon="el-icon-plus" @click="newRule" style="font-size: 13px" >{{$t('button.addDeptAuditorRule')}}</el-button>
        <el-button size="mini" icon="el-icon-delete" @click="delRuleBatch" style="font-size: 13px" v-if="showHandelBtn">{{$t('button.delete')}}</el-button>
      </el-col>
      <el-col :span="13" class="align-right">
        <MultiChoice ref="multiChoice" v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')" />
      </el-col>
    </el-row>
    <div class="create-process-prompt-box"><p>{{ $t('processCenter.guideExplain3') }}</p></div>
    <el-table
      :data="deptAuditorRuleList"
      element-loading-text=""
      v-loading="loading"
      :height="tableHeight"
      tooltip-effect="light"
      ref="multipleTable"
      style="margin-top: 10px; margin-bottom: 10px"
      border
      fit
      highlight-current-row
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      class="checkbox-table table-ellip">
        <el-table-column type="selection" width="35"></el-table-column>
        <el-table-column :label="$t('table.ruleName')" min-width="50%">
          <template slot-scope="scope">
            <span v-title :title="scope.row.rule_name" style="white-space:pre;">{{ scope.row.rule_name }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('table.auditor')">
          <template slot-scope="scope">
            <workflowPopover
               placement="bottom-start"
               :title="auditorNamesPopover?$t('strategy.table.auditor'):''"
               width="200"
               @show="auditorNamesPopover = true"
               trigger="click">
              <div class="popo-list" v-if="auditorNamesPopover">
                <div class="audit-list">
                  <template v-for="(item, index) in getAuditorNameList(scope.row.auditor_names)">
                    <div :key="index" v-title :title="item" style="width: 100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;"> {{ item }}</div>
                  </template>
                </div>
              </div>
              <span slot="reference" onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'" onmouseleave="this.style.color='',this.style.opacity=''">
                <span @click="auditorNamesPopover = true" v-title :title="auditorNamesTransform(scope.row.auditor_names)">{{ auditorNamesTransform(scope.row.auditor_names) }}</span>
              </span>
            </workflowPopover>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation.name')" min-width="20%">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-edit-outline" :title="$t('button.edit')" @click="edit(scope.row)" />
            <el-button type="text" icon="icon-delete" :title="$t('button.delete')" @click="deleteRule(scope.row)" />
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
    <div class="el-pagination">
      <workflowPagination
        :current-page="query.offset"
        :page-sizes="pagination.page_sizes"
        :page-size="query.limit"
        :layout="pagination.layout"
        :total="pagination.total"
        ref="hanjian"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <div>
      <el-drawer
        :visible.sync="visibleDrawer"
         :custom-class="'no-header'"
         :append-to-body="false"
         modal-append-to-body
         z-index="999"
         :modal='false'
         :wrapperClosable="false"
         @mousedown.native="handleWrapperMousedown($event)"
         @mouseup.native="handleWrapperMouseup($event)"
         size="75%">
        <rule-properties v-if="visibleDrawer" ref="ruleProperties" :ruleId="ruleId" @close="closeDrawer"></rule-properties>
      </el-drawer>
    </div>
  </div>
</template>
<script>
import processModel from 'ebpm-process-modeler-client'
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
  data () {
    const multic_hoice_types = [
      { label: this.$i18n.tc('table.ruleName'), value: 'names' },
      { label: this.$i18n.tc('modeler.multicTypeLabel.auditor'), value: 'auditors' }
    ]
    return {
      multic_hoice_types,
      visibleDrawer: false,
      classmodel: false,
      designProcessVisible: false,
      bpmnIsChange: false,
      loading: true,
      showHandelBtn: false,
      auditorNamesPopover: false,
      visit: 'new',
      procType: 'process_center',
      tableHeight: 580,
      ruleId: '',
      deptAuditorRuleList: [],
      multiChoiceSearch: [],
      multipleSelection: [],
      searchParams: {
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
  computed: {
    microWidgetPropsVal () {
      return this.$store.state.app.microWidgetProps
    }
  },
  created () {
    this.loadRuleTableData()
  },
  filters: {
    ellipsis (value, len) {
      if (!value) return ''
      if (value.length > len) {
        return value.slice(0, len) + '...'
      }
      return value
    }
  },
  mounted () {
    const _this = this
    this.$nextTick(function () {
      this.tableHeight = window.innerHeight - this.$refs.multipleTable.$el.offsetTop - 155
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
        this.loadRuleTableData('search')
      }
    }

  },
  methods: {
    /**
     * 加载部门审核员规则列表数据
     */
    loadRuleTableData (_type) {
      const _this = this
      _this.loading = true
      const query = { ..._this.query, ..._this.searchParams, process_client: 1, offset: (_this.query.offset - 1) * _this.query.limit }
      getDeptAuditorRulePage(query).then(response => {
        _this.deptAuditorRuleList = response.entries
        _this.pagination.total = response.total_count
        _this.loading = false
        if (_type !== 'search') {
          _this.$emit('showType', _this.deptAuditorRuleList)
        }
      }).catch(() => { })
    },
    /**
     * 新建部门审核员规则
     */
    newRule () {
      const _this = this
      _this.ruleId = ''
      _this.visibleDrawer = true
    },
    /**
     * 编辑部门审核员规则
     * @param row
     */
    edit (row) {
      const _this = this
      _this.ruleId = row.rule_id
      _this.visibleDrawer = true
    },
    /**
     * 删除部门审核员规则
     * @param row
     */
    deleteRule (row) {
      const _this = this
      _this.$dialog_confirm(_this.$t('deptAuditorRule.deleteDeptAuditorRuleTip'), '', _this.$t('button.confirm'), _this.$t('button.cancel'), true).then(() => {
        _this.loading = true
        let idArr = []
        idArr.push(row.rule_id)
        deleteDeptAuditorRule(idArr).then(res => {
          _this.$toast('success', _this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadRuleTableData()
        }).catch(() => { })
      }).catch(() => {
      })
    },
    /**
     * 批量删除部门审核员规则
     */
    delRuleBatch () {
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('deptAuditorRule.deleteDeptAuditorRuleTip'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        _this.loading = true
        let idArr = []
        _this.multipleSelection.forEach(select => {
          idArr.push(select.rule_id)
        })
        deleteDeptAuditorRule(idArr).then(res => {
          _this.$toast('success', _this.$i18n.tc('deptAuditorRule.deleteBatchPreTips1') + idArr.length + _this.$i18n.tc('deptAuditorRule.deleteBatchPreTips2'))
          _this.reloadRuleTableData()
        }).catch(() => { })
      }).catch(() => { })
    },
    /**
     * 分解获取审核员列表
     * @param auditorNames
     */
    getAuditorNameList (auditor_names) {
      return this.auditorNamesTransform(auditor_names).split('、')
    },
    /**
     * 搜索
     */
    search () {
      this.loadRuleTableData()
    },
    reloadRuleTableData () {
      this.query.offset = 1
      this.loadRuleTableData()
    },
    closeDrawer (obj) {
      const _this = this
      _this.visibleDrawer = false
      if (!obj) {
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
    handleSelectionChange (val) {
      this.multipleSelection = val
      if (this.multipleSelection.length > 0 && val !== null) {
        this.showHandelBtn = true
      } else {
        this.showHandelBtn = false
      }
    },
    // 监测抽屉鼠标事件
    handleWrapperMousedown (e) {
      // 如果为true，则表示点击发生在遮罩层
      this.classmodel = !!e.target.classList.contains('el-drawer__container')
    },
    handleWrapperMouseup (e) {
      if ((e.target.classList.contains('el-drawer__container')) && this.classmodel) {
        this.visibleDrawer = false
      } else {
        this.visibleDrawer = true
      }
      this.classmodel = false
    },
    handleSizeChange (val) {
      this.query.limit = val
      this.loadRuleTableData()
    },
    handleCurrentChange (val) {
      this.query.offset = val
      this.loadRuleTableData()
    },
    handleRowClick (row, column, event) {
      // 从已选中数据中 判断当前点击的是否被选中
      const selected = this.multipleSelection.some(item => item.rule_id === row.rule_id)  // 是取消选择还是选中
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

<style lang="scss" scoped>
</style>
