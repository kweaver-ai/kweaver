<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" :append-to-body="false" :modal="false" @close="cancel" custom-class="new-dialog">
    <div v-if="visible" class="choose-table">
      <div class="cell cell-relative">
        <div class="rzsj_search_bar absolute">
          <el-autocomplete
            v-if="active_name === 'user'"
            size="mini"
            prefix-icon="el-icon-search"
            v-model="search_value"
            :popper-append-to-body="false"
            :fetch-suggestions="querySearch"
            :placeholder="$t('modeler.search')"
            :trigger-on-focus="false"
            @select="add"
          >
            <template slot-scope="{ item }">
              {{ item.name }}({{ item.parent_dep_paths[0] }})
            </template>
          </el-autocomplete>
          <el-autocomplete
            v-if="active_name === 'role'"
            size="mini"
            prefix-icon="el-icon-search"
            v-model="search_role_value"
            :popper-append-to-body="false"
            :fetch-suggestions="querySearchRole"
            :placeholder="$t('modeler.search')"
            :trigger-on-focus="false"
            @select="addRole"
          >
            <template slot-scope="{ item }">
              <span>{{ item.roleName }}</span>
            </template>
          </el-autocomplete>
        </div>
        <el-tabs type="border-card" class="choose-ul" v-model="active_name" @tab-click="handleClick">
          <el-tab-pane :label="$t('modeler.member')" name="user"></el-tab-pane>
          <el-tab-pane :label="$t('modeler.role')" name="role"></el-tab-pane>
          <!-- <el-tab-pane label="组织" name="org"></el-tab-pane> -->
          <div v-if="active_name === 'user'" v-loading="loading">
            <el-tree
              v-if="is_show_tree"
              :props="default_props"
              :element-loading-text="$t('modeler.loading')"
              :default-expand-all="false"
              :expand-on-click-node="false"
              :highlight-current="true"
              node-key="id"
              :load="loadNode"
              lazy
              ref="currentNode"
              @node-click="handleNodeClick"
              style="height: 450px; overflow: auto"
            >
              <span slot-scope="{ node, data }" class="custom-tree-node">
                <span> <i :class="checkDataIcon(data, node)" /> {{ node.label }}</span>
              </span>
            </el-tree>
          </div>
          <div v-if="active_name === 'role'" v-loading="loading">
            <ul style="height: 450px">
              <li v-for="(item, index) in role_data" style="cursor:pointer;padding: 5px 0 5px 15px" :key="index" @click="handleNodeClickRole(item)"><i class="el-icon-user-solid" />&nbsp;&nbsp;{{ item.roleName }}</li>
            </ul>
          </div>
        </el-tabs>
      </div>
      <div class="cell no-border">
        <div class="choose-ul">
          <div class="head">
            <div class="left">{{ $t('modeler.selected') }}({{ check_data.length }})</div>
            <div class="right">
              <a class="empty-btn" :class="check_data.length==0?'disable':''" @click="delAllData">{{ $t('modeler.common.clear') }}</a>
            </div>
          </div>
          <draggable v-model="check_data">
            <transition-group style="height: 450px" tag="ul">
              <el-tooltip v-for="(item, index) in check_data" :key="item.id" class="item" effect="light"
                :content="showTips(item)" placement="top">
                <li>
                  <span v-if="deal_type === 'zjsh'" style="margin-right: 20px">{{ index + 1 }}{{ $t('modeler.level') }}</span>
                  <span><i :class="[item.type === 'user' ? 'el-icon-user': 'el-icon-user-solid']"></i>
                    {{ item.name }}
                    <i class="el-icon-close" @click="delAppointData(item)"></i>
                  </span>
                </li>
              </el-tooltip>
            </transition-group>
          </draggable>
        </div>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" style="min-width: 80px" size="mini" @click="confirm">{{ $t('modeler.common.confirm') }}</el-button>
      <el-button class="el-button-gray" style="min-width: 80px" size="mini" @click="cancel">{{ $t('modeler.common.cancel') }}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import userSelectorService from './selector-service'
import draggable from 'vuedraggable'
import { members, rootDepartment, transfer, userSearch } from '@/api/user-management'

export default {
  name: 'bl-full-selector',
  components: {
    draggable
  },
  props: {
    /**
     * 弹窗标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 是否多选 true false 默认false
     */
    multiple: {
      type: Boolean,
      default: false
    },
    /**
     * 父节点id 用于筛选指定部门
     */
    org_id: {
      type: String,
      default: ''
    },
    /**
     * 根据公司ID过滤
     */
    company_id: {
      type: String,
      default: ''
    },
    // type: {
    //   type: String,
    //   default: 'user',
    // },
    deal_type: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      type: 'user',
      loading: false,
      default_props: {
        // 配置选项
        children: 'children',
        label: 'name',
        isLeaf: 'leaf'
      },
      check_data: [], // 选择数据
      search_value: '', // 查找的value值
      is_show_tree: true, // 是否显示树
      visible: false,
      active_name: 'user',
      search_role_value: '',
      role_data: []
    }
  },
  created() {},
  methods: {
    /**
     * 根据所选数据的类型（用户或组织），显示对应的图标
     */
    checkDataIcon(_obj, node) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj' }
      if (node.level === 1) {
        return map['top']
      }
      return map[_obj.type]
    },
    /**
     * 调用者调用此方法打开弹窗
     */
    async openSelector(userIds, roleIds) {
      this.check_data = []
      if (userIds) {
        const checkedData = await this.getCheckedFullDataByIds(userIds)
        checkedData.forEach(item => this.check_data.push(item))
      }
      if (roleIds) {
        const checkedData = await this.getCheckedRoleByIds(roleIds)
        checkedData.forEach(item => this.check_data.push(item))
      }
      this.visible = true
      this.active_name = 'user'
      this.handleClick({ name: this.active_name })
    },
    showTips(item) {
      if (item.type === 'user') {
        return `${item.name} - ${item.parent_dep_paths}`
      } else {
        return '角色：' + item.name
      }
    },
    /**
     * 获取已选择的用户数据
     */
    getCheckedData() {
      return this.check_data
    },
    /**
     * 用户或组织的tab切换点击事件
     */
    handleClick(tab) {
      if (this.type === tab.name) {
        return
      }
      this.loading = true
      this.type = tab.name
      if (this.type === 'role') {
        userSelectorService.listRole().then(res => {
          res.forEach(item => item['type'] = 'role')
          this.role_data = res
        }).catch(() => {})
      } else if (this.type === 'user') {
        this.is_show_tree = false
        this.$nextTick(() => {
          this.is_show_tree = true
        })
      }
      this.loading = false
    },
    /**
     * 树节点点击事件
     */
    async handleNodeClick(data) {
      if (data.parentId === '0') {
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
        let _array = this.check_data.filter((item) => item.id === data.id)
        if (_array.length === 0) {
          const userObj = await this.getCheckedFullDataByIds(data.id)
          this.check_data.push(...userObj)
        }
      }
    },
    /**
     * 删除指定数据
     */
    delAppointData(item) {
      this.check_data.splice(
        this.check_data.findIndex((data) => data === item),
        1
      )
    },
    /**
     *删除所有选中数据
     */
    delAllData() {
      this.check_data = []
    },
    /**
     *确定提交按钮事件
     */
    confirm() {
      this.$emit('output', this.check_data)
      this.visible = false
    },
    /**
     *取消事件
     */
    cancel() {
      this.visible = false
    },
    /**
     * 搜索
     */
    async querySearch(queryString, cb) {
      queryString = queryString.trim()
      if (!queryString) {
        this.clean()
        cb([])
        return
      }
      let promise = null
      if (this.type === userSelectorService.urlMap.type.ORG) {
        promise = this.searchOrg(queryString)
      } else if (this.type === userSelectorService.urlMap.type.USER) {
        promise = this.searchUser(queryString)
      } else if (this.type === userSelectorService.urlMap.type.ALL) {
        promise = this.searchAll(queryString)
      }
      if (promise !== null) {
        // 调用 callback 返回建议列表的数据
        promise.then((res) => cb(res)).catch(() => {})
      } else {
        cb([])
      }
    },
    /**
     * 搜索角色
     */
    async querySearchRole(queryString, cb) {
      queryString = queryString.trim()
      if (!queryString) {
        this.clean()
        cb([])
        return
      }
      let promise = this.searchRole(queryString)
      if (promise !== null) {
        // 调用 callback 返回建议列表的数据
        promise.then((res) => cb(res)).catch(() => {})
      } else {
        cb([])
      }
    },
    addRole(data) {
      const filter = this.check_data.filter(item => item.type === 'role' && item.id === data.roleId )
      if (filter.length === 0) {
        const addData = {
          id: data.roleId,
          name: data.roleName,
          type: 'role'
        }
        this.check_data.push(addData)
      }
    },
    handleNodeClickRole(item) {
      this.addRole(item)
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
     * 搜索组织
     */
    searchOrg(queryString) {
      return new Promise((resolve) => {
        userSelectorService.searchOrg(queryString, '').then((rs) => {
          resolve(rs)
        }).catch(() => {})
      })
    },
    /**
     * 搜索组织
     */
    searchRole(queryString) {
      return new Promise((resolve) => {
        userSelectorService.searchRole(queryString).then((rs) => {
          resolve(rs)
        }).catch(() => {})
      })
    },
    /**
     *搜索组织和用户
     */
    searchAll(queryString) {
      return new Promise((resolve) => {
        userSelectorService.searchOrgAndUser(queryString, '').then((rs) => {
          resolve(rs)
        }).catch(() => {})
      })
    },
    /**
     * 清空
     */
    clean() {
      this.is_show_tree = true
      this.search_value = ''
    },
    /**
     * 添加
     * @param item
     */
    add(item) {
      let _array = this.check_data.filter((data) => item.id === data.id)
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
    async loadNode(node, resolve) {
      const self = this
      if (node.level === 0) {
        rootDepartment(0, 100).then((res) => {
          self.dealMembersData(res, resolve)
        }).catch(() => {})
      } else {
        members(node.data.id).then((res) => {
          self.dealMembersData(res, resolve)
        }).catch(() => {})
      }
    },
    dealMembersData(res, resolve) {
      const arr = []
      const departs = res.departments.entries
      departs.forEach((item) => {
        item['type'] = 'depart'
        item['leaf'] = false
        arr.push(item)
      })
      const users = res.users.entries
      users.forEach((item) => {
        item['type'] = 'user'
        item['leaf'] = true
        arr.push(item)
      })
      resolve(arr)
    },
    /**
     * 根据id查询数据
     */
    getCheckedFullDataByIds(userIds) {
      return new Promise((resolve) => {
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
        }).catch(() => {})
      })
    },
    getCheckedRoleByIds(roleIds) {
      return new Promise((resolve) => {
        if (!roleIds) {
          return resolve([])
        }
        const roleArr = roleIds.split(',')
        userSelectorService.transferRole(roleIds).then((res) => {
          const order_list = []
          res.forEach(item => {
            order_list[roleArr.indexOf(item.roleId)] = {
              id: item.roleId,
              name: item.roleName,
              type: 'role'
            }
          })
          resolve(order_list)
        }).catch(() => {})
      })
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
