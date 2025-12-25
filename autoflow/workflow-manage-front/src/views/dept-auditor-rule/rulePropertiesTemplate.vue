<!-- 部门审核员规则配置界面 -->
<template>
  <div>
    <el-form
      ref="processForm"
      :model="form"
      label-position="left"
      hide-requied-aterisk
      size="small"
      class="sm_form1"
      :rules="rules"
    >
      <label
        class="font-bold"
        :style="[
          { position: 'relative' },
          { display: 'inline-block' },
          { width: $i18n.locale === 'en-us' ? '290px' : '275px' }
        ]"
      >
        {{ $t('deptAuditorRule.deptAuditorRuleLabel2') }}
        <el-popover
          ref="selectTemplatePopover"
          placement="bottom-start"
          width="313"
          height="138"
          popper-class="template-popo"
          trigger="click"
        >
          <div
            v-if="showTemplate"
            class="popo-template"
            style="
              padding: 35px 19px 16px 19px;
              display: block;
              width: 313px;
              box-sizing: border-box;
              margin: 0;
            "
          >
            <el-form-item
              style="margin-bottom: 20px"
              :label="$t('deptAuditorRule.selectionRules') + ':'"
              prop="name"
            >
              <el-select
                popper-class="workflow-select"
                :popper-append-to-body="false"
                v-model="rule_id"
                :placeholder="$t('deptAuditorRule.choose')"
                @visible-change="loadRuleTableData($event)"
                style="width: 201px"
                v-loadmoresss="ruleSelectHandleScroll"
              >
                <template slot="empty">
                  <span class="select-sm">{{
                    $t('deptAuditorRule.noRuleTip')
                  }}</span>
                </template>
                <div
                  style="overflow: auto; max-height: 141px"
                  name="scrollWrap"
                >
                  <el-option
                    v-for="(item, index) in deptAuditorRuleList"
                    :key="index"
                    :label="item.rule_name"
                    :value="item.rule_id"
                  >
                    <template scop="label">
                      <div
                        v-title
                        :title="item.rule_name"
                        style="
                          width: 100%;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: pre;
                          word-break: keep-all;
                        "
                      >
                        {{ item.rule_name }}
                      </div>
                    </template>
                  </el-option>
                </div>
              </el-select>
            </el-form-item>
            <div slot="footer" class="dialog-footer" style="text-align: right">
              <el-button
                type="primary"
                size="mini"
                @click="selectDeptTemplate"
                :disabled="rule_id === ''"
                v-preventReClick="1000"
                >{{ $t('button.confirm') }}</el-button
              >
              <el-button size="mini" @click="cancel">{{
                $t('button.cancel')
              }}</el-button>
            </div>
          </div>
          <div slot="reference" class="select-from" @click="openDeptTemplate">
            <svg-icon iconClass="selectfrom" className="ops-icon"></svg-icon>
          </div>
        </el-popover>

        <span style="position: absolute; right: 0">{{
          $i18n.locale === 'en-us' ? ')' : '）'
        }}</span>
      </label>
      <div
        style="margin-top: 5px"
        v-loading="tableDataLoading"
        class="view-template"
      >
        <el-popover
          key="auditors-view"
          ref="popover"
          effect="light"
          placement="bottom-start"
          width="375px"
          height="330px"
          offset="4"
          trigger="click"
          :append-to-body="false"
          @show="bindListen"
        >
          <div
            class="auditor-pop"
            id="auditor-pop"
            style="width: 375px; height: 330px"
            v-if="viewRules"
          >
            <rule-properties-view
              :deptAuditorSetResult="deptAuditorSetResult"
              :deptTableData="viewDeptTableData"
              @showView="showView"
              ref="rulePropertiesView"
            ></rule-properties-view>
          </div>
          <span
            slot="reference"
            class="tooltip-text-overflow dept-rule-view"
            @click="assemble"
          >
            <svg-icon
              iconClass="view-auditor"
              className="view-auditor-icon"
            ></svg-icon>
            {{ $t('deptAuditorRule.ruleView') }}
          </span>
        </el-popover>

        <el-link
          :underline="false"
          @click="openStepForm"
          style="
            float: right;
            line-height: 30px;
            margin: 0 0 0 20px;
            color: rgba(52, 97, 236, 0.75);
          "
        >
          <span>{{ $t('deptAuditorRule.saveRuleTemplate') }}</span>
        </el-link>
        <el-link
          :underline="false"
          @click="clearAllDeptSet"
          style="float: right; line-height: 30px"
          :disabled="deptAuditorSetResult&&deptAuditorSetResult.length === 0"
        >
          <span
            :style="{
              color:
                deptAuditorSetResult && deptAuditorSetResult.length === 0
                  ? '#aaa'
                  : 'rgba(52, 97, 236, 0.75)'
            }"
            >{{ $t('deptAuditorRule.reset') }}</span
          >
        </el-link>
        <el-table
          :data="deptTableData"
          style="width: 100%"
          :max-height="360"
          ref="multipleTable"
          tooltip-effect="light"
          row-key="id"
          class="table-ellip table-dept"
          lazy
          :load="load"
          :cell-class-name="tableRowClassName"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <el-table-column
            :label="$t('deptAuditorRule.deptName')"
            prop="name" 
            show-overflow-tooltip
            :minWidth="colWidth"
          >
            <template slot-scope="scope">
              <span style="padding: 0;"><i :class="checkDataIcon(scope.row, scope)" style="margin-right: 10px"/>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="auditorNames"
            min-width="276"
            :label="$t('deptAuditorRule.deptAuditor')"
          >
            <template slot-scope="scope">
              <el-popover
                placement="bottom-start"
                :title="auditorNamesPopover ? $t('strategy.table.auditor') : ''"
                width="200"
                @show="auditorNamesPopover = true"
                trigger="click"
              >
                <div class="popo-list" v-if="auditorNamesPopover">
                  <div class="audit-list">
                    <template
                      v-for="(item, index) in getAuditorNameList(scope.row)"
                    >
                      <div
                        :key="index"
                        v-title
                        :title="item"
                        style="
                          width: 100%;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: pre;
                          word-break: keep-all;
                        "
                      >
                        {{ item }}
                      </div>
                    </template>
                  </div>
                </div>
                <span
                  slot="reference"
                  class="popover-audit"
                  onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'"
                  onmouseleave="this.style.color='',this.style.opacity=''"
                >
                  <span
                    class="tooltip-text-overflow"
                    @click="auditorNamesPopover = true"
                  >
                    <span v-title :title="getAuditorNames(scope.row)">{{
                      formatString(scope.row)
                    }}</span>
                  </span>
                </span>
              </el-popover>
              <span
                v-if="
                  scope.row.isconfigable === true ||
                  typeof scope.row.isconfigable === 'undefined'
                "
              >
                <el-button
                  type="text"
                  v-if="getAuditorNameList(scope.row).length === 0"
                  @click="openDeptSet(scope.row)"
                  >{{ $t('button.set') }}</el-button
                >
                <el-button
                  style="margin-left: 10px"
                  type="text"
                  v-if="getAuditorNameList(scope.row).length > 0"
                  :title="$t('button.edit')"
                  @click="openDeptSet(scope.row)"
                >
                  <svg-icon iconClass="edit" className="ops-icon"></svg-icon>
                </el-button>
                <el-button
                  type="text"
                  v-if="getAuditorNameList(scope.row).length > 0"
                  :title="$t('button.clear')"
                  :disabled="getAuditorNameList(scope.row).length <= 0"
                  :class="
                    getAuditorNameList(scope.row).length > 0 ? '' : 'gray'
                  "
                  @click="clearDeptSet(scope.row)"
                >
                  <svg-icon iconClass="delete" className="ops-icon"></svg-icon>
                </el-button>
              </span>
            </template>
          </el-table-column>
          <div slot="empty" class="empty-box">
            <template v-if="!tableDataLoading">
              <div class="empty-text"></div>
              <p class="text">{{ $t('message.noDataTableVisibilityTips') }}</p>
            </template>
          </div>
        </el-table>
      </div>
      <!-- <div class="foot_button btn-box1">
        <el-button
          type="primary"
          size="mini"
          @click="confirm"
          style="width: 80px"
          :disabled="form.rule_name === ''"
        >
          {{ $t('button.confirm') }}
        </el-button>
        <el-button size="mini" @click="close" style="width: 80px">
          {{ $t('button.cancel') }}
        </el-button>
      </div> -->
    </el-form>
    <auditor-selector
      ref="auditorSelect"
      @output="auditorSelectCall"
    ></auditor-selector>
    <ruleForm ref="stepRuleForm" @output="confirm"></ruleForm>
  </div>
</template>

<script>
import { members, rootDepartment, getInfoByTypeAndIds, usrmGetUserInfo } from '@/api/user-management'
import auditorSelector from './auditorSelector'
import rulePropertiesView from './rulePropertiesView'
import ruleForm from './ruleForm'
import { tenantId } from '@/utils/config'
import {
  saveDeptAuditorRule,
  getDeptAuditorRule,
  getDeptAuditorRulePage
} from '@/api/deptAuditorRule.js'
export default {
  name: 'rulePropertiesTemplate',
  components: { auditorSelector, rulePropertiesView, ruleForm },
  props: {
    ruleId: {
      type: String,
      default: ''
    }
  },
  data() {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)) {
        callback(
          new Error(
            this.$i18n.tc('modeler.ruleIllegalCharacterPrefix') +
              ' \\ / : * ? < > | "' +
              this.$i18n.tc('modeler.illegalCharacterSuffix')
          )
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
      form: {
        rule_id: '',
        rule_name: ''
      },
      id: null,
      rule_id: '',
      colWidth: 276,
      maxRowIndex: 11,
      loading: false,
      old_rule_name: '',
      showTemplate: false,
      search_value: '',
      viewRules: false,
      autocompleteQuery: true,
      deptAuditorRuleList: [],
      viewDeptTableData: [],
      deptAuditorSetResult: [],
      deptTableData: [],
      tableHeight: 360,
      rootDeptOffset: 0,
      rootDeptLimit: 100,
      iconPreviewing: 'icon-previewing',
      rootScrollLoad: true,
      showHandelBtn: false,
      tableDataLoading: false,
      auditorNamesPopover: false,
      nameExistenceErr: false,
      operateType: '',
      query: {
        name: '',
        filter_share: 1,
        type_id: '',
        offset: 1,
        limit: 5,
        template: 'Y'
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
  created() {
    this.rootDeptLoad()
    this.initForm(this.ruleId)
  },
  filters: {
    ellipsis(value, len) {
      if (!value) return ''
      if (value.length > len) {
        return value.slice(0, len) + '...'
      }
      return value
    }
  },
  methods: {
    closeInnerPop(){
      this.$refs.rulePropertiesView.closePop()
    },
    bindListen(){
      if(this.$refs.rulePropertiesView) {
        const dom = document.getElementById('auditor-pop')
        dom.removeEventListener('click',this.closeInnerPop,true)
        dom.addEventListener('click',this.closeInnerPop,true)
      }
    },
    initForm(_ruleId) {
      const _this = this
      if (_ruleId === '') {
        _this.form.rule_id = ''
        _this.form.rule_name = ''
      } else {
        _this.form.rule_id = _ruleId
      }
    },
    getAuditorNames(_obj) {
      let auditorNames = ''
      this.deptAuditorSetResult && this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNames = e.auditor_names
        }
      })
      return auditorNames
    },
    openDeptSet(_obj) {
      let checkedUserIds = []
      this.deptAuditorSetResult && this.deptAuditorSetResult.forEach((item) => {
        if (item.org_id === _obj.id) {
          item.auditor_list.forEach((e) => {
            checkedUserIds.push(e.user_id)
          })
        }
      })
      this.$refs['auditorSelect'].openSelector(_obj, checkedUserIds)
    },
    clearDeptSet(_obj) {
      this.id = _obj.id
      const _this = this
      _this.deptAuditorSetResult.splice(
        _this.deptAuditorSetResult.findIndex(
          (data) => data.org_id === _obj.id || data.org_id === _obj.depid
        ),
        1
      )
      this.$message.success( _this.$i18n.tc('modeler.common.clearTip'))
    },
    clearAllDeptSet() {
      const _this = this
      _this.deptAuditorSetResult = []
      this.$message.success( _this.$i18n.tc('modeler.common.resetTip'))
    },
    auditorSelectCall(_obj, orgInfo) {
      const _this = this
      const item = {
        org_id: orgInfo.id,
        org_name: orgInfo.name,
        auditor_list: _obj.auditorList,
        auditor_names: _obj.auditorNames
      }
      let _array = _this.deptAuditorSetResult.filter(
        (data) => item.org_id === data.org_id
      )
      if (_array.length === 0) {
        _this.deptAuditorSetResult.push(item)
      } else {
        _this.deptAuditorSetResult.splice(
          _this.deptAuditorSetResult.findIndex(
            (data) => item.org_id === data.org_id
          ),
          1
        )
        _this.deptAuditorSetResult.push(item)
      }
      this.$message.success( _this.$i18n.tc('modeler.common.editTip'))
    },
    /**
     *
     * 分解获取审核员列表
     * @param auditorNames
     */
    getAuditorNameList(_obj) {
      let auditorNameArr = []
      this.deptAuditorSetResult && this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNameArr = e.auditor_names
            .split('、')
            .filter((res) => res !== '')
        }
      })
      return auditorNameArr
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
    tableRowClassName({ row, column, rowIndex, columnIndex }) {
      if (this.maxRowIndex < rowIndex) {
        this.maxRowIndex = rowIndex
      }
    },
    // 保存为模板
    confirm(_form) {
      const _this = this
      const data = {
        rule_name: _form.rule_name,
        tenant_id: tenantId,
        template: 'Y',
        dept_auditor_rule_list: _this.deptAuditorSetResult
      }
      this.checkAuditorExistence(data)
    },
    /**
     * 校验审核员是否存在
     */
    checkAuditorExistence(data) {
      const _this = this
      let warnMsgStr = ''
      let userIds = this.jointUserId()
      getInfoByTypeAndIds('user', userIds)
        .then((res) => {
          saveDeptAuditorRule(data)
            .then((res) => {
              _this.$message.success( _this.$i18n.tc('modeler.common.saveTip'))
            })
            .catch(() => {})
        })
        .catch((res) => {
          if (res.response.data.code === 400019001) {
            const detail = JSON.parse(res.response.data.detail)
            let delUserIdArr = []
            _this.deptAuditorSetResult.forEach((result) => {
              result.auditor_list.forEach((auditor) => {
                if (detail.ids.indexOf(auditor.user_id) > -1) {
                  if (
                    delUserIdArr.filter((userId) => auditor.user_id === userId)
                      .length === 0
                  ) {
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
            delUserIdArr.forEach((userId) => {
              _this.deptAuditorSetResult.forEach((result) => {
                let index = result.auditor_list.findIndex(
                  (data) => userId === data.user_id
                )
                if (index !== -1) {
                  result.auditor_list.splice(index, 1)
                }
              })
            })
            data.dept_auditor_rule_list = _this.deptAuditorSetResult
            _this
              .$dialog_confirm_user_not_exist(
                '',
                _this.$i18n.tc('sync.userHasTip1') + warnMsgStr,
                _this.$i18n.tc('button.confirm'),
                _this.$i18n.tc('button.cancel'),
                false
              )
              .then(() => {
                saveDeptAuditorRule(data)
                  .then((res) => {
                    getDeptAuditorRule(res.id)
                      .then((res) => {
                        _this.deptAuditorSetResult = res.dept_auditor_rule_list
                      })
                      .catch((error) => {
                        console.error(error)
                      })
                    _this.$emit('close', _this.form.rule_id !== '')
                  })
                  .catch((e) => {
                    console.error(e)
                  })
              })
              .catch((e) => {
                console.error(e)
              })
          }
        })
    },
    /**
     * 拼接审核员ID
     */
    jointUserId() {
      let userIds = []
      for (let i = 0; i < this.deptAuditorSetResult.length; i++) {
        let auditor_list = this.deptAuditorSetResult[i].auditor_list
        for (let k = 0; k < auditor_list.length; k++) {
          userIds.push(auditor_list[k].user_id)
        }
      }
      return userIds
    },
    /**
     * 处理规则名称
     */
    dealFormName() {
      this.form.rule_name = this.form.rule_name.replace(/(^\s*)|(\s*$)/g, '')
    },
    close() {
      this.$emit('close', true)
    },
    checkAuditorShowTooltip(e) {
      this.tooltipDisabled = e.fromElement.innerText.indexOf('...') === -1
    },
    formatString(_obj) {
      let auditorNames = ''
      this.deptAuditorSetResult && this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNames = e.auditor_names
        }
      })
      if (auditorNames.length > 42) {
        return auditorNames.substring(0, 42) + '...'
      } else {
        return auditorNames
      }
    },
    /**
     * 加载审核员规则模板列表
     */
    ruleSelectHandleScroll() {
      const _this = this
      const scrollTop = document.querySelector('div[name=scrollWrap]').scrollTop
      const scrollHeight = document.querySelector(
        'div[name=scrollWrap]'
      ).scrollHeight
      const clientHeight = document.querySelector(
        'div[name=scrollWrap]'
      ).clientHeight
      if (scrollTop > (scrollHeight - clientHeight) * 0.7) {
        _this.query.offset += _this.query.limit
        const query = {
          ..._this.query,
          offset: _this.query.offset
        }
        getDeptAuditorRulePage(query)
          .then((response) => {
            _this.deptAuditorRuleList = _this.deptAuditorRuleList.concat(
              response.entries
            )
          })
          .catch((e) => {
            console.error(e)
          })
      }
    },
    /**
     * 打开保存模板名称弹窗
     */
    openStepForm() {
      this.$refs['stepRuleForm'].openProcessTitle(this.form)
    },
    /**
     * 关闭选择规则模板气泡
     */
    cancel() {
      this.showTemplate = false
      this.$refs.selectTemplatePopover.doClose()
    },
    /**
     * 选择规则模板渲染审核员规则列表
     */
    selectDeptTemplate() {
      let _this = this
      getDeptAuditorRule(_this.rule_id)
        .then((res) => {
          _this.deptAuditorSetResult = res.dept_auditor_rule_list
          _this.form.rule_name = res.rule_name
          _this.old_rule_name = res.rule_name
        })
        .catch((error) => {})
      _this.cancel()
    },
    /**
     * 打开选择规则模板气泡
     */
    openDeptTemplate() {
      this.showTemplate = true
    },
    /**
     * 加载部门审核员规则模板列表数据
     */
    loadRuleTableData(_obj) {
      if (_obj === true) {
        const _this = this
        _this.loading = true
        // 绑定滚动条事件
        this.$nextTick(() => {
          setTimeout(() => {
            document
              .querySelector('div[name=scrollWrap]')
              .addEventListener('scroll', this.ruleSelectHandleScroll)
          }, 500)
        })
        _this.query.offset = 1
        const query = {
          ..._this.query,
          offset: (_this.query.offset - 1) * _this.query.limit
        }
        getDeptAuditorRulePage(query)
          .then((response) => {
            _this.deptAuditorRuleList = response.entries
            _this.loading = false
          })
          .catch(() => {})
      }
    },
    /**
     * 组装详情页列表数据
     */
    assemble() {
      let _this = this
      _this.viewDeptAuditorSetResult = _this.deptAuditorSetResult
      _this.viewDeptTableData = []
      _this.deptAuditorSetResult && _this.deptAuditorSetResult.forEach((v) => {
        _this.deptAuditorSetResult.forEach((e) => {
          if (
            (e.org_id === v.org_id || e.org_id === v.depid) &&
            e.auditor_list.length > 0
          ) {
            _this.viewDeptTableData.push({
              depid: v.org_id,
              name: v.org_name,
              type: 'depart'
            })
          }
        })
      })
      _this.viewRules = true
    },
    changeImageSrc(_obj) {
      this.iconPreviewing = _obj
    },
    showView() {
      this.$refs.popover.show()
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
.view-template > span + .el-button + .el-table,
.view-template > span + .el-table {
  margin-top: -20px;
}
.v-template-view{
  display: inline-block;
  height: 30px;
  line-height: 30px;
}
.auditor-pop {
    background: rgb(255, 255, 255);
    color: rgb(96, 96, 96);
    border-radius: 0px;
    padding: 6px 8px;
    max-width: 390px;
    white-space: normal;
    word-break: break-all;
}
</style>
<style lang="scss" scoped>
.required::before {
  position: absolute;
  left: -10px;
  content: '*';
  color: #f56c6c;
}
.select-from {
  display: inline-block;
  height: 30px;
  position: absolute;
  right: 16px;
  cursor: pointer;
}
.ops-icon {
  font-size: 16px;
  color: rgb(51, 51, 51);
}
.view-auditor-icon {
  margin-right: 8px;
  font-size: 24px;
  color: rgb(51, 51, 51);
}
.view-template {
  border: 1px solid #cfd0d8;
  display: block;
  margin: 5px 0 0 0;
  padding: 8px 16px 25px 16px;
  border-radius: 4px;
}

.dept-rule-view {
  line-height: 24px;
  display: inline-flex;
  align-items: center;
  color: #000;
  cursor: pointer;
}
.dept-rule-view:hover,
.dept-rule-view:hover .view-auditor-icon {
  color: rgb(104, 137, 202);
}
.table-dept {
  cursor: default;
}
.popover-audit {
  float: left;
  max-width: calc(100% - 70px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
</style>
