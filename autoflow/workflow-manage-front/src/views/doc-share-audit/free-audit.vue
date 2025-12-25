<!-- 共享流程免审核配置界面 -->
<template>
  <div class="">
    <el-row class="">
      <div class="title-text">
        <template v-if="$store.state.app.secret.status === 'y'">
          {{ $t('freeAudit.text.secretShareLevelHint') }}
        </template>
        <template v-else>
          {{ $t('freeAudit.text.selfShareLevelHint') }}
        </template>
        <el-select v-model="file_level" :disabled="disabled" size="small" @change="save()">
          <el-option v-for="index in levels" :key="index.lv" :label="index.name" :value="index.lv" />
        </el-select>
        {{ $t('freeAudit.text.selfShareLevelFreeHint') }}
      </div>
    </el-row>
    <!-- 设置部门免密审核 -->
    <el-row style="margin-top:8px">
      <el-row type="flex" justify="space-between">
        <el-col :span="16">
          <el-button size="small" type="primary" icon="el-icon-plus" :disabled="disabled" @click="addDepartMent">
            {{ $t('freeAudit.addDept') }}
          </el-button>
          <el-button v-if="checkedDepts.length > 0" :disabled="disabled" size="small" style="width: 90px;" @click="deleteDeparts">
            {{ $t('freeAudit.delete') }}
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-input
            v-model="searchStr"
            clearable
            :placeholder="$t('freeAudit.text.searchDepartmentName')"
            prefix-icon="el-icon-search"
            :disabled="disabled"
            @input="searchchangeValue()"
          />
        </el-col>
      </el-row>
      <el-row type="flex" justify="space-between" style="margin: 5px 0 5px 0;">
        <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          :disabled="disabled"
          @change="handleCheckAllChange"
        >{{ $t('modeler.selectAll') }}</el-checkbox>
      </el-row>
    </el-row>
    <div>
      <!-- 表格显示部分 -->
      <el-checkbox-group v-model="checkedDepts" :disabled="disabled" @change="handleCheckedDeptChange">
        <table v-loading="list_loading" border="0" width="100%" frame="below" cellspacing="0" cellpadding="0">
          <tr>
            <th style="width: 80%;">{{ $t('freeAudit.departmentName') }}</th>
            <th style="width: 20%;">{{ $t('freeAudit.operate') }}</th>
          </tr>
          <tr>
            <td>{{ $t('freeAudit.text.belongDepartment') }}</td>
            <td>
              <el-switch v-model="directDepartment" :disabled="disabled" @change="save()" />
            </td>
          </tr>
          <tr v-for="(item,index) in tableData" :key="index">
            <td style="width: 80%;">
              <el-checkbox :key="item.id" :label="item.id">
                <el-tooltip class="item" effect="light" :content="item.department_name" placement="top-start">
                  <span style="width:700px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;float: left;">{{ item.department_name }}</span>
                </el-tooltip>
              </el-checkbox>
            </td>
            <td>
              <i class="el-icon-delete" @click="!disabled && deleteDepart(item.id)" />
            </td>
          </tr>
        </table>
      </el-checkbox-group>
      <!-- 分页部分 -->
      <div v-if="pagination.total > query.limit" class="el-pagination" style="float: right">
        <el-pagination
          background
          :current-page="query.offset"
          :page-sizes="pagination.page_sizes"
          :disabled="disabled"
          :page-size="query.limit"
          :layout="pagination.layout"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      <!-- 触发框 -->
      <bl-user-select
        v-if="user_selector_visible"
        :visible.sync="user_selector_visible"
        :dialog_title="$t('freeAudit.addDept')"
        selected_list="checked_id"
        org_type="depart"
        type="depart"
        :multiple="multiple"
        :ban_overlap="ban_overlap"
        :choose_data="choose_data"
        @confirm="checkDataConfirm"
      />
    </div>
  </div>
</template>

<script>

import BlUserSelect from '@/components/selector_dept/index'
import { asConfig } from '@/api/efast'
import { config, update, page_search_dept, save_dept, delete_dept } from '../../api/freeAuditApi'

export default {
  name: 'FreeAudit',
  components: {
    BlUserSelect
  },
  data() {
    return {
      disabled: false,
      visible: true,
      isCollapse: false,
      file_level: null,
      levels: [],
      searchDepartName: null,
      searchTimeouter:null,
      list_loading: false,
      tableData: [],
      searchStr: '',
      query: {
        search: '',
        offset: 1,
        limit: 200
      },
      pagination: {
        page_sizes: [10, 20, 30, 50, 100, 200],
        total: 0,
        layout: 'total, sizes, prev, pager, next, jumper'
      },
      directDepartment: false,
      user_selector_visible: false,
      multiple: true,
      ban_overlap: true,
      org: 'depart',
      check_data: [],
      checked_id: '',
      choose_data: [],
      isIndeterminate: false,
      checkAll: false,
      checkedDepts: []
    }
  },
  created() {
    this.initData()
  },
  mounted() {
  },
  methods: {
    initData() {
      this.getAsConfig()
      this.pageSearchFreeAuditDept()
    },
    getAsConfig() {
      asConfig().then(response => {
        const csfLevel = response.csf_level_enum
        const csfLevelKeys = Object.keys(csfLevel)
        const arr = []
        csfLevelKeys.forEach(key => {
          const item = {}
          item['lv'] = csfLevel[key] + ''
          item['name'] = key
          arr.push(item)
        })
        this.levels = arr.sort(this.compare('lv')).reverse()
        this.getConfig()
      })
    },
    compare(property){
      return function(a,b){
        let value1 = a[property]
        let value2 = b[property]
        return value1 - value2
      }
    },
    getConfig() {
      config().then(response => {
        this.file_level = response.csf_level + ''
        this.directDepartment = response.department_avoid_status === 'y'
      })
    },
    save() {
      const data = {
        csf_level: this.file_level,
        department_avoid_status: this.directDepartment ? 'y' : 'n'
      }
      update(data).then(response => {
      })
    },
    handleSizeChange(val) {
      this.query.limit = val
      this.pageSearchFreeAuditDept()
    },
    handleCurrentChange(val) {
      this.query.offset = val
      this.pageSearchFreeAuditDept()
    },
    addDepartMent() {
      this.user_selector_visible = true
      this.choose_data = []
    },
    async pageSearchFreeAuditDept() {
      this.query.search = this.searchStr
      let searVo = { offset: (this.query.offset - 1) * this.query.limit, limit: this.query.limit, search: this.searchStr }
      try{
        const response = await page_search_dept(searVo)
        this.tableData = response.entries
        this.pagination.total = response.total_count
        this.handleCheckedDeptChange(this.checkedDepts)
      } catch (err) {
        console.error(err)
      }
    },
    async deleteDepart(ids) {
      const deleteArr = ids.split(',')
      const self = this
      self.list_loading = true
      try {
        await delete_dept(ids)
        self.checkedDepts = self.checkedDepts.filter((item)=>!deleteArr.includes(item))
        await self.pageSearchFreeAuditDept()
        self.list_loading = false
      } catch (error) {
        console.error(error)
      }
    },
    deleteDeparts() {
      this.deleteDepart(this.checkedDepts.join(','))
    },
    searchchangeValue() {
      const _this = this
      _this.query.offset = 1
      if(_this.searchTimeouter){
        clearTimeout(_this.searchTimeouter)
      }
      _this.searchTimeouter = setTimeout(function () {
        _this.pageSearchFreeAuditDept()
      },800)
    },
    checkDataConfirm(check_data) {
      this.check_data = check_data
      const self = this
      self.checked_id = self.check_data[0].id
      let reqs = []
      for (let index = 0; index < check_data.length; index++) {
        let dept = { department_id: check_data[index].id, department_name: check_data[index].name }
        reqs.push(dept)
      }
      this.list_loading = !this.list_loading
      save_dept(JSON.stringify(reqs)).then(response => {
        this.list_loading = !this.list_loading
        this.pageSearchFreeAuditDept()
        this.check_data = null
      })
    },
    handleCheckAllChange(value) {
      if (value) {
        this.checkedDepts = this.tableData.map(item => item.id)
      } else {
        this.checkedDepts = []
      }
      this.isIndeterminate = false
    },
    handleCheckedDeptChange(value) {
      const checkedCount = value.length
      this.checkAll = checkedCount === this.tableData.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.tableData.length
    }
  }
}
</script>

<style scoped>
  .audit-box {
    /* font-family: "Noto Sans SC", "SimSun"; */
    font-family: inherit;
    font-size: "13px";
    line-height: 1.7;
  }

  .gray-text {
    color: #999999;
  }

  .check {
    color: #505050;
  }

  .title-text {
    margin-top: 16px;
  }

  table {
    border: 0;
    margin-top: 8px;
    border-collapse: collapse;
    border-bottom: 1px
  }

  th {
    background-color: #f6f7fc;
    font-weight: 300;
    height: 2.6rem;
  }

  td,
  th {
    padding-left: 1em;
    width: 50%;
    text-align: left;
  }

  td {
    border-bottom: 1px solid #f4f5f4;
    height: 3.6rem;
  }
</style>
