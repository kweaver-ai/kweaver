<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" :append-to-body="true" @close="close" custom-class="new-dialog">
    <div class="el-steps-2" v-if="!isUpdate">
      <el-steps :active="active_step" simple>
        <el-step :title="$t('modeler.selectorStepOne')" icon="el-icon-user"></el-step>
        <el-step :title="$t('modeler.selectorStepTwo')" icon="el-icon-monitor"></el-step>
      </el-steps>
    </div>
    <div v-if="visible && active_step === 0" class="choose-table">
      <div class="cell cell-relative">
        <div class="choose-ser">
          <el-autocomplete
            style="width: 100%"
            size="mini"
            prefix-icon="el-icon-search"
            v-model="search_value"
            :fetch-suggestions="querySearch"
            :placeholder="$t('modeler.search')"
            :trigger-on-focus="false"
            @select="addUser"
          >
            <template slot-scope="{ item }"> {{ item.name }}({{ item.direct_deps[0].name }}) </template>
          </el-autocomplete>
        </div>
        <div v-loading="loading" class="choose-ul">
          <el-tree
            :props="default_props"
            :element-loading-text="$t('modeler.loading')"
            :default-expand-all="false"
            :expand-on-click-node="false"
            :highlight-current="true"
            node-key="id"
            :load="loadNodeUser"
            lazy
            ref="currentNode"
            @node-click="handleNodeClickUser"
            style="height: 450px; overflow: auto"
          >
            <span class="custom-tree-node" slot-scope="{ node, data }">
              <span> <i :class="checkDataIcon(data, node)" /> {{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </div>
      <div class="cell no-border">
        <div class="choose-ul">
          <div class="head">
            <div class="left">
              <div class="left">{{ $t('modeler.selected') }}({{ check_user_data.length }})</div>
            </div>
            <div class="right">
              <a class="empty-btn" :class="check_user_data.length==0?'disable':''" @click="delAllUserData">{{ $t('modeler.common.clear') }}</a>
            </div>
          </div>
          <ul style="height: 450px">
            <!--            <el-tooltip v-for="(item, index) in check_user_data" :key="index" class="item" effect="light" :content="`${item.name}`" placement="top">-->
            <li v-for="(item, index) in check_user_data" :key="index">
              <span>
                {{ item.name }}
                <i class="el-icon-close" @click="delAppointUserData(item)"></i>
              </span>
            </li>
            <!--            </el-tooltip>-->
          </ul>
        </div>
      </div>
    </div>
    <div v-if="visible && active_step === 1" class="choose-table">
      <div class="cell cell-relative">
        <el-tabs type="border-card" class="choose-ul" style="height: 450px" v-model="active_name" @tab-click="handleClick">
          <el-tab-pane :label="$t('modeler.userDocLib')" name="user"></el-tab-pane>
          <el-tab-pane :label="$t('modeler.deptDocLib')" name="department"></el-tab-pane>
          <el-tab-pane :label="$t('modeler.customDocLib')" name="custom"></el-tab-pane>
          <div v-if="active_name === 'user'" class="choose-ul" v-loading="loading">
            <div class="choose-ser-1 no-border-bottom">
              <el-autocomplete
                style="width: 100%"
                size="mini"
                prefix-icon="el-icon-search"
                v-model="search_value_doc_lib"
                :fetch-suggestions="querySearch"
                :placeholder="$t('modeler.search')"
                :trigger-on-focus="false"
                @select="addUserDocLib"
              >
                <template slot-scope="{ item }"> {{ item.name }}({{ item.direct_deps[0].name }}) </template>
              </el-autocomplete>
            </div>
            <el-tree
              class="no-margin no-border-top"
              :props="default_props"
              :element-loading-text="$t('modeler.loading')"
              :default-expand-all="false"
              :expand-on-click-node="false"
              :highlight-current="true"
              node-key="id"
              :load="loadNodeUser"
              lazy
              ref="currentNode"
              @node-click="handleNodeClickUserDocLib"
              style="height: 407px; overflow: auto"
            >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <span> <i :class="checkDataIcon(data, node)" /> {{ node.label }}</span>
              </span>
            </el-tree>
          </div>
          <div v-else v-loading="loading">
            <div class="choose-ser-1 no-border-bottom">
              <el-autocomplete
                v-if="show_input_search"
                style="width: 100%"
                size="mini"
                prefix-icon="el-icon-search"
                v-model="search_doc_value"
                :fetch-suggestions="querySearchDocLib"
                :placeholder="$t('modeler.search')"
                :trigger-on-focus="false"
                @select="addDocLib"
              >
                <template slot-scope="{ item }">
                  <span>{{ item.name }}</span>
                </template>
              </el-autocomplete>
            </div>
            <ul class="no-border-top" style="height: 407px">
              <li v-for="(item, index) in doc_lib_data" :key="index" @click="handleNodeClickDocLib(item)"><i class="icon-document" />&nbsp;&nbsp;{{ item.name }}</li>
            </ul>
          </div>
        </el-tabs>
      </div>
      <div class="cell no-border">
        <div class="choose-ul">
          <div class="head">
            <span v-if="isUpdate">{{ choose_user_name }}&nbsp;{{ $t('field.auditScope') }}：</span>
            <span v-else>{{ $t('modeler.selected') }}({{ check_doc_lib_data.length }})</span>
            <div class="right">
              <a class="empty-btn" :class="check_doc_lib_data.length==0?'disable':''"  @click="delAllDocLibData">{{ $t('modeler.common.clear') }}</a>
            </div>
          </div>
          <ul style="height: 450px">
            <li v-for="(item, index) in check_doc_lib_data" :key="index">
              <span>
                {{ item.name }}
                <i class="el-icon-close" @click="delAppointDocLibData(item)"></i>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button v-if="active_step === 0" style="min-width: 80px" type="primary" size="mini" :disabled="check_user_data.length === 0" @click="toNextStep">{{ $t('modeler.common.nextStep') }}</el-button>
      <el-button v-if="active_step === 1 && !isUpdate" style="min-width: 80px" type="primary" size="mini" :disabled="choose_user_id !== ''" @click="toNextStep">{{ $t('modeler.common.preStep') }}</el-button>
      <el-button v-if="active_step === 1" style="min-width: 80px" size="mini" :disabled="check_doc_lib_data.length === 0" @click="confirm">{{ $t('modeler.complete') }}</el-button>
      <el-button size="mini" style="min-width: 80px" @click="close">{{ $t('modeler.common.cancel') }}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import userSelectorService from './selector-service';
import { getDocLibList } from '../../../api/doc-lib';
import { members, rootDepartment, userSearch, transfer } from '../../../api/user-management';

export default {
  name: 'bl-step-selector',
  props: {
    title: {
      type: String,
      default: '',
    },
    checkedUserIds: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      visible: false,
      type: 'user',
      loading: false,
      default_props: {
        // 配置选项
        children: 'children',
        label: 'name',
        isLeaf: 'leaf',
      },
      check_user_data: [], // 选择审核员数据
      check_doc_lib_data: [], // 选择审核范围数据
      search_value: '', // 查找的value值
      search_value_doc_lib: '', // 查找的value值
      search_doc_value: '', // 查找的value值
      show_input_search: true,
      is_show_tree: true, // 是否显示树
      active_name: 'user',
      active_step: 0,
      doc_lib_type: 'user',
      doc_lib_data: [],
      choose_user_id: '',
      choose_user_name: ''
    };
  },
  computed: {
    isUpdate() {
      return this.choose_user_id !== ''
    }
  },
  created() {},
  methods: {
    /**
     * 调用者调用此方法打开弹窗
     */
    openSelector(obj) {
      console.log('obj', obj);
      console.log('JSON.stringify(obj)', JSON.stringify(obj));
      // eslint-disable-next-line no-prototype-builtins
      if (obj && JSON.stringify(obj) !== '{}' && obj.hasOwnProperty('user_id') && obj.hasOwnProperty('doc_id') && obj.hasOwnProperty('doc_name')) {
        this.choose_user_id = obj.user_id;
        this.choose_user_name = obj.user_name;
        const docIds = obj.doc_id.split(',');
        const docNames = obj.doc_name.split(',');
        this.check_doc_lib_data = [];
        docIds.forEach((item, index) => {
          this.check_doc_lib_data.push({ id: item, name: docNames[index] });
        });
        this.getCheckedFullDataByIds(this.choose_user_id);
        this.toNextStep();
      } else {
        this.choose_user_id = '';
        this.check_user_data = [];
        this.check_doc_lib_data = [];
      }
      this.visible = true;
    },
    /**
     * 根据所选数据的类型（用户或组织），显示对应的图标
     */
    checkDataIcon(_obj, node) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj' };
      if (node) {
        if (node.level === 1) {
          return map['top'];
        }
      }
      return map[_obj.type];
    },
    auditScopeIcon(item) {
      const map = {
        user: 'icon iconfont icon-yonghu',
        top: 'icon iconfont icon-zuzhi3',
        depart: 'icon-wjj',
        department_doc_lib: 'icon-document',
        custom_doc_lib: 'icon-document',
      };
      return map[item.type];
    },
    /**
     * 文档库tab切换点击事件
     */
    handleClick(tab) {
      if (this.type !== tab.name) {
        this.type = tab.name;
        this.doc_lib_type = tab.name;
        this.show_input_search = false;
        this.search_doc_value = undefined;
        this.loadDocLibData();
        this.is_show_tree = false;
        this.$nextTick(() => {
          this.is_show_tree = true;
          this.show_input_search = true;
        });
      }
    },
    /**
     * 节点点击事件
     */
    handleNodeClickUser(data) {
      if (data.parentId === '0') {
        return;
      }
      if (data.type === userSelectorService.urlMap.type.USER) {
        let _array = this.check_user_data.filter((item) => item.id === data.id);
        if (_array.length === 0) {
          this.check_user_data.push(data);
        }
      }
    },
    /**
     * 节点点击事件
     */
    handleNodeClickUserDocLib(data) {
      console.log('handleNodeClickUserDocLib', data);
      let _array = this.check_doc_lib_data.filter((item) => item.id === data.id);
      if (_array.length === 0) {
        this.check_doc_lib_data.push(data);
      }
    },
    /**
     * 文档库节点点击事件
     */
    handleNodeClickDocLib(data) {
      const _array = this.check_doc_lib_data.filter((item) => item.id === data.id);
      if (_array.length === 0) {
        this.check_doc_lib_data.push(data);
      }
    },
    /**
     * 删除指定数据
     */
    delAppointUserData(item) {
      this.check_user_data.splice(
        this.check_user_data.findIndex((data) => data === item),
        1
      );
    },
    /**
     * 删除指定文档库数据
     */
    delAppointDocLibData(item) {
      this.check_doc_lib_data.splice(
        this.check_doc_lib_data.findIndex((data) => data === item),
        1
      );
    },
    /**
     * 删除所有选中审核员数据
     */
    delAllUserData() {
      this.check_user_data = [];
    },
    /**
     * 删除所有选中审核范围数据
     */
    delAllDocLibData() {
      this.check_doc_lib_data = [];
    },
    /**
     *确定提交按钮事件
     */
    confirm() {
      let doc_name = '';
      let doc_id = '';
      this.check_doc_lib_data.forEach((item) => {
        if (doc_name !== '') {
          doc_name += ',';
        }
        doc_name += item.name;
        if (doc_id !== '') {
          doc_id += ',';
        }
        doc_id += item.id;
      });
      const postDataArr = []
      this.check_user_data.forEach(user => {
        const postData = {
          user_id: user.id,
          user_name: user.name,
          user_dept_id: user.org_id,
          user_dept_name: user.orgName,
          doc_id: doc_id,
          doc_name: doc_name
        };
        postDataArr.push(postData)
      })
      this.$emit('output', postDataArr, this.isUpdate);
      this.close();
    },
    toNextStep() {
      if (this.active_step === 0) {
        if (this.judgeDuplicate()) {
          return
        }
        this.active_name = 'user';
        this.doc_lib_type = 'user';
        this.search_doc_value = undefined;
        this.loadDocLibData();
        this.active_step = 1;
      } else {
        this.active_step = 0;
      }
    },
    /**
     * 判断审核员是否重复选择
     **/
    judgeDuplicate() {
      const self = this
      let flag = false
      if (!this.isUpdate) {
        self.check_user_data.forEach(user => {
          const find = self.checkedUserIds.find((item) => item === user.id);
          if (find !== undefined) {
            self.$message.warning(`${self.$i18n.tc('message.user')}“${user.name}”${self.$i18n.tc('message.listExists')}`);
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
      this.active_step = 0;
      this.visible = false;
    },
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
    async querySearchDocLib(queryString, cb) {
      queryString = queryString.trim();
      if (!queryString) {
        this.clean();
        cb([]);
        return;
      }
      getDocLibList(this.doc_lib_type, { keyword: queryString, field: 'doc_lib_name' }).then((res) => {
        cb(res.entries);
      });
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
        userSelectorService.serachOrg(queryString, '').then((rs) => {
          resolve(rs);
        });
      });
    },
    /**
     *搜索组织和用户
     */
    searchAll(queryString) {
      return new Promise((resolve) => {
        userSelectorService.serachOrgAndUser(queryString, '').then((rs) => {
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
     * 添加审核员
     *
     * @param item
     */
    addUser(item) {
      let _array = this.check_user_data.filter((data) => item.id === data.id);
      if (_array.length === 0) {
        this.check_user_data.push(item);
      }
    },
    /**
     * 添加个人文档库
     *
     * @param item
     */
    addUserDocLib(item) {
      console.log('addUserDocLib', item);
      let _array = this.check_doc_lib_data.filter((data) => item.id === data.id);
      if (_array.length === 0) {
        this.check_doc_lib_data.push(item);
      }
    },
    /**
     * 添加文档库
     *
     * @param item
     */
    addDocLib(item) {
      let _array = this.check_doc_lib_data.filter((data) => item.id === data.id);
      if (_array.length === 0) {
        this.check_doc_lib_data.push(item);
      }
    },
    /**
     * 加载树节点
     * @param node
     * @param resolve
     * @returns {Promise<*>}
     */
    async loadNodeUser(node, resolve) {
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
     * 加载文档库数据
     */
    loadDocLibData() {
      const self = this;
      self.doc_lib_data = [];
      getDocLibList(this.doc_lib_type, {}).then((res) => {
        self.doc_lib_data = res.entries;
      });
    },
    /**
     * 根据id查询数据
     */
    getCheckedFullDataByIds(userIds) {
      return new Promise((resolve) => {
        const type = 'user';
        const userArr = userIds.split(',');
        transfer(type, userArr).then((res) => {
          const data = res;
          data.forEach((item) => {
            item['type'] = 'user';
          });
          this.check_user_data = data;
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
