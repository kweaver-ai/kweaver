<template>
  <div>
    <!-- 搜索 -->
    <div class="small-title-table">
      <el-row :gutter="20">
        <el-col :span="13" class="align-left">
          <div class="cell">
            <el-cascader
              v-show="!hasApplicationType"
              v-model="applyType"
              :show-all-levels="false"
              :options="bizTypes"
              :append-to-body="false"
              :props="{ expandTrigger: 'hover' }"
              id="applyTypeElement"
              style="width: 100px; margin-right: 32px"
              popper-class="el-popper-1"
              size="small"
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
            <el-dropdown
              @command="handleCommand"
              trigger="click"
              class="dropdown-1"
              style="margin-left: 0x"
              placement="bottom-start"
              :append-to-body="false"
            >
              <span class="el-dropdown-link">
                {{
                  $t(
                    'common.auditStatuss.' +
                      (queryParams.status === ''
                        ? 'auditStatus'
                        : queryParams.status)
                  )
                }}
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu
                slot="dropdown"
                class="dropdown-menu-1"
                :append-to-body="false"
              >
                <template v-for="item in $store.getters.dictList.auditStatuss">
                  <el-dropdown-item
                    v-if="item.value !== 'avoid'"
                    :key="item.value"
                    :command="item.value"
                    :class="{ active: item.value === queryParams.status }"
                  >
                    <span>{{
                      $t(
                        'common.auditStatuss.' +
                          (item.value === '' ? 'all' : item.value)
                      )
                    }}</span>
                  </el-dropdown-item>
                </template>
                <el-dropdown-item
                  key="sendback"
                  command="sendback"
                  :class="{ active: 'sendback' === queryParams.status }"
                >
                  <span>{{
                    $t('common.auditStatuss.sendback')
                  }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </el-col>
        <el-col :span="11" class="align-right">
          <MultiChoice
            ref="multiChoice"
            v-model="multiChoiceSearch"
            :types="multic_hoice_types"
            :placeholder="$t('common.search')"
          />
        </el-col>
      </el-row>
    </div>
    <div class="audit-table" :style="{ height: auditTableHeight }">
      <div class="cell-left">
        <div class="task_relea_page rzsj_table_bar" :style="{ height: auditTableHeight }">
          <el-table
            :data="dataList"
            ref="singleTable"
            v-loading="loading"
            :height="tableHeight"
            highlight-current-row
            class="table-ellip set-table-latout"
            @row-click="rowClick"
          >
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
                  <p v-title :title="scope.row.workflow.abstract_info.text" style="margin-bottom:0;">
                    <!-- 判断当前申请是否有申请类型，如果没有申请类型走无标题模板-->
                    <span v-if="typeof scope.row.workflow.abstract_info.icon !== 'undefined'">
                       <div :class="arbitrarilyFileClass(scope.row.workflow.abstract_info.text, scope.row.workflow.abstract_info.icon)" class="paper-list ">
                          <div
                            v-if="['file', 'folder', 'multiple','autosheet','article','group'].includes(scope.row.workflow.abstract_info.icon)"
                            class="file-ico"
                            :class="{'link-2': scope.row.doc_type === 'folder'  && scope.row.audit_status === 'pending'}">
                            <Thumbnail v-if="scope.row.workflow.abstract_info.icon === 'file'" :rowData="scope.row"></Thumbnail>
                            <span v-else class="ico"></span>
                          </div>
                         <div class="file-ico" v-else>
                           <img style="width: 24px;height: 24px" :src="scope.row.workflow.abstract_info.icon"/>
                         </div>
                          <div class="file-title">
                            <span  v-title :title="scope.row.workflow.abstract_info.text" v-html="hightLightText(scope.row.workflow.abstract_info.text)"></span>
                          </div>
                        </div>
                    </span>
                    <span v-else>
                      <!-- 无标题模板-->
                      <div style="overflow: hidden;text-overflow: ellipsis;">{{ scope.row.workflow.abstract_info.text }}</div>
                    </span>
                  </p>
                </div>
                <div v-else>
                    <div :class="fileClass(scope.row)" class="paper-list ">
                      <div
                        class="file-ico"
                        :class="{'link-2': scope.row.doc_type === 'folder'  && scope.row.audit_status === 'pending'}">
                        <Thumbnail v-if="scope.row.doc_type === 'file'" :rowData="scope.row"></Thumbnail>
                        <span v-else class="ico"></span>
                      </div>
                      <div class="file-title" :key="`else-${scope.row.id}`">
                        <span  v-title :title="formatDocName(scope.row)" v-html="hightLightText(formatDocName(scope.row))"></span>
                      </div>
                    </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('common.column.auditor')"
              min-width="120px"
            >
              <template slot-scope="scope">
                <span
                  v-if="scope.row.result == 'avoid'"
                  style="color: #009e0f"
                  >{{ $t('common.auditor.free') }}</span
                >
                <template v-else-if="getAuditors(scope.row, true) !== ''">
                  <template v-if="getAuditors(scope.row, true) !== '--'">
                    <el-avatar 
                     v-if="
                        scope.row.first_auditor &&
                        userAvatars[scope.row.first_auditor]
                      "
                      :src="userAvatars[scope.row.first_auditor]">
                    </el-avatar>
                    <el-avatar
                      v-else
                      :style="`background:#4A5C9B`"
                      v-html="getAuditors(scope.row, true).substring(0, 1)"
                    >
                    </el-avatar>
                  </template>
                  <span
                    v-title
                    :title="getAuditors(scope.row, false)"
                    class="cursor-pointer"
                    v-html="getAuditors(scope.row, true)"
                  ></span>
                </template>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('common.column.auditStatus')"
              min-width="80px"
              class-name="more-btn"
            >
              <template slot-scope="scope">
                <span
                  v-title
                  :title="$t('common.auditStatuss.' + scope.row.audit_status)"
                >
                  <span
                    v-if="scope.row.audit_status === 'pending'"
                    style="color: #eb7830"
                    >{{ $t('common.auditStatuss.pending') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'avoid'"
                    style="color: #4bbe47"
                    >{{ $t('common.auditStatuss.avoid') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'pass'"
                    style="color: #4bbe47"
                    >{{ $t('common.auditStatuss.pass') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'reject'"
                    style="color: #f66b76"
                    >{{ $t('common.auditStatuss.reject') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'cancel'"
                    style="color: #f66b76"
                    >{{ $t('common.auditStatuss.cancel') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'failed'"
                    style="color: #f66b76"
                    >{{ $t('common.auditStatuss.failed') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'sendback'"
                    style="color: #F66B76;"
                    >{{ $t('common.auditStatuss.sendback') }}</span
                  >
                  <span
                    v-else-if="
                      scope.row.audit_status === 'undone' ||
                        scope.row.audit_status === 'flow_undone'
                    "
                    style="color: #fe666a"
                    >{{ $t('common.auditStatuss.undone') }}</span
                  >
                </span>
              </template>
            </el-table-column>
            <div slot="empty" class="rzsj_empty no-padding-bottom">
              <template v-if="showEmpty">
                <div class="error_img img_1">
                  <div
                    :class="
                      queryParams.type !== '' ||
                      queryParams.status !== '' ||
                      searchParams.abstracts.length > 0
                        ? 'images-3'
                        : 'images-1'
                    "
                  ></div>
                </div>
                <div class="error_text">
                  <p
                    v-if="
                      queryParams.type !== '' ||
                        queryParams.status !== '' ||
                        searchParams.abstracts.length > 0
                    "
                  >
                    {{ $t('common.empty.none') }}
                  </p>
                  <p v-else class="text" style="width: 250px">
                    {{ $t('common.empty.apply') }}
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
        v-if="id !== '' && !drawer"
        :id="id"
        apply-page
        @auditResult="auditResult"
      ></info>
    </div>
    <DownloadProgress
      ref="downloadProgress"
      :percentage.sync="percentage"
      :docName.sync="download_doc_name"
    ></DownloadProgress>
    <el-drawer
      class="ayshareDrawer insetDrawer"
      :title="$t('common.detail.apply')"
      size="400px"
      :visible.sync="drawer"
      :before-close="beforeClose"
      :modal-append-to-body="false"
      :wrapperClosable="false"
    >
      <info
        v-if="applyId !== ''"
        clazz="new-tabs-1 new-tabs-2 new-tabs-3"
        :id="applyId"
        :inDrawer="true"
        apply-page
        @auditResult="auditResult"
        @closeDetail="closeDetail"
      />
    </el-drawer>
  </div>
</template>

<script>
import { fecthApplyPage as fecthPage, fecthInfo } from '@/api/audit'
import list from '@/mixins/list'
import { getUserImagesList } from '@/api/anyshareOpenApi'
import info from './info'
import DownloadProgress from '../common/components/download-progress/index'
import XEUtils from 'xe-utils'
import MultiChoice from '@/components/MultiChoice'
import Thumbnail from '@/components/Thumbnail'
import { isSafari } from '@/utils/config'
export default {
  components: { info, DownloadProgress, MultiChoice, Thumbnail },
  mixins: [list],
  data() {
    const multic_hoice_types = [
      { label: this.$i18n.tc('common.column.abstract'), value: 'abstracts' }
    ]
    return {
      multic_hoice_types,
      drawer: false,
      currentRow: undefined,
      newtoken: '',
      applyType: [''],
      // 查询条件
      queryParams: {
        status: '',
        type: '',
        doc_name: '',
        offset: 0,
        limit: 200
      },
      key: 1,
      download_num: 0,
      download_total: 0,
      download_doc_name: '',
      percentage: 0,
      dataList: [],
      internationalization: 'zh-cn',
      id: '',
      loading: true,
      applyId: '',
      multiChoiceSearch: [],
      searchParams: {
        abstracts: []
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
        Object.keys(this.searchParams).forEach(item => {
          this.searchParams[item] = []
        })
        val.forEach(el => {
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
        //if (this.dataList.length > 0) {
        //  this.id = this.dataList[0].id
        //  this.$refs.singleTable.setCurrentRow(this.dataList[0])
        //}
      }
    }
  },
  computed: {
    getBizType() {
      return function(_obj) {
        let arr = this.$store.getters.dictList.bizTypes.filter(
          bizTypeItem => bizTypeItem.value === _obj.biz_type
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
    //  默认展开第一条数据的详细信息
    this.loading = false
    if (this.dataList.length > 0) {
      this.id = this.dataList[0].id
      this.$refs.singleTable.setCurrentRow(this.dataList[0])
    }*/
  },
  mounted() {
    let applyId = this.$route.query.applyId
    if (!['', 'null', 'undefined'].includes(applyId + '')) {
      this.$nextTick(() => {
        this.applyId = applyId
        this.drawer = true
      })
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
      this.loading = true
      this.queryParams.offset =
        (this.pagination.pageNumber - 1) * this.pagination.pageSize
      this.queryParams.limit = this.pagination.pageSize
      // await fecthPage({ ..._this.queryParams, ..._this.searchParams })
      await fecthPage({
        ..._this.transformQueryParams(_this.queryParams),
        ..._this.searchParams
      })
        .then(res => {
          let promiseAll = []
          const allUserIds = []
          res.data.entries.forEach(e => {
            if (e.auditors.length > 0) {
              let _array = e.auditors
              if (e.audit_status === 'pass' || e.audit_status === 'reject') {
                _array = _array.filter(
                  item => item.status === 'pass' || item.status === 'reject'
                )
              }
              // promiseAll.push(_this.getAuditorAvatars(e, _array[0]))
              e['first_auditor'] = _array[0].id
              allUserIds.push(_array[0].id)
            }
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
            if (_this.dataList.length > 0) {
              if (
                typeof _this.$route.query.applyId !== 'undefined' &&
                _this.$route.query.applyId !== null &&
                _this.$route.query.applyId !== 'undefined'
              ) {
                fecthInfo(_this.$route.query.applyId)
                  .then(res => {
                    _this.id = _this.$route.query.applyId
                    const _array = _this.dataList.filter(
                      item => item.id === _this.id
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
                  .catch(res => {
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
                  item => item.id === _this.currentRow.id
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
            }
          })
        })
        .catch(res => {
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
     * @description 获取审核员名称
     * @author xiashneghui
     * @param row 行数据
     * @param show 是否截取
     * @return 审核员名称
     * @updateTime 2022/3/2
     * */
    getAuditors(row, show) {
      const splitPrx = this.internationalization === 'en-us' ? ',' : '、'
      if (
        row.auditors === null ||
        typeof row.auditors === 'undefined' ||
        row.auditors === ''
      ) {
        return ''
      }
      if (row.auditors.length === 0) {
        return '--'
      }
      if (row.audit_status === 'undone') {
        return '--'
      }
      let _array = row.auditors
      if (row.audit_status === 'pass' || row.audit_status === 'reject') {
        _array = _array.filter(
          item => item.status === 'pass' || item.status === 'reject'
        )
      }
      if (_array.length > 1 && show) {
        if (_array[0].name.length > 15) {
          return _array[0].name.substr(0, 15) + '...'
        }
        return _array[0].name + '...'
      }
      let allAuditorsName = ''
      _array.forEach(e => {
        if (allAuditorsName === '') {
          allAuditorsName = e.name
        } else {
          allAuditorsName = allAuditorsName + splitPrx + e.name
        }
      })
      return allAuditorsName
    },
    /**
     * @description 获取审核员头像
     * @param _data  申请数据
     * @param _auditorObj  审核员对象
     * */
    getAuditorAvatars(_data, _auditorObj) {
      return new Promise(resolve => {
        getUserImagesList(_auditorObj.id)
          .then(res => {
            _data['first_auditor_avatar_url'] = res.data[0].avatar_url
              ? res.data[0].avatar_url
              : ''
            resolve(res)
          })
          .catch(err => {
            _data['first_auditor_avatar_url'] = ''
            resolve(err)
          })
      })
    },
    /**
     * @description 筛选列表数据
     * @param val 值
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    applyTypeChange(val) {
      const value = val[val.length - 1]
      this.initApplyTypeElementWidth(value)
      this.queryParams.type = value
      this.pagination.pageNumber = 1
      this.handleSearch()
    },
    /**
     * @description 查看详情
     * @param row 行数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    rowClick(row) {
      let _this = this
      if (!row.proc_inst_id) {
        _this.id = row.id
        return
      }
      let params = {
        proc_inst_id: row.proc_inst_id,
        type: 'apply'
      }
      _this
        .checkFlow(params)
        .then(res => {
          _this.id = row.id
          _this.currentRow = row
          if (row.audit_status !== res.audit_status) {
            row.audit_status = res.audit_status
            row.auditors = res.auditors
          }
        })
        .catch(res => {
          if (res.response.data.code === 401001101) {
            _this.$dialog_alert(
              '',
              _this.$t('message.UndoFailedNotTask'),
              _this.$t('message.confirm'),
              function() {
                _this.pagination.pageNumber = 1
                _this.handleSearch()
              }
            )
          } else if (res.response.data.code === 401001102) {
            _this.$dialog_alert(
              '',
              _this.$t('message.csfLevel'),
              _this.$t('message.confirm')
            )
          }
        })
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
        type: 'apply'
      }
      _this
        .checkFlow(params)
        .then(res => {
          _this.openDoc(row)
        })
        .catch(res => {})
    },
    closeDetail() {
      this.drawer = false
    },
    beforeClose(done) {
      this.handleSearch('reload')
      done()
    },
    /**
     * @description 审核成功回调
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    auditResult(_type) {
      //this.id = ''
      if(_type) {
        this.handleSearch(_type)
      }else {
        this.handleSearch('reload')
      }
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
    /**
     * 搜索摘要
     */
    async searchMultiChoice() {
      const _this = this
      if (_this.searchParams.abstracts.length === 0) {
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
      //if (this.dataList.length > 0) {
      //  this.id = this.dataList[0].id
      //  this.$refs.singleTable.setCurrentRow(this.dataList[0])
      //}
    },
    /**
     * 清空搜索框
     */
    async clearSearch() {
      const _this = this
      // 查询列表数据
      await this.handleSearch()
      // 默认展开第一条数据的详细信息
      //if (this.dataList.length > 0) {
      //  this.id = this.dataList[0].id
      //  this.$refs.singleTable.setCurrentRow(this.dataList[0])
      //}
    },
    /**
     * @description 获取审核员头像信息
     * @author xiashneghui
     * @updateTime 2022/10/9
     * */
    // eslint-disable-next-line consistent-return
    getUserImages() {
      // eslint-disable-next-line consistent-return
      this.dataList.filter(async item => {
        if (item.auditors.length === 0) {
          item.src = ''
          return ''
        }
        let userID = []
        userID[0] = item.auditors[0].id
        await getUserImagesList(userID)
          .then(res => {
            if (res.data[0].avatar_url !== '') {
              item.src = res.data[0].avatar_url
            } else {
              item.src = ''
            }
          })
          .catch(res => {})
      })
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
        allow = allow.filter(item => item !== 'display')
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
