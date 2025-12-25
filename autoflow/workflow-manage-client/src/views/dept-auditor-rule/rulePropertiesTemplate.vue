<!-- 部门审核员规则配置界面 -->
<template>
  <div >
    <el-form ref="processForm" :model="form" label-position="left" hide-requied-aterisk size="small" class="sm_form1" :rules="rules">
      <label class="font-bold" style="position: relative;display: inline-block;width: 330px" v-if="$i18n.locale === 'en-us'">
          {{$t('deptAuditorRule.deptAuditorRuleLabel')}}
          <workflowPopover ref="selectTemplatePopover" placement="bottom-start" width="313" height="138" popper-class="template-popo" trigger="click">
            <div class="popo-template" style="padding: 35px 19px 16px 19px ; display: block; width: 313px; box-sizing: border-box; margin: 0;" v-if="showTemplate">
                <el-form-item style="margin-bottom: 20px" :label="$t('deptAuditorRule.selectionRules') + ':'" prop="name">
                  <el-select popper-class="workflow-select"  :popper-append-to-body="false" v-model="rule_id" :placeholder="$t('deptAuditorRule.choose')" @visible-change="loadRuleTableData($event)" v-loadmoresss="ruleSelectHandleScroll" style="width: 201px">
                    <template slot="empty">
                      <span class="select-sm">{{$t('deptAuditorRule.noRuleTip')}}</span>
                    </template>
                    <div style="overflow: auto;max-height: 141px;" name="scrollWrap">
                      <el-option v-for="(item, index) in deptAuditorRuleList" :key="index" :label="item.rule_name" :value="item.rule_id">
                        <template scop="label">
                          <div v-title :title="item.rule_name" style="width: 100%;overflow:hidden;text-overflow:ellipsis;white-space:pre;word-break:keep-all;">{{item.rule_name}}</div>
                        </template>
                      </el-option>
                    </div>
                  </el-select>
                </el-form-item>
                <div slot="footer" class="dialog-footer" style="text-align: right;">
                  <el-button type="primary" size="mini" @click="selectDeptTemplate" :disabled="rule_id === ''" v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
                  <el-button size="mini" @click="cancel">{{ $t('button.cancel') }}</el-button>
               </div>
            </div>
            <span   slot="reference" class="tooltip-text-overflow icon-configuration open-template" style="cursor:pointer;" @click="openDeptTemplate"/>
          </workflowPopover>
          <span style="position: absolute; right: 0;" v-if="$i18n.locale !== 'en-us'">）</span>
          <span style="position: absolute; right: 0;" v-else="$i18n.locale !== 'en-us'">)</span>
        </label>
      <label class="font-bold" :style="{position: 'relative',display: 'inline-block',width: $i18n.locale === 'vi-vn'? '350px':'275px'}" v-else>
        {{$t('deptAuditorRule.deptAuditorRuleLabel')}}
        <workflowPopover ref="selectTemplatePopover" placement="bottom-start" width="313" height="138" popper-class="template-popo" trigger="click">
          <div class="popo-template" style="padding: 35px 19px 16px 19px ; display: block; width: 313px; box-sizing: border-box; margin: 0;" v-if="showTemplate">
            <el-form-item style="margin-bottom: 20px" :label="$t('deptAuditorRule.selectionRules') + ':'" prop="name">
              <el-select popper-class="workflow-select"  :popper-append-to-body="false" v-model="rule_id" :placeholder="$t('deptAuditorRule.choose')" @visible-change="loadRuleTableData($event)" style="width: 201px">
                <template slot="empty">
                  <span class="select-sm">{{$t('deptAuditorRule.noRuleTip')}}</span>
                </template>
                <div style="overflow: auto;max-height: 141px;" name="scrollWrap">
                  <el-option v-for="(item, index) in deptAuditorRuleList" :key="index" :label="item.rule_name" :value="item.rule_id">
                    <template scop="label">
                      <div v-title :title="item.rule_name" style="width: 100%;overflow:hidden;text-overflow:ellipsis;white-space:pre;word-break:keep-all;">{{item.rule_name}}</div>
                    </template>
                  </el-option>
                </div>
              </el-select>
            </el-form-item>
            <div slot="footer" class="dialog-footer" style="text-align: right;">
              <el-button type="primary" size="mini" @click="selectDeptTemplate" :disabled="rule_id === ''" v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
              <el-button size="mini" @click="cancel">{{ $t('button.cancel') }}</el-button>
            </div>
          </div>
          <span   slot="reference" class="tooltip-text-overflow icon-configuration open-template" style="cursor:pointer;" @click="openDeptTemplate"/>
        </workflowPopover>
        <span style="position: absolute; right: 0;" v-if="$i18n.locale !== 'en-us'">）</span>
        <span style="position: absolute; right: 0;" v-else="$i18n.locale !== 'en-us'">)</span>
      </label>
      <div style="margin-top: 5px;" v-loading="tableDataLoading"  class="view-template">
<!--        <workflowPopover placement="bottom-start" width="390" height="330" popper-class="template-view" trigger="click">-->
<!--          <div class="popo-template" v-if="viewRules">-->
<!--            <rule-properties-view :deptAuditorSetResult="deptAuditorSetResult" :deptTableData="viewDeptTableData"  ref ="rulePropertiesView"></rule-properties-view>-->
<!--          </div>-->
<!--          <a slot="reference" style="line-height: 24px;display: inline-block;text-decoration: none;" class="tooltip-text-overflow" @click="assemble"><i class="icon-previewing" style="float: left;margin: 0 5px  0 0;"></i>{{$t('deptAuditorRule.ruleView')}}</a>-->
<!--        </workflowPopover>-->

          <v-popover  ref= "popover" effect="light" placement="bottom-start" offset="4" container="#workflow-client-ui-content" trigger="click" class="v-template-view" >
            <div slot="popover" class="popo-template" style="width:375px;height: 330px" v-if="viewRules">
              <rule-properties-view :deptAuditorSetResult="deptAuditorSetResult" :deptTableData="viewDeptTableData"  @showView="showView" ref ="rulePropertiesView"></rule-properties-view>
            </div>
            <a class="tooltip-text-overflow dept-rule-view" v-if="iconPreviewing === 'icon-previewing'" @click="assemble"  @mouseenter="changeImageSrc('icon-previewing-1')" @mouseleave="changeImageSrc('icon-previewing')"><i class="icon-previewing" style="float: left;margin: 0 5px  0 0;"></i>{{$t('deptAuditorRule.ruleView')}}</a>
            <a class="tooltip-text-overflow dept-rule-view" @click="assemble"  v-else @mouseenter="changeImageSrc('icon-previewing-1')" @mouseleave="changeImageSrc('icon-previewing')"><i class="icon-previewing-1" style="float: left;margin: 0 5px  0 0;"></i>{{$t('deptAuditorRule.ruleView')}}</a>
          </v-popover>

          <el-link :underline="false" @click="openStepForm" style="float:right;line-height: 30px;margin: 0 0 0 20px;color: rgba(52, 97, 236, 0.75)">
            <span >{{ $t('deptAuditorRule.saveRuleTemplate') }}</span>
          </el-link>
          <el-link :underline="false" @click="clearAllDeptSet"  style="float:right" :disabled="deptAuditorSetResult.length === 0">
            <span :style="{color: deptAuditorSetResult.length === 0 ? '#aaa' : 'rgba(52, 97, 236, 0.75)',}">{{ $t('deptAuditorRule.reset') }}</span>
          </el-link>
            <el-table
              :data="deptTableData" style="width: 100%;"
              :max-height="360" ref="multipleTable"
              tooltip-effect="light" row-key="id"
              class="table-ellip table-dept" lazy :load="load"
              :cell-class-name="tableRowClassName"
              :tree-props="{ children: 'children', hasChildren: 'hasChildren', }"
            >
                  <el-table-column :label="$t('deptAuditorRule.deptName')" :minWidth="colWidth">
                    <template slot-scope="scope">
                      <span v-title :title="scope.row.name">{{ scope.row.name }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="auditorNames" min-width="276"  :label="$t('deptAuditorRule.deptAuditor') ">
                    <template slot-scope="scope">
                      <workflowPopover placement="bottom-start" :title="auditorNamesPopover?$t('strategy.table.auditor'):''"  width="200" @show="auditorNamesPopover = true" trigger="click">
                        <div class="popo-list" v-if="auditorNamesPopover">
                          <div class="audit-list">
                            <template v-for="(item, index) in getAuditorNameList(scope.row)">
                              <div :key="index" v-title :title="item" style="width: 100%;overflow:hidden;text-overflow:ellipsis;white-space:pre;word-break:keep-all;"> {{item}}</div>
                            </template>
                          </div>
                        </div>
                        <span slot="reference"   onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'" onmouseleave="this.style.color='',this.style.opacity=''">
                          <span class="tooltip-text-overflow" @click="auditorNamesPopover = true">
                            <span   v-title :title="getAuditorNames(scope.row)">{{ formatString(scope.row) }}</span>
                          </span>
                        </span>
                      </workflowPopover>
                      <span v-if="scope.row.isconfigable === true || typeof scope.row.isconfigable === 'undefined'">
                        <el-button
                          type="text"
                          v-if="getAuditorNameList(scope.row).length === 0"
                          @click="openDeptSet(scope)"
                        >{{ $t('button.set') }}</el-button>
                        <el-button
                          style="margin-left: 10px"
                          type="text" v-if="getAuditorNameList(scope.row).length > 0"
                          icon="el-icon-edit-outline"
                          :title="$t('button.edit')"
                          @click="openDeptSet(scope)" />
                        <el-button
                          type="text"
                          v-if="getAuditorNameList(scope.row).length > 0"
                          :title="$t('button.clear')"
                          icon="icon-delete"
                          :disabled="getAuditorNameList(scope.row).length <= 0"
                          :class="  getAuditorNameList(scope.row).length > 0 ? '' : 'gray'
                          " @click="clearDeptSet(scope.row)"/>
                      </span>
                    </template>
                  </el-table-column>
                <div slot="empty" class="empty-box">
                    <template v-if="!tableDataLoading">
                      <div class="empty-text"></div>
                      <p class="text">{{$t('message.noDataTableVisibilityTips')}}</p>
                    </template>
                </div>
            </el-table>
              </div>
        <!-- <div class="foot_button btn-box1">
            <el-button type="primary" size="mini" @click="confirm" style="width: 80px;" :disabled="form.rule_name === ''">
              {{ $t('button.confirm') }}
            </el-button>
            <el-button size="mini" @click="close" style="width: 80px;">
              {{ $t('button.cancel') }}
            </el-button>
          </div> -->
    </el-form>
    <auditor-selector ref="auditorSelect" @output="auditorSelectCall"></auditor-selector>
    <ruleForm ref="stepRuleForm"  @output="confirm"></ruleForm>
  </div>
</template>

<script>
import { getRoots, getSubDeps, getSubUsers } from '@/api/efast'
import { getInfoByTypeAndIds } from '@/api/user-management'
import auditorSelector from './auditorSelector'
import rulePropertiesView from './rulePropertiesView'
import ruleForm from './ruleForm'
import { tenantId } from '@/utils/config'
import { saveDeptAuditorRule, getDeptAuditorRule,getDeptAuditorRulePage } from '@/api/deptAuditorRule.js'
export default {
  name: 'rulePropertiesTemplate',
  components: {auditorSelector,rulePropertiesView,ruleForm },
  props: {
    ruleId: {
      type: String,
      default: ''
    }
  },
  data () {
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
      form: {
        rule_id: '',
        rule_name: ''
      },
      id: null,
      rule_id:'',
      colWidth: 276,
      maxRowIndex: 11,
      loading: false,
      old_rule_name: '',
      showTemplate: false,
      search_value: '',
      viewRules: false,
      autocompleteQuery: true,
      deptAuditorRuleList:[],
      viewDeptTableData:[],
      deptAuditorSetResult: [],
      deptTableData: [],
      tableHeight: 360,
      rootDeptOffset: 0,
      rootDeptLimit: 100,
      iconPreviewing:'icon-previewing',
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
  created () {
    this.rootDeptLoad()
    this.initForm(this.ruleId)
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
  methods: {
    initForm (_ruleId) {
      const _this = this
      if (_ruleId === '') {
        _this.form.rule_id = ''
        _this.form.rule_name = ''
      } else {
        _this.form.rule_id = _ruleId
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
      _this.deptAuditorSetResult = []
      this.$toast('success', _this.$i18n.tc('modeler.common.resetTip'))

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
    /**
     *
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
    confirm (_form) {
      const _this = this
      const data = {
        rule_name: _form.rule_name,
        tenant_id: tenantId,
        template:'Y',
        dept_auditor_rule_list: _this.deptAuditorSetResult
      }
      this.checkAuditorExistence(data)
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
          _this.$toast('success', _this.$i18n.tc('modeler.common.saveTip'))
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
              getDeptAuditorRule(res.id)
                .then((res) => {
                  _this.deptAuditorSetResult = res.dept_auditor_rule_list
                })
                .catch((error) => { })
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
      if (auditorNames.length > 42) {
        return auditorNames.substring(0, 42) + '...'
      } else {
        return auditorNames
      }
    },
    /**
     * 加载审核员规则模板列表
     */
    ruleSelectHandleScroll () {
      const _this = this
      const scrollTop = document.querySelector('div[name=scrollWrap]').scrollTop
      const scrollHeight = document.querySelector('div[name=scrollWrap]').scrollHeight
      const clientHeight = document.querySelector('div[name=scrollWrap]').clientHeight
      if (scrollTop > (scrollHeight - clientHeight) * 0.7 ) {
        _this.query.offset += _this.query.limit
        const query = {..._this.query, process_client: 1, offset: _this.query.offset }
        getDeptAuditorRulePage(query).then(response => {
          _this.deptAuditorRuleList = _this.deptAuditorRuleList.concat(response.entries)
        }).catch(() => {
        })
      }
    },
    /**
     * 打开保存模板名称弹窗
     */
    openStepForm(){
      this.$refs['stepRuleForm'].openProcessTitle(this.form)
    },
    /**
     * 关闭选择规则模板气泡
     */
    cancel(){
      this.showTemplate = false
      this.$refs.selectTemplatePopover.doClose()
    },
    /**
     * 选择规则模板渲染审核员规则列表
     */
    selectDeptTemplate(){
      let _this = this
      getDeptAuditorRule(_this.rule_id)
        .then((res) => {
          _this.deptAuditorSetResult = res.dept_auditor_rule_list
          _this.form.rule_name = res.rule_name
          _this.old_rule_name = res.rule_name
        })
        .catch((error) => { })
      _this.cancel()
    },
    /**
     * 打开选择规则模板气泡
     */
    openDeptTemplate(){
      this.showTemplate = true
    },
    /**
     * 加载部门审核员规则模板列表数据
     */
    loadRuleTableData (_obj) {
      if (_obj === true) {
        const _this = this
        _this.loading = true
        // 绑定滚动条事件
        this.$nextTick(() => {
          setTimeout(() => {
            document.querySelector('div[name=scrollWrap]').addEventListener('scroll', this.ruleSelectHandleScroll)
          }, 500)
        })
        _this.query.offset = 1
        const query = {..._this.query, process_client: 1, offset: (_this.query.offset - 1) * _this.query.limit}
        getDeptAuditorRulePage(query).then(response => {
          _this.deptAuditorRuleList = response.entries
          _this.loading = false
        }).catch(() => {
        })
      }
    },
    /**
     * 组装详情页列表数据
     */
    assemble(){
      let _this = this
      _this.viewDeptAuditorSetResult = _this.deptAuditorSetResult
      _this.viewDeptTableData = []
      _this.deptAuditorSetResult.forEach(v => {
        _this.deptAuditorSetResult.forEach((e) => {
          if ((e.org_id === v.org_id || e.org_id === v.depid) && e.auditor_list.length > 0) {
            _this.viewDeptTableData.push({ depid: v.org_id, name: v.org_name, type: 'depart' })
          }
        })
      })
      _this.viewRules = true
    },
    changeImageSrc(_obj){
      this.iconPreviewing = _obj
    },
    showView(){
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


</style>
<style lang="scss">
.required::before {
  position: absolute;
  left: -10px;
  content: "*";
  color: #f56c6c;
}
</style>
