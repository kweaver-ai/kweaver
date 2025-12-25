<!-- 部门审核员规则配置界面 -->
<template>
  <div class="basicProperties no-border-bottom">
    <div class="no-border">
      <div class="card-body">
        <el-form ref="rulePropertiesForm" :model="form" label-position="left" hide-requied-aterisk label-width="0px" size="small" :rules="rules">
          <el-form-item prop="rule_name" style="-webkit-app-region:no-drag" class="ruleNameTips">
            <label class="font-bold" style="width: 75px;">
              {{ $t('deptAuditorRule.ruleName') }}：<span class="red">* </span>
            </label>
            <el-input v-model="form.rule_name" style="width: 300px;" @input="restValidateName" @change="dealFormName" :placeholder="$t('deptAuditorRule.ruleNamePlaceholder')"/>
          </el-form-item>
          <div>
            <el-row :gutter="20">
              <el-col :span="8" class="align-left rule-btn" style="padding-right: 0px">
                <label class="font-bold">
                  {{ $t('deptAuditorRule.setDeptAuditor') }}
                </label>
                <el-link :underline="false" type="text" @click="clearAllDeptSet" style="margin-left: 5px;" :disabled="deptAuditorSetResult.length === 0">
                  <span :style="{color: deptAuditorSetResult.length === 0 ? '#aaa' : '#3461EC',}">{{ $t('deptAuditorRule.reset') }}</span>
                </el-link>
              </el-col>
              <el-col :span="16" class="align-right">
                <MultiChoice ref="multiChoice" v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')"/>
              </el-col>
            </el-row>
            <div style="margin-top: 5px;" v-loading="tableDataLoading">
              <el-table
                :data="deptTableData"
                style="width: 100%;"
                :height="tableHeight"
                ref="multipleTable"
                tooltip-effect="light"
                row-key="id"
                class="table-ellip  table-dept"
                lazy
                :load="load"
                :cell-class-name="tableRowClassName"
                :tree-props="{
                children: 'children',
                hasChildren: 'hasChildren', }">
                  <el-table-column :label="$t('deptAuditorRule.deptName')" :minWidth="colWidth">
                    <template slot-scope="scope">
                      <span v-title :title="scope.row.name" style="white-space:pre;">{{scope.row.name}}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="auditorNames" min-width="276"  class="table-dept" :label="$t('deptAuditorRule.deptAuditor') ">
                    <template slot-scope="scope">
                      <workflowPopover placement="bottom-start" :title="auditorNamesPopover?$t('strategy.table.auditor'):''" width="200" @show="auditorNamesPopover = true" trigger="click">
                        <div class="popo-list" v-if="auditorNamesPopover">
                          <ul>
                            <template v-for="(item, index) in getAuditorNameList(scope.row)">
                              <div :key="index" v-title :title="item" style="width: 100%;overflow:hidden;text-overflow:ellipsis;white-space:pre;word-break:keep-all;"> {{ item }}</div>
                            </template>
                          </ul>
                        </div>
                        <span slot="reference" onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'" onmouseleave="this.style.color='',this.style.opacity=''">
                          <span class="tooltip-text-overflow" @click="auditorNamesPopover = true">
                            <span v-title :title="formatString(scope.row)">{{ formatString(scope.row) }}</span>
                          </span>
                        </span>
                      </workflowPopover>
                      <span v-if="scope.row.isconfigable === true || typeof scope.row.isconfigable === 'undefined'">
                        <el-button type="text" v-if="getAuditorNameList(scope.row).length === 0" @click="openDeptSet(scope)" >{{ $t('button.set') }}</el-button>
                        <el-button style="margin-left: 10px" type="text" v-if="getAuditorNameList(scope.row).length > 0"  icon="el-icon-edit-outline"   :title="$t('button.edit')" @click="openDeptSet(scope)" ></el-button>
                        <el-button
                          type="text"
                          v-if="getAuditorNameList(scope.row).length > 0"
                          :title="$t('button.clear')"
                          icon="icon-delete"
                          :disabled="getAuditorNameList(scope.row).length <= 0"
                          :class="  getAuditorNameList(scope.row).length > 0 ? '' : 'gray'
                          " @click="clearDeptSet(scope.row)"></el-button>
                      </span>
                    </template>
                  </el-table-column>
                  <div slot="empty" class="empty-box">
                    <div v-if="searchParams.deptnames.length > 0 || searchParams.auditors.length > 0">
                      <div class="no-seach"></div>
                      <p class="text">{{$t('message.noSeachTableTips')}}</p>
                    </div>
                    <div v-else>
                      <template v-if="!tableDataLoading">
                        <div class="empty-text"></div>
                        <p class="text">{{$t('message.noDataTableVisibilityTips')}}</p>
                      </template>
                    </div>
                  </div>
              </el-table>
            </div>
          </div>
          <div class="foot_button btn-box1">
            <el-button type="primary" size="mini" @click="confirm" style="width: 80px;" :disabled="form.rule_name === ''">{{ $t('button.confirm') }}</el-button>
            <el-button size="mini" @click="close" style="width: 80px;">{{ $t('button.cancel') }}</el-button>
          </div>
        </el-form>
      </div>
    </div>
    <auditor-selector ref="auditorSelect" @output="auditorSelectCall"></auditor-selector>
  </div>
</template>

<script>
import { getRoots, getSubDeps, getSubUsers, searchUser } from '@/api/efast'
import { deptAuditorSearch, getInfoByTypeAndIds } from '@/api/user-management'
import MultiChoice from '@/components/MultiChoice'
import auditorSelector from './auditorSelector'
import { tenantId } from '@/utils/config'
import { getDeptAuditorRulePage, saveDeptAuditorRule, getDeptAuditorRule } from '@/api/deptAuditorRule.js'
import dialogMixin from '@/mixins/dialog-mixin'
export default {
  name: 'ruleProperties',
  components: { MultiChoice, auditorSelector },
  props: {
    ruleId: {
      type: String,
      default: ''
    }
  },
  mixins:[dialogMixin],
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
            this.$i18n.tc('modeler.illegalCharacterTemplatePrefix') +
            ' \\ / : * ? < > | "' +
            this.$i18n.tc('modeler.illegalCharacterSuffix'),
          ),
        )
      } else if (value.length > 128) {
        callback(new Error(this.$i18n.tc('modeler.templateNameLengthErrorBack')))
      } else if (this.nameExistenceErr) {
        callback(new Error(this.$i18n.tc('deptAuditorRule.nameHasTips')))
      } else {
        callback()
      }
    }
    return {
      form: {
        rule_id: '',
        rule_name: ''
      },
      multic_hoice_types,
      id: null,
      colWidth: 276,
      maxRowIndex: 11,
      old_rule_name: '',
      search_value: null,
      serachEmpthInfo: this.$i18n.tc('modeler.searchTip'),
      serachTimeouter: null,
      autocompleteQuery: true,
      autocompleteQueryScroll: false,
      autocompleteQueryPage: {
        restaurants: [],
        offset: 0,
        limit: 50
      },
      queryObject: {
      },
      deptAuditorSetResult: [],
      old_deptTableData: [],
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
    },
    search_value (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.autocompleteQueryPage.restaurants = []
      }
      if (newVal === '') {
        this.clearSearch()
      }
    }
  },

  created () {
    this.rootDeptLoad()
    this.tableDataLoading = true
    this.initForm(this.ruleId)
    this.tableDataLoading = false
  },
  filters: {
    ellipsis (value, len) {
      if (!value) return ''
      if (value.length > len) {
        return value.slice(0, len) + '...'
      }
      return value
    }
  },
  mounted () {
    this.$nextTick(function () {
      this.tableHeight =
        window.innerHeight - this.$refs.multipleTable.$el.offsetTop - 80
      // 监听窗口大小变化
      let self = this
      window.addEventListener('resize', () => {
        self.tableHeight = self.$refs.multipleTable
          ? window.innerHeight - self.$refs.multipleTable.$el.offsetTop - 80
          : self.tableHeight
      })
    })
    this.computedDialogTop()
  },
  methods: {
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
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNames = e.auditor_names
        }
      })
      return auditorNames
    },
    openDeptSet (_obj) {
      let checkedUsers = []
      this.deptAuditorSetResult.forEach(item => {
        if (item.org_id === _obj.row.id || item.org_id === _obj.row.depid) {
          item.auditor_list.forEach(e => {
            checkedUsers.push(e)
          })
        }
      })
      this.$refs['auditorSelect'].openSelector(_obj.row, checkedUsers)
    },
    clearDeptSet (_obj) {
      this.id = _obj.id
      const _this = this
      _this.deptAuditorSetResult.splice(
        _this.deptAuditorSetResult.findIndex((data) => data.org_id === _obj.id || data.org_id === _obj.depid),
        1,
      )
      this.$toast('success', _this.$i18n.tc('modeler.common.clearTip'))
    },
    clearAllDeptSet () {
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('deptAuditorRule.deleteDeptAuditorTip'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        _this.deptAuditorSetResult = []
      }).catch(() => {
      })
    },
    auditorSelectCall (_obj, orgInfo) {
      const _this = this
      const item = {
        org_id: orgInfo.id,
        org_name: orgInfo.name,
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
      this.$toast('success', _this.$i18n.tc('modeler.common.editTip'))
    },
    /**      console.log()
       * 分解获取审核员列表
       * @param auditorNames
       */
    getAuditorNameList (_obj) {
      let auditorNameArr = []
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNameArr = e.auditor_names.split('、').filter(res=>  res !== '' )
        }
      })

      return auditorNameArr
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
      getRoots().then((res) => {
        const arrnew = []
        res.depinfos.forEach((item) => {
          item['type'] = 'depart'
          item['hasChildren'] = true
          item['parent'] = 0
          item['name'] = item.name
          item['isUser'] = false
          arrnew.push(item)
        })
        _this.deptTableData = [..._this.deptTableData, ...arrnew]
        _this.rootScrollLoad = true
      }).catch(() => { })
    },
    rootDeptLoad () {
      const _this = this
      getRoots().then((res) => {
        const arrnew = []
        res.depinfos.forEach((item) => {
          item['type'] = 'depart'
          item['hasChildren'] = true
          item['parent'] = 0
          item['name'] = item.name
          item['id'] = item.depid
          item['isUser'] = false
          arrnew.push(item)
        })
        _this.deptTableData = arrnew
      }).catch(() => { })
    },
    async load (data, node, resolve) {
      const _this = this
      getSubDeps({ depid: data.depid }).then((subDepRes) => {
        let arrnew = []
        getSubUsers({ depid: data.depid }).then((subUserRes) => {
          subUserRes.userinfos.forEach((item) => {
            item['type'] = 'depart'
            item['hasChildren'] = false
            item['parent'] = data.depid
            item['id'] = item.userid
            item['name'] = item.name
            item['isUser'] = true
            item['orgId'] = data.depid
            item['orgName'] = data.name
            arrnew.push(item)
          })
          subDepRes.depinfos.forEach((item) => {
            item['type'] = 'depart'
            item['hasChildren'] = true
            item['parent'] = data.depid
            item['name'] = item.name
            item['id'] = item.depid
            item['isUser'] = false
            arrnew.push(item)
          })
          resolve(arrnew)
        })
        if (_this.maxRowIndex > 11) {
          _this.colWidth += 25
        }
      }).catch(() => {
      })
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
        template:'Y',
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
                _this.$dialog_confirm(_this.$i18n.tc('deptAuditorRule.editErrTips'), '',
                  _this.$i18n.tc('button.confirm'),
                  _this.$i18n.tc('button.cancel'), false).then(() => {
                  _this.$emit('close')
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
          _this.$emit('close', _this.form.rule_id !== '')
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
          _this.$dialog_confirm_user_not_exist('', _this.$i18n.tc('sync.userHasTip1') +  warnMsgStr , _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), false).then(() => {
            saveDeptAuditorRule(data).then((res) => {
              _this.$emit('close', _this.form.rule_id !== '')
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
        getDeptAuditorRulePage({ name: ruleName, process_client: 1,template: 'Y' })
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
          getDeptAuditorRulePage({ id: _this.ruleId, process_client: 1,template: 'Y' }).then(response => {
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
          _this.deptAuditorSearch( _this.searchParams.auditors).then((res) => {
            if (_this.searchParams.deptnames.length > 0) {
              let filterDeptTableData = []
              res.forEach(e => {
                const arr = deptTableData.filter(item => item.depid === e.org_id)
                if (arr.length > 0) {
                  filterDeptTableData.push({depid: e.org_id, name: e.org_name, type: 'depart'})
                }
              })
              deptTableData = filterDeptTableData
            } else {
              res.forEach(e => {
                deptTableData.push({depid: e.org_id, name: e.org_name, type: 'depart'})
              })
            }
            _this.deptTableData = deptTableData
            _this.reloadTable()
          }).catch(() => {
          })

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
      })
      return Promise.all(promiseAll)
    },
    departmentSearch(dept, deptTableData){
      return new Promise((resolve) => {
        searchUser(dept, 0, 1000).then((res) => {
          const deptArr = res.depinfos
          const userArr = res.userinfos
          deptArr.forEach(e => {
            if(deptTableData.filter( (item) => item.id === e.depid).length === 0) {
              deptTableData.push({depid: e.depid, name: e.name, type: 'depart', isUser: false})
            }
          })
          userArr.forEach(e => {
            if(deptTableData.filter( (item) => item.id === e.depid).length === 0) {
              deptTableData.push({id: e.userid, name: e.name, type: 'depart', isUser: true, orgId : e.depid, orgName : e.depname})
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
    },
    checkAuditorShowTooltip (e) {
      this.tooltipDisabled = e.fromElement.innerText.indexOf('...') === -1
    },
    formatString (_obj) {
      let auditorNames = ''
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNames = e.auditor_names
        }
      })
      return auditorNames
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
</style>
<style lang="scss">
.required::before {
  position: absolute;
  left: -10px;
  content: "*";
  color: #f56c6c;
}
a.disabled {
  pointer-events: none;
  filter: alpha(opacity=50);
  -moz-opacity: 0.5;
  opacity: 0.5;
}
</style>
