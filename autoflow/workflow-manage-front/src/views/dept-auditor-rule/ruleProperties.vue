<!-- 部门审核员规则配置界面 -->
<template>
  <div class="basicProperties no-border-bottom">
    <div class="no-border">
      <div class="card-body">
        <el-form
          ref="rulePropertiesForm"
          :model="form"
          label-position="left"
          hide-requied-aterisk
          label-width="0px"
          size="small"
          :rules="rules">
          <el-form-item prop="rule_name" class="ruleNameTips">
            <label class="font-bold" style="width: 75px;">
              {{ $t('deptAuditorRule.ruleName') }}：<span class="red">* </span>
            </label>
            <el-input
              v-model="form.rule_name"
              style="width: 300px;"
              @input="restValidateName"
              @change="dealFormName"
              :placeholder="$t('deptAuditorRule.ruleNamePlaceholder')"></el-input>
          </el-form-item>
            <el-row >
              <el-col :span="6" class="align-left rule-btn align-center">
                <label class="font-bold">{{ $t('deptAuditorRule.setDeptAuditor') }}：</label>
                <el-link :underline="false" type="text" size="mini" @click="clearAllDeptSet" :disabled="deptAuditorSetResult.length === 0">
                  <span :style="{ color: deptAuditorSetResult.length === 0 ? '#aaa' : '#3461EC',}">{{ $t('button.reset') }}</span>
                </el-link>
              </el-col>
              <el-col :span="18" class="align-right">
                <MultiChoice ref="multiChoice" v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')"/>
              </el-col>
            </el-row>
            <div style="margin-top: 5px;" v-loading="tableDataLoading">
              <el-table
                :data="deptTableData"
                style="width: 100%;"
                :height="tableHeight"
                v-if="showTable"
                ref="multipleTable"
                tooltip-effect="light"
                row-key="id"
                class="table-ellip  table-dept"
                lazy
                :load="load"
                :cell-class-name="tableRowClassName"
                :tree-props="{
                  children: 'children',
                  hasChildren: 'hasChildren',
                }"
              >
                <el-table-column :label="$t('deptAuditorRule.deptName')" prop="name" show-overflow-tooltip :minWidth="colWidth">
                  <template slot-scope="scope">
                    <span style="padding: 0;"><i :class="checkDataIcon(scope.row, scope)" style="margin-right: 10px"/>{{ scope.row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="auditorNames" class="table-dept" min-width="276">
                  <template slot="header" slot-scope="scope">
                    <div>{{ $t('deptAuditorRule.deptAuditor') }}</div>
                  </template>
                  <template slot-scope="scope">
                    <el-popover
                      placement="bottom-start"
                      :title="auditorNamesPopover ? $t('strategy.table.auditor') : ''"
                      width="200"
                      trigger="click"
                    >
                      <div class="popo-list" v-if="auditorNamesPopover">
                        <ul>
                          <template v-for="(item, index) in getAuditorNameList(scope.row,)">
                            <el-tooltip :key="index" class="item" effect="light" placement="top-start">
                              <div slot="content">{{ item }}</div>
                              <li class="tooltip-text-overflow">{{ item }}</li>
                            </el-tooltip>
                          </template>
                        </ul>
                      </div>
                      <span
                        slot="reference"
                        onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'"
                        onmouseleave="this.style.color='',this.style.opacity=''"
                      >
                        <el-tooltip placement="top-start" effect="light" :offset="0" :visible-arrow="false" :content="getAuditorNames(scope.row)">
                          <span class="tooltip-text-overflow" @click="auditorNamesPopover = true">
                            {{ getAuditorNames(scope.row) }}
                          </span>
                        </el-tooltip>
                      </span>
                    </el-popover>
                    <span>
                        <el-button type="text" v-if="getAuditorNameList(scope.row).length === 0" @click="openDeptSet(scope.row)" >{{ $t('button.set') }}</el-button>
                        <el-button style="margin-left: 10px" type="text" v-if="getAuditorNameList(scope.row).length > 0" :title="$t('button.edit')" @click="openDeptSet(scope.row)" >
                          <svg-icon iconClass="edit" className="list-ops-icon" />
                        </el-button>
                        <el-button
                          type="text"
                          v-if="getAuditorNameList(scope.row).length > 0"
                          :title="$t('button.clear')"
                          :disabled="getAuditorNameList(scope.row).length <= 0"
                          :class="getAuditorNameList(scope.row).length > 0 ? '' : 'gray'
                          " @click="clearDeptSet(scope.row)">
                          <svg-icon iconClass="delete" className="list-ops-icon" />
                        </el-button>
                      </span>
                  </template>
                </el-table-column>
                <div slot="empty" class="empty-box">
                  <div v-if="searchParams.deptnames.length !== 0 || searchParams.auditors.length !== 0">
                    <div class="no-seach"></div>
                    <p class="text">{{ $t('message.noSeachTableTips') }}</p>
                  </div>
                  <div v-else>
                    <div class="empty-text"></div>
                    <p class="text">{{ $t('message.noDataTableTips') }}</p>
                  </div>
                </div>
              </el-table>
            </div>
          <div class="foot_button btn-box1">
            <el-button type="primary" size="mini" @click="confirm" style="width: 80px;" :disabled="form.rule_name === ''">
              {{ $t('button.confirm') }}
            </el-button>
            <el-button size="mini" @click="close" style="width: 80px;">
              {{ $t('button.cancel') }}
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
    <auditor-selector ref="auditorSelect" @output="auditorSelectCall"></auditor-selector>
  </div>
</template>

<script>
import { members, rootDepartment, userSearch, deptAuditorSearch, getInfoByTypeAndIds, usrmGetUserInfo } from '@/api/user-management'
import MultiChoice from '@/components/MultiChoice'
import auditorSelector from './auditorSelector'
import { tenantId } from '@/utils/config'
import { getDeptAuditorRule, getDeptAuditorRulePage, saveDeptAuditorRule } from '@/api/deptAuditorRule.js'
export default {
  name: 'ruleProperties',
  components: { MultiChoice, auditorSelector },
  props: {
    ruleId: {
      type: String,
      default: ''
    }
  },
  data () {
    const multic_hoice_types = [
      { label: this.$i18n.tc('deptAuditorRule.deptName'), value: 'deptnames' },
      { label: this.$i18n.tc('deptAuditorRule.deptAuditor'), value: 'auditors' }
    ]
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)) {
        callback(
          new Error(
            this.$i18n.tc('modeler.ruleIllegalCharacterPrefix') +
            ' \\ / : * ? < > | "' +
            this.$i18n.tc('modeler.illegalCharacterSuffix'),
          ),
        )
      } else if (value.length > 128) {
        callback(new Error(this.$i18n.tc('modeler.ruleNameLengthErrorBack')))
      } else if (this.nameExistenceErr) {
        callback(new Error(this.$i18n.tc('deptAuditorRule.nameHasTips')))
      } else {
        callback()
      }
    }
    return {
      multic_hoice_types,
      form: {
        rule_id: '',
        rule_name: ''
      },
      id: null,
      colWidth: 276,
      maxRowIndex: 11,
      old_rule_name: '',
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip'),
      serachTimeouter: null,
      showTable: true,
      queryObject: {},
      deptAuditorSetResult: [],
      deptTableData: [],
      tableHeight: 600,
      rootDeptOffset: 0,
      rootDeptLimit: 100,
      rootScrollLoad: true,
      showHandelBtn: false,
      tableDataLoading: false,
      auditorNamesPopover: false,
      nameExistenceErr: false,
      operateType: '',
      multiChoiceSearch: [],
      searchParams:{
        deptnames: [],
        auditors: []
      },
      rules: {
        rule_name: [
          {
            required: true,
            message: this.$i18n.tc('modeler.isNotNull'),
            trigger: 'change'
          },
          { required: true, trigger: 'change', validator: validateName }
        ]
      }
    }
  },
  watch: {
    multiChoiceSearch: {
      deep: true,
      handler(val) {
        Object.keys(this.searchParams).forEach(item => {
          this.searchParams[item] = []
        })
        val.forEach(el => {
          this.searchParams[el.type].push(el.val)
        })
        this.searchMultiChoiceDept()
      }
    }
  },
  created () {
    this.rootDeptLoad()
    // 绑定滚动条事件
    this.$nextTick(() => {
      setTimeout(() => {
        this.$refs.multipleTable.bodyWrapper.addEventListener(
          'scroll',
          this.userRootHandleScroll,
        )
      }, 1000)
    })
    this.initForm(this.ruleId)
  },
  mounted () {
    this.$nextTick(function () {
      let _this = this
      _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 80
      window.onresize = function () {
        _this.tableHeight = _this.$refs.multipleTable ? window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 80 : _this.tableHeight
      }
    })
  },
  methods: {
    /**
     * 初始化参数
     * */
    initForm (_ruleId) {
      const _this = this
      if (_ruleId === '') {
        _this.form.rule_id = ''
        _this.form.rule_name = ''
        _this.deptAuditorSetResult = []
      } else {
        _this.form.rule_id = _ruleId
        getDeptAuditorRule(_ruleId)
          .then((res) => {
            _this.deptAuditorSetResult = res.dept_auditor_rule_list
            _this.form.rule_name = res.rule_name
            _this.old_rule_name = res.rule_name
          })
          .catch((error) => { })
      }
    },
    getAuditorNames (_obj) {
      let auditorNames = ''
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id) {
          auditorNames = e.auditor_names
        }
      })
      return auditorNames
    },
    openDeptSet (_obj) {
      let checkedUserIds = []
      this.deptAuditorSetResult.forEach((item) => {
        if (item.org_id === _obj.id) {
          item.auditor_list.forEach((e) => {
            checkedUserIds.push(e.user_id)
          })
        }
      })
      if(_obj.orgId === null){
        // 处理搜索审核对象为用户时，查询用户详情赋值用户的直属部门信息
        usrmGetUserInfo(_obj.id).then((res) => {
          if(res.user){
            _obj.orgId = res.user.departmentIds[0]
            _obj.orgName = res.user.departmentNames[0]
          }
          this.$refs['auditorSelect'].openSelector(_obj, checkedUserIds)
        })
      } else {
        this.$refs['auditorSelect'].openSelector(_obj, checkedUserIds)
      }
    },
    clearDeptSet (_obj) {
      const _this = this
      _this.deptAuditorSetResult.splice(
        _this.deptAuditorSetResult.findIndex((data) => _obj.id === data.org_id),
        1,
      )
      this.$message({
        showClose: false,
        message: _this.$i18n.tc('modeler.common.clearTip'),
        type: 'success'
      })
    },
    clearAllDeptSet () {
      const _this = this
      _this
        .$confirm(_this.$i18n.tc('deptAuditorRule.deleteDeptAuditorTip'), '', {
          confirmButtonText: _this.$i18n.tc('button.confirm'),
          cancelButtonText: _this.$i18n.tc('button.cancel'),
          iconClass: 'warning-blue',
          type: 'warning'
        })
        .then(() => {
          _this.deptAuditorSetResult = []
        })
        .catch(() => { })
    },
    auditorSelectCall (_obj, auditObject) {
      const _this = this
      const item = {
        org_id: auditObject.id,
        org_name: auditObject.name,
        auditor_list: _obj.auditorList,
        auditor_names: _obj.auditorNames
      }
      let _array = _this.deptAuditorSetResult.filter(
        (data) => item.org_id === data.org_id,
      )
      if (_array.length === 0) {
        _this.deptAuditorSetResult.push(item)
      } else {
        _this.deptAuditorSetResult.splice(
          _this.deptAuditorSetResult.findIndex(
            (data) => item.org_id === data.org_id,
          ),
          1,
        )
        _this.deptAuditorSetResult.push(item)
      }
      this.$message({
        showClose: false,
        message: _this.$i18n.tc('modeler.common.editTip'),
        type: 'success'
      })

    },
    /**
       * 分解获取审核员列表
       * @param auditorNames
       */
    getAuditorNameList (_obj) {
      let auditorNameArr = []
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id) {
          auditorNameArr = e.auditor_names.split('、').filter(res=>  res !== '' )
        }
      })
      return auditorNameArr
    },
    /**
       * 用户根节点滚动条
       */
    userRootHandleScroll () {
      const _this = this
      const scrollTop = this.$refs.multipleTable.bodyWrapper.scrollTop
      const scrollHeight = this.$refs.multipleTable.bodyWrapper.scrollHeight
      const clientHeight = this.$refs.multipleTable.bodyWrapper.clientHeight
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
      rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit)
        .then((res) => {
          const arrnew = []
          res.departments.entries.forEach((item) => {
            item['type'] = 'depart'
            item['hasChildren'] = true
            item['parent'] = 0
            item['name'] = item.name
            item['isUser'] = false
            arrnew.push(item)
          })
          _this.deptTableData = [..._this.deptTableData, ...arrnew]
          _this.rootScrollLoad = true
        })
        .catch(() => { })
    },
    rootDeptLoad () {
      const _this = this
      rootDepartment(_this.rootDeptOffset, _this.rootDeptLimit)
        .then((res) => {
          const arrnew = []
          res.departments.entries.forEach((item) => {
            item['type'] = 'depart'
            item['hasChildren'] = true
            item['parent'] = 0
            item['name'] = item.name
            item['isUser'] = false
            arrnew.push(item)
          })
          _this.deptTableData = arrnew
        })
        .catch(() => { })
    },
    async load (data, node, resolve) {
      const _this = this
      members(data.id, 0, 100)
        .then((res) => {
          const arrnew = []
          res.users.entries.forEach((item) => {
            item['type'] = 'depart'
            item['hasChildren'] = false
            item['parent'] = data.id
            item['name'] = item.name
            item['isUser'] = true
            item['orgId'] = data.id
            item['orgName'] = data.name
            arrnew.push(item)
          })
          res.departments.entries.forEach((item) => {
            item['type'] = 'depart'
            item['hasChildren'] = true
            item['parent'] = data.id
            item['name'] = item.name
            item['isUser'] = false
            arrnew.push(item)
          })
          resolve(arrnew)
          if (_this.maxRowIndex > 11) {
            _this.colWidth += 25
          }
        })
        .catch(() => { })
    },
    /**
     * 根据所选数据的类型，显示对应的图标
     */
    checkDataIcon (_obj, index) {
      const map = { user: 'icon iconfont icon-yonghu', top: 'icon iconfont icon-zuzhi3', depart: 'icon-wjj', group: 'icon-yhz' }
      if (_obj.isUser) {
        return map['user']
      } else if(_obj.parent === 0){
        return map['top']
      } else {
        return map['depart']
      }
    },
    tableRowClassName ({ row, column, rowIndex, columnIndex }) {
      if (this.maxRowIndex < rowIndex) {
        this.maxRowIndex = rowIndex
      }
    },
    confirm () {
      const _this = this
      let _arrary = _this.deptAuditorSetResult
      const data = {
        rule_id: _this.ruleId,
        rule_name: _this.form.rule_name,
        tenant_id: tenantId,
        template: 'Y',
        dept_auditor_rule_list: _arrary
      }

      _this.$refs['rulePropertiesForm'].validate((valid) => {
        if (valid) {
          _this.checkNameExistence().then((res) => {
            if (res) {
              _this.nameExistenceErr = true
              _this.$refs.rulePropertiesForm.validateField('rule_name')
              return
            }
            _this.checkExistence().then((res) => {
              if (!res) {
                _this.$confirm(_this.$i18n.tc('deptAuditorRule.editErrTips'), '', {
                  confirmButtonText: _this.$i18n.tc('button.confirm'),
                  cancelButtonText: _this.$i18n.tc('button.cancel'),
                  showCancelButton: false,
                  iconClass: 'warning-blue',
                  type: 'warning'
                }).then(() => {
                  _this.$emit('close',true)
                }).catch(() => { })
                return
              }
              this.checkAuditorExistence(data)
            })
          })
        }
      })
    },
    /**
     * 校验审核员是否存在
     */
    checkAuditorExistence(data){
      const  _this = this
      let warnMsgStr = ''
      let userIds = this.jointUserId()
      getInfoByTypeAndIds('user', userIds).then(res => {
        saveDeptAuditorRule(data).then((res) => {
          _this.$emit('close',data.rule_id !== '')
        }).catch(() => {
        })
      }).catch((res) => {
        if (res.response.data.code === 400019001) {
          const detail = JSON.parse(res.response.data.detail)
          let delUserIdArr = []
          _this.deptAuditorSetResult.forEach(result=> {
            result.auditor_list.forEach(auditor =>{
              if (detail.ids.indexOf(auditor.user_id) > -1) {
                if(delUserIdArr.filter(userId => auditor.user_id === userId).length === 0) {
                  if (warnMsgStr === '') {
                    warnMsgStr = '“' + auditor.user_name + '”'
                  } else {
                    warnMsgStr += '、“' + auditor.user_name + '”'
                  }
                }
                delUserIdArr.push(auditor.user_id)
              }
            })
          })
          // 移除已配置的审核员
          delUserIdArr.forEach(userId => {
            _this.deptAuditorSetResult.forEach(result=> {
              let index = result.auditor_list.findIndex((data) => userId === data.user_id)
              if(index !== -1){
                result.auditor_list.splice(index,1)
              }
            })
          })
          data.dept_auditor_rule_list = _this.deptAuditorSetResult
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
            saveDeptAuditorRule(data).then((res) => {
              _this.$emit('close')
            }).catch(() => {
            })
          }).catch(() => { })
        }
      })
    },
    /**
     * 拼接审核员ID
     */
    jointUserId(){
      let userIds = []
      for(let i = 0 ; i < this.deptAuditorSetResult.length ; i++){
        let auditor_list = this.deptAuditorSetResult[i].auditor_list
        for(let k = 0 ; k < auditor_list.length; k++){
          userIds.push(auditor_list[k].user_id)
        }
      }
      return userIds
    },
    /**
       * 校验规则名称是否存在
       */
    checkNameExistence () {
      const _this = this
      return new Promise((resolve) => {
        if (_this.rule_id !== '' && _this.form.rule_name === _this.old_rule_name) {
          resolve(false)
          return
        }
        const ruleName = this.form.rule_name.indexOf(' ') !== -1 ? '' : this.form.rule_name
        getDeptAuditorRulePage({ name: ruleName })
          .then((res) => {
            if (res !== null && res !== '') {
              res.entries.forEach((e) => {
                if (e.rule_name === this.form.rule_name) {
                  resolve(true)
                  return
                }
              })
              resolve(false)
            }
          })
          .catch(() => { })
      })
    },
    checkExistence () {
      const _this = this
      return new Promise((resolve) => {
        if (_this.ruleId !== '') {
          getDeptAuditorRulePage({ id: _this.ruleId }).then(response => {
            if (response.total_count > 0) {
              resolve(true)
            } else {
              resolve(false)
            }
          }).catch(() => { })
        } else {
          resolve(true)
        }
      })
    },
    restValidateName () {
      this.nameExistenceErr = false
      this.$refs.rulePropertiesForm.validateField('rule_name')
    },
    /**
     * 搜索用户和部门信息
     */
    searchMultiChoiceDept () {
      const _this = this
      let deptTableData = []
      if(_this.searchParams.deptnames.length === 0 && _this.searchParams.auditors.length === 0){
        _this.clearSearch()
        return
      }

      _this.departmentAllSearch(deptTableData).then((res) => {
        if(_this.searchParams.auditors.length > 0 ){
          _this.deptAuditorSearch(_this.searchParams.auditors).then((res) => {
            if(_this.searchParams.deptnames.length > 0){
              let filterDeptTableData = []
              res.forEach(e => {
                const arr = deptTableData.filter(item => item.id === e.org_id)
                if(arr.length > 0){
                  filterDeptTableData.push({ id: e.org_id, name: e.org_name, type: 'depart' })
                }
              })
              deptTableData = filterDeptTableData
            } else {
              res.forEach(e => {
                deptTableData.push({ id: e.org_id, name: e.org_name, type: 'depart' })
              })
            }
            _this.deptTableData = deptTableData
            _this.reloadTable()
          }).catch(() => { })
        } else {
          _this.deptTableData = deptTableData
        }
      })
    },
    deptAuditorSearch(auditors){
      const _this = this
      return new Promise((resolve) => {
        let resultArr = []
        if(_this.deptAuditorSetResult.length === 0){
          _this.deptTableData = resultArr
        }
        _this.deptAuditorSetResult.forEach(item => {
          auditors.forEach(keyword => {
            if(item.auditor_names.indexOf(keyword) !== -1){
              resultArr.push(item)
            }
          })

          resolve(resultArr)

        })
      })
    },
    departmentAllSearch(deptTableData){
      const _this = this
      let promiseAll = []
      _this.searchParams.deptnames.forEach(dept => {
        promiseAll.push(_this.departmentSearch(dept, deptTableData))
        promiseAll.push(_this.departmentSearchByUser(dept, deptTableData))
      })
      return Promise.all(promiseAll)
    },
    departmentSearch(dept, deptTableData){
      return new Promise((resolve) => {
        userSearch(dept, 'department', 0, 1000).then((res) => {
          const deptArr = res.departments.entries
          deptArr.forEach(e => {
            if(deptTableData.filter( (item) => item.id === e.id).length === 0){
              deptTableData.push({ id: e.id, name: e.name, type: 'depart', isUser: false })
            }
          })
          resolve(deptTableData)
        }).catch(() => { })
      })
    },
    departmentSearchByUser(dept, deptTableData){
      return new Promise((resolve) => {
        userSearch(dept, 'user', 0, 1000).then((res) => {
          const userArr = res.users.entries
          userArr.forEach(e => {
            if(deptTableData.filter( (item) => item.id === e.id).length === 0){
              deptTableData.push({ id: e.id, name: e.name, type: 'depart', isUser: true, orgId : null, orgName : null})
            }
          })
          resolve(deptTableData)
        }).catch(() => { })
      })
    },
    /**
       * 清空搜索框
       */
    clearSearch () {
      const _this = this
      _this.rootDeptOffset = 0
      _this.rootDeptLimit = 100
      _this.rootDeptLoad()

    },
    reloadTable(){
      this.showTable = false
      this.$nextTick(() => {
        this.showTable = true
      })
    },
    /**
       * 处理规则名称
       */
    dealFormName () {
      this.form.rule_name = this.form.rule_name.replace(/(^\s*)|(\s*$)/g, '')
    },
    close () {
      this.$emit('close', true)
    }
  }
}
</script>

<style lang="scss">
.el-table-column--selection >>> .cell {
  padding-left: 0px !important;
}
.ruleNameTips .el-form-item__error {
  top: 0px;
  left: 385px !important;
}

.required::before {
  position: absolute;
  left: -10px;
  content: "*";
  color: #f56c6c;
}

.align-center {
  display: flex;
  align-items: center;
}
</style>

<style lang="css" scoped>
.list-ops-icon {
  font-size: 16px;
  color:rgb(51, 51, 51);
}
</style>
