<template>
  <div class="basicProperties no-border-bottom">
    <div class="gray-tstext">{{ $t('modeler.strategyTabelTips') }}</div>
    <div class="no-border">
      <div class="card-body">
        <el-form ref="sharePropertiesForm" :model="form" label-position="left" hide-requied-aterisk label-width="0px" size="small" :rules="rules">
          <el-form-item prop="name">
            <label class="font-bold"><span class="red"> * </span>{{$t('modeler.nodeName')}}：</label>
            <el-input  v-model="form.name" style="width: 300px;" @change="saveProcess"></el-input>
          </el-form-item>
          <el-form-item>
            <label class="font-bold" >{{$t('strategy.strategyName')}}：</label>
          </el-form-item>
        </el-form>
        <div>
          <el-row :gutter="20">
            <el-col :span="8" class="align-left">
              <el-button type="primary" size="mini" icon="el-icon-plus" @click="openStepSelector">{{$t('strategy.addStrategyName')}}</el-button>
              <el-button v-if="showHandelBtn" size="mini" icon="el-icon-edit-outline" @click="editStepAll">{{$t('button.edit')}}</el-button>
              <el-button v-if="showHandelBtn" size="mini" icon="el-icon-delete" @click="delStepAll">{{$t('button.delete')}}</el-button>
            </el-col>
            <el-col :span="16" class="align-right">
              <MultiChoice v-model="multiChoiceSearch" :types="multic_hoice_types" :placeholder="$t('input.search')"/>
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
                              <li style="width:150px;overflow:hidden;text-overflow:ellipsis;white-space:pre;word-break:keep-all;">
                                <span v-if="scope.row.audit_model === 'zjsh'">（{{index + 1}}{{$t('modeler.level')}}）</span>{{item}}
                              </li>
                            </el-tooltip>
                          </template>
                        </ul>
                      </div>
                      <span slot="reference" onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'" onmouseleave="this.style.color='',this.style.opacity=''">
                        <el-tooltip placement="top-start" effect="light" :offset="0" :visible-arrow="false" :content="delAuditorNames(scope.row.audit_model, scope.row.auditorNames)">
                          <span style="overflow:hidden;text-overflow:ellipsis;white-space:pre;word-break:keep-all;" @click="auditorNamesPopover = true">{{delAuditorNames(scope.row.audit_model, scope.row.auditorNames)}}</span>
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
                    <el-button size="mini" icon="el-icon-edit-outline" @click="openStepSelector(scope.row)"></el-button>
                    <el-button size="mini" icon="el-icon-delete" @click="docAuditStrategyDataRemove(scope.row)"></el-button>
                  </template>
                </el-table-column>
                <div slot="empty" class="empty-box">
                  <div v-if="strategyParams.doc_names.length > 0 || strategyParams.auditors.length > 0">
                    <div class="no-seach"></div>
                    <p class="text">{{$t('message.noSeachTableTips')}}</p>
                  </div>
                  <div v-else>
                    <div class="empty-text"></div>
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
                layout="total, prev, pager, next, sizes"
                :total="strategyPageParams.total">
              </el-pagination>
            </div>
          </div>
          <div class="gray-tstext">{{ $t('modeler.strategyTabelTips') }}</div>
        </div>
      </div>
    </div>
    <ShareSelect ref="stepSelect" @output="stepSelectorCall" :title="dialog_title" :checkedUserIds="checkedUserIds" :selectDocList="selectDocList" :procDefId="process_obj.id"></ShareSelect>
  </div>
</template>

<script>
import ShareSelect from './share-selector/index'
import MultiChoice from '@/components/MultiChoice'
import { getStrategyPage, saveStrategy, updateStrategy, deleteStrategy } from '@/api/docShareStrategy.js'
export default {
  name: 'docShareProperties',
  props: {
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
    approver_config: {
      required: true,
      type: Object
    }
  },
  components: { ShareSelect, MultiChoice },
  data() {
    const multic_hoice_types = [
      { label: this.$i18n.tc('modeler.multicTypeLabel.libName'), value: 'doc_names' },
      { label: this.$i18n.tc('modeler.multicTypeLabel.auditor'), value: 'auditors' }
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
      restaurantsDoc:[],
      multipleSelection: [],
      strategyTableData:[],
      tableHeight:600,
      showHandelBtn:false,
      tableDataLoading:false,
      auditorNamesPopover:false,
      operateType:'',
      multic_hoice_types,
      multiChoiceSearch: [],
      strategyParams:{
        doc_names: [],
        doc_type:'',
        auditors: []
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
    checkedUserIds:{
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
    selectDocList:{
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
    }
  },
  watch: {
    multiChoiceSearch: {
      deep: true,
      handler(val) {
        this.strategyParams = {
          doc_names: [],
          doc_type:'',
          auditors: []
        }
        val.forEach(el => {
          this.strategyParams[el.type].push(el.val)
        })
        this.strategyPageParams.pageNumber = 1
        this.loadProcessStrategy()
      }
    },
    docAuditStrategyData: {
      deep: true,
      handler() {
        this.loadProcessStrategy()
      }
    },
    form: {
      deep: true,
      handler: function(nVal) {
        let approverConfig = {...this.approver_config}
        approverConfig.nodeName = nVal.name
        this.$emit('updateApproverConfig', approverConfig)
      }
    }
  },
  created(){
    this.initForm(this.approver_config)
  },
  mounted(){
    this.$nextTick(function () {
      this.tableHeight = window.innerHeight - this.$refs.multipleTable.$el.offsetTop - 160

      // 监听窗口大小变化
      let self = this
      window.addEventListener('resize', () => {
        self.tableHeight = window.innerHeight - self.$refs.multipleTable.$el.offsetTop - 160
      })
    })
    this.loadProcessStrategy()
  },
  methods: {
    /**
     * 初始化表单
     */
    initForm(_config){
      this.form = {
        ...this.form,
        id: _config.nodeId,
        name: _config.nodeName
      }
    },
    /**
     * 加载共享审核策略
     */
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
    /**
     * 分解获取审核员列表
     * @param auditorNames
     */
    getAuditorNameList(auditorNames){
      return auditorNames.split('、')
    },
    /**
     * 审核员展现处理（逐级展现级别）
     * @param auditModel
     * * @param auditorNames
     */
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
        if(this.$i18n.locale === 'en-us'){
          return names.replaceAll('、', ', ')
        }
        return names
      } else {
        if(this.$i18n.locale === 'en-us'){
          return auditorNames.replaceAll('、', ', ')
        }
        return auditorNames
      }
    },
    /**
     * 开启共享审核策略编辑
     * * @param _obj
     */
    openStepSelector(_obj) {
      const _this = this
      _this.dialog_title = _this.title_type.add
      _this.operateType = ''
      // eslint-disable-next-line no-prototype-builtins
      if (_obj && JSON.stringify(_obj) !== '{}' && _obj.hasOwnProperty('doc_id') && _obj.hasOwnProperty('doc_name')) {
        _this.operateType = 'single'
        _this.dialog_title = _this.title_type.edit
      }
      _this.$refs['stepSelect'].openSelector(_obj, this.operateType)
    },
    /**
     * 开启批量编辑共享审核策略
     */
    editStepAll(){
      this.operateType = 'batch'
      this.dialog_title = this.title_type.edit
      this.$refs['stepSelect'].openSelector(null, this.operateType)
    },
    /**
     * 共享审核策略确认编辑回调
     * * @param _objArr
     * * @param isUpdate
     */
    stepSelectorCall(_objArr, isUpdate) {
      const _this = this
      _objArr.forEach(_obj => {
        _obj.act_def_id = _this.form.id
        _obj.act_def_name = _this.form.name
        _obj.strategy_type = 'named_auditor'
      })
      if(_objArr.length === 1 || isUpdate){
        _this.tableDataLoading = true
      }
      if (isUpdate) {
        updateStrategy(_objArr, _this.process_obj.id).then(() => {
          this.$toast('success', _this.$i18n.tc('modeler.common.editTip'))
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
      }
    },
    /**
     * 表单检验
     */
    checkValidate(){
      let result = true
      this.$refs['sharePropertiesForm'].validate(valid => {
        result = valid
      })
      return result
    },
    /**
     * 保存流程
     */
    saveProcess(){
      this.form.name = this.form.name.replace(/(^\s*)|(\s*$)/g, '')
      this.$emit('processSave')
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
        saveStrategy(data, _this.process_obj.id).then(() => {
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
    /**
     * 共享审核策略删除
     * * @param _obj
     */
    docAuditStrategyDataRemove(_obj) {
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('message.onceConfirmDelete'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        _this.tableDataLoading = true
        let idArr = []
        idArr.push(_obj.id)
        deleteStrategy(idArr).then(() => {
          this.$toast('success', _this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadProcessStrategy()
        }).catch(() => {})
      }).catch(() => {
      })
    },
    /**
     * 批量删除共享审核策略
     */
    delStepAll(){
      let _this = this
      _this.$dialog_confirm(_this.$i18n.tc('message.confirmDelete'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        let idArr = []
        _this.multipleSelection.forEach(select => {
          idArr.push(select.id)
        })
        _this.tableDataLoading = true
        deleteStrategy(idArr).then(() => {
          this.$toast('success', _this.$i18n.tc('modeler.common.deleteTip'))
          _this.loadProcessStrategy()
        }).catch(() => {})
      }).catch(() => {
      })
    },
    /**
     * 共享审核策略列表文档库类型筛选过滤
     * @param item
     */
    handleFilterChange(item){
      const typeArr = item.doc_type
      this.strategyParams.doc_type = ''
      if(typeArr.length > 0){
        this.strategyParams.doc_type = item.doc_type[0]
      }
      this.loadProcessStrategy()
    },
    /**
     * 复选框change
     * @param val
     */
    handleSelectionChange(val){
      this.multipleSelection = val
      this.strategyPageParams.pageNumber = 1
      if(this.multipleSelection.length > 1){
        this.showHandelBtn = true
      } else {
        this.showHandelBtn = false
      }
    },
    /**
     * 当前选中的分页
     * @param val
     */
    handleCurrentChange() {
      this.loadProcessStrategy()
    },
    /**
     * 当前分页展示条目change
     * @param val
     */
    handleSizeChange(val){
      this.strategyPageParams.pageSize = val
      this.loadProcessStrategy()
    }
  }
}
</script>

<style lang="scss" scoped>
  .el-table-column--selection >>> .cell{
    padding-left:0px !important;
  }
</style>
