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
            <el-dropdown
              @command="handleCommand"
              trigger="click"
              class="dropdown-1"
              style="margin-left: 0;"
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
                <template v-for="item in auditStatus">
                  <el-dropdown-item
                    v-if="
                      item.value !== 'avoid' &&
                        item.value !== 'failed' &&
                        item.value !== 'pending'
                    "
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
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </el-col>
        <el-col :span="11" class="align-right">
          <MultiChoice
            ref="multiChoice"
            v-model="multiChoiceSearch"
            :types="multic_hoice_types"
            :placeholder="$t('common.searches')"
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
              min-width="100px"
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
                       <div :class="arbitrarilyFileClass(scope.row.workflow.abstract_info.text,scope.row.workflow.abstract_info.icon)" class="paper-list ">
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
                <div v-else :key="`else-${scope.row.id}`">
                  <div :class="fileClass(scope.row)" class="paper-list ">
                    <div
                      class="file-ico"
                      :class="{'link-2': scope.row.doc_type === 'folder'  && scope.row.audit_status === 'pending'}">
                      <Thumbnail v-if="scope.row.doc_type === 'file'" :rowData="scope.row"></Thumbnail>
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
              min-width="100px"
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
            <!-- 改为处理时间 -->
            <el-table-column
              :label="$t('common.column.processTime')"
              min-width="100px"
            >
              <template slot-scope="scope">
                <span
                  v-title
                  :title="
                    $utils.toDateString(scope.row.end_time, 'yyyy/MM/dd HH:mm')
                  "
                >
                  {{
                    $utils.toDateString(scope.row.end_time, 'yyyy/MM/dd HH:mm')
                  }}</span
                >
              </template>
            </el-table-column>
             <!-- 处理人 -->
             <el-table-column
              :label="$t('common.column.auditor')"
              min-width="100px"
            >
            <template slot-scope="scope">
              <span v-if="!scope.row.last_auditor" >---</span>
              <span v-else>
                <el-avatar
                  v-if="
                    scope.row.last_auditor_id &&
                    userAvatars[scope.row.last_auditor_id]
                  "
                  :src="userAvatars[scope.row.last_auditor_id]">
                </el-avatar>
                <el-avatar
                  v-else
                  :style="`background:#4A5C9B`"
                  v-html="scope.row.last_auditor.substring(0, 1)"
                >
                </el-avatar>
                <span
                  v-title
                  :title="scope.row.last_auditor"
                  v-html="hightLightApplyUserName(scope.row.last_auditor)"
                  style="width: 80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;"
                ></span>
              </span>
            </template>
            </el-table-column>
            <el-table-column
              :label="$t('common.column.status')"
              min-width="80px"
              class-name="more-btn"
            >
              <template slot-scope="scope">
                <span
                  v-title
                  :title="
                    scope.row.audit_status === 'pending'
                      ? $t('common.auditStatuss.pending-done')
                      : $t('common.auditStatuss.' + scope.row.audit_status)
                  "
                >
                  <span
                    v-if="scope.row.audit_status === 'pending'"
                    style="color: #4BBE47;"
                    >{{ $t('common.auditStatuss.pending-done') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'avoid'"
                    style="color: #4BBE47;"
                    >{{ $t('common.auditStatuss.avoid') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'pass'"
                    style="color: #4BBE47;"
                    >{{ $t('common.auditStatuss.pass') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'transfer'"
                    style="color: #4BBE47;"
                    >{{ $t('common.auditStatuss.transfer') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'reject'"
                    style="color: #F66B76;"
                    >{{ $t('common.auditStatuss.reject') }}</span
                  >
                  <span
                    v-else-if="scope.row.audit_status === 'failed'"
                    style="color: #F66B76;"
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
                    style="color: #9f9f9f;"
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
                      searchParams.abstracts.length > 0 ||
                      searchParams.apply_user_names.length > 0
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
                        searchParams.abstracts.length > 0 ||
                        searchParams.apply_user_names.length > 0
                    "
                  >
                    {{ $t('common.empty.none') }}
                  </p>
                  <p v-else class="text" style="width: 250px;">
                    {{ $t('common.empty.done') }}
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
          />
        </div>
      </div>
      <info
        v-if="id !== '' && !drawer"
        :id="id"
        :donePage="true"
        :doneStatus="doneStatus"
      />
    </div>
    <el-drawer
        class="ayshareDrawer insetDrawer"
        :title="$t('common.detail.done')"
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
          :donePage="true"
          @auditResult="auditResult"
        />
      </el-drawer>
  </div>
</template>
<script>
import { fecthDonePage as fecthPage,fecthInfo } from '@/api/audit'
import list from '@/mixins/list'
import info from './info'
import MultiChoice from '@/components/MultiChoice'
import Thumbnail from '@/components/Thumbnail'
import { getUserImagesList } from '@/api/anyshareOpenApi'
import XEUtils from 'xe-utils'
import { isSafari } from '@/utils/config'
export default {
  components: { info, MultiChoice, Thumbnail },
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
      applyId: '',
      applyType: [''],
      // 查询条件
      queryParams: {
        status: '',
        type: '',
        doc_name: '',
        offset: 0,
        limit: 200
      },
      dataList: [],
      internationalization: 'zh-cn',
      id: '',
      doneStatus: '',
      multiChoiceSearch: [],
      searchParams: {
        abstracts: [],
        apply_user_names: []
      },
      autocompleteQueryPage: {
        restaurants: [],
        offset: 0,
        limit: 50
      },
      auditStatus: [
        { label: '全部', value: '' },
        { label: '已拒绝', value: 'reject' },
        { label: '已通过', value: 'pass' },
        { label: '已撤销', value: 'undone' },
        { label: '已转审', value: 'transfer' },
        { label: '已退回', value: 'sendback' }
      ]
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
  async created() {
    this.internationalization = XEUtils.cookie('lang')
    /*// 查询列表数据
    await this.handleSearch()
    // 默认展开第一条数据的详细信息
    if (this.dataList.length > 0) {
      this.id = this.dataList[0].id
      this.$refs.singleTable.setCurrentRow(this.dataList[0])
    }*/
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
        .then(res => {
          let promiseAll = []
          const allUserIds = []
          res.data.entries.forEach(e => {
            // promiseAll.push(_this.getApplyUserAvatars(e, e.apply_user_id))
            e['apply_user'] = e.apply_user_id
            allUserIds.push(e.apply_user_id)
            if(e.last_auditor_id){
              allUserIds.push(e.last_auditor_id)
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
    rowClick(row, column, event) {
      let _this = this
      let params = {
        proc_inst_id: row.proc_inst_id,
        type: 'history'
      }
      _this
        .checkFlow(params)
        .then(res => {
          _this.id = row.id
          _this.doneStatus = row.audit_status
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
      //if (this.dataList.length > 0) {
      //  this.id = this.dataList[0].id
      //  this.$refs.singleTable.setCurrentRow(this.dataList[0])
      //}
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
    beforeClose(done) {
      this.handleSearch('reload')
      done()
    },
    auditResult() {
      this.id = ''
      this.handleSearch('reload')
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
     * @description 获取发起人头像
     * @param _data  申请数据
     * @param applyUserId  发起人ID
     * */
    getApplyUserAvatars(_data, applyUserId) {
      return new Promise(resolve => {
        getUserImagesList(applyUserId)
          .then(res => {
            _data['apply_user_avatar_url'] = res.data[0].avatar_url
              ? res.data[0].avatar_url
              : ''
            resolve(res)
          })
          .catch(err => {
            _data['apply_user_avatar_url'] = ''
            resolve(err)
          })
      })
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
        let userID = []
        userID[0] = item.apply_user_id
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
