<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" :append-to-body="true" @close="cancel" custom-class="new-dialog">
    <div v-if="visible" class="choose-table">
      <div class="cell cell-relative">
        <div class="rzsj_search_bar absolute">
          <el-autocomplete size="mini" prefix-icon="el-icon-search" v-model="search_value" :fetch-suggestions="querySearch" :placeholder="$t('modeler.search')" :trigger-on-focus="false" @select="add">
            <template slot-scope="{ item }"> {{ item.name }}({{ item.direct_deps[0].name }}) </template>
          </el-autocomplete>
        </div>
        <el-tabs type="border-card" class="choose-ul" v-model="active_name" @tab-click="handleClick">
          <el-tab-pane :label="$t('modeler.member')" name="user"></el-tab-pane>
          <!-- <el-tab-pane label="组织" name="org"></el-tab-pane> -->
          <div v-loading="loading">
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
              <!--              <el-tooltip v-for="(item, index) in check_data" :key="item.id" class="item" effect="light" :content="`${item.name}`" placement="top">-->
              <li v-for="(item, index) in check_data" :key="item.id">
                <span v-if="deal_type === 'zjsh'" style="margin-right: 20px">{{ index + 1 }}{{ $t('modeler.level') }}</span>
                <span>
                  {{ item.name }}
                  <i class="el-icon-close" @click="delAppointData(item)"></i>
                </span>
              </li>
              <!--              </el-tooltip>-->
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
import userSelectorService from './selector-service';
import draggable from 'vuedraggable';
import { rootDepartment, members, userSearch, transfer } from '../../../api/user-management';
export default {
  name: 'bl-full-selector',
  components: {
    draggable,
  },
  props: {
    /**
     * 弹窗标题
     */
    title: {
      type: String,
      default: '',
    },
    /**
     * 是否多选 true false 默认false
     */
    multiple: {
      type: Boolean,
      default: false,
    },
    /**
     * 父节点id 用于筛选指定部门
     */
    org_id: {
      type: String,
      default: '',
    },
    /**
     * 根据公司ID过滤
     */
    company_id: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'user',
    },
    deal_type: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      loading: false,
      default_props: {
        // 配置选项
        children: 'children',
        label: 'name',
        isLeaf: 'leaf',
      },
      check_data: [], // 选择数据
      search_value: '', // 查找的value值
      is_show_tree: true, // 是否显示树
      visible: false,
      active_name: 'user',
    };
  },
  created() {},
  methods: {
    /**
     * 根据所选数据的类型（用户或组织），显示对应的图标
     */
    checkDataIcon(_obj, node) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj' };
      if (node.level === 1) {
        return map['top'];
      }
      return map[_obj.type];
    },
    /**
     * 调用者调用此方法打开弹窗
     */
    openSelector(userIds) {
      if (userIds) {
        this.getCheckedFullDataByIds(userIds);
      } else {
        this.check_data = [];
      }
      this.visible = true;
      this.active_name = 'user';
      this.handleClick({ name: this.active_name });
    },
    /**
     * 获取已选择的用户数据
     */
    getCheckedData() {
      return this.check_data;
    },
    /**
     * 用户或组织的tab切换点击事件
     */
    handleClick(tab) {
      if (this.type !== tab.name) {
        this.type = tab.name;
        this.is_show_tree = false;
        this.$nextTick(() => {
          this.is_show_tree = true;
        });
      }
    },
    /**
     * 树节点点击事件
     */
    handleNodeClick(data) {
      if (data.parentId === '0') {
        return;
      }
      if (
        (this.type === userSelectorService.urlMap.type.ORG && data.type === userSelectorService.urlMap.type.ORG) ||
        (this.type === userSelectorService.urlMap.type.USER && data.type === userSelectorService.urlMap.type.USER) ||
        this.type === userSelectorService.urlMap.type.ALL
      ) {
        if (!this.multiple) {
          this.check_data = [];
        }
        let _array = this.check_data.filter((item) => item.id === data.id);
        if (_array.length === 0) {
          this.check_data.push(data);
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
      );
    },
    /**
     *删除所有选中数据
     */
    delAllData() {
      this.check_data = [];
    },
    /**
     *确定提交按钮事件
     */
    confirm() {
      this.$emit('output', this.check_data);
      this.visible = false;
    },
    /**
     *取消事件
     */
    cancel() {
      this.visible = false;
    },
    /**
     * 搜索
     */
    async querySearch(queryString, cb) {
      queryString = queryString.trim();
      if (!queryString) {
        this.clean();
        cb([]);
        return;
      }
      let promise = null;
      if (this.type === userSelectorService.urlMap.type.ORG) {
        promise = this.searchOrg(queryString);
      } else if (this.type === userSelectorService.urlMap.type.USER) {
        promise = this.searchUser(queryString);
      } else if (this.type === userSelectorService.urlMap.type.ALL) {
        promise = this.searchAll(queryString);
      }
      if (promise !== null) {
        // 调用 callback 返回建议列表的数据
        promise.then((res) => cb(res));
      } else {
        cb([]);
      }
    },
    /**
     * 搜索用户
     */
    searchUser(queryString) {
      return new Promise((resolve) => {
        userSearch(queryString).then((res) => {
          const arr = res.entries;
          arr.forEach((item) => {
            item['type'] = 'user';
          });
          resolve(arr);
        });
      });
    },
    /**
     * 搜索组织
     */
    searchOrg(queryString) {
      return new Promise((resolve) => {
        userSelectorService.searchOrg(queryString, '').then((rs) => {
          resolve(rs);
        });
      });
    },
    /**
     *搜索组织和用户
     */
    searchAll(queryString) {
      return new Promise((resolve) => {
        userSelectorService.searchOrgAndUser(queryString, '').then((rs) => {
          resolve(rs);
        });
      });
    },
    /**
     * 清空
     */
    clean() {
      this.is_show_tree = true;
      this.search_value = '';
    },
    /**
     * 添加
     * @param item
     */
    add(item) {
      let _array = this.check_data.filter((data) => item.id === data.id);
      if (_array.length === 0) {
        if (!this.multiple) {
          this.check_data = [];
        }
        this.check_data.push(item);
      }
    },
    /**
     * 加载树节点
     * @param node
     * @param resolve
     * @returns {Promise<*>}
     */
    async loadNode(node, resolve) {
      if (node.level === 0) {
        rootDepartment().then((res) => {
          res.forEach((item) => {
            item['type'] = 'top';
            item['leaf'] = false;
          });
          resolve(res);
        });
      } else {
        members(node.data.id).then((res) => {
          const arr = [];
          const departs = res.depart_infos.entries;
          departs.forEach((item) => {
            item['type'] = 'depart';
            item['leaf'] = false;
            arr.push(item);
          });
          const users = res.user_infos.entries;
          users.forEach((item) => {
            item['type'] = 'user';
            item['leaf'] = true;
            arr.push(item);
          });
          console.log('arr', users);
          resolve(arr);
        });
      }
    },
    /**
     * 根据id查询数据
     */
    getCheckedFullDataByIds(userIds) {
      return new Promise((resolve) => {
        const type = 'user';
        const userArr = userIds.split(',');
        transfer(type, userArr).then((res) => {
          console.log('res-', res);
            const data = res;
            data.forEach((item) => {
              item['type'] = 'user';
            });
            this.check_data = data;
            resolve(data);
        });
      });
    },
  },
};
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
</style>
