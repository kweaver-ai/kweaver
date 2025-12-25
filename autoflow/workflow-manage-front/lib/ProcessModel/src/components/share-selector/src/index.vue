<template>
  <div>
    <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" :append-to-body="true" @close="close" v-dialogDrag custom-class="new-dialog" width="628px">
      <div class="el-steps-2" v-if="!isUpdate">
        <el-steps :active="active_step" simple>
          <el-step :title="$t('modeler.selectorStepOne')" icon="el-icon-user"></el-step>
          <el-step :title="$t('modeler.selectorStepTwo')" icon="el-icon-monitor"></el-step>
        </el-steps>
      </div>
      <div v-if="visible && active_step === 0" >
        <div class="sers-2">
          <span class="clum" :style="$i18n.locale === 'en-us'?'width: 140px':''">{{$t('modeler.auditMode')}}：</span>
          <el-select v-model="audit_model">
            <el-option value="tjsh" :label="$t('modeler.dealTypeTips.tjsh')"></el-option>
            <el-option value="hqsh" :label="$t('modeler.dealTypeTips.hqsh')"></el-option>
            <el-option value="zjsh" :label="$t('modeler.dealTypeTips.zjsh')"></el-option>
          </el-select>
        </div>
        <div class="choose-table">
          <div class="cell cell-relative">
            <div v-loading="loading" class="choose-ul">
              <div class="head"><div class="left">{{$t('strategy.chooseAuditorTips')}}：</div></div>
              <div class="choose-ser-1 no-border-bottom">
                <el-autocomplete
                  clearable
                  style="width: 100%"
                  size="mini"
                  prefix-icon="el-icon-search"
                  v-model="search_value"
                  class="user-auto-complete"
                  ref="autocomplete"
                  :debounce="0"
                  :fetch-suggestions="querySearch"
                  :placeholder="$t('modeler.search')"
                  :trigger-on-focus="false"
                  :hideLoading="true"
                  @clear="clearSearch"
                  @select="addUser"
                  @input="clearSearch"
                  v-loadmore="handleScroll"
                >
                  <template slot-scope="{ item }" >
                    <span v-if="item.parent_dep_paths[0] !== ''">
                      <el-tooltip class="item" effect="light" placement="top" :open-delay="1000" >
                        <div slot="content">
                          <div>{{ item.name }}</div>
                          <div>{{ item.parent_dep_paths[0] }}</div>
                        </div>
                        <div>
                          <p style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">
                            <i class="icon iconfont icon-yonghu"></i>
                            {{ item.name }}
                          </p>
                          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">{{ item.parent_dep_paths[0] }}</div>
                        </div>
                      </el-tooltip>
                    </span>
                    <span v-else>{{ item.name }}</span>
                  </template>
                </el-autocomplete>
              </div>
              <el-tree
                v-if="user_show_tree"
                :props="default_props"
                element-loading-text=""
                :default-expand-all="false"
                :expand-on-click-node="false"
                :highlight-current="true"
                node-key="id"
                :load="loadNodeUser"
                lazy
                name="userRootContent"
                ref="userTree"
                @node-click="handleNodeClickUser"
                class="no-margin no-border-top"
                style="height: 274px; overflow: auto"
              >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <template v-if="data.type === 'loadMore'">
                  <div style="padding-left: 20px;color:#40a9ff;" class="loadMoreLoading" v-loading="loadMoreLoading">
                    <span>{{ node.label }} <i class="el-icon-d-arrow-right" style="transform: rotate(90deg);-ms-transform: rotate(90deg);-moz-transform: rotate(90deg);-webkit-transform: rotate(90deg);-o-transform: rotate(90deg);"></i></span>
                  </div>
                </template>
                <template v-else>
                  <span> <i :class="checkDataIcon(data, node)" /> {{ node.label }}</span>
                </template>
              </span>
              </el-tree>
            </div>
          </div>
          <div class="cell no-border">
            <div class="choose-ul">
              <div class="head">
                <div class="left">{{ $t('modeler.selected') }}：</div>
                <div class="right">
                  <el-button type="text" v-if="check_user_data.length==0" disabled>{{ $t('modeler.common.clear') }}</el-button>
                  <el-button type="text" v-else @click="delAllUserData">{{ $t('modeler.common.clear') }}</el-button>
                </div>
              </div>
              <ul style="height: 314px">
                <vuedraggable :disabled="audit_model !== 'zjsh'" class="wrapper" v-model="check_user_data">
                  <transition-group>
                    <el-tooltip
                      v-for="(item, index) in check_user_data"
                        :key="item.id"
                        class="item"
                        effect="light"
                        :content="`${item.name}- ${item.parent_dep_paths}`"
                        placement="top">
                      <li>
                    <span style="cursor: pointer">
                      <span v-if="audit_model === 'zjsh'">{{index + 1}}{{$t('modeler.level')}}  </span>
                      {{ item.name }}
                      <i class="el-icon-close" @click="delAppointUserData(item)"></i>
                    </span>
                      </li>
                    </el-tooltip>
                  </transition-group>
                </vuedraggable>
              </ul>
            </div>
          </div>
        </div>
        <div v-if="operateType === 'batch'" style="padding: 10px 0;">
            <div>{{$t('modeler.chooseRuleTitle')}}</div>
          <div style="padding: 8px 10px;">
            <el-radio v-model="allEditType" label="additional">{{$t('modeler.chooseRule.additional')}}</el-radio>
            <el-radio v-model="allEditType" label="replace">{{$t('modeler.chooseRule.replace')}}</el-radio>
          </div>
        </div>
      </div>
      <div>
        <div v-if="visible && active_step === 1" class="choose-table">
          <div class="cell cell-relative">
            <el-tabs type="border-card" :class="['choose-ul', $i18n.locale === 'en-us'?'':'new-tab-ul']" style="height: 324px" v-model="active_name" @tab-click="handleClick">
              <el-tab-pane :label="$t('modeler.userDocLib')" name="user"></el-tab-pane>
              <el-tab-pane :label="$t('modeler.deptDocLib')" name="department"></el-tab-pane>
              <el-tab-pane :label="$t('modeler.customDocLib')" name="custom"></el-tab-pane>
              <div v-if="active_name === 'user'" class="choose-ul" v-loading="loading">
                <div class="choose-ser-1 no-border-bottom">
                  <el-autocomplete
                    clearable
                    style="width: 100%"
                    size="mini"
                    prefix-icon="el-icon-search"
                    ref="autocomplete"
                    v-model="search_value_doc_lib"
                    :fetch-suggestions="querySearch"
                    :debounce="0"
                    :placeholder="$t('modeler.search')"
                    :trigger-on-focus="false"
                    :hideLoading="true"
                    @clear="clearSearch"
                    @select="addUserDocLib"
                    @input="clearSearch"
                    v-loadmore="handleScroll"
                  >
                    <template slot-scope="{ item }" >
                    <span v-if="item.parent_dep_paths[0] !== ''">
                      <el-tooltip class="item" effect="light" placement="top" :open-delay="1000">
                        <div slot="content">
                          <div>{{ item.name }}</div>
                          <div>{{ item.parent_dep_paths[0] }}</div>
                        </div>
                        <div>
                          <p style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">
                            <i class="icon iconfont icon-yonghu"></i>
                            {{ item.name }}
                          </p>
                          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">{{ item.parent_dep_paths[0] }}</div>
                        </div>
                      </el-tooltip>
                    </span>
                    <span v-else>{{ item.name }}</span>
                    </template>
                  </el-autocomplete>
                </div>
                <el-tree
                  v-if="user_show_tree"
                  class="no-margin no-border-top"
                  :props="default_props"
                  element-loading-text=""
                  :default-expand-all="false"
                  :expand-on-click-node="false"
                  :highlight-current="true"
                  node-key="id"
                  :load="loadNodeUser"
                  show-checkbox
                  check-on-click-node
                  lazy
                  name="userRootContent"
                  ref="userLibTree"
                  @node-click="handleNodeClickUser"
                  @check="handleNodeClickUserDocLib"
                  style="height: 304px; overflow: auto"
                >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <template v-if="data.type === 'loadMore'">
                  <div style="padding-left: 20px;color:#40a9ff;" class="loadMoreLoading" v-loading="loadMoreLoading">
                    <span>{{ node.label }} <i class="el-icon-d-arrow-right" style="transform: rotate(90deg);-ms-transform: rotate(90deg);-moz-transform: rotate(90deg);-webkit-transform: rotate(90deg);-o-transform: rotate(90deg);"></i></span>
                  </div>
                </template>
                <template v-else>
                  <span> <i :class="checkDataIcon(data, node)" /> {{ node.label }}</span>
                </template>
              </span>
                </el-tree>
              </div>
              <div v-else v-loading="loading">
                <div class="choose-ser-1 no-border-bottom">
                  <el-autocomplete
                    v-if="show_input_search"
                    style="width: 100%"
                    size="mini"
                    clearable
                    prefix-icon="el-icon-search"
                    ref="autocomplete"
                    v-model="search_doc_value"
                    :fetch-suggestions="querySearchDocLib"
                    :placeholder="$t('modeler.search')"
                    :trigger-on-focus="false"
                    @input="autocompleteQuery = true"
                    @select="addDocLib"
                    @clear="clearSearch"
                  >
                    <template slot-scope="{ item }">
                      <span>{{ item.name }}</span>
                    </template>
                  </el-autocomplete>
                </div>
                <el-tree
                  v-if="other_show_tree"
                  class="no-margin no-border-top"
                  :props="default_props"
                  element-loading-text=""
                  :default-expand-all="false"
                  :expand-on-click-node="false"
                  :highlight-current="true"
                  node-key="id"
                  :load="loadNodeDocDepart"
                  show-checkbox
                  check-on-click-node
                  lazy
                  ref="docLibTree"
                  @check="handleNodeClickDocLib"
                  style="height: 304px; overflow: auto"
                >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <span> <i class="icon-document" /> {{ node.label }}</span>
              </span>
                </el-tree>
                <!--<ul class="no-border-top" style="height: 407px">
                  <li v-for="(item, index) in doc_lib_data" :key="index" @click="handleNodeClickDocLib(item)" style="cursor: pointer;"><i class="icon-document" />&nbsp;&nbsp;{{ item.name }}</li>
                </ul>-->
              </div>
            </el-tabs>
          </div>
          <div class="cell cell-btn"><a class="btn-right" @click="addSelectedDocLib"></a></div>
          <div class="cell no-border">
            <div class="choose-ul">
              <div class="head">
                <div v-if="isUpdate" class="left">{{ choose_user_name }}&nbsp;{{ $t('field.auditScope') }}：</div>
                <div v-else class="left">{{ $t('modeler.selected') }}：</div>
                <div class="right">
                  <el-button type="text" v-if="check_doc_lib_data.length==0" disabled>{{ $t('modeler.common.clear') }}</el-button>
                  <el-button type="text" v-else @click="delAllDocLibData">{{ $t('modeler.common.clear') }}</el-button>
                </div>
              </div>
              <ul style="height: 345px;margin-top: 10px">
                <el-tooltip
                  v-for="(item, index) in check_doc_lib_data"
                  :key="index"
                  effect="light"
                  :content="`${item.name}`"
                  placement="top">
                  <li>
                    <span style="cursor: pointer">
                      {{ item.name }}
                      <i class="el-icon-close" @click="delAppointDocLibData(item)"></i>
                    </span>
                  </li>
                </el-tooltip>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
      <el-button v-if="active_step === 0 && isUpdate" style="min-width: 80px" type="primary" size="mini" :disabled="isCheckUserData" @click="confirm">{{ $t('button.confirm') }}</el-button>
      <el-button v-if="active_step === 0 && !isUpdate" :style="'min-width: 80px;',isCheckUserData?'color:#a6a9ad':''" size="mini" :disabled="isCheckUserData" @click="toNextStep">{{ $t('modeler.common.nextStep') }}</el-button>
      <el-button v-if="active_step === 1 && !isUpdate" style="min-width: 80px" size="mini" :disabled="choose_user_id !== ''" @click="toNextStep">{{ $t('modeler.common.preStep') }}</el-button>
      <el-button v-if="!isUpdate" :style="'min-width: 80px;' , (isCheckUserData || isCheckDocLibData)?'color:#a6a9ad':''" size="mini" :disabled="(isCheckUserData || isCheckDocLibData)" @click="confirm">{{ $t('modeler.complete') }}</el-button>
      <el-button size="mini" style="min-width: 80px" @click="close">{{ $t('modeler.common.cancel') }}</el-button>
    </span>
    </el-dialog>
    <warnMsg :warnMsgList="warnMsgList" :msgVisible="msgVisible" @closeWarnMsg="closeWarnMsg"></warnMsg>
    <StepProgress ref="stepProgress" :percentage.sync="percentage"></StepProgress>
  </div>
</template>
<script>
import userSelectorService from './selector-service'
import { getDocLibList } from '../../../api/doc-lib'
import StepProgress from '../../step-progress/index'
import warnMsg from '../../warnMsg'
import { members, rootDepartment, transfer, userSearch, getInfoByTypeAndIds } from '@/api/user-management'
import { queryUserDocLib } from '@/api/efast'
import { checkStrategy } from '@/api/docShareStrategy.js'
import vuedraggable from 'vuedraggable'
export default {
  name: 'share-selector',
  components: { StepProgress, warnMsg, vuedraggable },
  props: {
    title: {
      type: String,
      default: ''
    },
    checkedUserIds: {
      type: Array,
      required: true
    },
    selectDocList: {
      type: Array,
      required: true
    },
    procDefId:{
      type: String,
      default: ''
    }
  },
  data() {
    return {
      visible: false,
      msgVisible:false,
      type: 'user',
      loading: false,
      loadMoreLoading: false,
      autocompleteQuery: true,
      default_props: {
        // 配置选项
        children: 'children',
        label: 'nameLabel',
        isLeaf: 'leaf'
      },
      queryUserPage:{
        restaurants:[],
        offset:0,
        limit:50
      },
      check_user_data: [], // 选择审核员数据
      check_doc_lib_data: [], // 选择审核范围数据
      search_value: '', // 查找的value值
      search_value_doc_lib: '', // 查找的value值
      search_doc_value: '', // 查找的value值
      show_input_search: true,
      user_show_tree: true, // 是否显示树
      other_show_tree:true,
      checkStrategyResult:true,
      checkedNodesUserDocLibData:[],
      checkedNodesDocLibData:[],
      progressUserDocLibList: [],
      progressUserDocLibTotal: 0,
      rootScrollLoad:true,
      rootNode:null,
      rootDeptOffset:0,
      rootDeptLimit:100,
      active_step: 0,
      percentage: 0,
      timeouter:null,
      operateType: '',
      active_name: 'user',
      doc_lib_type: 'user',
      doc_lib_data: [],
      checkDocLibList:[],
      warnMsgList:[],
      allEditType:'additional',
      audit_model:'tjsh',
      choose_user_id: '',
      choose_user_name: '',
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip')
    }
  },
  computed: {
    isUpdate() {
      return this.operateType !== ''
    },
    isCheckUserData(){
      if(this.operateType === 'batch'){
        return false
      }
      return this.check_user_data.length === 0
    },
    isCheckDocLibData(){
      return this.check_doc_lib_data.length === 0
    }
  },
  created() {
    this.audit_model = 'tjsh'
    this.initStepSelector()
  },
  methods: {
    /**
     * 调用者调用此方法打开弹窗
     * @param _obj
     * @param operateType
     */
    async openSelector(obj, operateType) {
      this.operateType = operateType
      // eslint-disable-next-line no-prototype-builtins
      if (obj && JSON.stringify(obj) !== '{}' && obj.hasOwnProperty('doc_id') && obj.hasOwnProperty('doc_name')) {
        const docId = obj.doc_id
        const docName = obj.doc_name
        const docType = obj.doc_type
        this.check_doc_lib_data = []
        this.choose_user_id = ''
        this.check_doc_lib_data.push({ id: docId, name: docName, type: docType})
        obj.auditor_list.forEach(auditor => {
          if(this.choose_user_id === '' || this.choose_user_id === null){
            this.choose_user_id = auditor.user_id
          }else{
            this.choose_user_id += ',' + auditor.user_id
          }
          if(this.choose_user_name === ''){
            this.choose_user_name = auditor.user_name
          }else{
            this.choose_user_name += ',' + auditor.user_name
          }
        })
        this.check_user_data = await this.getCheckedFullDataByIds(this.choose_user_id)
      } else if(this.selectDocList.length > 1 && this.operateType === 'batch'){
        this.choose_user_id = ''
        this.check_user_data = []
        this.check_doc_lib_data = []
        this.selectDocList.forEach((item) => {
          const docId = item.doc_id
          const docName = item.doc_name
          const docType = item.doc_type
          this.check_doc_lib_data.push({ id: docId, name: docName, type: docType})
        })
        this.allEditType = 'additional'
      } else {
        this.choose_user_id = ''
        this.check_user_data = []
        this.check_doc_lib_data = []
      }
      if(this.operateType === 'single'){
        this.audit_model = obj.audit_model
      } else {
        this.audit_model = 'tjsh'
      }
      this.type = 'user'
      this.doc_lib_type = 'user'
      this.initStepSelector()
      // 绑定滚动条事件
      this.$nextTick(() => {
        setTimeout(() =>{
          document.querySelector('div[name=userRootContent]').addEventListener('scroll', this.userRootHandleScroll)
        },1000)
      })
      this.visible = true
    },
    initStepSelector(){
      this.search_value = ''
      this.search_value_doc_lib = ''
      this.search_doc_value = ''
      this.rootDeptOffset = 0
      this.rootDeptLimit = 100
      this.checkStrategyResult = true
      this.checkedNodesUserDocLibData = []
      this.checkedNodesDocLibData = []
      this.clearSearch()
    },
    /**
     * 文档库tab切换点击事件
     * @param tab
     */
    handleClick(tab) {
      if (this.type !== tab.name) {
        this.type = tab.name
        this.doc_lib_type = tab.name
        this.show_input_search = false
        this.search_doc_value = undefined
        this.loadDocLibData()
        this.user_show_tree = false
        this.other_show_tree = false
        this.checkedNodesDocLibData = []
        this.checkedNodesUserDocLibData = []
        this.$nextTick(() => {
          this.user_show_tree = true
          this.show_input_search = true
          this.other_show_tree = true
        })
      }
      // 绑定滚动条事件
      if(tab.name === 'user'){
        this.$nextTick(() => {
          setTimeout(() =>{
            document.querySelector('div[name=userRootContent]').addEventListener('scroll', this.userRootHandleScroll)
          },1000)
        })
      }
    },
    /**
     * 点击下一步
     **/
    toNextStep() {
      if (this.active_step === 0) {
        if (this.judgeDuplicate()) {
          return
        }
        this.active_name = 'user'
        this.doc_lib_type = 'user'
        this.search_doc_value = undefined
        this.loadDocLibData()
        this.active_step = 1
      } else {
        this.active_step = 0
      }
      this.rootDeptOffset = 0
      this.rootDeptLimit = 100
      // 绑定滚动条事件
      this.$nextTick(() => {
        document.querySelector('div[name=userRootContent]').addEventListener('scroll', this.userRootHandleScroll)
      })
    },
    /**
     * 加载文档库数据
     */
    loadDocLibData() {
      const self = this
      self.doc_lib_data = []
      getDocLibList(this.doc_lib_type, {}).then((res) => {
        self.doc_lib_data = res.entries
      }).catch(() => {})
    },
    /**
     * 判断审核员是否重复选择
     **/
    judgeDuplicate() {
      const self = this
      let flag = false
      if (this.isUpdate) {
        self.check_user_data.forEach(user => {
          const find = self.checkedUserIds.find((item) => item === user.id)
          if (find !== undefined) {
            self.$message.warning(`${self.$i18n.tc('message.user')}“${user.name}”${self.$i18n.tc('message.listExists')}`)
            flag = true
          }
        })
      }
      return flag
    },
    /**
     * 关闭弹窗事件
     */
    close() {
      this.active_step = 0
      this.visible = false
    },
    /**
     * ==========================================加载用户组织树和文档库树节点======================================
     * */
    /**
     * 加载用户树节点
     * @param node
     * @param resolve
     * @returns {Promise<*>}
     */
    async loadNodeUser(node, resolve) {
      const _this = this
      if (node.level === 0) {
        _this.rootNode = node
        rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit).then((res) => {
          if(_this.active_step === 1){
            const allItem = {}
            allItem['id'] = 'all_user_doc_lib'
            allItem['name'] = '所有个人文档库'
            if(_this.$i18n.locale === 'en-us'){
              allItem['name'] = 'All User Documents'
            } else if(_this.$i18n.locale === 'zh-tw'){
              allItem['name'] = '所有個人文件庫'
            }
            res.departments.entries.unshift(allItem)
          }
          _this.dealMembersData(res, resolve)
        }).catch(() => {})
      } else {
        members(node.data.id, 0, 100).then((res) => {
          _this.getUserInfoList(res).then((data) => {
            _this.dealMembersData(res, resolve, node, data)
          })
        }).catch(() => {})
      }
    },
    /**
     * 加载部门与自定义文档库树节点
     * @param node
     * @param resolve
     * @returns {Promise<*>}
     */
    loadNodeDocDepart(node, resolve){
      let _this = this
      getDocLibList(this.doc_lib_type, {}).then((res) => {
        _this.dealDocDepartData(res, resolve, node)
      }).catch(() => {})
    },
    /**
     * 根据所选数据的类型（用户或组织），显示对应的图标
     * @param _obj
     * @param node
     */
    checkDataIcon(_obj, node) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj', all_user_doc_lib: 'icon-document' }
      if (node) {
        if (node.level === 1) {
          return map['top']
        }
      }
      return map[_obj.type]
    },
    /**
     * 用户根节点滚动条
     */
    userRootHandleScroll() {
      const _this = this
      const scrollTop = document.querySelector('div[name=userRootContent]').scrollTop
      const scrollHeight = document.querySelector('div[name=userRootContent]').scrollHeight
      const clientHeight = document.querySelector('div[name=userRootContent]').clientHeight
      if (scrollTop > (scrollHeight - clientHeight) * 0.7 ) {
        if (_this.rootScrollLoad) {
          _this.rootDeptLoadMoreData()
          _this.rootScrollLoad = false
        }
      }
    },
    /**
     * 根节点加载更多数据处理
     */
    rootDeptLoadMoreData() {
      const _this = this
      if (_this.rootDeptOffset === 0) {
        _this.rootDeptOffset = _this.rootDeptLimit
      } else {
        _this.rootDeptOffset += _this.rootDeptLimit
      }
      rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit).then((res) => {
        const arrnew = []
        const departs = res.departments.entries
        let parentId = 0
        departs.forEach((item) => {
          item['type'] = 'depart'
          item['leaf'] = false
          item['parent'] = parentId
          item['nameLabel'] = item.name
          arrnew.push(item)
        })
        _this.rootNode.doCreateChildren(arrnew)
        _this.rootScrollLoad = true
      }).catch(() => {})
    },
    /**
     * 添加加载更多节点
     * @param res
     * @param arr
     * @param offset
     * @param limit
     * @param parentId
     */
    addLoadMoreNode(res, arr, offset, limit, parentId){
      const _this = this
      if(arr.length < res.users.total_count){
        let nameLabel = '加载更多'
        if(_this.$i18n.locale === 'en-us'){
          nameLabel = 'Load More'
        } else if(_this.$i18n.locale === 'zh-tw'){
          nameLabel = '加載更多'
        }
        let obj = {
          nameLabel:nameLabel,
          type:'loadMore',
          leaf:true,
          offset:offset,
          limit:limit,
          parent:parentId
        }
        arr.push(obj)
      }
    },
    /**
     * 加载更多处理
     * @param data
     * @param node
     */
    dealLoadMoreData(data, node){
      let _this = this
      let arrnew = node.parent.childNodes.map(item => {
        return Object.assign({},item.data)
      })
      let offset = data.offset
      let limit = data.limit
      if(offset === 0){
        offset = limit
      } else {
        offset += limit
      }
      arrnew.splice(arrnew.findIndex(d => d.type === data.type), 1)
      _this.loadMoreLoading = true
      members(node.parent.data.id, offset, limit).then((res) => {
        _this.getUserInfoList(res).then((userInfoList) => {
          const users = res.users.entries
          let parentId = ''
          if(node !== undefined){
            parentId = node.parent.data.id
          }
          users.forEach((item) => {
            item['type'] = 'user'
            item['leaf'] = true
            item['parent'] = parentId
            item['nameLabel'] = item.name
            arrnew.push(item)
          })
          _this.addLoadMoreNode(res, arrnew, offset, limit, parentId)
          _this.loadMoreLoading = false
          node.parent.childNodes = []
          node.parent.doCreateChildren(arrnew)
          //  若父节点被选中，加载更多则默认选择
          _this.checkedNodesUserDocLibData.forEach(e => {
            if(data.parent === e.id){
              _this.$refs.userLibTree.setChecked(data.parent, true, true)
            }
          })
        }).catch(() => {})
      }).catch(() => {})
    },
    /**
     * ==========================================用户组织树和文档库树条件搜索======================================
     * */
    /**
     * 用户搜索
     * @param queryString
     * @param cb
     */
    async querySearch(queryString, cb) {
      const _this = this
      if(['', 'null', 'undefined'].includes(queryString + '') || !_this.autocompleteQuery){
        cb([])
        return
      }
      queryString = queryString.trim()
      if (!queryString) {
        _this.clean()
        cb([])
        return
      }
      let promise = null
      if(_this.timeouter){
        clearTimeout(_this.timeouter)
      }
      _this.timeouter = setTimeout(function () {
        if (_this.type === userSelectorService.urlMap.type.ORG) {
          promise = _this.searchOrg(queryString)
        } else if (_this.type === userSelectorService.urlMap.type.USER) {
          promise = _this.searchUser(queryString, _this.queryUserPage.offset, _this.queryUserPage.limit)
        } else if (_this.type === userSelectorService.urlMap.type.ALL) {
          promise = _this.searchAll(queryString)
        }
        if (promise !== null) {
          // 调用 callback 返回建议列表的数据
          promise.then((res) => {
            if (res.length === 0 && _this.queryUserPage.restaurants.length === 0) {
              cb([{parent_dep_paths: [''], name: _this.serachEmpthInfo}])
            } else {
              _this.queryUserPage.restaurants = _this.queryUserPage.restaurants.concat(res)
              cb(_this.queryUserPage.restaurants)
            }
          }).catch(() => {})
        } else {
          cb([])
        }
      }, 800)
    },
    /**
     * 搜索滚动条
     */
    handleScroll() {
      let _this = this
      let search_value = _this.search_value
      if(_this.active_step === 1){
        search_value = _this.search_value_doc_lib
      }
      _this.$refs.autocomplete.getData(search_value)
      _this.queryUserPage.offset += _this.queryUserPage.limit
    },
    /**
     * 部门及自定义文档库搜索
     * @param queryString
     * @param cb
     */
    async querySearchDocLib(queryString, cb) {
      const _this = this
      if(['', 'null', 'undefined'].includes(queryString + '') || !_this.autocompleteQuery){
        cb([])
        return
      }
      queryString = queryString.trim()
      if (!queryString) {
        _this.clean()
        cb([])
        return
      }
      getDocLibList(_this.doc_lib_type, { keyword: queryString, field: 'doc_lib_name' }).then((res) => {
        if(res.entries.length === 0){
          cb([{parent_dep_paths: [''], name: _this.serachEmpthInfo}])
        }else{
          cb(res.entries)
        }
      }).catch(() => {})
    },
    /**
     * 清空搜索框
     */
    clearSearch(){
      this.autocompleteQuery = true
      this.queryUserPage.offset = 0
      this.queryUserPage.limit = 50
      this.queryUserPage.restaurants = []
      if(this.$refs.autocomplete !== undefined){
        this.$refs.autocomplete.handleFocus()
      }
    },
    /**
     * 搜索用户
     * @param queryString
     * @param offset
     * @param limit
     */
    searchUser(queryString, offset, limit) {
      return new Promise((resolve) => {
        userSearch(queryString, 'user', offset, limit).then((res) => {
          const arr = res.users.entries
          arr.forEach((item) => {
            item['type'] = 'user'
          })
          resolve(arr)
        }).catch(() => {})
      })
    },
    /**
     * 搜索组织
     * @param queryString
     */
    searchOrg(queryString) {
      return new Promise((resolve) => {
        userSelectorService.serachOrg(queryString, '').then((rs) => {
          resolve(rs)
        }).catch(() => {})
      })
    },
    /**
     * 搜索组织和用户
     * @param queryString
     */
    searchAll(queryString) {
      return new Promise((resolve) => {
        userSelectorService.serachOrgAndUser(queryString, '').then((rs) => {
          resolve(rs)
        }).catch(() => {})
      })
    },
    /**
     * 清空
     */
    clean() {
      this.search_value = ''
    },
    /**
     * 搜索集合添加审核员
     * @param item
     */
    addUser(item) {
      if(item.name === this.serachEmpthInfo){
        return
      }
      if(this.check_user_data.length === 10){
        this.$message.success(this.$i18n.tc('strategy.addAuditorTips'))
        return
      }
      let _array = this.check_user_data.filter((data) => item.id === data.id)
      if (_array.length === 0) {
        this.check_user_data.push(item)
      }
      this.autocompleteQuery = false
    },
    /**
     * 搜索集合添加个人文档库
     * @param item
     */
    addUserDocLib(item) {
      if(item.name === this.serachEmpthInfo){
        return
      }
      let _array = this.check_doc_lib_data.filter((data) => item.id === data.id)
      if (_array.length === 0) {
        this.check_doc_lib_data.push(item)
      }
    },
    /**
     * 搜索集合添加部门及自定义文档库
     * @param item
     */
    addDocLib(item) {
      if(item.name === this.serachEmpthInfo){
        return
      }
      let _array = this.check_doc_lib_data.filter((data) => item.id === data.id)
      if (_array.length === 0) {
        this.check_doc_lib_data.push(item)
      }
      this.autocompleteQuery = false
    },
    /**
     * ==========================================用户组织树和文档库树操作======================================
     * */
    /**
     * 用户树节点点击事件
     * @param data
     * @param node
     */
    async handleNodeClickUser(data, node) {
      const _this = this
      if (data.parentId === '0') {
        return
      }
      if(data.type === 'loadMore'){
        this.dealLoadMoreData(data, node)
        return
      }
      if (data.type === userSelectorService.urlMap.type.USER && _this.active_step === 0) {
        let _array = _this.check_user_data.filter((item) => item.id === data.id)
        if (_array.length === 0) {
          const userObj = await _this.getCheckedFullDataByIds(data.id)
          if(this.check_user_data.length === 10){
            _this.$message.success(_this.$i18n.tc('strategy.addAuditorTips'))
            return
          }
          _this.check_user_data.push(...userObj)
        }
      }
    },
    /**
     * 个人文档库节点点击事件
     */
    handleNodeClickUserDocLib(data, checkedData) {
      if(data.type === 'loadMore'){
        return
      }
      this.checkedNodesUserDocLibData = this.$refs.userLibTree.getCheckedNodes()
    },
    /**
     * 部门及自定义文档库节点点击事件
     */
    handleNodeClickDocLib(data, checkedData) {
      this.checkedNodesDocLibData = this.$refs.docLibTree.getCheckedNodes()
    },
    /**
     * 添加文档库至已选列表
     **/
    addSelectedDocLib(){
      const _this = this
      let _array = _this.check_doc_lib_data
      if(_this.active_name === 'user'){
        _this.checkedNodesUserDocLibData.forEach(checkItem => {
          if(checkItem.id === 'all_user_doc_lib'){
            let checkArray = _array.filter(item => item.id === checkItem.id)
            if (checkArray.length === 0) {
              _array.push(checkItem)
            }
          } else if (checkItem.type === 'user' || checkItem.type === 'depart') {
            let add = true
            _this.checkedNodesUserDocLibData.forEach(e =>{
              if(checkItem.parent === e.id){
                add = false
              }
            })
            if (add) {
              let checkArray = _array.filter(item => item.id === checkItem.id)
              if (checkArray.length === 0) {
                _array.push(checkItem)
              }
            }
          }
        })
        _this.$refs.userLibTree.setCheckedKeys([])
      }else{
        _this.checkedNodesDocLibData.forEach(checkItem => {
          let checkArray = _array.filter(e => e.id === checkItem.id)
          if (checkArray.length === 0) {
            if(checkItem.type === 'custom_doc_lib'){
              _array.unshift(checkItem)
            }else{
              _array.push(checkItem)
            }
          }
        })
        _this.$refs.docLibTree.setCheckedKeys([])
      }
      _this.check_doc_lib_data = _array
    },
    /**
     * 删除指定审核员数据
     * @param item
     */
    delAppointUserData(item) {
      this.check_user_data.splice(
        this.check_user_data.findIndex((data) => data === item),
        1
      )
    },
    /**
     * 删除指定文档库数据
     * @param item
     */
    delAppointDocLibData(item) {
      this.check_doc_lib_data.splice(
        this.check_doc_lib_data.findIndex((data) => data === item),
        1
      )
    },
    /**
     * 删除第一步：所有选中审核员数据
     */
    delAllUserData() {
      this.check_user_data = []
    },
    /**
     * 删除第二步：所有选中审核范围数据
     */
    delAllDocLibData() {
      this.check_doc_lib_data = []
    },
    /**
     * ==========================================确认提交配置======================================
     * */
    /**
     *确定提交按钮事件
     */
    confirm() {
      const _this = this
      _this.checkRepeatStrategyAutitor().then(res => {
        if(res){
          _this.preSubmitData()
        }
      })
    },
    /**
     * 提交前置处理
     */
    preSubmitData(){
      let _this = this
      let postDataArr = []
      let auditorArr = []
      let auditorNames = ''
      _this.check_user_data.forEach(user => {
        const auditorData = {
          user_id: user.id,
          user_name: user.name,
          user_dept_id: user.org_id,
          user_dept_name: user.orgName,
          user_code:user.account,
          parent_dep_paths: user.parent_dep_paths
        }
        if(auditorNames !== ''){
          auditorNames += ',' + user.name + '(' +  user.user_code + ')'
        } else {
          auditorNames = user.name + '(' +  user.user_code + ')'
        }
        auditorArr.push(auditorData)
      })
      let hasDepart = false
      _this.check_doc_lib_data.forEach((item) => {
        if(item.type === 'depart'){
          hasDepart = true
        }
      })
      if(hasDepart){
        if(!_this.isUpdate){
          _this.percentage = 0
          _this.openStepProgress()
        }
        _this.getBatchUserDocLibTotal().then(totalRes => {
          _this.getBatchUserDocLib(_this.check_doc_lib_data, _this.progressUserDocLibList).then(res =>{
            _this.checkRepeatStrategy().then(checkRes => {
              _this.submitData(postDataArr, auditorArr, auditorNames)
            }).catch(() => {})
          }).catch(() => {})
        }).catch(() => {})
      }else{
        if(!_this.isUpdate && _this.check_doc_lib_data.length > 1){
          _this.percentage = 0
          _this.openStepProgress()
        }
        _this.checkRepeatStrategy().then(checkRes => {
          _this.submitData(postDataArr, auditorArr, auditorNames)
        }).catch(() => {})
      }
      _this.close()
    },
    /**
     * 查询组织所有个人文档库总条目数
     * @param orgId
     **/
    getUserDocLibTotal(orgId){
      let _this = this
      return new Promise((resolve) => {
        this.getAllUserDocLib(orgId, 0, 10).then((res) =>{
          _this.progressUserDocLibTotal += res.total_count
          resolve(res)
        }).catch(() => {})
      })
    },
    /**
     * 查询组织所有个人文档库
     * @param orgId
     * @param _array
     * @param _progressuserlib
     **/
    allUserDocLibDeal(orgId, _array, _progressuserlib){
      let _this = this
      let userLibList = []
      return new Promise((resolve) => {
        this.getAllUserDocLib(orgId, 0, 200).then((res) =>{
          userLibList = res.entries
          if(res.entries.length < res.total_count){
            _this.batchQueryUserDocLib(orgId, userLibList, _array, _progressuserlib, 0, 200).then(re => {
              resolve(true)
            }).catch(() => {})
          } else {
            userLibList.forEach(uLib =>{
              if(uLib.created_by.name !== ''){
                let item = {}
                item['id'] = uLib.created_by.id
                item['name'] = uLib.created_by.name
                item['type'] = 'user'
                let checkArray = _array.filter(e => e.id === item.id)
                if (checkArray.length === 0) {
                  _array.push(item)
                  _progressuserlib.push(item)
                }
              }
            })
            let currentPercen = _this.progressUserDocLibList.length / _this.progressUserDocLibTotal / 2
            _this.percentage = parseInt((currentPercen * 100).toFixed(0))
            resolve(true)
          }
        }).catch(() => {})
      })
    },
    /**
     * 分批查询个人文档库
     * @param orgId
     * @param userLibList
     * @param _array
     * @param _progressuserlib
     * @param offset
     * @param limit
     **/
    batchQueryUserDocLib(orgId, userLibList, _array, _progressuserlib, offset, limit){
      let _this = this
      offset += limit
      return new Promise((resolve) => {
        this.getAllUserDocLib(orgId, offset, limit).then((res) =>{
          userLibList = [...userLibList, ...res.entries]
          if(userLibList.length < res.total_count){
            _this.batchQueryUserDocLib(orgId, userLibList, _array, _progressuserlib, offset, limit).then(batchRes => {
              resolve(true)
            }).catch(() => {})
            let currentPercen = userLibList.length / _this.progressUserDocLibTotal / 2
            _this.percentage = parseInt((currentPercen * 100).toFixed(0))
          } else {
            userLibList.forEach(uLib =>{
              if(uLib.created_by.name !== ''){
                let item = {}
                item['id'] = uLib.created_by.id
                item['name'] = uLib.created_by.name
                item['type'] = 'user'
                let checkArray = _array.filter(e => e.id === item.id)
                if (checkArray.length === 0) {
                  _array.push(item)
                  _progressuserlib.push(item)
                }
              }
            })
            let currentPercen = _this.progressUserDocLibList.length / _this.progressUserDocLibTotal / 2
            _this.percentage = parseInt((currentPercen * 100).toFixed(0))
            resolve(true)
          }
        }).catch(() => {})
      })
    },
    /**
     * 分页查询个人文档库
     * @param orgId
     * @param offset
     * @param limit
     **/
    getAllUserDocLib(orgId, offset, limit){
      return new Promise((resolve) => {
        queryUserDocLib(orgId, offset, limit).then((res) => {
          resolve(res)
        }).catch(() => {})
      })
    },
    /**
     * 获取文档库所选组织下的所有个人文档库总条目数
     **/
    getBatchUserDocLibTotal(){
      let _this = this
      let promiseAll = []
      _this.progressUserDocLibList = []
      _this.progressUserDocLibTotal = 0
      _this.check_doc_lib_data.forEach((item) => {
        if(item.type === 'depart'){
          promiseAll.push(_this.getUserDocLibTotal(item.id))
        }
      })
      return Promise.all(promiseAll)
    },
    /**
     * 获取文档库所选组织下的所有个人文档库
     * @param _array
     * @param _progressuserlib
     **/
    getBatchUserDocLib(_array, _progressuserlib){
      let _this = this
      let promiseAll = []
      _this.check_doc_lib_data.forEach((item) => {
        if(item.type === 'depart'){
          promiseAll.push(_this.allUserDocLibDeal(item.id, _array, _progressuserlib))
        }
      })
      return Promise.all(promiseAll)
    },
    /**
     * 提交数据进行入库
     * @param postDataArr
     * @param auditorArr
     * @param auditorNames
     **/
    submitData(postDataArr, auditorArr, auditorNames){
      let _this = this
      _this.check_doc_lib_data.forEach((item) => {
        let docType = item.type
        let auditorList = [...auditorArr]
        if(item.type === 'depart'){
          return true // continue
        }
        if(item.type === 'user' || item.type === 'all_user_doc_lib'){
          docType = 'user_doc_lib'
        }
        if(_this.operateType === 'batch' && _this.selectDocList.length > 1){
          auditorList = _this.batchUpdateDeal(auditorList, item.id)
        }
        const postData = {
          doc_id: item.id,
          doc_name: item.name,
          doc_type: docType,
          audit_model: _this.audit_model,
          auditorNames: auditorNames,
          auditor_list:auditorList
        }
        postDataArr.push(postData)
      })
      if(postDataArr.length === 0){
        _this.percentage = 100
        if(!_this.checkStrategyResult){
          _this.msgVisible = true
        }
        return
      } else if(postDataArr.length <= 200){
        setTimeout(() => {
          _this.percentage = 100
        }, 1000)
      }
      _this.$emit('output', postDataArr, this.isUpdate)
    },
    /**
     * 新增策略校验审核员是否存在
     **/
    checkRepeatStrategyAutitor(){
      const _this = this
      let ids = []
      _this.warnMsgList = []
      _this.check_user_data.forEach(user => {
        ids.push(user.id)
      })
      return new Promise((resolve) => {
        getInfoByTypeAndIds('user', ids).then(res => {
          resolve(true)
        }).catch((res) => {
          if(res.response.data.code === 400019001){
            const detail = JSON.parse(res.response.data.detail)
            _this.check_user_data.forEach(user => {
              if(detail.ids.indexOf(user.id) > -1){
                const warnMsg = user.name + _this.$i18n.tc('modeler.strategyWarnMsgFix') + _this.$i18n.tc('modeler.strategyAuditorWarnMsg')
                _this.warnMsgList.push(warnMsg)
              }
            })
            _this.msgVisible = true
            resolve(false)
          }
        })
      })
    },
    /**
     * 新增策略校验是否已存在策略
     **/
    checkRepeatStrategy(){
      const _this = this
      _this.warnMsgList = []
      let docLibDataList = []
      let docLibList = []
      return new Promise((resolve) => {
        if(_this.isUpdate){
          resolve(true)
          return true
        }
        _this.check_doc_lib_data.forEach((e) => {
          let item = {}
          item.doc_id = e.id
          item.doc_name = e.name
          docLibList.push(item)
        })
        checkStrategy(docLibList, _this.procDefId).then(existDocList => {
          _this.check_doc_lib_data.forEach((item) => {
            let docType = item.type
            if(item.type === 'user' || item.type === 'all_user_doc_lib'){
              docType = 'user_doc_lib'
            }
            const find = existDocList.find((doc) => doc.doc_id === item.id)
            if (find !== undefined) {
              const warnMsg = item.name + _this.$i18n.tc('modeler.strategyWarnMsgFix') + ' ' +  _this.getDocTypeName(docType) + ' ' +  (_this.$store.state.app.secret.status === 'y' ? _this.$i18n.tc('modeler.secretStrategyWarnMsg') : _this.$i18n.tc('modeler.strategyWarnMsg'))
              _this.warnMsgList.push(warnMsg)
              if(_this.checkStrategyResult){
                _this.checkStrategyResult = false
              }
            } else {
              docLibDataList.push(item)
            }
          })
          _this.check_doc_lib_data = docLibDataList
          resolve(true)
        }).catch(() => {})
      })
    },
    /**
     * 批量修改数据处理
     * @param auditorList
     * @param docId
     **/
    batchUpdateDeal(auditorList, docId){
      let _this = this
      let result = []
      if(_this.operateType === 'batch' && _this.selectDocList.length > 1){
        _this.check_doc_lib_data = []
        _this.selectDocList.forEach((item) => {
          if(item.doc_id === docId){
            const oldArr = [...item.auditor_list]
            if(_this.allEditType === 'additional'){
              auditorList.forEach(newAuditor => {
                if(oldArr.length === 10){
                  return
                }
                const index = oldArr.findIndex((oldAuditor) => oldAuditor.user_id === newAuditor.user_id)
                if(index === -1){
                  oldArr.push(newAuditor)
                }
              })
              result = oldArr
            } else if(_this.allEditType === 'replace'){
              if(auditorList.length > 0){
                result = auditorList
              } else {
                result = oldArr
              }
            }
          }
        })
      }
      return result
    },
    /**
     * 用户成员数据处理
     * @param res
     * @param resolve
     * @param node
     * @param userInfoList
     */
    dealMembersData(res, resolve, node, userInfoList) {
      let arr = []
      const users = res.users.entries
      let userIds = ''
      users.forEach((user) => {
        if(userIds === ''){
          userIds = user.id
        }else{
          userIds += ',' + user.id
        }
      })
      users.forEach((item) => {
        item['type'] = 'user'
        item['leaf'] = true
        item['parent'] = parentId
        item['nameLabel'] = item.name
        arr.push(item)
      })
      const departs = res.departments.entries
      let parentId = ''
      if(node !== undefined){
        parentId = node.data.id
      }
      departs.forEach((item) => {
        item['type'] = 'depart'
        item['leaf'] = false
        item['parent'] = parentId
        if(item.id === 'all_user_doc_lib'){
          item['leaf'] = true
          item['type'] = 'all_user_doc_lib'
        }
        item['nameLabel'] = item.name
        arr.push(item)
      })
      this.addLoadMoreNode(res, arr, 0, 100, parentId)
      resolve(arr)
    },
    /**
     * 文档库数据集处理
     * @param data
     * @param node
     */
    dealDocDepartData(res, resolve, node){
      const doc_lib_data = res.entries
      const arr = []
      if (node.level === 0) {
        const allItem = {}
        if(this.doc_lib_type === 'department'){
          allItem['id'] = 'all_department_doc_lib'
          allItem['type'] = 'department_doc_lib'
          allItem['name'] = '所有部门文档库'
          if(this.$i18n.locale === 'en-us'){
            allItem['name'] = 'All Dept. Documents'
          } else if(this.$i18n.locale === 'zh-tw'){
            allItem['name'] = '所有部門文件庫'
          }
        }else if(this.doc_lib_type === 'custom'){
          allItem['id'] = 'all_custom_doc_lib'
          allItem['type'] = 'custom_doc_lib'
          allItem['name'] = '所有自定义文档库'
          if(this.$i18n.locale === 'en-us'){
            allItem['name'] = 'All Custom Documents'
          } else if(this.$i18n.locale === 'zh-tw'){
            allItem['name'] = '所有自訂文件庫'
          }
        }
        doc_lib_data.unshift(allItem)
        doc_lib_data.forEach((item) => {
          item['leaf'] = true
          item['nameLabel'] = item.name
          arr.push(item)
        })
        resolve(arr)
      } else {
        resolve([])
      }
    },
    /**
     * 获取用户数据结果集
     * @param res
     */
    getUserInfoList(res){
      let users = res.users.entries
      let userIds = ''
      users.forEach((user) => {
        if(userIds === ''){
          userIds = user.id
        }else{
          userIds += ',' + user.id
        }
      })
      return this.getCheckedFullDataByIds(userIds)
    },
    /**
     * 根据用户id查询明细数据
     * @param userIds
     */
    getCheckedFullDataByIds(userIds) {
      return new Promise((resolve) => {
        if (!userIds) {
          return resolve([])
        }
        const userArr = userIds.split(',')
        transfer(userIds).then((res) => {
          const data = res
          const order_list = []
          data.forEach((item) => {
            item['type'] = 'user'
            order_list[userArr.indexOf(item.id)] = item
          })
          resolve(order_list)
        }).catch((e) => {
          if(e.response.data.code === 404019001){
            this.$message.success(this.$i18n.tc('modeler.strategyAuditorWarnMsg'))
          }else if(e.response.data.message){
            this.$message.success(e.response.data.message)
          }
        })
      })
    },
    /**
     * 获取各类型文档库（国际化）
     * @param type
     */
    getDocTypeName(type){
      if(type === 'user_doc_lib'){
        let name = '个人文档库'
        if(this.$i18n.locale === 'en-us'){
          name = 'User Documents'
        } else if(this.$i18n.locale === 'zh-tw'){
          name = '個人文件庫'
        }
        return name
      }else if(type === 'department_doc_lib'){
        let name = '部门文档库'
        if(this.$i18n.locale === 'en-us'){
          name = 'Department Documents'
        } else if(this.$i18n.locale === 'zh-tw'){
          name = '部門文件庫'
        }
        return name
      }else if(type === 'custom_doc_lib'){
        let name = '自定义文档库'
        if(this.$i18n.locale === 'en-us'){
          name = 'Custom Documents'
        } else if(this.$i18n.locale === 'zh-tw'){
          name = '自訂文件庫'
        }
        return name
      }
    },
    /**
     * 开启进度条
     */
    openStepProgress() {
      this.$refs['stepProgress'].openSelector()
    },
    closeWarnMsg(){
      this.msgVisible = false
    }
  }
}
</script>
<style>
.select-view {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: inherit;
  max-height: 100px;
  min-height: 60px;
  display: table;
  width: 100%;
  cursor: pointer;
}
.select-view .align-center {
  text-align: center;
  vertical-align: middle;
  display: table-cell;
}
.tag-boxs {
  height: 100px;
  overflow: auto;
  padding: 5px;
}
.tag-boxs .el-tag {
  margin: 2px;
}
.el-tree-node__content>label.el-checkbox{
  margin: 0px 10px 20px 15px !important;
}
</style>
