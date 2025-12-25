<template>
  <div>
    <!-- 搜索 -->
    <div class="small-title-table">
      <div class="todoList-header">
        <div class="todoList-cascader">
          <div class="cell">
            <el-cascader
              v-show="!hasApplicationType"
              v-model="applyType"
              :show-all-levels="false"
              :options="bizTypes"
              :append-to-body="false"
              :props="{ expandTrigger: 'hover' }"
              id="applyTypeElement"
              popper-class="el-popper-1"
              size="small"
              style="width: 100px; margin-right: 32px"
              @change="applyTypeChange"
            >
              <template slot-scope="{ node, data }">
                <template
                  v-if="
                    $store.state.app.secret.status === 'y' &&
                      ['realname', 'perm', 'owner', 'inherit'].includes(
                        data.value
                      )
                  "
                  >{{ $t('common.bizTypes.secretRealName') }}</template
                >
                <template v-else>{{
                  data.value === ''
                    ? $t('common.bizTypes.all')
                    : data.value === 'share' ||
                      ['realname', 'perm', 'owner', 'inherit'].includes(
                        data.value
                      ) ||
                      data.value === 'anonymous'
                    ? $t('common.bizTypes.' + data.value)
                    : data.label
                }}</template>
              </template>
            </el-cascader>
          </div>
        </div>
        <div class="todoList-btnGroup">
          <div v-show="multipleSelection.length > 1">
            <span>{{
              $t('common.selectNum', { num: this.multipleSelection.length })
            }}</span>
            <!-- <el-popover
              key="pass"
              placement="bottom"
              v-model="passVisible"
              :append-to-body="false"
              :popper-options="{
                boundariesElement: 'body'
              }"
            >
              <p>
                <i
                  class="el-icon-warning"
                  style="color: rgb(0,145,255);font-size:16px;margin-right:8px;"
                ></i>
                <span style="color:#000;font-size:13px">
                  {{
                    $t('common.surePass', {
                      num: this.multipleSelection.length
                    })
                  }}
                </span>
              </p>
              <div style="text-align: right; margin: 12px 0 0;">
                <el-button
                  size="mini"
                  class="todolist-sure"
                  @click="handleBatchPass"
                >
                  {{ $t('common.detail.operation.sure') }}
                </el-button>
                <el-button
                  size="mini"
                  @click="passVisible = false"
                  class="todolist-cancel"
                >
                  {{ $t('common.detail.operation.cancel') }}
                </el-button>
              </div>
              <el-button
                slot="reference"
                style="margin-left: 8px"
                class="as-btn"
                :disabled="loading"
                type="primary"
                size="mini"
              >
                {{ $t('common.detail.operation.pass') }}
              </el-button>
            </el-popover> -->
            <!-- <el-popover
              key="reject"
              placement="bottom"
              v-model="rejectVisible"
              :append-to-body="false"
              :popper-options="{
                boundariesElement: 'body'
              }"
            >
              <p>
                <i
                  class="el-icon-warning"
                  style="color: rgb(0,145,255);font-size:16px;margin-right:8px;"
                ></i>
                <span style="color:#000;font-size:13px">
                  {{
                    $t('common.sureReject', {
                      num: this.multipleSelection.length
                    })
                  }}
                </span>
              </p>
              <div style="text-align: right; margin: 12px 0 0;">
                <el-button
                  size="mini"
                  @click="handleBatchReject"
                  class="todolist-sure"
                  >{{ $t('common.detail.operation.sure') }}</el-button
                >
                <el-button
                  size="mini"
                  @click="rejectVisible = false"
                  class="todolist-cancel"
                >
                  {{ $t('common.detail.operation.cancel') }}
                </el-button>
              </div>
              <el-button
                slot="reference"
                style="margin-left: 8px"
                class="as-btn"
                :disabled="loading"
                size="mini"
                >{{ $t('common.detail.operation.reject') }}
              </el-button>
            </el-popover> -->
            <el-button
              style="margin-left: 8px"
              class="as-btn"
              :disabled="loading"
              type="primary"
              size="mini"
              @click="handleBatchPass"
            >
              {{ $t('common.detail.operation.pass') }}
            </el-button>
            <el-button
              style="margin-left: 8px"
              class="as-btn"
              :disabled="loading"
              size="mini"
              @click="handleBatchReject"
              >{{ $t('common.detail.operation.reject') }}
            </el-button>
          </div>
        </div>
        <div class="todoList-search">
          <MultiChoice
            ref="multiChoice"
            v-model="multiChoiceSearch"
            :types="multic_hoice_types"
            :placeholder="$t('common.searches')"
          />
        </div>
      </div>
    </div>
    <div class="audit-table multiple" :style="{ height: auditTableHeight }">
      <div class="cell-left">
        <div class="task_relea_page rzsj_table_bar" :style="{ height: auditTableHeight }">
          <el-table
            :data="dataList"
            ref="singleTable"
            v-loading="loading"
            :height="tableHeight"
            :highlight-current-row="multipleSelection.length === 1"
            class="table-ellip set-table-latout"
            @row-click="rowClick"
            @selection-change="handleSelectionChange"
          >
            >
            <el-table-column type="selection" width="55"> </el-table-column>
            <el-table-column
              :label="$t('common.column.bizType')"
              min-width="120px"
            >
              <template slot-scope="scope">
                <template
                  v-if="
                    $store.state.app.secret.status === 'y' &&
                      ['realname', 'perm', 'owner', 'inherit'].includes(
                        scope.row.biz_type
                      )
                  "
                >
                  <span
                    v-title
                    :title="$t('common.dataBizTypes.secretRealName')"
                    >{{ $t('common.dataBizTypes.secretRealName') }}</span
                  >
                </template>
                <template v-else>
                  <span
                    v-if="
                      ['realname', 'perm', 'owner', 'inherit'].includes(
                        scope.row.biz_type
                      ) || scope.row.biz_type === 'anonymous'
                    "
                    v-title
                    :title="$t('common.bizTypes.' + scope.row.biz_type)"
                    >{{ $t('common.dataBizTypes.' + scope.row.biz_type) }}</span
                  >
                  <span v-else v-title :title="getBizType(scope.row)">{{
                    getBizType(scope.row)
                  }}</span>
                </template>
              </template>
            </el-table-column>

            <el-table-column
              :label="$t('common.column.abstract')"
              min-width="130px"
            >
              <template slot-scope="scope">
                <!-- 判断当前申请是对接了任意审核还是未对接任意审核 -->
                <div v-if="scope.row.workflow !== null && !getIsMultiKcPublish(scope.row)" :key="scope.row.id">
                  <p
                    v-title
                    :title="scope.row.workflow.abstract_info.text"
                    style="margin-bottom:0;"
                  >
                    <!-- 判断当前申请是否有申请类型，如果没有申请类型走无标题模板-->
                    <span
                      v-if="
                        typeof scope.row.workflow.abstract_info.icon !==
                          'undefined'
                      "
                    >
                      <div
                        :class="
                          arbitrarilyFileClass(
                            scope.row.workflow.abstract_info.text,
                            scope.row.workflow.abstract_info.icon
                          )
                        "
                        class="paper-list "
                      >
                        <div
                          v-if="['file', 'folder', 'multiple','autosheet','article','group'].includes(scope.row.workflow.abstract_info.icon)"
                          class="file-ico"
                          :class="{
                            'link-2':
                              scope.row.doc_type === 'folder' &&
                              scope.row.audit_status === 'pending'
                          }"
                        >
                          <Thumbnail
                            v-if="
                              scope.row.workflow.abstract_info.icon === 'file'
                            "
                            :rowData="scope.row"
                          ></Thumbnail>
                          <span v-else class="ico"></span>
                        </div>
                        <div class="file-ico" v-else>
                          <img
                            style="width: 24px;height: 24px"
                            :src="scope.row.workflow.abstract_info.icon"
                          />
                        </div>
                        <div class="file-title">
                          <span
                            v-title
                            :title="scope.row.workflow.abstract_info.text"
                            v-html="
                              hightLightText(
                                scope.row.workflow.abstract_info.text
                              )
                            "
                          ></span>
                        </div>
                      </div>
                    </span>
                    <span v-else>
                      <!-- 无标题模板-->
                      <div style="overflow: hidden;text-overflow: ellipsis;">
                        {{ scope.row.workflow.abstract_info.text }}
                      </div>
                    </span>
                  </p>
                </div>
                <div v-else :key="`else-${scope.row.id}`">
                  <div :class="fileClass(scope.row)" class="paper-list ">
                    <div
                      class="file-ico"
                      :class="{
                        'link-2':
                          scope.row.doc_type === 'folder' &&
                          scope.row.audit_status === 'pending'
                      }"
                    >
                      <Thumbnail
                        v-if="scope.row.doc_type === 'file'"
                        :rowData="scope.row"
                      ></Thumbnail>
                      <span v-else class="ico"></span>
                    </div>
                    <div class="file-title">
                      <span
                        v-title
                        :title="formatDocName(scope.row)"
                        v-html="hightLightText(formatDocName(scope.row))"
                      ></span>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column
              :label="$t('common.column.applyUserName')"
              min-width="120px"
            >
              <template slot-scope="scope">
                <el-avatar 
                  v-if="
                    scope.row.apply_user &&
                    userAvatars[scope.row.apply_user]
                  "
                  :src="userAvatars[scope.row.apply_user]">
                </el-avatar>
                <el-avatar
                  v-else
                  :style="`background:#4A5C9B`"
                  v-html="scope.row.apply_user_name.substring(0, 1)"
                >
                </el-avatar>
                <span
                  v-title
                  :title="scope.row.apply_user_name"
                  v-html="hightLightApplyUserName(scope.row.apply_user_name)"
                  style="width: 80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;"
                ></span>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('common.column.applyTime')"
              min-width="100px"
            >
              <template slot-scope="scope">
                <span
                  v-title
                  :title="
                    $utils.toDateString(
                      scope.row.apply_time,
                      'yyyy/MM/dd HH:mm'
                    )
                  "
                >
                  {{
                    $utils.toDateString(
                      scope.row.apply_time,
                      'yyyy/MM/dd HH:mm'
                    )
                  }}</span
                >
              </template>
            </el-table-column>
            <div slot="empty" class="rzsj_empty no-padding-bottom">
              <template v-if="showEmpty">
                <div class="error_img img_1">
                  <div
                    :class="
                      queryParams.type !== '' ||
                      searchParams.abstracts.length > 0 ||
                      searchParams.apply_user_names.length > 0
                        ? 'images-3'
                        : 'images-1'
                    "
                  />
                </div>
                <div class="error_text">
                  <p
                    v-if="
                      queryParams.type !== '' ||
                        searchParams.abstracts.length > 0 ||
                        searchParams.apply_user_names.length > 0
                    "
                  >
                    {{ $t('common.empty.none') }}
                  </p>
                  <p v-else class="text" style="width: 250px;">
                    {{ $t('common.empty.todo') }}
                  </p>
                </div>
              </template>
            </div>
          </el-table>
          <el-pagination
            v-show="pagination.totalRows > 0"
            :layout="pagination.layout"
            :current-page="pagination.pageNumber"
            :total="pagination.totalRows"
            :page-sizes="pagination.pageSizes"
            :page-size="pagination.pageSize"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
          >
          </el-pagination>
        </div>
      </div>
      <info
        v-if="id !== '' && !drawer && multipleSelection.length < 2 && !!dataList.length" 
        :id="id"
        audit-page
        @auditResult="auditResult"
      ></info>
      <div v-if="multipleSelection.length > 1" class="cell-right">
        <div class="texts-box">
          <div class="box-head">
            {{
              $t('common.selectApply', { num: this.multipleSelection.length })
            }}
          </div>
          <div class="no-detail">
            {{ $t('common.noDetail') }}
          </div>
        </div>
      </div>
    </div>
    <!-- <DownloadProgress
      ref="downloadProgress"
      :percentage.sync="percentage"
      :docName.sync="download_doc_name"
    ></DownloadProgress> -->
    <BatchAudit
      ref="batchAuditDialog"
      :selectData="multipleSelection"
      @auditResult="auditResult"
    >
    </BatchAudit>

    <el-drawer
      class="ayshareDrawer insetDrawer"
      :title="$t('common.detail.backlog')"
      size="450px"
      :visible.sync="drawer"
      :before-close="beforeClose"
      :modal-append-to-body="false"
      :wrapperClosable="false"
    >
      <info
        v-if="applyId !== ''"
        :id="applyId"
        :inDrawer="true"
        clazz="new-tabs-1 new-tabs-2 new-tabs-3"
        audit-page
        @closeDetail="closeDetail"
        @auditResult="auditResult"
      ></info>
    </el-drawer>
  </div>
</template>
<script>
import { fecthTodoPage as fecthPage, fecthInfo } from '@/api/audit'
import list from '@/mixins/list'
import info from './todoInfo'
import BatchAudit from './batchAudit.vue'
import Thumbnail from '@/components/Thumbnail'
import { getUserImagesList } from '@/api/anyshareOpenApi'
import MultiChoice from '@/components/MultiChoice'
import XEUtils from 'xe-utils'
import { isSafari } from '@/utils/config'

export default {
  components: { info, MultiChoice, Thumbnail, BatchAudit },
  mixins: [list],
  data() {
    const multic_hoice_types = [
      { label: this.$i18n.tc('common.column.abstract'), value: 'abstracts' },
      {
        label: this.$i18n.tc('common.column.applyUserName'),
        value: 'apply_user_names'
      }
    ]
    return {
      multic_hoice_types,
      drawer: false,
      passVisible: false,
      rejectVisible: false,
      currentRow: undefined,
      highlightCurrentRow: true,
      applyType: [''],
      // 查询条件
      queryParams: {
        type: '',
        doc_name: '',
        biz_id: '',
        offset: 0,
        limit: 200
      },
      download_num: 0,
      download_total: 0,
      download_doc_name: '',
      percentage: 0,
      dataList: [],
      internationalization: 'zh-cn',
      id: '',
      applyId: '',
      multipleSelection: [],
      multiChoiceSearch: [],
      searchParams: {
        abstracts: [],
        apply_user_names: []
      },
      autocompleteQueryPage: {
        restaurants: [],
        offset: 0,
        limit: 50
      }
    }
  },
  watch: {
    multiChoiceSearch: {
      deep: true,
      handler(val) {
        Object.keys(this.searchParams).forEach((item) => {
          this.searchParams[item] = []
        })
        val.forEach((el) => {
          this.searchParams[el.type].push(el.val)
        })
        this.searchMultiChoice()
      }
    },
    search_value(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.autocompleteQueryPage.restaurants = []
      }
      if (newVal === '') {
        this.clearSearch()
      }
    },
    async audit_types(newVal, oldVal) {
      if (newVal && newVal.length !== oldVal.length && this.initialized_audit_types) {
        // 查询列表数据
        await this.handleSearch()
        this.loading = false
        // 默认展开第一条数据的详细信息
        // if (
        //   this.dataList.length > 0 &&
        //   ['', 'null', 'undefined'].includes(this.$route.query.applyId + '')
        // ) {
        //   this.id = this.dataList[0].id
        //   this.$refs.singleTable.setCurrentRow(this.dataList[0])
        // }
      }
    }
  },
  computed: {
    getBizType() {
      return function(_obj) {
        let arr = this.$store.getters.dictList.bizTypes.filter(
          (bizTypeItem) => bizTypeItem.value === _obj.biz_type
        )
        return arr.length > 0 ? arr[0].label : _obj.biz_type
      }
    },
    hasApplicationType() {
      const { applicationType } = this.$store.state.app.context || ''
      // 检查是否存在 applicationType 参数
      return applicationType
    }
  },
  async created() {
    this.internationalization = XEUtils.cookie('lang')
    /*// 查询列表数据
    await this.handleSearch()
    // 默认展开第一条数据的详细信息
    if (
      this.dataList.length > 0 &&
      ['', 'null', 'undefined'].includes(this.$route.query.applyId + '')
    ) {
      this.id = this.dataList[0].id
      this.$refs.singleTable.setCurrentRow(this.dataList[0])
    }*/
  },
  mounted() {
    let _this = this
    let applyId = _this.$route.query.applyId
    _this.highlightCurrentRow = true
    if (!['', 'null', 'undefined'].includes(applyId + '')) {
      _this.applyId = applyId
      _this.drawer = true
      _this.highlightCurrentRow = false
    }
        
    // 检查并设置 applicationType
    const { applicationType } = this.$store.state.app.context || ''

    if (this.hasApplicationType) {
      this.applyType = [applicationType]
      this.queryParams.type = applicationType
      // 如果有 applicationType，自动执行搜索
      this.$nextTick(() => {
        this.handleSearch()
      })
    }
  },
  filters: {
    formatString(applyDetail) {
      if (applyDetail.length > 14) {
        return applyDetail.substring(0, 14) + '...'
      } else {
        return applyDetail
      }
    }
  },
  methods: {
    /**
     * @description 查询列表数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    async handleSearch(_type) {
      let _this = this
      _this.loading = true
      this.queryParams.offset =
        (this.pagination.pageNumber - 1) * this.pagination.pageSize
      this.queryParams.limit = this.pagination.pageSize
      // await fecthPage({ ..._this.queryParams, ..._this.searchParams })
      await fecthPage({
        ..._this.transformQueryParams(_this.queryParams),
        ..._this.searchParams
      })
        .then((res) => {
          let promiseAll = []
          const allUserIds = []
          res.data.entries.forEach((e) => {
            // promiseAll.push(_this.getApplyUserAvatars(e, e.apply_user_id))
            e['apply_user'] = e.apply_user_id
            allUserIds.push(e.apply_user_id)
          })
          if(allUserIds.length > 0) {
            this.getAllUserAvatars(allUserIds)
          }
          const scrollToTop = ()=>{
            const scrollWrapper = _this.$refs.singleTable.$el.querySelector('.el-table__body-wrapper');  
            if (scrollWrapper) {  
              scrollWrapper.scrollTop = 0; // 滚动到顶部  
            }  
          }
          Promise.all(promiseAll).then(() => {
            _this.dataList = res.data.entries
            _this.pagination.totalRows = res.data.total_count
            _this.$nextTick(function() {
              _this.closeInfo()
              _this.showEmpty = true
              _this.loading = false
            })
            _this.$emit('search')
            if (
              typeof _this.$route.query.applyId !== 'undefined' &&
              _this.$route.query.applyId !== null &&
              _this.$route.query.applyId !== 'undefined'
            ) {
              fecthInfo(_this.$route.query.applyId)
                .then((res) => {
                  _this.id = _this.$route.query.applyId
                  const _array = _this.dataList.filter(
                    (item) => item.id === _this.id
                  )
                  if (_array.length > 0) {
                    _this.$refs.singleTable.setCurrentRow(_array[0])
                    _this.rowClick(_array[0])
                  } else {
                    _this.$refs.singleTable.setCurrentRow(_this.dataList[0])
                    _this.rowClick(_this.dataList[0])
                    scrollToTop()
                  }
                })
                .catch((res) => {
                  _this.$refs.singleTable.setCurrentRow(_this.dataList[0])
                  _this.rowClick(_this.dataList[0])
                  scrollToTop()
                })
                .finally(() => {
                  if(this.drawer === false) {
                    _this.$router.push({ query: { ..._this.$route.query, applyId: undefined } })
                  }
                })
            } else if (_type === 'reload' && _this.currentRow !== undefined) {
              const _array = _this.dataList.filter(
                (item) => item.id === _this.currentRow.id
              )
              if (_array.length > 0) {
                _this.$refs.singleTable.setCurrentRow(_array[0])
                _this.rowClick(_array[0])
              } else {
                _this.$refs.singleTable.setCurrentRow(_this.dataList[0])
                _this.rowClick(_this.dataList[0])
                scrollToTop()
              }
            } else {
              _this.$refs.singleTable.setCurrentRow(_this.dataList[0])
              _this.rowClick(_this.dataList[0])
              scrollToTop()
            }
          })
        })
        .catch((res) => {
          console.error(res)
          _this.$nextTick(function() {
            _this.loading = false
          })
        })
        .finally(() => {
          if (isSafari) {
            const table = document.querySelector('.set-table-latout .el-table__body')

            if(table) {
              table.style.tableLayout = 'auto'
              requestAnimationFrame(() => {
                table.style.tableLayout = 'fixed'
              })
            }
          }
        })
    },
    /**
     * @description 切换条件筛选数据
     * @author xiashneghui
     * @param val 值
     * @updateTime 2022/3/2
     * */
    applyTypeChange(val) {
      const value = val[val.length - 1]
      this.initApplyTypeElementWidth(value)
      this.queryParams.type = value
      this.pagination.pageNumber = 1
      this.handleSearch()
    },
    toggleSelection(row) {
      this.$refs.singleTable.clearSelection()
      this.$refs.singleTable.toggleRowSelection(row, true)
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
      const row = val[0]
      if(row && row.id !== this.id && val.length === 1) {
        this.$refs.singleTable.setCurrentRow(row)
        this.rowClick(row)
      }
    },
    handleBatchPass() {
      this.passVisible = false
      this.$refs.batchAuditDialog.openDialog('pass')
    },
    handleBatchReject() {
      this.rejectVisible = false
      this.$refs.batchAuditDialog.openDialog('reject')
    },
    /**
     * @description 打开待办详情
     * @author xiashneghui
     * @param row 值
     * @updateTime 2022/3/2
     * */
    rowClick(row, column, event) {
      if (row === undefined) {
        return
      }
      let _this = this
      let params = {
        proc_inst_id: row.proc_inst_id,
        type: 'task'
      }
      _this
        .checkFlow(params)
        .then((res) => {
          _this.id = row.id
          _this.currentRow = row
          _this.toggleSelection(row)
        })
        .catch((res) => {
          if (res.response.data.code === 401001101) {
            _this.$dialog_alert(
              _this.$t('common.detail.auditMsg.title'),
              _this.$t('message.UndoFailedNotTask'),
              _this.$t('message.confirm'),
              function() {
                _this.pagination.pageNumber = 1
                _this.handleSearch()
              }
            )
          } else if (res.response.data.code === 401001102) {
            _this.id = row.id
          }
        })
    },
    /**
     * @description 关闭弹窗
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    closeDetail() {
      this.drawer = false
      this.highlightCurrentRow = true
    },
    beforeClose(done) {
      this.handleSearch('reload')
      done()
    },
    /**
     * @description 刷新列表数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    auditResult() {
      this.handleSearch('reload')
    },
    /**
     * @description 打开文件位置
     * @param row 行数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    openDocBefore(row) {
      let _this = this
      let params = {
        proc_inst_id: row.proc_inst_id,
        type: 'task'
      }
      _this
        .checkFlow(params)
        .then((res) => {
          _this.openDoc(row)
        })
        .catch((res) => {})
    },
    openPathBefore(row) {
      let _this = this
      let params = {
        proc_inst_id: row.proc_inst_id,
        type: 'task'
      }
      _this
        .checkFlow(params)
        .then((res) => {
          _this.openPath(row)
        })
        .catch((res) => {})
    },
    /**
     * @description 校验文件
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    checkDocName() {
      if (this.queryParams.doc_name === '') {
        this.handleSearch()
      }
    },
    isAudit(bizId) {
      let _this = this
      return new Promise((resolve) => {
        _this.queryParams.offset =
          (_this.pagination.pageNumber - 1) * _this.pagination.pageSize
        _this.queryParams.limit = _this.pagination.pageSize
        _this.queryParams.biz_id = bizId
        fecthPage(_this.queryParams)
          .then((res) => {
            resolve(res.data.entries.length < 1)
          })
          .catch((res) => {
            resolve(false)
          })
      })
    },
    /**
     * @description 获取发起人头像
     * @param _data  申请数据
     * @param applyUserId  发起人ID
     * */
    getApplyUserAvatars(_data, applyUserId) {
      return new Promise((resolve) => {
        getUserImagesList(applyUserId)
          .then((res) => {
            _data['apply_user_avatar_url'] = res.data[0].avatar_url
              ? res.data[0].avatar_url
              : ''
            resolve(res)
          })
          .catch((err) => {
            _data['apply_user_avatar_url'] = ''
            resolve(err)
          })
      })
    },
    /**
     * 搜索用户和部门信息
     */
    async searchMultiChoice() {
      const _this = this
      if (
        _this.searchParams.abstracts.length === 0 &&
        _this.searchParams.apply_user_names.length === 0
      ) {
        _this.clearSearch()
        return
      } else if (_this.searchParams.abstracts.length === 1) {
        _this.searchParams.abstracts[0] =
          _this.searchParams.abstracts[0] === '"'
            ? '""'
            : _this.searchParams.abstracts[0]
        if (_this.searchParams.abstracts[0].indexOf(',') !== -1) {
          _this.searchParams.abstracts.push(' ')
        }
      } else {
        _this.searchParams.abstracts.forEach((e, index) => {
          if (e === '"') {
            _this.searchParams.abstracts[index] = ' '
          }
        })
      }
      await _this.handleSearch('search')
      // if (this.dataList.length > 0) {
      //   this.id = this.dataList[0].id
      //   this.$refs.singleTable.setCurrentRow(this.dataList[0])
      // }
    },
    /**
     * 清空搜索框
     */
    async clearSearch() {
      const _this = this
      // 查询列表数据
      await this.handleSearch()
      // 默认展开第一条数据的详细信息
      // if (this.dataList.length > 0) {
      //   this.id = this.dataList[0].id
      //   this.$refs.singleTable.setCurrentRow(this.dataList[0])
      // }
    },
    roleStr(_temp) {
      let detail = _temp.apply_detail

      if (_temp.apply_type === 'inherit') {
        return detail.inherit
          ? this.$t('share.roleDetail.inherit')
          : this.$t('share.roleDetail.noInherit')
      } else if (_temp.apply_type === 'owner' && detail.op_type === 'create') {
        return this.$t('share.roleDetail.owner')
      } else if (_temp.apply_type === 'owner' && detail.op_type === 'delete') {
        return (
          this.$t('share.roleDetail.cancel') +
          '：' +
          this.$t('share.roleDetail.owner')
        )
      }

      let allow = detail.allow_value !== '' ? detail.allow_value.split(',') : []
      if (_temp.apply_type === 'anonymous') {
        allow = allow.filter((item) => item !== 'display')
      }
      let _allowValue = allow.map((item, key, arr) => {
        return this.$t('share.roleDetail.' + item)
      })
      let _denyValue = []
      if (
        detail.deny_value !== null &&
        detail.deny_value !== '' &&
        typeof detail.deny_value !== 'undefined'
      ) {
        _denyValue = detail.deny_value.split(',').map((item, key, arr) => {
          return this.$t('share.roleDetail.' + item)
        })
      }

      let roles = ''
      if (detail.op_type === 'delete') {
        roles += this.$t('share.roleDetail.cancel') + '：'
      }

      roles += _allowValue.join('/')
      if (_denyValue.length > 0) {
        roles +=
          '(' +
          this.$t('share.roleDetail.deny') +
          ' ' +
          _denyValue.join('/') +
          ')'
      }
      return roles
    }
  }
}
</script>

<style scoped>
.no-detail {
  margin-top: 24px;
  color: rgba(0, 0, 0, 0.55);
  text-align: center;
}

.todoList-header {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
}

.todoList-cascader {
  display: flex;
  flex-grow: 1;
  flex-shrink: 0;
}

.todoList-btnGroup {
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  justify-content: flex-end;
  margin-right: 8px;
}

.todoList-search {
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  width: 400px;
  justify-content: flex-end;
}

.gol-search {
  display: inline-flex;
  align-items: center;
}
</style>

<style>
.audit-table.multiple .el-checkbox__input.is-checked .el-checkbox__inner,
.audit-table.multiple .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background-color: #779eea;
  border-color: #779eea;
}
.audit-table.multiple .el-checkbox__input.is-checked .el-checkbox__inner,
.audit-table.multiple .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background-color: #779eea;
  border-color: #779eea;
}

.audit-table.multiple .el-checkbox__inner:hover {
  border-color: #8ba7dd;
}

.audit-table.multiple .el-checkbox__input.is-focus .el-checkbox__inner {
  border-color: #dcdfe6;
}

.todolist-sure.el-button {
  background: #136fe3;
  color: #fff;
  border-color: transparent;
  border-radius: 4px;
}

.todolist-sure.el-button:hover {
  background: #3a8ff0;
  color: #fff;
  border-color: transparent;
}

.todolist-sure.el-button:active {
  background: #064fbd;
  color: #fff;
  border-color: transparent;
}

.todolist-cancel {
  background: #fff;
  color: #000;
  border-radius: 4px;
}

.todolist-cancel.el-button.el-button--default:hover,
.todolist-cancel.el-button:active {
  color: #000;
  border-color: #dcdfe6;
}

.todolist-cancel.el-button.el-button--default:hover {
  background-color: rgba(228, 230, 237, 0.25);
}
.todolist-cancel.el-button.el-button--default:active {
  background-color: rgba(228, 230, 237, 0.45);
}
</style>
