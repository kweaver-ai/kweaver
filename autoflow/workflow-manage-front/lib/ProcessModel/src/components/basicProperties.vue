<template>
  <div class="basicProperties no-border-bottom">
    <div class="gray-tstext">{{ $t('modeler.strategyTabelTips') }}</div>
    <div class="no-border">
      <div class="card-body">
        <el-form ref="basicForm" :model="form" label-position="left" hide-requied-aterisk :class="elementType === 'Root' ? 'new-form' : ''" :label-width="$i18n.locale === 'en-us'?'145px':'86px'" size="small" :rules="rules">
          <template v-if="elementType === 'Root'">
            <el-form-item :label="$t('modeler.processName') + '：'">
              {{ process_obj.name }}
            </el-form-item>
            <el-form-item :label="$t('modeler.processType') + '：'">
              {{ process_obj.type_name }}
            </el-form-item>
            <template v-if="is_edit">
              <el-form-item :label="$t('modeler.creator') + '：'">
                {{ process_obj.create_user_name ? process_obj.create_user_name : '-' }}
              </el-form-item>
              <el-form-item :label="$t('modeler.lastUpdateTime') + '：'">
                {{ formatDate(process_obj.create_time) }}
              </el-form-item>
            </template>
          </template>
          <template v-else-if="elementType === 'Task'">
            <el-form-item prop="name">
              <template slot="label"><label class="font-bold">{{$t('modeler.nodeName')}}：</label></template>
              <el-input  v-model="form.name" style="width: 300px;" @change="saveProcess"></el-input>
            </el-form-item>
            <el-form-item>
              <template slot="label"><label class="font-bold" >{{$t('strategy.strategyName')}}：</label></template>
            </el-form-item>
            <el-form-item v-if="!is_share">
              <template slot="label">
                {{ $t('modeler.auditMode') }}
                <el-tooltip effect="light" placement="top">
                  <div slot="content" style="width: 320px">
                    {{ $t('modeler.auditModeDescription1') }} <br />{{ $t('modeler.auditModeDescription2') }} <br />{{ $t('modeler.auditModeDescription3') }}
                  </div>
                  <span style="cursor: pointer">
                    <i class="el-icon-question" />
                  </span>
                </el-tooltip>
              </template>
              <el-select v-model="deal_type" style="width: 100%" :disabled="is_edit&&disable">
                <el-option :label="$t('modeler.dealType.tjsh')" value="tjsh" />
                <el-option :label="$t('modeler.dealType.hqsh')" value="hqsh" />
                <el-option :label="$t('modeler.dealType.zjsh')" value="zjsh" />
              </el-select>
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item :label="$t('modeler.processName')">
              <el-input size="mini" v-model.trim="form.name" maxlength="15" />
            </el-form-item>
          </template>
        </el-form>
        <div>
          <el-row :gutter="20">
            <el-col :span="8" class="align-left">
              <el-button type="primary" size="mini" icon="el-icon-plus" @click="openStepSelector">{{$t('strategy.addStrategyName')}}</el-button>
              <el-button v-if="showHandelBtn" size="mini" icon="el-icon-edit-outline" @click="editStepAll">{{$t('button.edit')}}</el-button>
              <el-button v-if="showHandelBtn" size="mini" icon="el-icon-delete" @click="delStepAll">{{$t('button.delete')}}</el-button>
            </el-col>
            <el-col :span="16" class="align-right">
              <MultiChoice v-model="search_obj" :types="multic_hoice_types" :placeholder="$t('input.search')"/>
            </el-col>
          </el-row>
          <div style="margin-top: 5px" v-loading="tableDataLoading">
            <el-table
              ref="multipleTable"
              :data="strategyTableData"
              tooltip-effect="light"
              style="width: 100%"
              :height="tableHeight"
              @filter-change="handleFilterChange"
              @selection-change="handleSelectionChange">
              <el-table-column
                type="selection"
                width="55">
              </el-table-column>
              <el-table-column
                :label="$t('strategy.table.labName')"
                prop="doc_name"
                show-overflow-tooltip
                width="300">
              </el-table-column>
              <el-table-column
                prop="auditorNames"
                :label="$t('strategy.table.auditor')">
                <template slot-scope="scope">
                  <el-popover
                    placement="bottom-start"
                    :title="auditorNamesPopover?$t('strategy.table.auditor'):''"
                    width="200"
                    trigger="click">
                    <div class="popo-list"  v-if="auditorNamesPopover">
                      <ul>
                        <template  v-for="(item, index) in getAuditorNameList(scope.row.auditorNames)" >
                          <el-tooltip :key="index" class="item" effect="light" placement="top-start">
                            <div slot="content">
                              <span v-if="scope.row.audit_model === 'zjsh'">（{{index + 1}}{{$t('modeler.level')}}）</span>{{item}}
                            </div>
                            <li style="width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">
                              <span v-if="scope.row.audit_model === 'zjsh'">（{{index + 1}}{{$t('modeler.level')}}）</span>{{item}}
                            </li>
                          </el-tooltip>
                        </template>
                      </ul>
                    </div>
                    <span slot="reference" onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'" onmouseleave="this.style.color='',this.style.opacity=''">
                      <el-tooltip placement="top-start" effect="light" :offset="0" :visible-arrow="false" :content="delAuditorNames(scope.row.audit_model, scope.row.auditorNames)">
                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;" @click="auditorNamesPopover = true">{{delAuditorNames(scope.row.audit_model, scope.row.auditorNames)}}</span>
                      </el-tooltip>
                    </span>
                  </el-popover>

                </template>
              </el-table-column>
              <el-table-column
                :label="$t('strategy.table.labType')"
                width="210"
                column-key="doc_type"
                :filters="doc_type_options"
                :filter-multiple="false"
                filter-placement="bottom-end"
                show-overflow-tooltip>
                <template slot-scope="scope">
                  <span v-if="scope.row.doc_type === 'user_doc_lib'">{{$t('modeler.userDocLib')}}</span>
                  <span v-if="scope.row.doc_type === 'department_doc_lib'">{{$t('modeler.deptDocLib')}}</span>
                  <span v-if="scope.row.doc_type === 'custom_doc_lib'">{{$t('modeler.customDocLib')}}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('strategy.table.auditModel')"
                width="210">
                <template slot-scope="scope">
                  <span v-if="scope.row.audit_model === 'tjsh'">{{$t('modeler.dealType.tjsh')}}</span>
                  <span v-if="scope.row.audit_model === 'hqsh'">{{$t('modeler.dealType.hqsh')}}</span>
                  <span v-if="scope.row.audit_model === 'zjsh'">{{$t('modeler.dealType.zjsh')}}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('strategy.table.hander')" width="100">
                <template slot-scope="scope">
                  <el-button
                    size="mini"
                    icon="el-icon-edit-outline"
                    @click="openStepSelector(scope.row)"></el-button>
                  <el-button
                    size="mini"
                    icon="el-icon-delete"
                    @click="docAuditStrategyDataRemove(scope.row)"></el-button>
                </template>
              </el-table-column>
              <div slot="empty" class="empty-box">
                <div v-if="strategyParams.doc_name !== '' || strategyParams.auditor !== ''">
                  <div class="empty-text"></div>
                  <p class="text">{{$t('message.noSeachTableTips')}}</p>
                </div>
                <div v-else>
                  <div class="no-seach"></div>
                  <p class="text">{{$t('message.noDataTableTips')}}</p>
                </div>
              </div>
            </el-table>
            <div class="block" style="margin-top: 10px">
              <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page.sync="strategyPageParams.pageNumber"
                :page-sizes="[50, 100, 200]"
                :page-size="strategyPageParams.pageSize"
                layout="total, sizes, prev, pager, next"
                :total="strategyPageParams.total">
              </el-pagination>
            </div>
          </div>
          <div class="gray-tstext">{{ $t('modeler.strategyTabelTips') }}</div>
        </div>
        <div v-if="elementType === 'Task'">
          <div v-if="process_obj_type === '1'">
            <div class="rzsj_table_box margin-bottom-10">
              <div class="cell">{{ $t('modeler.auditManSetting') }}</div>
              <div class="cell align-right" style="width: 130px">
                <el-button size="mini" @click="openFullSelector">{{ $t('modeler.common.add') }}</el-button>
                <el-button size="mini" @click="cleanFullSelected()">{{ $t('modeler.common.clear') }}</el-button>
              </div>
            </div>
            <div class="revie-list" :style="{ height: scrollerHeight }">
              <template v-if="select_id_obj_list.length > 0">
                <div class="list" v-for="(item, index) in select_id_obj_list" :key="item.id">
                  <div class="cell-text">
                    <el-tooltip effect="light" class="item" :content="showTips(item)" placement="top">
                      <div class="name" style="cursor: pointer">
                        <template v-if="deal_type === 'zjsh'">{{ index + 1 }}{{ $t('modeler.level') }}</template>
                        <i class="el-icon-user"></i>{{ item.name }}
                      </div>
                    </el-tooltip>
                  </div>
                  <div class="cell-btn">
                    <a class="btn" @click="remove(item.id, 'user')"><i class="el-icon-error"></i></a>
                  </div>
                </div>
              </template>
              <template v-if="select_role_id_obj_list.length > 0">
                <div class="list" v-for="(item, index) in select_role_id_obj_list" :key="item.id">
                  <div class="cell-text">
                    <el-tooltip effect="light" class="item" :content="showTips(item)" placement="top">
                      <div class="name" style="cursor: pointer">
                        <template v-if="deal_type === 'zjsh'">{{ select_id_obj_list.length + index + 1 }}{{ $t('modeler.level') }}</template>
                        <i class="el-icon-user-solid"></i>{{ item.name }}
                      </div>
                    </el-tooltip>
                  </div>
                  <div class="cell-btn">
                    <a class="btn" @click="remove(item.id, 'role')"><i class="el-icon-error"></i></a>
                  </div>
                </div>
              </template>
              <div v-if="select_id_obj_list.length === 0 && select_role_id_obj_list.length === 0" class="align-center gray">
                {{ $t('modeler.auditNoSetTip') }}
              </div>
              <!--list-->
            </div>
          </div>
        </div>
      </div>
    </div>
    <OrgSelect ref="orgSelect" @output="fullSelectorCall" :deal_type="deal_type" :title="dialog_title" :multiple="true"></OrgSelect>
    <ShareSelect ref="stepSelect" @output="stepSelectorCall" :deal_type="deal_type" :title="dialog_title" :checkedUserIds="auditorObj" :selectDocList="selectDocObj" :procDefId="process_obj.id"></ShareSelect>
  </div>
</template>

<script>
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'
import OrgSelect from './full-selector/index'
import ShareSelect from './share-selector/index'
import xeUtils from 'xe-utils'
import MultiChoice from '@/components/MultiChoice'
import { getStrategyPage, saveStrategy, updateStrategy, deleteStrategy } from '@/api/docShareStrategy.js'
export default {
  name: 'basicProperties',
  props: {
    element: {
      required: true,
      type: Object
    },
    bpmn_modeler: {
      required: true,
      type: Object
    },
    doc_audit_strategy_data: {
      required: true,
      type: Array
    },
    process_obj: {
      required: true,
      type: Object
    },
    proc_def_key: {
      type: String,
      required: true
    },
    disable:{
      type: Boolean,
      default:false
    }
  },
  components: { OrgSelect, ShareSelect, MultiChoice },
  data() {
    const multic_hoice_types = [
      { label: this.$i18n.tc('modeler.multicTypeLabel.libName'), value: 'doc_name' },
      { label: this.$i18n.tc('modeler.multicTypeLabel.auditor'), value: 'auditor' }
    ]
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if(/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)){
        callback(new Error(this.$i18n.tc('modeler.illegalCharacterPrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 20){
        callback(new Error(this.$i18n.tc('modeler.linkNameLengthErrorBack')))
      }else if (value.trim().length > 0) {
        // 如果等于旧名称就认为没有修改
        if(this.old_name === value){
          callback()
        }
      } else {
        callback()
      }
    }
    return {
      form: {},
      select_id_list: [],
      select_id_obj_list: [],
      select_role_id_list: [],
      select_role_id_obj_list: [],
      restaurantsDoc:[],
      multipleSelection: [],
      strategyTableData:[],
      tableHeight:600,
      showHandelBtn:false,
      tableDataLoading:false,
      auditorNamesPopover:false,
      operateType:'',
      multic_hoice_types,
      search_obj: [],
      strategyParams:{
        doc_name:'',
        doc_type:'',
        auditor:''
      },
      strategyPageParams:{
        pageNumber:1,
        pageSize:50,
        total:0
      },
      doc_type_options:[
        { text: this.$i18n.tc('modeler.docTypeOptions.user_doc_lib'), value: 'user_doc_lib' },
        { text: this.$i18n.tc('modeler.docTypeOptions.department_doc_lib'), value: 'department_doc_lib' },
        { text: this.$i18n.tc('modeler.docTypeOptions.custom_doc_lib'), value: 'custom_doc_lib' }
      ],
      type_options: [
        { label: this.$i18n.tc('modeler.procType.DOC_SHARE'), value: 'doc_share' },
        { label: this.$i18n.tc('modeler.procType.DOC_FLOW'), value: 'doc_flow' },
        { label: this.$i18n.tc('modeler.procType.DOC_SYNC'), value: 'doc_sync' },
        { label: this.$i18n.tc('modeler.procType.DOC_SECRET'), value: 'doc_secret' }
      ],
      choose_doc_lib_ids: [], // 审核范围组件选择的文档库
      dialog_title: '',
      title_type: {
        edit: this.$i18n.tc('modeler.editMembers'),
        add: this.$i18n.tc('modeler.addMembers')
      },
      rules: {
        name: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'change' },
          { required: true, trigger: 'change', validator: validateName }
        ],
        type: { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'change' }
      }
    }
  },
  computed: {
    is_share() {
      return this.process_obj.type === 'doc_share'
    },
    is_edit() {
      if (['', 'null', 'undefined'].includes(this.proc_def_key + '')) {
        return false
      } else {
        return true
      }
    },
    auditorObj:{
      get() {
        const arr = []
        let _this = this
        _this.doc_audit_strategy_data.forEach(item => {
          if (item.act_def_id === _this.form.id) {
            item.auditor_list.forEach(auditor => {
              arr.push(auditor.user_id)
            })
          }
        })
        if(arr.length > 0){
          return arr.filter(item=>item)
        }
        return arr
      }
    },
    selectDocObj:{
      get() {
        const arr = []
        let _this = this
        _this.multipleSelection.forEach(item => {
          arr.push(item)
        })
        if(arr.length > 0){
          return arr.filter(item=>item)
        }
        return arr
      }
    },
    docAuditStrategyData() {
      return this.doc_audit_strategy_data
    },
    scrollerHeight: function() {
      return window.innerHeight - 400 + 'px'
    },
    selectIds() {
      return this.select_id_list.join(',')
    },
    selectRoleIds() {
      return this.select_role_id_list.join(',')
    },
    elementType() {
      const { type } = this.element || {}
      if (type && type.indexOf('bpmn:') !== -1) {
        const realType = type.substring(type.indexOf('bpmn:') + 5)
        if (realType === 'Process') {
          return 'Root'
        } else if (realType.includes('Task')) {
          return 'Task'
        }
      }
      return ''
    },
    process_obj_type() {
      const type = this.process_obj.type
      let flag = ''
      switch (type) {
      case 'doc_share':
      case 'doc_secret':
        flag = '2'
        break
      case 'doc_flow':
      case 'doc_sync':
        flag = '1'
        break
      }
      return flag
    },
    deal_type: {
      get() {
        const businessObject = getBusinessObject(this.element)
        if (businessObject && businessObject.extensionElements) {
          const { values } = businessObject.extensionElements
          if (values) {
            let element = {}
            values.forEach(el => {
              if (el.id === 'dealType') {
                element = el
                return
              }
            })
            return element.value
          }
        }
        return ''
      },
      set(val) {
        const businessObject = getBusinessObject(this.element)
        if (businessObject.extensionElements) {
          // const { values } = businessObject.extensionElements;
        }
        this.setExtensionElements([{ id: 'dealType', value: val }], [])
        const modeling = this.bpmn_modeler.get('modeling')
        if (['hqsh', 'tjsh'].includes(val)) {
          modeling.updateProperties(this.element, { 'activiti:assignee': '${assignee}' })
          this.setLoopEntry('bpmn:MultiInstanceLoopCharacteristics', {
            property: { isSequential: false },
            attrs: { isSequential: false, 'activiti:collection': '${assigneeList}', 'activiti:elementVariable': 'assignee' }
          })
        } else if (['zjsh'].includes(val)) {
          modeling.updateProperties(this.element, { 'activiti:assignee': '${assignee}' })
          this.setLoopEntry('bpmn:MultiInstanceLoopCharacteristics', {
            property: { isSequential: true },
            attrs: { 'activiti:collection': '${assigneeList}', 'activiti:elementVariable': 'assignee' }
          })
        } else {
          this.setLoopEntry()
        }
        const date = new Date()
        if (this.element.sync) {
          this.$delete(this.element, 'sync')
        } else {
          this.$set(this.element, 'sync', date + '')
        }
      }
    }
  },
  watch: {
    search_obj: {
      deep: true,
      handler(val) {
        Object.keys(this.strategyParams).forEach(item => {
          this.strategyParams[item] = ''
        })
        val.forEach(el => {
          this.strategyParams[el.type] = this.strategyParams[el.type] ? this.strategyParams[el.type] : el.val
        })
        this.pageNumber = 1
        this.loadProcessStrategy()
      }
    },
    docAuditStrategyData: {
      deep: true,
      handler(val) {
        this.loadProcessStrategy()
      }
    },
    selectIds(val) {
      if(this.process_obj_type === '1'){
        this.$refs['orgSelect'].getCheckedFullDataByIds(val).then(res => {
          const order_list = []
          res.forEach(el => {
            order_list[this.select_id_list.indexOf(el.id)] = el
          })
          this.select_id_obj_list = order_list
          // this.fullSelectorCall(order_list)
        }).catch(() => {})
      }
      if (this.elementType === 'Task') {
        this.$set(this.form, 'activiti:candidateUsers', val)
      }
    },
    selectRoleIds(val) {
      if(this.process_obj_type === '1'){
        this.$refs['orgSelect'].getCheckedRoleByIds(val).then(res => {
          const order_list = []
          res.forEach(el => {
            order_list[this.select_role_id_list.indexOf(el.id)] = el
          })
          this.select_role_id_obj_list = order_list
          // this.fullSelectorCall(order_list)
        }).catch(() => {})
      }
      if (this.elementType === 'Task') {
        this.$set(this.form, 'activiti:candidateGroups', val)
      }
    },
    form: {
      deep: true,
      handler: function(nVal) {
        let val = { ...nVal }
        if (this.elementType === 'Root') {
          val = { ...nVal, name: this.process_obj.name }
        }
        const _this = this
        const businessObject = getBusinessObject(this.element)
        const attrs = businessObject.$attrs
        const originalVal = { id: businessObject.id, name: businessObject.name, ...attrs }
        const keys = Object.keys(val)
        const filterKeys = keys.filter(el => val[el] !== originalVal[el])
        const modeling = _this.bpmn_modeler.get('modeling')
        if (filterKeys.length > 0) {
          const data = xeUtils.pick(val, filterKeys)
          if(data.name !== '' && data.name !== undefined){
            data.name =  data.name.replace(/(^\s*)|(\s*$)/g, '')
          }
          modeling.updateProperties(_this.element, { ...data })
        }
      }
    },
    element: {
      deep: true,
      handler: function(val) {
        if (val) {
          this.initForm(val)
        }
      }
    }
  },
  created(){
    this.initForm(this.element)
  },
  mounted(){
    let _this = this
    _this.$nextTick(function () {
      _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 160

      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        _this.tableHeight = window.innerHeight - _this.$refs.multipleTable.$el.offsetTop - 160
      })
    })
    this.loadProcessStrategy()
  },
  methods: {
    initForm(element){
      const businessObject = getBusinessObject(element)
      Object.keys(this.form).forEach(key => this.$delete(this.form, key))

      this.setFormDefaultVal()
      this.form = {
        ...this.form,
        id: businessObject.id,
        name: businessObject.name,
        ...businessObject.$attrs
      }
      const users = this.form['activiti:candidateUsers'] ? this.form['activiti:candidateUsers'] : ''
      this.select_id_list = []
      if (users.length > 0) {
        this.select_id_list.push(users.split(',')[0])
      }
      const roles = this.form['activiti:candidateGroups'] ? this.form['activiti:candidateGroups'] : ''
      this.select_role_id_list = []
      if (roles.length > 0) {
        this.select_role_id_list = roles.split(',')
      }
    },
    showTips(item) {
      if (item.type === 'user') {
        return `${item.name}（${item.user_code}）- ${item.parent_dep_paths}`
      } else {
        return '角色：' + item.name
      }
    },
    getAuditorNameList(auditorNames){
      return auditorNames.split('、')
    },
    delAuditorNames(auditModel, auditorNames){
      const _this = this
      const auditorNameArr = auditorNames.split('、')
      if(auditModel === 'zjsh'){
        let level = 1
        let names = ''
        auditorNameArr.forEach(e =>{
          if(names !== ''){
            names += '、' + '（' + level + _this.$i18n.tc('modeler.level') + '）' + e
          } else {
            names = '（' + level + _this.$i18n.tc('modeler.level') + '）' + e
          }
          level++
        })
        return names
      } else {
        return auditorNames
      }
    },
    formatDate(time) {
      return xeUtils.toDateString(time)
    },
    remove (id, type) {
      if (type === 'user') {
        this.select_id_list.splice(this.select_id_list.indexOf(id), 1)
        this.$set(this.form, 'activiti:candidateUsers', this.select_id_list.join(','))
      } else if (type === 'role') {
        this.select_role_id_list.splice(this.select_role_id_list.indexOf(id), 1)
        this.$set(this.form, 'activiti:candidateGroups', this.select_role_id_list.join(','))
      }
    },
    docAuditStrategyDataRemove(_obj) {
      let _this = this
      _this.$confirm(_this.$i18n.tc('message.onceConfirmDelete'), '', {
        confirmButtonText: _this.$i18n.tc('button.confirm'),
        cancelButtonText: _this.$i18n.tc('button.cancel'),
        iconClass: 'warning-blue',
        type: 'warning'
      }).then(() => {
        _this.tableDataLoading = true
        let idArr = []
        idArr.push(_obj.id)
        deleteStrategy(idArr).then(res => {
          _this.$message.success(_this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadProcessStrategy()
        }).catch(() => {})
      }).catch(() => {
      })
    },
    /**
     * @param {String} userIds 多个用","分格
     */
    openFullSelector() {
      this.dialog_title = this.title_type.add
      this.$refs['orgSelect'].openSelector(this.selectIds, this.selectRoleIds)
    },
    cleanFullSelected () {
      this.select_id_list = []
      this.$set(this.form, 'activiti:candidateUsers', '')
      this.select_role_id_list = []
      this.$set(this.form, 'activiti:candidateGroups', '')
    },
    fullSelectorCall(dataList) {
      let userIds = ''
      let roleIds = ''
      const userIdArr = []
      const roleIdArr = []
      dataList.forEach(item => {
        if (item.type === 'user') {
          userIdArr.push(item.id)
          userIds += ',' + item.id
        } else if (item.type === 'role') {
          roleIdArr.push(item.id)
          roleIds += ',' + item.id
        }
      })
      this.select_id_list = userIdArr
      this.select_role_id_list = roleIdArr
      if (this.elementType === 'Task') {
        this.$set(this.form, 'activiti:candidateUsers', userIds.startsWith(',') ? userIds.substring(1) : userIds)
        this.$set(this.form, 'activiti:candidateGroups', roleIds.startsWith(',') ? roleIds.substring(1) : roleIds)
      }
    },
    openStepSelector(_obj) {
      this.dialog_title = this.title_type.add
      this.operateType = ''
      // eslint-disable-next-line no-prototype-builtins
      if (_obj && JSON.stringify(_obj) !== '{}' && _obj.hasOwnProperty('doc_id') && _obj.hasOwnProperty('doc_name')) {
        this.operateType = 'single'
        this.dialog_title = this.title_type.edit
      }
      this.$refs['stepSelect'].openSelector(_obj, this.operateType)
    },
    stepSelectorCall(_objArr, isUpdate) {
      const _this = this
      _this.deal_type = 'tjsh'
      _objArr.forEach(_obj => {
        _obj.act_def_id = _this.form.id
        _obj.act_def_name = _this.form.name
      })
      if(_objArr.length === 1 || isUpdate){
        _this.tableDataLoading = true
      }
      if (isUpdate) {
        updateStrategy(_objArr, _this.process_obj.id).then(res => {
          _this.$message.success(_this.$i18n.tc('modeler.common.editTip'))
          _this.loadProcessStrategy()
        }).catch(() => {})
      } else {
        if(!_this.$refs['stepSelect'].checkStrategyResult){
          _this.$refs['stepSelect'].msgVisible = true
        }
        _this.batchSaveStrategy(_objArr)

        let arr = []
        _objArr.forEach(item =>{
          if(arr.length === 0){
            item.auditor_list.forEach(auditor => {
              arr.push(auditor.user_id)
            })
          }
        })
        // 初始化xml审核员
        if(_this.select_id_list.length === 0){
          _this.select_id_list = arr
          _this.$emit('processSave')
        }
      }
    },
    /**
     * 分批保存策略（进度条处理）
     * @param _objArr 策略集合
     */
    batchSaveStrategy(_objArr){
      const _this = this
      let dataArr = _this.chunck(_objArr, 200)
      let addNum = 0
      dataArr.forEach( data => {
        saveStrategy(data, _this.process_obj.id).then(res => {
          addNum += data.length
          const percent = 50 + parseInt(addNum / _objArr.length / 2 * 100)
          _this.$refs['stepSelect'].percentage = percent
          if(percent === 100){
            setTimeout(() => {
              if(_objArr.length === 1 ){
                _this.$message.success(_this.$i18n.tc('strategy.saveSuccess'))
              } else {
                _this.$message.success(_this.$i18n.tc('strategy.saveBatchSuccessPr') + _objArr.length + _this.$i18n.tc('strategy.saveBatchSuccessSuffix'))
              }
              _this.loadProcessStrategy()
            }, 500)
          }
        }).catch(() => {})
      })
    },
    /**
     * 拆分策略集合
     * @param _objArr 策略集合
     * @param size 拆分数组长度
     */
    chunck(_arr, size){
      let newArr = []
      for(let i = 0;i < _arr.length;i += size){
        let sliceArr = [..._arr]
        newArr.push(sliceArr.slice(i,i + size))
      }
      return newArr
    },
    setLoopEntry(type, options) {
      let loopCharacteristics
      if (!type) {
        loopCharacteristics = undefined
      } else {
        loopCharacteristics = this.bpmn_modeler.get('moddle').create(type)
        if (options) {
          if (options.attrs) {
            Object.keys(options.attrs).forEach(key => {
              loopCharacteristics.$attrs[key] = options.attrs[key]
            })
          }
          if (options.property) {
            Object.keys(options.property).forEach(key => {
              loopCharacteristics[key] = options.property[key]
            })
          }
        }
      }
      const modeling = this.bpmn_modeler.get('modeling')
      modeling.updateProperties(this.element, { loopCharacteristics: loopCharacteristics })
    },
    /**
     * @param {Array} 添加的值
     * @param {Array} existenceElements 实际值
     */
    setExtensionElements(elements, existenceElements) {
      let extensionElements
      const modeling = this.bpmn_modeler.get('modeling')
      extensionElements = this.bpmn_modeler.get('moddle').create('bpmn:ExtensionElements')
      const type = 'ExpandProperty'
      elements.forEach(el => {
        const extensionElement = this.createElement(type, el)
        extensionElement.$parent = extensionElements
        existenceElements.push(extensionElement)
      })
      extensionElements.values = existenceElements
      extensionElements.$parent = getBusinessObject(this.element)
      modeling.updateProperties(this.element, { extensionElements: extensionElements })
    },
    createElement(type, options) {
      const extensionElement = this.bpmn_modeler.get('moddle').create(`activiti:${type}`)
      Object.keys(options).forEach(key => {
        extensionElement[key] = options[key]
      })
      return extensionElement
    },
    /**
     * 是第一个任务节点
     */
    isFirstTask(_businessObject) {
      const incoming = _businessObject.incoming || []
      let isFirstTask = false
      incoming.forEach(el => {
        if (el.sourceRef.$type === 'bpmn:StartEvent') {
          isFirstTask = true
          return
        }
      })
      return isFirstTask
    },
    /**
     * 设置表单默认值
     */
    setFormDefaultVal() {
      if (this.elementType === 'Root') {
        // this.$set(this.form, 'sort', 1);
      } else if (this.elementType === 'Task') {
        // todo: 设置默认值
      }
    },
    querySearch(queryString, cb) {
      let restaurants = this.restaurantsDoc
      let results = queryString ? restaurants.filter(this.createFilter(queryString)) : restaurants
      // 调用 callback 返回建议列表的数据
      cb(results)
    },
    createFilter(queryString) {
      return (restaurant) => {
        return (restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0)
      }
    },
    handleSelect(){
      this.strategyParams.query_name = this.strategyParams.name
    },
    editStepAll(){
      this.operateType = 'batch'
      this.dialog_title = this.title_type.edit
      this.$refs['stepSelect'].openSelector(null, this.operateType)
    },
    delStepAll(){
      let _this = this
      _this.$confirm(_this.$i18n.tc('message.confirmDelete'), '', {
        confirmButtonText: _this.$i18n.tc('button.confirm'),
        cancelButtonText: _this.$i18n.tc('button.cancel'),
        iconClass: 'warning-blue',
        type: 'warning'
      }).then(() => {
        let idArr = []
        _this.multipleSelection.forEach(select => {
          idArr.push(select.id)
        })
        _this.tableDataLoading = true
        deleteStrategy(idArr).then(res => {
          _this.$message.success(_this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadProcessStrategy()
        }).catch(() => {})
      }).catch(() => {
      })
    },
    handleFilterChange(item){
      const typeArr = item.doc_type
      this.strategyParams.doc_type = ''
      if(typeArr.length > 0){
        this.strategyParams.doc_type = item.doc_type[0]
      }
      this.loadProcessStrategy()
    },
    handleSelectionChange(val){
      this.multipleSelection = val
      this.strategyPageParams.pageNumber = 1
      if(this.multipleSelection.length > 1){
        this.showHandelBtn = true
      } else {
        this.showHandelBtn = false
      }
    },
    handleCurrentChange(val) {
      this.loadProcessStrategy()
    },
    handleSizeChange(val){
      this.strategyPageParams.pageSize = val
      this.loadProcessStrategy()
    },
    loadProcessStrategy(){
      const _this = this
      const query = { ..._this.strategyParams, proc_def_id:_this.process_obj.id, offset: _this.strategyPageParams.pageNumber, limit: _this.strategyPageParams.pageSize }
      _this.tableDataLoading = true
      getStrategyPage(query).then(res => {
        _this.strategyTableData = res.entries
        _this.strategyPageParams.total = res.total_count
        _this.tableDataLoading = false
      }).catch(() => {})
    },
    checkValidate(){
      let result = true
      this.$refs['basicForm'].validate(valid => {
        result = valid
      })
      return result
    },
    saveProcess(){
      this.form.name = this.form.name.replace(/(^\s*)|(\s*$)/g, '')
      this.$emit('processSave')
    }
  }
}
</script>

<style lang="scss" scoped>
  .el-table-column--selection >>> .cell{
    padding-left:0px !important;
  }
</style>
