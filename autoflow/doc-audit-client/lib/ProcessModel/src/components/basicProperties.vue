<template>
  <div class="basicProperties no-border-bottom">
    <div class="basi-card no-border">
      <div class="card-head">{{ elementType === 'Root' ? $t('modeler.processInfo') : $t('modeler.actInfo') }}</div>
      <div class="card-body">
        <el-form :model="form" :class="elementType === 'Root' ? 'new-form' : ''" :label-position="elementType === 'Root' ? 'right' : 'top'">
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
            <el-form-item :label="$t('modeler.nodeName')">
              <el-input size="mini" v-model="form.name" maxlength="15"></el-input>
            </el-form-item>
            <el-form-item v-if="!is_share">
              <template v-slot:label>
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
              <el-input size="mini" v-model="form.name" maxlength="15" />
            </el-form-item>
          </template>
        </el-form>
        <div v-if="elementType === 'Task'">
          <div v-if="process_obj_type === '1'">
            <div class="rzsj_table_box margin-bottom-10">
              <div class="cell">{{ $t('modeler.auditManSetting') }}</div>
              <div class="cell align-right" style="width: 130px">
                <el-button size="mini" @click="openFullSelector">{{ $t('modeler.common.add') }}</el-button>
                <el-button size="mini" @click="select_id_list = []">{{ $t('modeler.common.clear') }}</el-button>
              </div>
            </div>
            <div class="revie-list" :style="{ height: scrollerHeight }">
              <template v-if="select_id_obj_list.length > 0">
                <div class="list" v-for="(item, index) in select_id_obj_list" :key="item.id">
                  <div class="cell-text">
                    <el-tooltip effect="light" class="item" :content="`${item.name}`" placement="top">
                      <div class="name" style="cursor: pointer">
                        <template v-if="deal_type === 'zjsh'">{{ index + 1 }}{{ $t('modeler.level') }}</template> {{ item.name }}
                      </div>
                    </el-tooltip>
                  </div>
                  <div class="cell-btn">
                    <a class="btn" @click="arrayListRemove(select_id_list, item.id)"><i class="el-icon-error"></i></a>
                  </div>
                </div>
              </template>
              <div v-else class="align-center gray">{{ $t('modeler.auditNoSetTip') }}</div>
              <!--list-->
            </div>
          </div>
          <div v-if="process_obj_type === '2'">
            <div class="rzsj_table_box margin-bottom-10">
              <div class="cell">{{ $t('modeler.auditManSetting') }}</div>
              <div class="cell align-right" style="width: 130px">
                <el-button size="mini" @click="openStepSelector()">{{ $t('modeler.common.add') }}</el-button>
                <el-button size="mini" @click="stepSelectObj = []">{{ $t('modeler.common.clear') }}</el-button>
              </div>
            </div>
            <div class="revie-list" :style="{ height: scrollerHeight }">
              <template v-if="stepSelectObj.length > 0">
                <div class="list" v-for="(item, index) in stepSelectObj" :key="item.id">
                  <div class="cell-text">
                    <el-tooltip class="item" effect="light" :content="`${item.user_name}`" placement="top">
                      <div class="name" style="cursor: pointer">
                        <template v-if="deal_type === 'zjsh'">{{ index + 1 }}{{ $t('modeler.level') }}</template> {{ item.user_name }}
                      </div>
                    </el-tooltip>
                    <el-tooltip class="item" effect="light" :content="`${item.doc_name}`" placement="top">
                      <div class="text" style="cursor: pointer">{{ item.doc_name }}</div>
                    </el-tooltip>
                  </div>
                  <div class="cell-btn">
                    <a class="btn" @click="openStepSelector(item)"><i class="icon iconfont icon-bianjifuben"></i></a>
                    <a class="btn" @click="stepSelectObjRemove(index)"><i class="el-icon-error"></i></a>
                  </div>
                </div>
              </template>
              <div v-else class="align-center gray">{{ $t('modeler.auditNoSetTip') }}</div>
              <!--list-->
            </div>
          </div>
        </div>
      </div>
    </div>
    <OrgSelect ref="orgSelect" @output="fullSelectorCall" :deal_type="deal_type" :title="dialog_title" :multiple="true"></OrgSelect>
    <StepSelect ref="stepSelect" @output="stepSelectorCall" :deal_type="deal_type" :title="dialog_title" :checkedUserIds="stepSelectObj.map(el => el.user_id)"></StepSelect>
  </div>
</template>

<script>
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil'
import OrgSelect from './full-selector/index'
import StepSelect from './step-selector/index'
import xeUtils from 'xe-utils'

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
    doc_audit_scope_data: {
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
  components: { OrgSelect, StepSelect },
  data() {
    return {
      form: {},
      select_id_list: [],
      select_id_obj_list: [],
      type_options: [
        { label: this.$i18n.tc('modeler.procType.DOC_SHARE'), value: 'DOC_SHARE' },
        { label: this.$i18n.tc('modeler.procType.DOC_FLOW'), value: 'DOC_FLOW' },
        { label: this.$i18n.tc('modeler.procType.DOC_SYNC'), value: 'DOC_SYNC' },
        { label: this.$i18n.tc('modeler.procType.DOC_SECRET'), value: 'DOC_SECRET' }
      ],
      choose_doc_lib_ids: [], // 审核范围组件选择的文档库
      dialog_title: '',
      title_type: {
        edit: this.$i18n.tc('modeler.editMembers'),
        add: this.$i18n.tc('modeler.addMembers')
      }
    }
  },
  computed: {
    is_share() {
      return this.process_obj.type === 'DOC_SHARE'
    },
    is_edit() {
      if (['', 'null', 'undefined'].includes(this.proc_def_key + '')) {
        return false
      } else {
        return true
      }
    },
    stepSelectObj: {
      get() {
        const arr = []
        this.doc_audit_scope_data.forEach(item => {
          if (item.act_def_id === this.form.id) {
            arr.push(item)
          }
        })
        return arr
      },
      set(val) {
        this.$emit('submitAuditScope', this.form.id, val)
      }
    },
    scrollerHeight: function() {
      return window.innerHeight - 400 + 'px'
    },
    selectIds() {
      return this.select_id_list.join(',')
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
        case 'DOC_SHARE':
        case 'DOC_SECRET':
          flag = '2'
          break
        case 'DOC_FLOW':
        case 'DOC_SYNC':
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
    selectIds(val) {
      this.$refs['orgSelect'].getCheckedFullDataByIds(val).then(res => {
        const order_list = []
        res.forEach(el => {
          order_list[this.select_id_list.indexOf(el.id)] = el
        })
        this.select_id_obj_list = order_list
        this.fullSelectorCall(order_list)
      })
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
          modeling.updateProperties(_this.element, { ...data })
        }
      }
    },
    element: {
      deep: true,
      handler: function(val) {
        if (val) {
          const businessObject = getBusinessObject(val)
          Object.keys(this.form).forEach(key => this.$delete(this.form, key))
          this.setFormDefaultVal()
          this.form = {
            ...this.form,
            id: businessObject.id,
            name: businessObject.name,
            ...businessObject.$attrs
          }
          const users = this.form['activiti:candidateUsers'] ? this.form['activiti:candidateUsers'] : ''
          let ids = users
          if (ids.length > 0) {
            this.select_id_list = ids.split(',')
          } else {
            this.select_id_list = []
          }
        }
      }
    },
    stepSelectObj(val) {
      const userIds = val.map(el => el.user_id).join(',')
      if (this.elementType === 'Task') {
        this.$set(this.form, 'activiti:candidateUsers', userIds)
      }
    }
  },
  methods: {
    formatDate(time) {
      return xeUtils.toDateString(time)
    },
    arrayListRemove(select_id_list, val) {
      xeUtils.remove(select_id_list, item => item === val)
    },
    stepSelectObjRemove(index) {
      // this.stepSelectObj.splice(index, 1)
      this.$delete(this.stepSelectObj, index)
      this.$emit('submitAuditScope', this.form.id, this.stepSelectObj)
    },
    /**
     * @param {String} userIds 多个用","分格
     */
    openFullSelector() {
      this.dialog_title = this.title_type.add
      this.$refs['orgSelect'].openSelector(this.selectIds)
    },
    fullSelectorCall(userList) {
      let userIds = ''
      const arr = []
      userList.forEach(item => {
        if (item.type === 'user') {
          arr.push(item.id)
          userIds += ',' + item.id
        }
      })
      this.select_id_list = arr
      if (this.elementType === 'Task') {
        this.$set(this.form, 'activiti:candidateUsers', userIds.startsWith(',') ? userIds.substring(1) : userIds)
      }
    },
    openStepSelector(_obj) {
      this.dialog_title = this.title_type.add
      if (_obj) {
        this.dialog_title = this.title_type.edit
      }
      this.$refs['stepSelect'].openSelector(_obj)
    },
    stepSelectorCall(_objArr, isUpdate) {
      const self = this
      _objArr.forEach(_obj => {
        _obj.act_def_id = self.form.id
        _obj.act_def_name = self.form.name
        const typeMap = { DOC_SHARE: 'se', DOC_SECRET: 'st' }
        _obj.doc_type = typeMap[self.process_obj.type]
        if (isUpdate) {
          self.stepSelectObj.forEach((el, index) => {
            if (el.user_id === _obj.user_id) {
              self.stepSelectObj[index] = _obj
            }
          })
        }
      })
      if (isUpdate) { // 更新
        self.$emit('submitAuditScope', self.form.id, self.stepSelectObj)
      } else { // 新增
        self.$emit('submitAuditScope', self.form.id, [...self.stepSelectObj, ..._objArr])
      }
    },
    setLoopEntry(type, options) {
      var loopCharacteristics
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
      var extensionElements
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
