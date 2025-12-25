<!-- 部门审核员规则配置界面，选择部门审核员 -->
<template>
  <div>
    <el-dialog
      :title="$t('deptAuditorRule.setDeptAuditorTitle')"
      :visible="visible"
      :close-on-click-modal="false"
      :append-to-body="true"
      @close="close"
      v-dialogDrag
      custom-class="new-dialog auditor-selector"
      width="650px"
    >
      <div>
        <div class="sers-2">
          <span class="clum" style="width: 120px;text-align: left">{{$t('deptAuditorRule.deptNameLabel')}}</span>
          <div style="text-align: left">
            <el-tooltip :content="auditObject.name" effect="light" placement="top">
              <el-tag type="info" style="max-width: 250px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;word-break: keep-all;">{{auditObject.name}}</el-tag>
            </el-tooltip>
          </div>
        </div>
        <div class="sers-2" style="text-align: left">
          <span class="clum" style="width: 120px;text-align: left">{{$t('deptAuditorRule.deptAuditorLabel')}}</span>
          <el-radio v-model="auditorSelectorType" label="zsbm" @change="reloadUserTree" v-if="showZsbbRadio">{{$t('deptAuditorRule.auditorSelectorType1')}}</el-radio>
          <el-radio v-model="auditorSelectorType" label="zzjg" @change="reloadUserTree">{{$t('deptAuditorRule.auditorSelectorType2')}}</el-radio>
        </div>
        <div class="choose-table">
          <div class="cell cell-relative">
            <div v-loading="loading"  class="choose-ul">
              <div class="head">
                <div class="left">{{$t('strategy.chooseAuditorTips')}}：</div>
              </div>
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
                  :placeholder="$t('modeler.searchUser')"
                  :trigger-on-focus="false"
                  :hideLoading="true"
                  @clear="clearSearch"
                  @select="addUser"
                  @input="clearSearch"
                  v-loadmore="handleScroll">
                  <template slot-scope="{ item }">
                    <span v-if="item.parent_dep_paths[0] !== ''">
                      <el-tooltip class="item" effect="light" placement="top" :open-delay="1000">
                        <div slot="content">
                          <div>{{ item.name }}</div>
                          <div>{{ item.parent_dep_paths[0] }}</div>
                        </div>
                        <div>
                          <p style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;"><i class="icon iconfont icon-yonghu"></i>
                            {{ item.name }}
                          </p>
                          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">{{ item.parent_dep_paths[0] }}</div>
                        </div>
                      </el-tooltip>
                    </span>
                    <span v-else>&nbsp;{{ item.name }}</span>
                  </template>
                </el-autocomplete>
              </div>
              <el-tree
                v-if="user_show_tree"
                :props="default_props"
                element-loading-text=""
                :default-expanded-keys="defaultShowNodes"
                :default-expand-all="false"
                :highlight-current="true"
                node-key="id"
                :load="loadNodeUser"
                lazy
                name="userRootContent"
                ref="userTree"
                @node-click="handleNodeClickUser"
                class="no-margin no-border-top"
                style="height: 274px; overflow: auto">
                <span class="custom-tree-node" slot-scope="{ node, data }">
                  <template v-if="data.type === 'loadMore'">
                    <div style="padding-left: 20px;color:#40a9ff;" class="loadMoreLoading" v-loading="loadMoreLoading">
                      <span>{{ node.label }} <i class="el-icon-d-arrow-right"  style="transform: rotate(90deg);-ms-transform: rotate(90deg);-moz-transform: rotate(90deg);-webkit-transform: rotate(90deg);-o-transform: rotate(90deg);"></i></span>
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
                      placement="top"
                    >
                      <li style="text-align: left">
                        <span style="cursor: pointer">
                          <span v-if="audit_model === 'zjsh'">{{index + 1}}{{$t('modeler.level')}} </span>
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
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button style="min-width: 80px" type="primary" size="mini" @click="confirm">{{ $t('button.confirm') }}</el-button>
        <el-button size="mini" style="min-width: 80px" @click="close">{{ $t('modeler.common.cancel') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import userSelectorService from './selector-service'
import { members, rootDepartment, getUserInfos, userSearch, getInfoByTypeAndIds } from '@/api/user-management'
import vuedraggable from 'vuedraggable'
export default {
  name: 'auditorSelecter',
  components: { vuedraggable },
  data () {
    return {
      orgInfo: {},
      auditObject: {},
      defaultShowNodes:[],
      auditorSelectorType: 'zsbm',
      visible: false,
      msgVisible: false,
      type: 'user',
      loading: false,
      loadMoreLoading: false,
      autocompleteQuery: true,
      showZsbbRadio: true,
      // 配置选项
      default_props: {
        children: 'children',
        label: 'nameLabel',
        isLeaf: 'leaf'
      },
      //
      queryUserPage: {
        restaurants: [],
        offset: 0,
        limit: 50
      },
      check_user_data: [], // 选择审核员数据
      search_value: '', // 查找的value值
      search_value_doc_lib: '', // 查找的value值
      user_show_tree: true, // 是否显示树
      rootScrollLoad: true, // 根节点滚动加载标识
      rootNode: null, // 根节点对象
      rootDeptOffset: 0, // 根节点offset
      rootDeptLimit: 100, // 根节点limit
      timeouter: null,
      warnMsgList: [],
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip')// 未查找到数据提示
    }
  },
  created () {
    this.audit_model = 'tjsh'
    this.initStepSelector()
  },
  methods: {
    reloadUserTree () {
      this.user_show_tree = false
      this.$nextTick(() => {
        this.user_show_tree = true
      })
    },
    /**
     * 调用者调用此方法打开弹窗
     * @param _obj
     * @param checkedUserIds
     */
    async openSelector (_obj, _checkedUserIds) {
      if (typeof this.$refs.autocomplete !== 'undefined') {
        this.$refs.autocomplete.suggestions = []
      }
      this.showZsbbRadio = true
      this.auditorSelectorType = 'zsbm'
      if(_obj.isUser){
        if(_obj.orgId === null){
          this.auditorSelectorType = 'zzjg'
          this.showZsbbRadio = false
        }
        this.orgInfo = {
          id: _obj.orgId,
          name: _obj.orgName
        }
        this.auditObject = {
          id: _obj.id,
          name: _obj.name,
          isUser: _obj.isUser
        }
      } else {
        this.orgInfo = _obj
        this.auditObject = _obj
      }
      this.search_value = null
      this.reloadUserTree()
      this.initStepSelector()
      this.check_user_data = await this.getCheckedFullDataByIds(_checkedUserIds.join(','))
      this.visible = true
    },
    initStepSelector () {
      this.search_value = ''
      this.rootDeptOffset = 0
      this.rootDeptLimit = 100
      this.checkedNodesUserDocLibData = []
      this.check_user_data = []
      this.clearSearch()
    },
    /**
     * 关闭弹窗事件
     */
    close () {
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
    async loadNodeUser (node, resolve) {
      const _this = this
      if (node.level === 0) {
        if(_this.auditorSelectorType !== 'zsbm') {
          _this.defaultShowNodes = []
        }
        _this.rootNode = node
        rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit).then((res) => {
          if (_this.auditorSelectorType === 'zsbm') {
            let arr = []
            arr.push(_this.orgInfo)
            res.departments.entries = arr
          }
          _this.dealMembersData(res, resolve)
          // 默认展开第一级菜单
          if(this.auditorSelectorType === 'zsbm'){
            _this.defaultShowNodes.push(res.departments.entries[0].id)
          }
        }).catch(() => { })
      } else {
        members(node.data.id, 0, 100).then((res) => {
          _this.getUserInfoList(res).then((data) => {
            _this.dealMembersData(res, resolve, node, data)
          })
        }).catch(() => { })
      }
    },
    /**
     * 根据所选数据的类型（用户或组织），显示对应的图标
     * @param _obj
     * @param node
     */
    checkDataIcon (_obj, node) {
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
    userRootHandleScroll () {
      const _this = this
      const scrollTop = document.querySelector('div[name=userRootContent]').scrollTop
      const scrollHeight = document.querySelector('div[name=userRootContent]').scrollHeight
      const clientHeight = document.querySelector('div[name=userRootContent]').clientHeight
      if (scrollHeight - clientHeight === scrollTop) {
        if (_this.rootScrollLoad) {
          _this.rootDeptLoadMoreData()
          _this.rootScrollLoad = false
        }
      }
    },
    /**
     * 根节点加载更多数据处理
     */
    rootDeptLoadMoreData () {
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
      }).catch(() => { })
    },
    /**
     * 添加加载更多节点
     * @param res
     * @param arr
     * @param offset
     * @param limit
     * @param parentId
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
     * 加载更多处理
     * @param data
     * @param node
     */
    dealLoadMoreData (data, node) {
      let _this = this
      let arrnew = node.parent.childNodes.map(item => {
        return Object.assign({}, item.data)
      })
      let offset = data.offset
      if (offset === 0) {
        offset = data.limit
      } else {
        offset += data.limit
      }
      arrnew.splice(arrnew.findIndex(d => d.type === data.type), 1)
      _this.loadMoreLoading = true
      members(node.parent.data.id, offset, data.limit).then((res) => {
        _this.getUserInfoList(res).then((userInfoList) => {
          const users = res.users.entries
          let parentId = ''
          if (node !== undefined) {
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
            if (data.parent === e.id) {
              _this.$refs.userLibTree.setChecked(data.parent, true, true)
            }
          })
        }).catch(() => { })
      }).catch(() => { })
    },
    /**
     * ==========================================用户组织树和文档库树条件搜索======================================
     * */
    /**
     * 用户搜索
     * @param queryString
     * @param cb
     */
    async querySearch (queryString, cb) {
      const _this = this
      // 搜索值是否为空
      if (['', 'null', 'undefined'].includes(queryString + '') || !_this.autocompleteQuery) {
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
      if (_this.timeouter) {
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
              cb([{ parent_dep_paths: [''], name: _this.serachEmpthInfo }])
            } else {
              _this.queryUserPage.restaurants = _this.queryUserPage.restaurants.concat(res)
              cb(_this.queryUserPage.restaurants)
            }
          }).catch(() => { })
        } else {
          cb([])
        }
      }, 800)
    },
    /**
     * 搜索滚动条
     */
    handleScroll () {
      let _this = this
      let search_value = _this.search_value
      _this.$refs.autocomplete.getData(search_value)
      _this.queryUserPage.offset += _this.queryUserPage.limit
    },
    /**
     * 清空搜索框
     */
    clearSearch () {
      this.autocompleteQuery = true
      this.queryUserPage.offset = 0
      this.queryUserPage.limit = 50
      this.queryUserPage.restaurants = []
      if (this.$refs.autocomplete !== undefined) {
        this.$refs.autocomplete.handleFocus()
      }
    },
    /**
     * 搜索用户
     * @param queryString
     * @param offset
     * @param limit
     */
    searchUser (queryString, offset, limit) {
      return new Promise((resolve) => {
        userSearch(queryString, 'user', offset, limit).then((res) => {
          const arr = res.users.entries
          arr.forEach((item) => {
            item['type'] = 'user'
          })
          resolve(arr)
        }).catch(() => { })
      })
    },
    /**
     * 搜索组织
     * @param queryString
     */
    searchOrg (queryString) {
      return new Promise((resolve) => {
        userSelectorService.serachOrg(queryString, '').then((rs) => {
          resolve(rs)
        }).catch(() => { })
      })
    },
    /**
     * 搜索组织和用户
     * @param queryString
     */
    searchAll (queryString) {
      return new Promise((resolve) => {
        userSelectorService.serachOrgAndUser(queryString, '').then((rs) => {
          resolve(rs)
        }).catch(() => { })
      })
    },
    /**
     * 清空
     */
    clean () {
      this.search_value = ''
    },
    /**
     * 搜索集合添加审核员
     * @param item
     */
    addUser (item) {
      if (item.name === this.serachEmpthInfo) {
        return
      }
      if (this.check_user_data.length === 10) {
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
     * ==========================================用户组织树和文档库树操作======================================
     * */
    /**
     * 用户树节点点击事件
     * @param data
     * @param node
     */
    async handleNodeClickUser (data, node) {
      const _this = this
      if (data.parentId === '0') {
        return
      }
      if (data.type === 'loadMore') {
        this.dealLoadMoreData(data, node)
        return
      }
      if (data.type === userSelectorService.urlMap.type.USER) {
        let _array = _this.check_user_data.filter((item) => item.id === data.id)
        if (_array.length === 0) {
          const userObj = await _this.getCheckedFullDataByIds(data.id)
          if (this.check_user_data.length === 10) {
            _this.$message.success(_this.$i18n.tc('strategy.addAuditorTips'))
            return
          }
          _this.check_user_data.push(...userObj)
        }
      }
    },
    /**
     * 删除指定审核员数据
     * @param item
     */
    delAppointUserData (item) {
      this.check_user_data.splice(
        this.check_user_data.findIndex((data) => data === item),
        1
      )
    },
    /**
     * 删除第一步：所有选中审核员数据
     */
    delAllUserData () {
      this.check_user_data = []
    },
    /**
     * ==========================================确认提交配置======================================
     * */
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
      let _this = this
      let auditorArr = []
      let auditorNames = ''
      _this.check_user_data.forEach(user => {
        const auditorData = {
          user_id: user.id,
          user_name: user.name,
          org_id: _this.auditObject.id,
          org_name: _this.auditObject.name,
          remark: _this.auditObject.isUser ? 'isUser' : null,
          user_code: user.account,
          parent_dep_paths: user.parent_dep_paths
        }
        if (auditorNames !== '') {
          auditorNames += '、' + auditorData.user_name + '（' + auditorData.user_code + '）'
        } else {
          auditorNames = auditorData.user_name + '（' + auditorData.user_code + '）'
        }
        auditorArr.push(auditorData)
      })
      _this.submitData(auditorArr, auditorNames)
      _this.close()
    },
    /**
     * 提交数据进行入库
     * @param auditorArr
     * @param auditorNames
     **/
    submitData (auditorArr, auditorNames) {
      let _this = this
      const postData = {
        auditorNames: auditorNames,
        auditorList: auditorArr
      }
      _this.$emit('output', postData, _this.auditObject)
    },
    /**
     * 新增策略校验审核员是否存在
     **/
    checkRepeatStrategyAutitor () {
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
          if (res.response.data.code === 400019001) {
            const detail = JSON.parse(res.response.data.detail)
            let delUserIdArr = []
            _this.check_user_data.forEach(user => {
              if (detail.ids.indexOf(user.id) > -1) {
                if (warnMsgStr === '') {
                  warnMsgStr = '“' + user.name + '”'
                } else {
                  warnMsgStr += '、“' + user.name + '”'
                }
                delUserIdArr.push(user.id)
              }
            })
            // 移除已配置的审核员
            delUserIdArr.forEach(userId => {
              _this.check_user_data.splice(
                _this.check_user_data.findIndex((data) => userId === data.id),
                1
              )
            })
            const h = this.$createElement
            _this.$confirm('', {
              message: h('div', null, [
                h('p', { style: 'font-weight:bolder' }, _this.$i18n.tc('field.tip')),
                h('p', { style: 'word-break:break-all;' }, _this.$i18n.tc('sync.userHasTip1') + warnMsgStr + _this.$i18n.tc('sync.userHasTip2'))
              ]),
              confirmButtonText: _this.$i18n.tc('button.confirm'),
              cancelButtonText: _this.$i18n.tc('button.cancel'),
              showCancelButton: false,
              iconClass: 'warning-blue',
              type: 'warning'
            }).then(() => {
              _this.preSubmitData()
            }).catch(() => { })
            _this.msgVisible = true
            resolve(false)
          }
        })
      })
    },
    /**
     * 用户成员数据处理
     * @param res
     * @param resolve
     * @param node
     * @param userInfoList
     */
    dealMembersData (res, resolve, node, userInfoList) {
      let arr = []
      const departs = res.departments.entries
      let parentId = ''
      if (node !== undefined) {
        parentId = node.data.id
      }
      const users = res.users.entries
      let userIds = ''
      users.forEach((user) => {
        if (userIds === '') {
          userIds = user.id
        } else {
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

      departs.forEach((item) => {
        item['type'] = 'depart'
        item['leaf'] = false
        item['parent'] = parentId
        item['nameLabel'] = item.name
        arr.push(item)
      })

      this.addLoadMoreNode(res, arr, 0, 100, parentId)
      resolve(arr)
    },
    /**
     * 获取用户数据结果集
     * @param res
     */
    getUserInfoList (res) {
      let users = res.users.entries
      let userIds = ''
      users.forEach((user) => {
        if (userIds === '') {
          userIds = user.id
        } else {
          userIds += ',' + user.id
        }
      })
      return this.getCheckedFullDataByIds(userIds)
    },
    /**
     * 根据用户id查询明细数据
     * @param userIds
     */
    getCheckedFullDataByIds (userIds) {
      // eslint-disable-next-line consistent-return
      return new Promise((resolve, reject) => {
        if (!userIds) {
          return resolve([])
        }
        const userArr = userIds.split(',')
        getUserInfos(userArr).then(res => {
          const order_list = []
          res.forEach((item) => {
            item['type'] = 'user'
            order_list[userArr.indexOf(item.id)] = item
          })

          resolve(order_list.filter(res=>  res !== undefined))
        }).catch((e) => {
          reject(e)
        })
      })
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
.sers-2 .el-tooltip.el-tag {
  position: inherit;
}
.tag-boxs {
  height: 100px;
  overflow: auto;
  padding: 5px;
}
.tag-boxs .el-tag {
  margin: 2px;
}
.el-tree-node__content > label.el-checkbox {
  margin: 0px 10px 20px 15px !important;
}
.el-dialog {
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.auditor-selector .el-dialog .el-dialog__body {
  flex: 1;
  overflow: auto;
}
</style>
