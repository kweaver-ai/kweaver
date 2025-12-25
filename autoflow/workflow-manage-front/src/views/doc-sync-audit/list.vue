<!-- 同步流程列表-->
<template>
  <div>
    <el-row>
      <el-col :span="12" class="align-left">
        <el-button type="primary" size="mini" icon="el-icon-plus" @click="newProcess">{{ $t('button.addProc') }}</el-button>
      </el-col>
    </el-row>
    <el-table v-loading="list_loading" style="margin-top: 10px; margin-bottom: 10px" :data="list" element-loading-text="" border fit highlight-current-row>
      <el-table-column :label="$t('table.procName')" show-overflow-tooltip min-width="200">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.procType')" show-overflow-tooltip min-width="200">
        <template slot-scope="scope">
          <span>{{ scope.row.type_name }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.version')" width="200">
        <template slot-scope="scope">
          <span>{{ scope.row.id.split(':')[1] }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.creator')" width="200">
        <template slot-scope="scope">
          {{ scope.row.create_user_name ? scope.row.create_user_name : '-' }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.createTime')" min-width="150">
        <template slot-scope="scope">
          {{ scope.row.create_time || formatDate }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation.name')" width="220">
        <template slot-scope="scope">
          <el-button type="text" icon="icon iconfont icon-bianjifuben" :title="$t('button.edit')" @click="edit(scope.row)" />
        </template>
      </el-table-column>
    </el-table>
    <div class="el-pagination" style="float: right">
      <el-pagination
        background
        :current-page="query.offset"
        :page-sizes="pagination.page_sizes"
        :page-size="query.limit"
        :layout="pagination.layout"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog :visible="dialog_visible" :close-on-click-modal="false" :show-close="false" fullscreen :custom-class="'no-header el-dialog-white'">
      <div element-loading-text="">
        <processModel v-if="dialog_visible" :is_change.sync="bpmn_is_change" :tenant_id="process_model_obj.tenant_id" :proc_def_key="process_model_obj.proc_def_key" :proc_def_id="process_model_obj.proc_def_id" :visit="visit" :proc_type="proc_type" @close="closeDialog" @refresh="fetchData" @setCurrentStep="setCurrentStep" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
// @ts-ignore
import processModel from 'ebpm-process-modeler-front'
import { getList } from '@/api/processDefinition.js'
import { tenantId } from '@/utils/config'
import XEUtils from 'xe-utils'
let bpmn_is_change_open = false
export default {
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    formatDate(date) {
      return XEUtils.toDateString(date)
    },
    type_name(type) {
      const map = {
        doc_share: this.$i18n.tc('modeler.procType.DOC_SHARE'),
        doc_flow: this.$i18n.tc('modeler.procType.DOC_FLOW'),
        doc_sync: this.$i18n.tc('modeler.procType.DOC_SYNC'),
        doc_secret: this.$i18n.tc('modeler.procType.DOC_SECRET')
      }
      return map[type]
    }
  },
  components: { processModel },
  data() {
    return {
      list: null,
      list_loading: true,
      visit:'new',
      proc_type:'doc_sync',
      query: {
        name: undefined,
        type_id: 'doc_sync',
        offset: 1,
        limit: 20
      },
      pagination: {
        page_sizes: [10, 20, 30, 50, 100],
        total: 0,
        layout: 'total, sizes, prev, pager, next, jumper'
      },
      dialog_visible: false,
      bpmn_is_change: false,
      process_model_obj: { tenant_id: tenantId, proc_def_key: '', proc_def_id: '' }
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.list_loading = true
      const query = { ...this.query, offset: (this.query.offset - 1) * this.query.limit }
      getList(query).then(response => {
        this.list = response.entries
        this.pagination.total = response.total_count
        this.list_loading = false
      }).catch(() => {})
    },
    closeDialog() {
      if (this.bpmn_is_change) {
        if (!bpmn_is_change_open) {
          bpmn_is_change_open = true
          this.$confirm(this.$i18n.tc('field.modelDialogQuit'), '', {
            confirmButtonText: this.$i18n.tc('button.confirm'),
            cancelButtonText: this.$i18n.tc('button.cancel'),
            iconClass: 'warning-blue',
            type: 'warning'
          })
            .then(() => {
              this.dialog_visible = false
              bpmn_is_change_open = false
            })
            .catch(() => {
              bpmn_is_change_open = false
            })
        }
      } else {
        this.fetchData()
        this.dialog_visible = false
      }
    },
    newProcess() {
      this.process_model_obj.proc_def_key = 'null'
      this.visit = 'new'
      this.dialog_visible = true
    },
    edit(row) {
      const key = row.id.split(':')[0]
      const tenant_id = row.tenant_id
      this.process_model_obj.tenant_id = tenant_id
      this.process_model_obj.proc_def_key = key
      this.process_model_obj.proc_def_id = row.id
      this.proc_type = row.type
      this.visit = 'update'
      this.dialog_visible = true
    },
    search() {
      this.fetchData()
    },
    handleSizeChange(val) {
      this.query.limit = val
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.query.offset = val
      this.fetchData()
    },
    setCurrentStep(val) {
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
