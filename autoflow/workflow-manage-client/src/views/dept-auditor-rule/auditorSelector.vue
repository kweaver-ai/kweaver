<!-- 部门审核员规则配置界面，选择部门审核员 -->
<template>
  <div>
    <el-dialog
       :visible="visible"
       :close-on-click-modal="false"
       :append-to-body="false"
       :modal="false"
       @close="close"
       v-dialogDrag
       custom-class="new-dialog auditor-selector"
       :title="$t('deptAuditorRule.setDeptAuditor')"
       width="650px">
        <div>
          <div class="sers-2">
            <span class="clum" style="width: 120px">{{$t('deptAuditorRule.deptNameLabel')}}</span>
            <div style="text-align: left">
              <span v-title :title="auditObject.name">
                <el-tag type="info" style="max-width: 250px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;word-break: keep-all;">{{ auditObject.name }}</el-tag>
              </span>
            </div>
          </div>
          <div class="sers-2">
            <span class="clumTop" style="width:120px">{{$t('deptAuditorRule.deptAuditorLabel')}}</span>
            <el-radio style="margin-bottom:4px;" v-model="auditorSelectorType" label="zsbm" @change="reloadUserTree" v-if="showZsbbRadio">{{$t('deptAuditorRule.auditorSelectorType1')}}</el-radio>
            <el-radio style="margin-top:4px;" v-model="auditorSelectorType" label="zzjg" @change="reloadUserTree">{{$t('deptAuditorRule.auditorSelectorType2')}}</el-radio>
          </div>
          <div class="choose-table">
            <div class="cell cell-relative">
              <div v-loading="loading" class="choose-ul">
                <div class="head">
                  <div class="left">{{$t('strategy.chooseAuditorTips')}}：</div>
                </div>
                <div :class="isEmpth?'choose-ser-1 no-border-bottom choose-ser-2':'choose-ser-1 no-border-bottom '">
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
                     v-loadmore="handleScroll">
                      <template slot-scope="{ item }" style="height: 20px">
                          <span v-if="item.deppath != null" :title="item.name + '\n' + item.deppath">
                            <div>
                              <p class="tooltip-text-overflow">
                                <i class="icon iconfont icon-yonghu"></i>&nbsp;{{ item.name }}
                              </p>
                              <div class="tooltip-text-overflow">{{ item.deppath }}</div>
                            </div>
                          </span>
                        <span v-else>{{ item.name }}</span>
                     </template>
                  </el-autocomplete>
                </div>
                <el-tree
                   v-if="user_show_tree"
                   :props="default_props"
                   :element-loading-text="$t('modeler.loading')"
                   :default-expanded-keys="defaultShowNodes"
                   :highlight-current="true"
                    node-key="id"
                   :load="loadNodeUser"
                   lazy
                   name="userRootContent"
                   ref="userTree"
                   @node-click="handleNodeClickUser"
                   class="no-margin no-border-top"
                   style="height: 274px; overflow: auto">
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
                        <template v-for="(item, index) in check_user_data">
                          <li :key="index">
                            <span style="cursor: pointer" v-title :title="item.name + '-' + item.parent_dep_paths"  >
                              <span v-if="audit_model === 'zjsh'">{{index + 1}}{{$t('modeler.level')}} </span>{{ item.name }}
                            </span>
                            <i class="el-icon-close" style="padding-right: 8px" @click="delAppointUserData(item)"></i>
                          </li>
                        </template>
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
import { rootDepartment, getInfoByTypeAndIds, getUserInfos } from '@/api/user-management'
import { getRoots, getSubDeps, getSubUsers, searchUser } from '@/api/efast'
import vuedraggable from 'vuedraggable'
export default {
  name: 'auditorSelecter',
  components: { vuedraggable },
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      orgInfo: {},
      auditObject: {},
      auditorSelectorType: 'zsbm',
      visible: false,
      msgVisible: false,
      type: 'user',
      flag:false,
      loading: false,
      loadMoreLoading: false,
      isShowTooltip: true,
      isEmpth: true,
      autocompleteQuery: true,
      showZsbbRadio: true,
      defaultShowNodes:[],
      default_props: {
        // 配置选项
        children: 'children',
        label: 'nameLabel',
        isLeaf: 'leaf'
      },
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
      userIds: null,
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip')
    }
  },
  created () {
    this.audit_model = 'tjsh'
    this.initStepSelector()
    this.clearSearch()
  },
  methods: {
    // 加载用户树
    reloadUserTree () {
      this.user_show_tree = false
      this.$nextTick(() => {
        this.user_show_tree = true
      })
    },
    /**
       * 调用者调用此方法打开弹窗
       * @param _obj
       * @param checkedUsers
       */
    async openSelector (_obj, checkedUsers) {
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
          depid: _obj.orgId,
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
      this.check_user_data = this.dealUserData(checkedUsers)
      this.getCheckedFullDataByIds(this.userIds)
      this.visible = true
    },
    async initStepSelector () {
      this.search_value = ''
      this.rootDeptOffset = 0
      this.rootDeptLimit = 100
      this.check_user_data = []

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
        getRoots().then((res) => {
          if (_this.auditorSelectorType === 'zsbm') {
            let arr = []
            arr.push(_this.orgInfo)
            res.depinfos = arr
          }
          _this.dealMembersData(res, resolve)
          // 默认展开第一级菜单
          if(this.auditorSelectorType === 'zsbm'){
            _this.defaultShowNodes.push(res.depinfos[0].depid)
          }
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
       * 根据所选数据的类型（用户或组织），显示对应的图标
       * @param _obj
       * @param node
       */
    checkDataIcon (_obj, node) {
      const map = { user: 'icon-user', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj', all_user_doc_lib: 'icon-document' }
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
       * ==========================================用户组织树和文档库树条件搜索======================================
       * */
    /**
       * 用户搜索
       * @param queryString
       * @param cb
       */
    async querySearch (queryString, cb) {
      const _this = this
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
              _this.isEmpth = false
              cb([{ parent_dep_paths: [''], name: _this.serachEmpthInfo }])
            } else {
              _this.queryUserPage.restaurants = _this.queryUserPage ? _this.queryUserPage.restaurants.concat(res) : res
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
        searchUser(queryString, offset, limit).then((res) => {
          const usersArr = res.userinfos
          usersArr.forEach((item) => {
            item['type'] = 'user'
            item['id'] = item['userid']
          })
          resolve(usersArr)
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
      let _this = this
      if (item.name === this.serachEmpthInfo) {
        return
      }
      if (_this.check_user_data.length === 10) {
        _this.$toast('error', _this.$i18n.tc('strategy.addAuditorTips'))
        return
      }
      let _array = this.check_user_data.filter((data) => item.id === data.id)
      if (_array.length === 0) {
        _this.formatGroupUser(item)
      }
      _this.autocompleteQuery = false
    },
    /**
       * ==========================================用户组织树和文档库树操作======================================
       * */
    /**
       * 用户树节点点击事件
       * @param data
       * @param node
       */
    handleNodeClickUser (data, node) {
      const _this = this
      if (!data.leaf) {
        _this.flag = false
        return
      }else{
        _this.flag = true
      }
      if (data.type === userSelectorService.urlMap.type.USER) {
        let _array = _this.check_user_data.filter((item) => item.id === data.userid)
        if (_array.length === 0) {
          if (this.check_user_data.length === 10) {
            _this.$toast('error', _this.$i18n.tc('strategy.addAuditorTips'))
            return
          }
          this.formatGroupUser(data)
        }
      }
    },
    // 根据用户ID获取用户信息
    formatGroupUser (item) {
      let _this = this
      const userArr = [1]
      userArr[0] = item.id
      getUserInfos(userArr).then(res => {
        const data = res
        data.forEach((item) => {
          item['type'] = 'user'
        })
        _this.check_user_data.push(data[0])
      }).catch((e) => {
      })
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
        // 组装审核员
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
      _this.warnMsgList = []
      _this.check_user_data.forEach(user => {
        ids.push(user.id)
      })

      return new Promise((resolve) => {
        // 获取用户集合
        getInfoByTypeAndIds('user', ids).then(res => {
          resolve(true)
        }).catch((res) => {
          if (res.response.data.code === 400019001) {
            const detail = JSON.parse(res.response.data.detail)
            let delUserIdArr = []
            _this.check_user_data.forEach(user => {
              // 判断该用户是否被删除
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
            _this.$dialog_confirm_user_not_exist('', warnMsgStr, _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), false).then(() => {
              _this.preSubmitData()
            }).catch(() => {
            })
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
      const departs = res.depinfos
      let parentId = ''
      if (node !== undefined) {
        parentId = node.data.depid
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
        item['id'] = item.depid
        item['type'] = 'depart'
        item['leaf'] = false
        item['parent'] = parentId
        item['nameLabel'] = item.name
        arr.push(item)
      })
      resolve(arr)
    },
    dealUserData (checkedUsers) {
      let userArr = []
      this.userIds = ''
      checkedUsers.forEach(e => {
        let item = {}
        item['id'] = e.user_id
        item['userId'] = e.user_id
        item['account'] = e.user_code
        item['name'] = e.user_name
        userArr.push(item)
        this.userIds += e.user_id + ','
      })
      return userArr
    },
    /**
       * 获取用户数据结果集
       * @param res
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
       * 根据用户id查询明细数据
       * @param userIds
       */
    getCheckedFullDataByIds (_userIds) {
      // eslint-disable-next-line consistent-return
      return new Promise((resolve, reject) => {
        if (!_userIds) {
          return resolve([])
        }
        const userArr = _userIds.split(',')
        getUserInfos(userArr).then(res => {
          const order_list = []
          res.forEach((item) => {
            item['type'] = 'user'
            order_list[userArr.indexOf(item.id)] = item
          })
          this.check_user_data = order_list.filter(res=>  res !== undefined)
          resolve(order_list)
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
.sers-2 .el-tooltip {
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
</style>
