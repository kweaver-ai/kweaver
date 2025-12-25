<template>
  <el-dialog :title="dialog_title"
             :close-on-click-modal="false"
             top="35px"
             :visible="visible"
             :append-to-body="false"
             :modal="false"
             custom-class="new-dialog"
             @close="cancel">
    <div class="choose-table">
      <div class="cell cell-relative">
        <div class="choose-ser">
          <el-autocomplete v-model="search_value"
                           style="width: 100%"
                           size="mini"
                           prefix-icon="el-icon-search"
                           :popper-append-to-body="false"
                           :fetch-suggestions="querySearch"
                           :placeholder="$t('modeler.search')"
                           :trigger-on-focus="false"
                           @select="add">
            <template slot-scope="{ item }">
              <span :title="item.value">{{ item.value }} </span>
            </template>
          </el-autocomplete>
        </div>
        <div v-loading="loading"
             class="choose-ul">
          <el-tree ref="currentNode"
                   :props="default_props"
                   :element-loading-text="$t('modeler.loading')"
                   :default-expand-all="false"
                   :expand-on-click-node="false"
                   :highlight-current="true"
                   node-key="id"
                   :load="loadNode"
                   lazy
                   style="height: 450px; overflow: auto"
                   name="treeContent"
                   @node-click="handleNodeClick">
            <span slot-scope="{ node, data }"
                  class="custom-tree-node">
              <span> <i :class="checkDataIcon(data, node)" /> {{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </div>
      <div class="cell no-border">
        <div class="choose-ul">
          <div class="head">
            <div class="left">{{ $t('modeler.selected') }}：</div>
            <div class="right">
              <!-- <a class="empty-btn" :class="check_data.length==0?'disable':''" @click="delAllData">{{ $t('modeler.common.clear') }}</a> -->
              <el-button v-if="check_data.length==0"
                         type="text"
                         disabled>{{ $t('modeler.common.clear') }}</el-button>
              <el-button v-else
                         type="text"
                         @click="delAllData">{{ $t('modeler.common.clear') }}</el-button>
            </div>
          </div>
          <ul style="height: 450px;margin-top: 8px">
            <template v-for="(item, index) in check_data">
              <li :key="index">
                <span :title="item.name">
                  {{ item.name }}
                  <i class="el-icon-close"
                     @click="delAppointData(item)" />
                </span>
              </li>
            </template>

          </ul>
        </div>
      </div>
    </div>
    <div class="gray padding-top-15" />
    <div slot="footer"
         class="dialog-footer">
      <div>
        <el-button type="primary"
                   style="min-width: 80px"
                   size="small"
                   :disabled="check_data.length === 0"
                   @click="confirm">{{ $t('button.confirm') }}</el-button>
        <el-button class="el-button-gray"
                   style="min-width: 80px"
                   size="small"
                   @click="cancel">{{ $t('button.cancel') }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>
<script>
import userSelectorService from './selector-service'
import { rootDepartment, members, userSearch, transfer } from '@/api/user-management'

export default {
  name: 'BlSelector',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    dialog_title: {
      type: String,
      default: ''
    },
    /**
     * 选择类型
     * user
     * org
     * all
     */
    type: {
      type: String,
      required: true
    },
    /**
     *是否多选 true false 默认false
     */
    multiple: {
      type: Boolean,
      required: false,
      default: false
    },
    /**
     * 对应数据库表中的orgType
     */
    org_type: {
      type: String,
      required: true
    },
    choose_data: {
      type: Array,
      required: false,
      default: () => {
        return []
      }
    },
    /**
     * 父节点id 用于筛选指定部门
     */
    org_id: {
      type: String,
      required: false,
      default: ''
    },
    /**
     * 父节点id 用于筛选指定部门
     */
    common_type: {
      type: String,
      required: false,
      default: ''
    },
    /**
     * 根据公司ID过滤
     */
    company_id: {
      type: String,
      required: false,
      default: ''
    },
    /**
     * 请求url
     */
    src: {
      type: String,
      required: false,
      default: ''
    },
    /**
     * 绑定单个数据
     */
    choose_model: {
      type: String,
      required: false,
      default: ''
    },
    selected_list: {
      type: String,
      required: false,
      default: ''
    },
    /**
     * 禁止数据重叠
     * 例1：选择了公司总部，再选择其底下的人员或组织，提示无法选择
     * 例2：选择了公司总部底下的人员或组织，再选择公司总部，提示无法选择
     */
    ban_overlap: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data () {
    return {
      loading: false,
      treeData: [], // 树节点数据
      default_props: {
        // 配置选项
        children: 'children',
        label: 'name',
        isLeaf: 'leaf'
      },
      rootNode: null,
      rootScrollLoad: true,
      rootDeptOffset: 0,
      rootDeptLimit: 100,
      check_data: [], // 选择数据
      search_value: '', // 查找的value值
      is_show_tree: true, // 是否显示树
      is_show_search: false, // 是否显示搜索列表
      search_data: [], // 查找的数据
      inputName: '', // 搜索框名字
      old_name: ''
    }
  },
  computed: {
    checkDataName () {
      return this.check_data[0] ? this.check_data[0].name : ''
    }
  },
  watch: {
    selected_list (val) {
      if (val) {
        this.getCheckedFullDataByIds(val)
      } else {
        this.check_data = []
      }
    }
  },
  created () {
    if (this.type === userSelectorService.urlMap.type.ORG) {
      this.inputName = userSelectorService.urlMap.inputName.ORGNAME
    } else if (this.type === userSelectorService.urlMap.type.USER) {
      this.inputName = userSelectorService.urlMap.inputName.USERNAME
    } else if (this.type === userSelectorService.urlMap.type.ALL) {
      this.inputName = userSelectorService.urlMap.inputName.ALL
    }
  },
  mounted () {
    this.check_data = this.choose_data
    // 在mounted钩子函数绑定滚动条事件
    this.$nextTick(() => {
      document.querySelector('div[name=treeContent]').addEventListener('scroll', this.rootDeptHandleScroll)
    })
  },
  methods: {
    /**
     * 根据所选数据的类型（用户或组织），显示对应的图标
     */
    checkDataIcon (_obj, node) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj' }
      if (node) {
        if (node.level === 1) {
          return map['top']
        }
      }
      return map[_obj.type]
    },
    /**
     * 节点点击事件
     */
    handleNodeClick (data) {
      // 校验数据重叠
      if (!this.checkDataOverlap(data)) {
        return
      }
      if (
        (this.type === userSelectorService.urlMap.type.ORG && data.type === userSelectorService.urlMap.type.ORG) ||
        (this.type === userSelectorService.urlMap.type.USER && data.type === userSelectorService.urlMap.type.USER) ||
        this.type === userSelectorService.urlMap.type.ALL
      ) {
        if (!this.multiple) {
          this.check_data = []
        }
        const _array = this.check_data.filter(item => item.id === data.id)
        if (_array.length === 0) {
          this.check_data.push(data)
        }
      }
    },
    /**
     * 校验数据重叠
     * @param data 当前点击的数据
     */
    checkDataOverlap (data) {
      if (!this.ban_overlap) {
        return true
      }
      // 选择顶级组织会导致校验数据重叠失败
      if (data.parentId === '0') {
        this.notifyError(`${this.$i18n.tc('selectorTip.topOrgTip')}`)
        return false
      }
      let flag = true
      for (let i = 0; i < this.check_data.length; i++) {
        const item = this.check_data[i]
        // 向上查找
        // 判断当前所选的人员组织，其上级组织有没有被选择
        if (item.type === 'org' && data.id !== item.id) {
          if (data.company_id === item.org_id || data.deptId === item.org_id || data.org_id === item.org_id) {
            this.notifyError(`${this.$i18n.tc('selectorTip.repeatTip')}`)
            flag = false
            break
          }
        }
        // 向下查找
        // 判断当前所选的组织，其底下的组织和人员有没有被选择
        if (data.type === 'org' && data.id !== item.id) {
          if (data.org_id === item.company_id || data.org_id === item.deptId || data.org_id === item.org_id) {
            this.notifyError(`${this.$i18n.tc('selectorTip.repeatTip')}`)
            flag = false
            break
          }
        }
      }
      return flag
    },
    /**
     * 删除指定数据
     */
    delAppointData (item) {
      this.check_data.splice(
        this.check_data.findIndex(data => data === item),
        1
      )
    },
    /**
     *删除所有选中数据
     */
    delAllData () {
      this.check_data = []
    },
    /**
     *确定提交按钮事件
     */
    confirm () {
      if (this.common_type !== '') {
        this.$emit('confirm', this.check_data)
      } else {
        this.$emit('confirm', this.check_data)
      }
      this.cancel()
    },
    /**
     *取消事件
     */
    cancel () {
      this.$emit('update:visible', false)
    },
    /**
     * 搜索
     */
    search () {
      this.search_value = this.search_value.trim()
      this.is_show_search = true
      this.is_show_tree = false
      this.loading = true
      if (this.type === userSelectorService.urlMap.type.ORG) {
        this.searchOrg()
      } else if (this.type === userSelectorService.urlMap.type.USER) {
        this.searchUser()
      } else if (this.type === userSelectorService.urlMap.type.ALL) {
        this.searchAll()
      }
    },
    /**
     * 搜索
     */
    querySearch (queryString, cb) {
      userSelectorService.searchOrg(queryString, '', '').then(rs => {
        let list = []
        for (let index = 0; index < rs.departments.entries.length; index++) {
          const element = rs.departments.entries[index]
          list.push({ value: element.name, id: element.id, name: element.name })
        }
        cb(list)
      }).catch(() => { })
    },
    /**
     * 搜索用户
     */
    searchUser (queryString) {
      return new Promise(resolve => {
        userSearch(queryString, 'user', 0, 50).then(res => {
          const arr = res.users.entries
          arr.forEach(item => {
            item['type'] = 'user'
          })
          resolve(arr)
        }).catch(() => { })
      })
    },
    /**
     * 搜索组织
     */
    searchOrg (queryString) {

    },
    /**
     *搜索组织和用户
     */
    searchAll (queryString) {
      return new Promise(resolve => {
        userSelectorService.serachOrgAndUser(queryString, '').then(rs => {
          resolve(rs)
        }).catch(() => { })
      })
    },
    /**
     * 清空
     */
    clean () {
      this.is_show_search = false
      this.is_show_tree = true
      this.search_value = ''
      this.search_data = []
    },
    /**
     * 添加
     * @param item
     */
    add (item) {
      // 校验数据重叠
      if (!this.checkDataOverlap(item)) {
        return
      }
      const _array = this.check_data.filter(data => item.id === data.id)
      if (_array.length === 0) {
        if (!this.multiple) {
          this.check_data = []
        }
        this.check_data.push(item)
      }
    },
    /**
     * 加载树节点
     * @param node
     * @param resolve
     * @returns {Promise<*>}
     */
    async loadNode (node, resolve) {
      const _this = this
      if (node.level === 0) {
        _this.rootNode = node
        rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit).then(res => {
          _this.dealMembersData(res, resolve)
        }).catch(() => { })
      } else {
        members(node.data.id, 0, 50).then(res => {
          _this.dealMembersData(res, resolve)
        }).catch(() => { })
      }
    },
    dealMembersData (res, resolve) {
      const arr = []
      const departs = res.departments.entries
      departs.forEach((item) => {
        item['type'] = 'depart'
        item['leaf'] = false
        arr.push(item)
      })
      resolve(arr)
    },
    /**
     * 根据id查询数据
     */
    getCheckedFullDataByIds (userIds) {
      return new Promise(resolve => {
        if (!userIds) {
          return resolve([])
        }
        transfer(userIds).then(res => {
          const data = res
          data.forEach(item => {
            item['type'] = 'user'
          })
          this.old_name = data[0] ? data[0].name : ''
          this.check_data = data
          resolve(data)
        }).catch(() => { })
      })
    },
    rootDeptHandleScroll () {
      const _this = this
      const scrollTop = document.querySelector('div[name=treeContent]').scrollTop
      const scrollHeight = document.querySelector('div[name=treeContent]').scrollHeight
      const clientHeight = document.querySelector('div[name=treeContent]').clientHeight
      if (scrollTop > (scrollHeight - clientHeight) * 0.7 ) {
        if (_this.rootScrollLoad) {
          _this.rootDeptLoadMoreData()
          _this.rootScrollLoad = false
        }
      }
    },
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
        departs.forEach((item) => {
          item['type'] = 'depart'
          item['leaf'] = false
          arrnew.push(item)
        })
        _this.rootNode.doCreateChildren(arrnew)
        _this.rootScrollLoad = true
      }).catch(() => { })
    }
  }
}
</script>
