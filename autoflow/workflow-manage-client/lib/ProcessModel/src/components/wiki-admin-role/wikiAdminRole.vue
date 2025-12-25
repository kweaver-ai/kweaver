<template>
  <div class="role-selector">
    <div class="label">{{ $t('strategy.selectRole') }}</div>
    <el-select
      v-model="selectedRole"
      :placeholder="$t('strategy.selectRole')"
      style="width: 50%"
      @change="handleRoleChange"
      filterable
      remote
      :remote-method="remoteMethod"
      :loading="loading"
      @visible-change="handleVisibleChange"
      :popper-append-to-body="false"
      clearable
    >
      <el-option 
        v-for="role in roleList" 
        :key="role.id"
        :label="role.title"
        :value="role.snow_id"
      >
      {{ role.title }}
      </el-option>
    </el-select>
    <div class="hint-text">
      {{ $t('strategy.goTo') }}<a @click="goToKnowledgeManagement">{{ $t('strategy.knowledgeManagement') }}</a> {{ $t('strategy.setKnowledgeManagementRole') }}
    </div>
  </div>
</template>

<script>
import { getUserRoleTitleList } from '@/api/leaderRoleAuditorStrategy'

export default {
  name: 'RoleSelector',
  props: {
    isEdit: {
      required: true,
      type: Boolean
    },
    approver_config: {
      required: true,
      type: Object
    },
    doc_audit_strategy_data: {
      required: true,
      type: Array
    },
  },
  data() {
    return {
      loading: false,
      search: '',
      roleData: {
        page_info: {
          page: 1,
          size: 50,
          total: 0
        },
        roles: []
      },
      selectedRole: undefined,
      auditorList: [],
    }
  },
  created() {
    this.fetchRoleList()
    this.initSelectedRole(this.approver_config, this.doc_audit_strategy_data)
  },
  computed: {
    microWidgetPropsVal () {
      return this.$store.state.app.microWidgetProps
    },
    roleList() {
      return this.roleData.roles
    },
    pageInfo() {
      return this.roleData.page_info
    }
  },
  watch: {
    roleList: {
      handler(newRoleList) {
        // 当roleList更新且selectedRole已有值时，确保显示正确的title 
        if (this.selectedRole && newRoleList.length > 0) {
          const selectedRoleObj = newRoleList.find(role => role.snow_id === this.selectedRole);
          if (selectedRoleObj) {
            // 强制更新一次选中值，触发el-select的重新渲染
            const currentValue = this.selectedRole;
            this.selectedRole = null;
            this.$nextTick(() => {
              this.selectedRole = currentValue;
            });
          } else { 
            this.selectedRole = null
          }
          this.$emit('change', selectedRoleObj || null)
        }
      },
      immediate: true
    },
    isEdit: {
      handler(newVal) {
        if (newVal) {
          this.initSelectedRole()
        }
      }
    }
  },
  methods: {
    async fetchRoleList({isMore = false, page = 1, search = ''} = {}) {
      try {
        const _this = this
        const response = await getUserRoleTitleList({page , size: 50, kw: search})
        if (isMore) {
          const uniqueRoles = [...new Map([..._this.roleData.roles, ...response.data.roles].map(role => [role.snow_id,role])).values()]
          _this.roleData.roles = uniqueRoles
        } else {
          _this.roleData = response.data
          if (_this.auditorList.length > 0) {
            const uniqueRoles = [...new Map([..._this.auditorList, ...response.data.roles].map(role => [role.snow_id,role])).values()]
            _this.roleData.roles = uniqueRoles
          }
        }
        if(!_this.selectedRole && !this.isEdit && !search) {
          _this.selectedRole = response.data.roles[0].snow_id
          _this.$emit('change', response.data.roles[0])
        }
      } catch (error) {
        console.error('获取角色列表失败:', error)
      }
    },
    initSelectedRole(_config, strategyList) {
      const _this = this
      strategyList.forEach(strategy => {
        if (strategy.act_def_id === _config.nodeId && strategy.strategy_type === 'kc_admin') {
          _this.selectedRole = strategy.auditor_list[0]?.user_id || ''
          _this.auditorList = [{
            snow_id: strategy.auditor_list[0]?.user_id,
            title: strategy.auditor_list[0]?.user_name
          }]
          _this.handleRoleChange(_this.selectedRole, 'edit')
        }
      })
    },
    handleRoleChange(selectedOption, type = '') {
      let selectedRole;
      const _this = this
      _this.search = '';
      if (selectedOption) {
        selectedRole = _this.roleList.find(role => role.snow_id === selectedOption)
      }
      if (type === 'edit' && !selectedRole && _this.auditorList.length > 0) {
        _this.roleData.roles.push(_this.auditorList[0])
        selectedRole = _this.auditorList[0]
      }
      _this.$emit('change', selectedRole)
    },
    handleVisibleChange(visible) {
      if (visible) {
       setTimeout(() => {
         const dropdown = document.querySelector('.role-selector .el-select-dropdown.el-popper');
         const scrollWrap = dropdown?.querySelector('.el-select-dropdown__wrap');
          if (scrollWrap) {
            this.scrollHandler = () => {
              const { scrollTop, clientHeight, scrollHeight } = scrollWrap;
              if (scrollHeight - scrollTop - clientHeight < 50 && !this.loading) {
                this.handlePopupScroll();
              }
            };
            
            scrollWrap.removeEventListener('scroll', this.scrollHandler);
            dropdown.removeEventListener('scroll', this.scrollHandler);

            scrollWrap.addEventListener('scroll', this.scrollHandler, { capture: true, passive: true });
            dropdown.addEventListener('scroll', this.scrollHandler, { capture: true, passive: true });
          }
        }, 100);
      } else {
        // 移除事件监听
        const dropdown = document.querySelector('.role-selector .el-select-dropdown.el-popper');
        const scrollWrap = dropdown?.querySelector('.el-select-dropdown__wrap');
        if (scrollWrap && this.scrollHandler) {
          scrollWrap.removeEventListener('scroll', this.scrollHandler);
          dropdown?.removeEventListener('scroll', this.scrollHandler);
        }
      }
    },
    handleScroll(event) {
      const { scrollTop, clientHeight, scrollHeight } = event.target
      if (scrollHeight - scrollTop - clientHeight < 50) {
        this.handlePopupScroll();
      }
    },
    handlePopupScroll() {
      const _this = this
      if (_this.pageInfo.page * _this.pageInfo.size >= _this.pageInfo.total) {
        return
      }
      _this.pageInfo.page += 1
      _this.fetchRoleList({isMore: true, page: _this.pageInfo.page, search: this.search})
    },
    remoteMethod(query) {
      this.search = query
      this.fetchRoleList({search: query})
    },
    goToKnowledgeManagement() {
      const _this = this
      _this.microWidgetPropsVal?.history.navigateToMicroWidget({
        command: 'knowledge-center',
        path: '/manage?curtab=manager',
        isNewTab: true,
        isClose: false,
      })
    }
  }
}
</script>

<style scoped>
.role-selector {
  width: 100%;
}
.label {
  white-space: nowrap;
  display: inline-block;
  margin-right: 10px;
}

.el-select {
  display: inline-block;
}

.hint-text {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
}
.hint-text a {
  color: #1890ff;
  cursor: pointer;
}
.hint-text a:hover {
  text-decoration: underline;
}
</style>