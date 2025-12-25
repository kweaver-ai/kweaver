<template>
  <div>
    <div class="choose-table" >
      <div class="cell cell-relative">
        <el-tabs type="border-card" class="choose-ul" v-model="active_name" @tab-click="handleClick">
          <el-tab-pane :label="$t('sync.organization')" name="user"></el-tab-pane>
          <el-tab-pane :label="$t('sync.userGroup')" name="userGroup"></el-tab-pane>
          <div v-if="active_name === 'user'" v-loading="loading">
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
                          <i class="icon iconfont icon-yonghu">{{ item.name }}</i>
                          <div>{{ item.parent_dep_paths[0] }}</div>
                        </div>
                      </el-tooltip>
                    </span>
                  <span v-else>{{ item.name }}</span>
                </template>
              </el-autocomplete>
            </div>
            <el-tree
              v-if="show_user_tree"
              :props="default_props"
              element-loading-text=""
              :default-expand-all="false"
              :expand-on-click-node="false"
              :highlight-current="true"
              node-key="id"
              name="userRootContent"
              :load="loadNodeUser"
              ref="userTree"
              lazy
              @node-click="handleNodeClick"
              :style="'height:' + treeHeight + 'px;overflow: auto'"
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
          <div v-if="active_name === 'userGroup'" v-loading="loading">
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
                          <i class="icon iconfont icon-yonghu">{{ item.name }}</i>
                          <div>{{ item.parent_dep_paths[0] }}</div>
                        </div>
                      </el-tooltip>
                    </span>
                  <span v-else>{{ item.name }}</span>
                </template>
              </el-autocomplete>
            </div>
            <el-tree
              v-if="show_user_group_tree"
              :props="default_props"
              element-loading-text=""
              :default-expand-all="false"
              :expand-on-click-node="false"
              :highlight-current="true"
              node-key="id"
              name="userGroupRootContent"
              :load="loadNodeUserGroup"
              lazy
              ref="userGroupTree"
              @node-click="handleNodeClick"
              :style="'height:' + treeHeight + 'px;overflow: auto'"
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
            <div v-else class="user-group-empty-box" :style="'border: 1px solid #ccc;height: ' + (treeHeight - treeHeight / 3) + 'px;padding-top: ' + (treeHeight / 3  - 20) + 'px;'">
                <div class="icon"></div>
                <p class="text">{{$t('message.noDataUserGroupTips')}}</p>
            </div>
          </div>
        </el-tabs>
      </div>
      <div class="cell no-border">
        <div class="choose-ul">
          <div class="head">
            <div class="left">{{ $t('modeler.selected') }}：</div>
            <div class="right">
              <el-button type="text" v-if="check_user_data.length == 0 || processDisable" disabled>{{ $t('modeler.common.clear') }}</el-button>
              <el-button type="text" v-else @click="delAllUserData">{{ $t('modeler.common.clear') }}</el-button>
            </div>
          </div>
          <ul :style="'height:' + chooseUlHeight + 'px;margin-top: 10px'" ref="chooseUl">
            <vuedraggable :disabled="audit_model !== 'zjsh'" class="wrapper" v-model="check_user_data">
              <transition-group>
                <el-tooltip
                  v-for="(item, index) in check_user_data"
                  :key="item.id"
                  class="item"
                  effect="light"
                  :content="`${item.name}- ${item.parent_dep_paths}`"
                  placement="top-start">
                  <li>
                    <span style="cursor: pointer">
                      <span v-if="audit_model === 'zjsh'">{{index + 1}}{{$t('modeler.level')}}  </span>
                      {{ item.name }}
                      <i v-if="!processDisable" class="el-icon-close" @click="delAppointUserData(item)"></i>
                    </span>
                  </li>
                </el-tooltip>
              </transition-group>
            </vuedraggable>
          </ul>
        </div>
      </div>
    </div>
    <div class="foot_button" v-if="!processDisable">
        <el-button type="primary" size="mini" @click="confirm" :disabled="isCheckUserData" style="width: 80px">{{ $t('button.confirm') }}</el-button>
        <el-button size="mini" @click="closeProperties" style="width: 80px">{{ $t('button.cancel') }}</el-button>
    </div>
  </div>
</template>
<script>
import userSelectorService from './selector-service'
import { members, rootDepartment, userGroups, groupMembers, transfer, userSearch, getInfoByTypeAndIds } from '@/api/user-management'
import vuedraggable from 'vuedraggable'
export default {
  name: 'sync-selector',
  props: {
    audit_model:{
      type: String,
      default: ''
    },
    checkedUserIds: {
      type: Array,
      required: true
    },
    processDisable: {
      type: Boolean
    }
  },
  components: { vuedraggable },
  data() {
    return {
      type: 'user',
      loading: false,
      loadMoreLoading: false,
      msgVisible:false,
      throttling: false, // 节流控制
      rootScrollLoad:true,
      show_user_tree: true, // 是否显示树
      show_user_group_tree: true, // 是否显示树
      autocompleteQuery: true,
      treeHeight: '450',
      chooseUlHeight: '450',
      default_props: {
        // 配置选项
        children: 'children',
        label: 'nameLabel',
        isLeaf: 'leaf'
      },
      check_user_data: [], // 选择数据
      search_value: '', // 查找的value值
      active_name: 'user',
      rootNode:null,
      rootGroupNode:null,
      rootDeptOffset:0,
      rootDeptLimit:100,
      rootGroupOffset:0,
      rootGroupLimit:100,
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip'),
      serachTimeouter: null,
      queryUserPage:{
        restaurants:[],
        offset:0,
        limit:50
      }
    }
  },
  computed: {
    isCheckUserData(){
      return this.check_user_data.length === 0
    }
  },
  watch: {
    checkedUserIds: {
      deep: true,
      handler() {
        this.initCheckUserData()
      }
    }
  },
  created() {
    this.$nextTick(function () {
      const _this = this
      _this.treeHeight = window.innerHeight - _this.$refs.userTree.$el.offsetTop - 295
      _this.chooseUlHeight = window.innerHeight - _this.$refs.chooseUl.offsetTop - 105
      // 监听窗口大小变化
      window.onresize = function() {
        _this.treeHeight = window.innerHeight - _this.$refs.userTree.$el.offsetTop - 295
        _this.chooseUlHeight = window.innerHeight - _this.$refs.chooseUl.offsetTop - 105
      }
    })
    // 绑定滚动条事件
    this.$nextTick(() => {
      setTimeout(() =>{
        document.querySelector('div[name=userRootContent]').addEventListener('scroll', this.userRootHandleScroll)
      },1000)
    })
    this.initSyncSelector()
    this.initCheckUserData()
  },
  methods: {
    initSyncSelector(){
      this.rootDeptOffset = 0
      this.rootDeptLimit = 100
      this.rootGroupOffset = 0
      this.rootGroupLimit = 100
    },
    /**
     * 初始化已选审核员
     */
    async initCheckUserData(){
      this.check_user_data = await this.getCheckedFullDataByIds(this.checkedUserIds.join(','))
    },
    /**
     * tab切换点击事件
     */
    handleClick(tab) {
      if (this.type === tab.name) {
        return
      }
      this.type = tab.name
      this.show_user_tree = false
      this.show_user_group_tree = false
      this.$nextTick(() => {
        this.show_user_tree = true
        this.show_user_group_tree = true
      })
      // 绑定滚动条事件
      if(tab.name === 'userGroup' && null !== document.querySelector('div[name=userGroupRootContent]')){
        this.$nextTick(() => {
          setTimeout(() =>{
            document.querySelector('div[name=userGroupRootContent]').addEventListener('scroll', this.userGroupRootHandleScroll)
          },1000)
        })
      } else if(tab.name === 'user'){
        this.$nextTick(() => {
          setTimeout(() =>{
            document.querySelector('div[name=userRootContent]').addEventListener('scroll', this.userRootHandleScroll)
          },1000)
        })
      }
      this.initSyncSelector()
    },
    /**
     * 加载用户树
     * @param node
     * @param resolve
     */
    async loadNodeUser(node, resolve) {
      const _this = this
      if (node.level === 0) {
        _this.rootNode = node
        rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit).then((res) => {
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
     * 加载用户组树
     * @param node
     * @param resolve
     */
    async loadNodeUserGroup(node, resolve) {
      const _this = this
      if (node.level === 0) {
        _this.rootGroupNode = node
        userGroups(_this.rootGroupOffset, _this.rootGroupLimit).then((res) => {
          _this.dealGroupMembersData(res, resolve, 1)
        }).catch(() => {})
      } else {
        if(node.data.type === 'depart'){
          members(node.data.id, 0, 100).then((res) => {
            _this.getUserInfoList(res).then((data) => {
              _this.dealMembersData(res, resolve, node, data)
            })
          }).catch(() => {})
        } else {
          groupMembers(node.data.id, 0, 100).then((res) => {
            _this.getGroupUserInfoList(res).then((data) => {
              _this.dealGroupMembersData(res, resolve, 2, data)
            })
          }).catch(() => {})
        }
      }
    },
    /**
     * 根据所选数据的类型，显示对应的图标
     */
    checkDataIcon(_obj, node) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj', group: 'icon-yhz' }
      if(_obj.type === 'group'){
        return map[_obj.type]
      }
      if (node.level === 1) {
        return map['top']
      }
      return map[_obj.type]
    },
    /**
     * 搜索
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
      if(_this.serachTimeouter){
        clearTimeout(_this.serachTimeouter)
      }
      _this.serachTimeouter = setTimeout(function () {
        if (_this.type === userSelectorService.urlMap.type.USER || _this.type === userSelectorService.urlMap.type.USER_GROUP) {
          promise = _this.searchUser(queryString)
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
     * 搜索用户
     */
    searchUser(queryString) {
      return new Promise((resolve) => {
        userSearch(queryString, 'user', 0, 50).then((res) => {
          const arr = res.users.entries
          arr.forEach((item) => {
            item['type'] = 'user'
          })
          resolve(arr)
        }).catch(() => {})
      })
    },
    /**
     * 清空搜索框
     */
    clearSearch(){
      const _this = this
      _this.autocompleteQuery = true
      _this.queryUserPage.offset = 0
      _this.queryUserPage.limit = 50
      _this.queryUserPage.restaurants = []
      if(_this.$refs.autocomplete !== undefined){
        _this.$refs.autocomplete.handleFocus()
      }
    },
    /**
     * 滚动条事件
     */
    handleScroll() {
      const _this = this
      let search_value = _this.search_value
      _this.$refs.autocomplete.getData(search_value)
      _this.queryUserPage.offset += _this.queryUserPage.limit
    },
    /**
     * 树节点点击事件
     */
    async handleNodeClick(data, node) {
      const _this = this
      if (!data.leaf || _this.processDisable) {
        return
      }
      if(data.type === 'loadMore'){
        _this.dealLoadMoreData(data, node)
        return
      }
      let _array = _this.check_user_data.filter((item) => item.id === data.id)
      if (_array.length === 0 && !_this.throttling) {
        if(_this.check_user_data.length === 10){
          _this.$message.success(_this.$i18n.tc('strategy.addAuditorTips'))
          return
        }
        _this.throttling = true
        _this.getCheckedFullDataByIds(data.id).then(res => {
          _this.throttling = false
          _this.check_user_data.push(...res)
        }).catch((e) => {
          if (e.response) {
            const { data } = e.response
            if(data.code === 404019001){
              _this.$message.success(_this.$i18n.tc('modeler.strategyAuditorWarnMsg'))
            }
          }
          _this.throttling = false
        })
      }
    },
    /**
     * 添加审核员至已选
     * @param item
     */
    addUser(item) {
      const _this = this
      if(item.name === _this.serachEmpthInfo || _this.processDisable){
        return
      }
      let _array = _this.check_user_data.filter((data) => item.id === data.id)
      if (_array.length === 0) {
        if(_this.check_user_data.length === 10){
          _this.$message.success(_this.$i18n.tc('strategy.addAuditorTips'))
          return
        }
        _this.check_user_data.push(item)
      }
      _this.autocompleteQuery = false
    },
    /**
     * 删除选中的审核员
     */
    delAppointUserData(item) {
      const _this = this
      _this.check_user_data.splice(
        _this.check_user_data.findIndex((data) => data === item),
        1
      )
    },
    /**
     * 删除所有选中的审核员
     */
    delAllUserData() {
      this.check_user_data = []
    },
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
      const _this = this
      let auditorArr = []
      _this.check_user_data.forEach(user => {
        const auditorData = {
          user_id: user.id,
          user_name: user.name,
          user_dept_id: user.org_id,
          user_dept_name: user.orgName,
          user_code:user.account,
          parent_dep_paths: user.parent_dep_paths
        }
        auditorArr.push(auditorData)
      })
      let auditorList = [...auditorArr]
      const postData = {
        doc_id: null,
        doc_name: null,
        doc_type: null,
        auditor_list:auditorList
      }
      _this.$emit('output', postData)
    },
    /**
     * 新增策略校验审核员是否存在
     **/
    checkRepeatStrategyAutitor(){
      const _this = this
      let ids = []
      let warnMsgStr = ''
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
                if(warnMsgStr === ''){
                  warnMsgStr = '“' + user.name + '”'
                } else {
                  warnMsgStr += '、“' + user.name + '”'
                }
              }
            })
            const h = this.$createElement
            _this.$confirm('', {
              message:h('div',null, [
                h('p',{ style:'word-break:break-all;' },_this.$i18n.tc('sync.userHasTip1') + warnMsgStr + _this.$i18n.tc('sync.userHasTip2'))
              ]),
              confirmButtonText: _this.$i18n.tc('button.confirm'),
              cancelButtonText: _this.$i18n.tc('button.cancel'),
              showCancelButton: false,
              iconClass: 'warning-blue',
              type: 'warning'
            }).then(() => {}).catch(() => {})
            _this.msgVisible = true
            resolve(false)
          }
        })
      })
    },
    /**
     * 添加加载更多节点
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
     */
    dealLoadMoreData(data, node){
      const _this = this
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
        }).catch(() => {})
      }).catch(() => {})
    },
    /**
     * 获取用户数据结果集
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
     * 获取用户组数据结果集
     */
    getGroupUserInfoList(res){
      let members = res.entries
      let userIds = ''
      members.forEach((member) => {
        if(member.type === 'user'){
          if(userIds === ''){
            userIds = member.id
          } else {
            userIds += ',' + member.id
          }
        }
      })
      return this.getCheckedFullDataByIds(userIds)
    },
    /**
     * 部门组织成员处理
     * @param res
     * @param resolve
     */
    dealMembersData(res, resolve, node, userInfoList) {
      const arr = []
      const departs = res.departments.entries
      let parentId = ''
      if(node !== undefined){
        parentId = node.data.id
      }
      departs.forEach((item) => {
        item['type'] = 'depart'
        item['leaf'] = false
        item['parent'] = parentId
        item['nameLabel'] = item.name
        arr.push(item)
      })
      const users = res.users.entries
      users.forEach((item) => {
        item['type'] = 'user'
        item['parent'] = parentId
        item['nameLabel'] = item.name
        item['leaf'] = true
        arr.push(item)
      })
      this.addLoadMoreNode(res, arr, 0, 100, parentId)
      resolve(arr)
    },
    /**
     * 用户组成员处理
     * @param res
     * @param resolve
     */
    dealGroupMembersData(res, resolve, type, userInfoList) {
      const arr = []
      if(type === 1){
        const groups = res.entries
        groups.forEach((item) => {
          item['type'] = 'group'
          item['leaf'] = false
          item['nameLabel'] = item.name
          arr.push(item)
        })
        if(groups.length === 0){
          this.show_user_group_tree = false
        }
      } else {
        const groupMembers = res.entries
        groupMembers.forEach((item) => {
          if(item.type === 'department'){
            item['type'] = 'depart'
            item['leaf'] = false
            item['nameLabel'] = item.name
            arr.push(item)
          } else {
            item['type'] = 'user'
            item['leaf'] = true
            item['nameLabel'] = item.name
            arr.push(item)
          }
        })
      }
      resolve(arr)
    },
    /**
     * 根据用户id查询明细数据
     */
    getCheckedFullDataByIds(userIds) {
      return new Promise((resolve, reject) => {
        if (!userIds) {
          return resolve([])
        }
        const userArr = userIds.split(',')
        transfer(userIds).then((res) => {
          const order_list = []
          const data = res
          data.forEach((item) => {
            item['type'] = 'user'
            order_list[userArr.indexOf(item.id)] = item
          })
          resolve(order_list)
        }).catch((e) => {
          reject(e)
        })
      })
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
     * 用户组根节点滚动条
     */
    userGroupRootHandleScroll() {
      const _this = this
      const scrollTop = document.querySelector('div[name=userGroupRootContent]').scrollTop
      const scrollHeight = document.querySelector('div[name=userGroupRootContent]').scrollHeight
      const clientHeight = document.querySelector('div[name=userGroupRootContent]').clientHeight
      if (scrollTop > (scrollHeight - clientHeight) * 0.7 ) {
        if (_this.rootGroupScrollLoad) {
          _this.rootGroupLoadMoreData()
          _this.rootGroupScrollLoad = false
        }
      }
    },
    /**
     * 用户根节点加载更多数据处理
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
     * 用户组根节点加载更多数据处理
     */
    rootGroupLoadMoreData() {
      const _this = this
      if (_this.rootGroupOffset === 0) {
        _this.rootGroupOffset = _this.rootGroupLimit
      } else {
        _this.rootGroupOffset += _this.rootGroupLimit
      }
      userGroups(_this.rootGroupOffset, _this.rootGroupLimit).then((res) => {
        const arrnew = []
        const groups = res.entries
        groups.forEach((item) => {
          item['type'] = 'group'
          item['leaf'] = false
          item['nameLabel'] = item.name
          arrnew.push(item)
        })
        _this.rootGroupNode.doCreateChildren(arrnew)
        _this.rootGroupScrollLoad = true
      }).catch(() => {})
    },
    /**
     * 关闭环节属性配置界面
     */
    closeProperties(){
      this.$emit('closeProperties')
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
.rzsj_search_bar {
  width: 50%;
}
</style>
