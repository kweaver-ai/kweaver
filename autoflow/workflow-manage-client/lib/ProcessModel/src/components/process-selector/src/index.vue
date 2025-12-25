<template>
  <div>
    <div class="choose-table">
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
                :popper-append-to-body="false"
                :debounce="0"
                :fetch-suggestions="querySearch"
                :placeholder="$t('modeler.searchUser')"
                :trigger-on-focus="false"
                :hideLoading="true"
                @clear="clearSearch"
                @select="addUser"
                @input="clearSearch"
                v-loadmore="handleScroll"
              >
                <template slot-scope="{ item }">
                  <span v-if="item.deppath != null" :title="item.name + '\n' + item.deppath">
                    <div>
                      <p class="tooltip-text-overflow">
                        <i class="icon iconfont icon-yonghu"></i>&nbsp;{{item.name}}
                      </p>
                      <div class="tooltip-text-overflow">{{ item.deppath }}</div>
                    </div>
                  </span>
                  <span v-else>{{ item.name }}</span>
                </template>
              </el-autocomplete>
            </div>
            <el-tree
               :empty-text="emptyText"
               v-if="show_user_tree"
               :props="default_props"
               element-loading-text=""
               :default-expand-all="false"
               :highlight-current="true"
               node-key="id"
               name="userRootContent"
               :load="loadNodeUser"
               ref="userTree"
               lazy
               @node-click="handleNodeClick"
               :style="'height:' + treeHeight + 'px;overflow: auto;min-height:225px'">
                <span :class="flag === true ?'custom-tree-node':''" slot-scope="{ node, data }">
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
                 :popper-append-to-body="false"
                 :debounce="0"
                 :fetch-suggestions="querySearch"
                 :placeholder="$t('modeler.search')"
                 :trigger-on-focus="false"
                 :hideLoading="true"
                 @clear="clearSearch"
                 @select="addUser"
                 @input="clearSearch"
                 v-loadmore="handleScroll">
                <template slot-scope="{ item }">
                  <span v-if="item.deppath != null" :title="item.name + '\n' + item.deppath">
                    <div>
                      <p class="tooltip-text-overflow">
                        <i v-if="item.type==='user'" class="icon iconfont icon-yonghu"></i>
                        <i v-if="item.type==='group'" class="icon iconfont icon-yhz"></i>
                        &nbsp;{{item.name}}
                      </p>
                      <div class="tooltip-text-overflow">{{ item.deppath }}</div>
                    </div>
                  </span>
                  <span v-else>{{ item.name }}</span>
                </template>
              </el-autocomplete>
            </div>
            <el-tree
               :empty-text="emptyText"
               v-if="show_user_group_tree"
               :props="default_props"
               element-loading-text=""
               :default-expand-all="false"
               :highlight-current="true"
               :expand-on-click-node="false"
               node-key="id"
               name="userGroupRootContent"
               :load="loadNodeUserGroup"
               lazy
               ref="userGroupTree"
               @node-click="handleNodeClick"
               :style="'height:' + treeHeight + 'px;overflow: auto;min-height:225px'">
                <span :class="flag === true ?'custom-tree-node':''" slot-scope="{ node, data }">
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
            <div v-else class="user-group-empty-box" :style="'min-height:225px;border: 1px solid #ccc;height: ' +treeHeight + 'px;padding-top: ' + (treeHeight / 3  - 20) + 'px;'">
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
                <template v-for="(item, index) in check_user_data">
                  <li :key="item.id">
                      <span style="cursor: pointer" v-title :title="item.name + (item.type==='group'?$t('sync.groupType'):('-' + item.parent_dep_paths))">
                        <span v-if="audit_model === 'zjsh' && $i18n.locale === 'en-us'">{{$t('modeler.level')}} {{index + 1}}:&nbsp; </span>
                        <span v-if="audit_model === 'zjsh' && $i18n.locale !== 'en-us'"> {{index + 1}}{{$t('modeler.level')}}：&nbsp; </span>
                        {{ item.name }}{{item.type==='group' ? $t('sync.groupType'):''}}
                      </span>
                    <i v-if="!processDisable" class="el-icon-close" @click="delAppointUserData(item)"></i>
                  </li>
                </template>
              </transition-group>
            </vuedraggable>
          </ul>
        </div>
      </div>
    </div>
    <!-- <div class="foot_button" v-if="!processDisable">
      <el-button type="primary" size="mini" @click="confirm" style="width: 80px">{{ $t('button.confirm') }}</el-button>
      <el-button size="mini" @click="closeProperties" style="width: 80px">{{ $t('button.cancel') }}</el-button>
    </div> -->
  </div>
</template>
<script>
import userSelectorService from './selector-service'
import { getInfoByTypeAndIds, getUserInfos } from '@/api/user-management'
import { getRoots, getSubDeps, getSubUsers, userGroups, groupMembers, searchUser, getUserBasicInfo, userGroupsSearch } from '@/api/efast'
import vuedraggable from 'vuedraggable'
export default {
  name: 'sync-selector',
  props: {
    audit_model: {
      type: String,
      default: ''
    },
    checkedUsers: {
      type: Array,
      required: true
    },
    processDisable: {
      type: Boolean
    }
  },
  components: { vuedraggable },
  data () {
    return {
      type: 'user',
      loading: false,
      loadMoreLoading: false,
      msgVisible: false,
      throttling: false, // 节流控制
      rootScrollLoad: true,
      show_user_tree: true, // 是否显示树
      show_user_group_tree: true, // 是否显示树
      autocompleteQuery: true,
      flag:false,
      isEmpth:true,
      treeHeight: '450',
      chooseUlHeight: '450',
      emptyText:'',
      default_props: {
        // 配置选项
        children: 'children',
        label: 'nameLabel',
        isLeaf: 'leaf'
      },
      check_user_data: [], // 选择数据
      search_value: '', // 查找的value值
      active_name: 'user',
      rootNode: null,
      rootGroupNode: null,
      rootDeptOffset: 0,
      rootDeptLimit: 100,
      rootGroupOffset: 0,
      rootGroupLimit: 100,
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip'),
      serachTimeouter: null,
      queryUserPage: {
        restaurants: [],
        offset: 0,
        limit: 50
      }
    }
  },
  watch: {
    checkedUsers: {
      deep: true,
      handler () {
        this.initCheckUserData()
      }
    },
    check_user_data: {
       handler () {
        this.$emit('onChangeCheckUser',this.check_user_data)
      }
    }
  },
  created () {
    this.$nextTick(function () {
      const _this = this
      _this.chooseUlHeight = window.innerHeight - _this.$refs.chooseUl.offsetTop - 165 - 160
      _this.treeHeight = _this.chooseUlHeight - 41
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        if (_this.$refs.chooseUl) {
          _this.chooseUlHeight = window.innerHeight - _this.$refs.chooseUl.offsetTop - 165 - 160
          _this.treeHeight = _this.chooseUlHeight - 41
        }
      })
    })
    // 绑定滚动条事件
    this.$nextTick(() => {
      setTimeout(() => {
        if (null !== document.querySelector('div[name=userRootContent]')) {
          document.querySelector('div[name=userRootContent]').addEventListener('scroll', this.userRootHandleScroll)
        }
      }, 1000)
    })
    this.initSyncSelector()
    this.initCheckUserData()
  },
  methods: {
    initSyncSelector () {
      this.rootDeptOffset = 0
      this.rootDeptLimit = 100
      this.rootGroupOffset = 0
      this.rootGroupLimit = 100
    },
    /**
     * 初始化已选审核员
     */
    async initCheckUserData () {
      this.check_user_data = await this.getCheckedFullDataByIds(this.checkedUsers)
    },
    /**
     * tab切换点击事件
     */
    handleClick (tab) {
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
      if (tab.name === 'userGroup' && null !== document.querySelector('div[name=userGroupRootContent]')) {
        this.$nextTick(() => {
          setTimeout(() => {
            document.querySelector('div[name=userGroupRootContent]').addEventListener('scroll', this.userGroupRootHandleScroll)
          }, 1000)
        })
      }
      this.initSyncSelector()
    },
    /**
     * 加载用户树
     * @param node
     * @param resolve
     */
    async loadNodeUser (node, resolve) {
      const _this = this
      if (node.level === 0) {
        _this.rootNode = node
        getRoots().then((res) => {
          _this.dealMembersData(res, resolve)
        }).catch(() => { })
      } else {
        getSubDeps({ depid: node.data.depid }).then((res) => {
          _this.getUserInfoList(node.data.depid).then((data) => {
            _this.dealMembersData(res, resolve, node, data)
          })
        }).catch(() => { })
      }
    },
    /**
     * 加载用户组树
     * @param node
     * @param resolve
     */
    async loadNodeUserGroup (node, resolve) {
      const _this = this
      if (node.level === 0) {
        _this.rootGroupNode = node
        userGroups(_this.rootGroupOffset, _this.rootGroupLimit).then((res) => {
          _this.dealGroupMembersData(res, resolve, 1)
        }).catch(() => { })
      } else {
        if (node.data.type === 'depart') {
          getSubDeps({ depid: node.data.id }).then((res) => {
            _this.getUserInfoList(node.data.id).then((data) => {
              _this.dealMembersData(res, resolve, node, data)
            })
          }).catch(() => { })
        } else {
          groupMembers(node.data.id, 0, 100).then((res) => {
            _this.getGroupUserInfoList(res).then((data) => {
              _this.dealGroupMembersData(res, resolve, 2, data)
            })
          }).catch(() => { })
        }
      }
    },
    /**
     * 根据所选数据的类型，显示对应的图标
     */
    checkDataIcon (_obj, node) {
      const map = { user: 'icon-user', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj', group: 'icon-yhz' }
      if (_obj.type === 'group') {
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
    async querySearch (queryString, cb) {
      const _this = this
      if (['', 'null', 'undefined'].includes(queryString + '') || !_this.autocompleteQuery) {
        cb([])
        return
      }else{
        queryString = queryString.trim()
        if (!queryString) {
          _this.clean()
          cb([])
          return
        }
        let promise = null
        if (_this.serachTimeouter) {
          clearTimeout(_this.serachTimeouter)
        }
        _this.serachTimeouter = setTimeout(async function () {
          if (_this.type === userSelectorService.urlMap.type.USER) {
            promise = _this.searchUser(queryString, _this.queryUserPage.offset, _this.queryUserPage.limit)
          }else if(_this.type === userSelectorService.urlMap.type.USER_GROUP) {
            promise = _this.handleSearchUserGroup(queryString, _this.queryUserPage.offset, _this.queryUserPage.limit)
          }
          if (promise !== null) {
            // 调用 callback 返回建议列表的数据
            promise.then((res) => {
              if (res.length === 0 && _this.queryUserPage.restaurants.length === 0) {
                _this.isEmpth = false
                _this.queryUserPage.restaurants = []
                cb([{ parent_dep_paths: [''], name: _this.serachEmpthInfo }])
              } else {
                _this.isEmpth = true
                _this.queryUserPage.restaurants = _this.queryUserPage ? _this.queryUserPage.restaurants.concat(res) : res
                cb(_this.queryUserPage.restaurants)
              }
            }).catch((err) => {
              console.warn(err)
            })
          } else {
            cb([])
          }
        }, 800)
      }

    },
    /**
     * 清空
     */
    clean () {
      this.search_value = ''
    },
    /**
     * 搜索用户
     */
    searchUser (queryString, offset, limit) {
      return new Promise((resolve) => {
        searchUser(queryString, offset, limit).then((res) => {
          const usersArr = res.userinfos
          usersArr.forEach((item) => {
            item['type'] = 'user'
          })
          resolve(usersArr)
        }).catch((err) => {
          console.error(err)
        })
      })
    },
    /**
     * 搜索用户组
     */
    handleSearchUserGroup (queryString, offset, limit) {
      const _this = this
      return new Promise((resolve) => {
        userGroupsSearch(queryString, offset, limit).then((res) => {
          const usersArr = res.members.entries
          usersArr.forEach((item) => {
            item['type'] = 'user',
            item['deppath'] = item.group_names.length > 0? item.group_names.join('、'):'',
            item['account'] = item.name
          })
          const groupArr = res.groups.entries
          groupArr.forEach((item) => {
            item['type'] = 'group'
            item['deppath'] = _this.$t('sync.group')
            item['account'] = _this.$t('sync.group')
          })
          resolve(groupArr.concat(usersArr))
        }).catch((err) => {
          console.error(err)
        })
      })
    },
    /**
     * 清空搜索框
     */
    clearSearch () {
      const _this = this
      _this.autocompleteQuery = true
      _this.queryUserPage.offset = 0
      _this.queryUserPage.limit = 50
      _this.queryUserPage.restaurants = []
      if (_this.$refs.autocomplete !== undefined) {
        _this.$refs.autocomplete.handleFocus()
      }
    },
    /**
     * 滚动条事件
     */
    handleScroll () {
      const _this = this
      let search_value = _this.search_value
      _this.$refs.autocomplete.getData(search_value)
      _this.queryUserPage.offset += _this.queryUserPage.limit
    },
    /**
     * 树节点点击事件
     */
    async handleNodeClick (data) {
      const _this = this
      if ((!data.leaf && data.type !== 'group') || _this.processDisable) {
        _this.flag = false
        return
      }else{
        _this.flag = true
      }

      let _array = _this.check_user_data.filter((item) => item.id === data.id)
      if (_array.length === 0 && !_this.throttling) {
        if (_this.check_user_data.length === 10) {
          _this.$toast('error', _this.$i18n.tc('strategy.addAuditorTips'))
          return
        }
        _this.throttling = true
        if(data.type === 'user') {
          getUserBasicInfo({ userid: data.id }).then(res => {
            _this.throttling = false
            data['parent_dep_paths'] = res.directdepinfos.length > 0 ? res.directdepinfos[0].deppath : ''
            _this.check_user_data.push(data)
          }).catch((e) => {
            if (e.response) {
              const { data } = e.response
              if (data.code === 403001011) {
                _this.$message.success(_this.$i18n.tc('modeler.strategyAuditorWarnMsg'))
              }
            }
            _this.throttling = false
          })
        // 添加用户组
        }else if(data.type === 'group') {
          data['parent_dep_paths'] = ''
          data['account'] = _this.$t('sync.group')
          _this.check_user_data.push(data)
          _this.throttling = false
        }
      }

    },
    /**
     * 添加审核员至已选
     * @param item
     */
    addUser (item) {
      const _this = this
      if (item.name === _this.serachEmpthInfo || _this.processDisable) {
        return
      }
      let _array = []
      // 判断是用户还是用户组
      _array = _this.check_user_data.filter((data) => item.id === data.id || item.userid === data.id)
      if (_array.length === 0) {
        if (_this.check_user_data.length === 10) {
          _this.$toast('error', _this.$i18n.tc('strategy.addAuditorTips'))
          return
        }
        _this.check_user_data.push(this.formatUser(item))
      }
      _this.autocompleteQuery = false
    },
    // 封装用户数据
    formatUser (item) {
      let formatUser = {
        account: null,
        name: null,
        id: null,
        parent_dep_paths: null,
        type: 'type'
      }
      formatUser.id = item.userid || item.id
      formatUser.account = item.account
      formatUser.name = item.name
      formatUser.parent_dep_paths = item.deppath
      formatUser.type = item.type
      return formatUser
    },
    // 根据用户ID获取用户信息
    async formatGroupUser (item) {
      let _this = this
      const userArr = [1]
      userArr[0] = item.id
      getUserInfos(userArr).then(res => {
        const data = res
        data.forEach((item) => {
          item['type'] = 'user'
        })
        _this.check_user_data.push(data[0])
      }).catch((err) => {
        console.error(err)
      })
    },
    /**
     * 删除选中的审核员
     */
    delAppointUserData (item) {
      const _this = this
      _this.check_user_data.splice(
        _this.check_user_data.findIndex((data) => data === item),
        1
      )
    },
    /**
     * 删除所有选中的审核员
     */
    delAllUserData () {
      this.check_user_data = []
    },
    /**
     *确定提交按钮事件
     */
    confirm () {
      const _this = this
      _this.checkRepeatStrategyAutitor().then(res => {
        if (res) {
          _this.preSubmitData()
        }
      })
    },
    /**
     * 提交前置处理
     */
    preSubmitData () {
      const _this = this
      let auditorArr = []
      _this.check_user_data.forEach(user => {
        const auditorData = {
          user_id: user.id,
          user_name: user.name,
          user_dept_id: user.org_id,
          user_dept_name: user.orgName,
          user_code: user.account,
          parent_dep_paths: user.parent_dep_paths,
          org_type: user.type
        }
        auditorArr.push(auditorData)
      })
      let auditorList = [...auditorArr]
      const postData = {
        doc_id: null,
        doc_name: null,
        doc_type: null,
        auditor_list: auditorList
      }
      _this.$emit('output', postData)
    },
    /**
     * 新增策略校验审核员是否存在
     **/
    checkRepeatStrategyAutitor () {
      const _this = this
      let userIds = []
      const groupIds = []
      let warnMsgStr = ''
      _this.check_user_data.forEach(user => {
        if(user.type === 'user') {
          userIds.push(user.id)
        } else if(user.type === 'group') {
          groupIds.push(user.id)
        }
      })
      return new Promise(async (resolve) => {
        let errorType = ""
        if(userIds.length) {
          try {
            await getInfoByTypeAndIds('user', userIds)
          } catch (error) {
            if (error.response.data.code === 400019001) {
              const detail = JSON.parse(error.response.data.detail)
              _this.check_user_data.forEach(user => {
                if (detail.ids.indexOf(user.id) > -1) {
                  if (warnMsgStr === '') {
                    warnMsgStr = '“' + user.name + '”'
                  } else {
                    warnMsgStr += '、“' + user.name + '”'
                  }
                  errorType = "user"
                }
              })
            }
          }
        }
        // 用户组校验
        if(groupIds.length) {
          try {
            await getInfoByTypeAndIds('group', groupIds)
          } catch (error) {
            if (error.response.data.code === 400019003) {
              const detail = JSON.parse(error.response.data.detail)
              _this.check_user_data.forEach(user => {
                if (detail.ids.indexOf(user.id) > -1) {
                  if (warnMsgStr === '') {
                    warnMsgStr = '“' + user.name + '”'
                  } else {
                    warnMsgStr += '、“' + user.name + '”'
                  }
                  if(errorType === "user") {
                    errorType = "both"
                  }else{
                    errorType = "group"
                  }
                }
              })
            }
          }
        }
        if(warnMsgStr) {
          _this.$dialog_confirm_user_not_exist('', warnMsgStr, _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), false, errorType).then(() => {
            // _this.preSubmitData()
          }).catch(() => {})

          _this.msgVisible = true
          resolve(false)
        }else {
          resolve(true)
        }
      })
    },
    /**
     * 添加加载更多节点
     */
    addLoadMoreNode (res, arr, offset, limit, parentId) {
      const _this = this
      if (arr.length < res.users.total_count) {
        let nameLabel = '加载更多'
        if (_this.$i18n.locale === 'en-us') {
          nameLabel = 'Load More'
        } else if (_this.$i18n.locale === 'zh-tw') {
          nameLabel = '加載更多'
        }
        let obj = {
          nameLabel: nameLabel,
          type: 'loadMore',
          leaf: true,
          offset: offset,
          limit: limit,
          parent: parentId
        }
        arr.push(obj)
      }
    },
    /**
     * 获取用户数据结果集
     */
    getUserInfoList (depid) {
      return new Promise((resolve) => {
        getSubUsers({ depid: depid }).then((res) => {
          const users = res.userinfos
          resolve(users)
        }).catch(() => { })
      })
    },
    /**
     * 获取用户组数据结果集
     */
    getGroupUserInfoList (res) {
      let members = res.entries
      const users = []
      members.forEach((member) => {
        if (member.type === 'user') {
          users.push(member)
        }
      })
      return this.getCheckedFullDataByIds(users)
    },
    /**
     * 部门组织成员处理
     * @param res
     * @param resolve
     */
    dealMembersData (res, resolve, node, userInfoList) {
      const arr = []
      const departs = res.depinfos
      let parentId = ''
      if (node !== undefined) {
        parentId = node.data.id
      }
      if (!['', 'null', 'undefined'].includes(userInfoList + '')) {
        userInfoList.forEach((item) => {
          item['id'] = item.userid
          item['type'] = 'user'
          item['leaf'] = true
          item['parent'] = parentId
          item['nameLabel'] = item.name
          arr.push(item)
        })
      }
      departs.forEach((item) => {
        item['type'] = 'depart'
        item['leaf'] = false
        item['parent'] = parentId
        item['nameLabel'] = item.name
        item['id'] = item.depid
        arr.push(item)
      })
      if(arr.length === 0){
        this.emptyText = '暂无数据'
      }
      resolve(arr)
    },
    /**
     * 用户组成员处理
     * @param res
     * @param resolve
     */
    dealGroupMembersData (res, resolve, type, userInfoList) {
      const arr = []
      if (type === 1) {
        const groups = res.entries
        groups.forEach((item) => {
          item['type'] = 'group'
          item['leaf'] = false
          item['nameLabel'] = item.name
          arr.push(item)
        })
        if (groups.length === 0) {
          this.show_user_group_tree = false
        }
      } else {
        const groupMembers = res.entries
        groupMembers.forEach((item) => {
          if (item.type === 'department') {
            item['type'] = 'depart'
            item['leaf'] = false
            item['nameLabel'] = item.name
            arr.push(item)
          } else {
            item['type'] = 'user'
            item['leaf'] = true
            const userObj = userInfoList.filter(user => user.id === item.id)
            item['nameLabel'] = item.name
            item['account'] = userObj[0].account
            item['parent_dep_paths'] = userObj[0].parent_dep_paths
            arr.push(item)
          }
        })
      }
      resolve(arr)
    },
    /**
     * 根据用户id查询明细数据
     */
    getCheckedFullDataByIds (users) {
      const _this = this
      return new Promise(async (resolve, reject) => {
        if (!users.length) {
          return resolve([])
        }
        const userIdsArr = []
        const groupsArr = []
        users.forEach((item)=>{
          if(item.org_type==="group" || item.type==="group") {
            groupsArr.push(item)
          }else {
            userIdsArr.push(item.user_id || item.id)
          }
        })
        const order_list = []
        let errorFlag = false
        if(userIdsArr.length) {
          try {
            const res = await getUserInfos(userIdsArr)
          
            const data = res
            data.forEach((item) => {
              item['type'] = 'user'
              order_list[userIdsArr.indexOf(item.id)] = item
            })
          } catch (error) {
            errorFlag = error
          }
        }
        
        // 用户组
        if(groupsArr.length) {
          for(let i=0;i<groupsArr.length;i+=1) {
            try {
              order_list.push({
                type:"group",
                name:groupsArr[i].user_name,
                id:groupsArr[i].user_id,
                account:_this.$t('sync.group')
              })
            } catch (error) {
              errorFlag = error
            }
          }
        }
        
        if(errorFlag) {
          reject(errorFlag)
        }else {
          resolve(order_list.filter(res => res !== undefined))
        }
      })
    },
    /**
     * 用户组根节点滚动条
     */
    userGroupRootHandleScroll () {
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
     * 用户组根节点加载更多数据处理
     */
    rootGroupLoadMoreData () {
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
      }).catch(() => { })
    },
    /**
     * 关闭环节属性配置界面
     */
    closeProperties () {
      this.$emit('closeProperties')
    },
    closeWarnMsg () {
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
