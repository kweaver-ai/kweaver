<!-- 共享流程列表 -->
<template>
  <div :class="{'audit-table': tableData.length > 0}" >
    <el-table
      style="width: 100%; margin-top: 10px; margin-bottom: 10px"
      :data="tableData"
      border
      fit
      highlight-current-row
      v-show="tableData.length > 0"
    >
      <el-table-column :label="$t('table.procName')" show-overflow-tooltip min-width="150">
        <template v-if="$store.state.app.secret.status === 'y'">
          <span v-if="proc_type === 'doc_realname_share'">{{ $t('modeler.docShareName.secretRealName') }}</span>
        </template>
        <template v-else>
          <span v-if="proc_type === 'doc_anonymity_share'">{{ $t('modeler.docShareName.anonymity') }}</span>
          <span v-else>{{ $t('modeler.docShareName.realName') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation.name')" width="100">
        <template slot-scope="scope">
          <el-button
            type="text"
            icon="el-icon-edit-outline"
            :title="$t('button.edit')"
            :disabled="disabled"
            @click="editProcess(scope.row)"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :visible="dialog_visible"
      :close-on-click-modal="false"
      :show-close="false"
      fullscreen
      :custom-class="'no-header ' + dialog_class"
    >
      <div element-loading-text="">
        <processModel
          v-if="dialog_visible"
          :proc_type="proc_type"
          :tenant_id="process_model_obj.tenant_id"
          :proc_def_key="process_model_obj.proc_def_key"
          :proc_def_id="process_model_obj.proc_def_id"
          :process-name="processName"
          @close="closeDialog"
          @refresh="getShareProcess"
          @setCurrentStep="setCurrentStep"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>

import processModel from 'ebpm-process-modeler-front'
import { getList } from '@/api/processDefinition.js'
import { tenantId } from '@/utils/config'
export default {
  name: 'DocShareProcessList',
  components: { processModel },
  props: {
    proc_type: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      disabled: false,
      tableData: [],
      dialog_visible: false,
      dialog_class: 'el-dialog-white',
      process_model_obj: { tenant_id: tenantId, proc_def_key: '', proc_def_id: '' },
      shareKey: 'Process_SHARE001',
      processName: ''
    }
  },
  created() {
    this.getShareProcess()
  },
  methods: {
    /**
     * 查询共享审核流程列表数据
     */
    getShareProcess() {
      const _this = this
      if (_this.proc_type === 'doc_anonymity_share') {
        _this.shareKey = 'Process_SHARE002'
      }
      const query = {
        key: _this.shareKey
      }
      getList(query).then(response => {
        if (response !== null && response !== '') {
          _this.tableData = response.entries
        }
      })
    },
    /**
     * 编辑流程
     * @param row
     */
    editProcess(row) {
      const key = row.id.split(':')[0]
      this.process_model_obj.proc_def_key = key
      this.process_model_obj.proc_def_id = row.id
      this.dialog_visible = true
      this.processName = row.name
    },
    closeDialog() {
      this.dialog_visible = false
    },
    setCurrentStep(val) {
      this.dialog_class = 'el-dialog-white'
    }
  }
}
</script>
