<template>
  <div style="height:100%;">
    <div class="containers" ref="content" v-loading="loading" style="height:100%">
      <!--<div class="title-sm-1">
        <span class="list">
          <i class="icon iconfont icon-dengpao-tianchong" style="color: #4996e6" />
          <span class="gray" v-if="is_share">{{$t('modeler.processDiagramShareTip')}}</span>
          <template v-else>
            <span class="gray" v-if="!is_edit"> {{ $t('modeler.processDiagramTip') }}</span>
            <template v-else>
              <span class="gray" v-if="is_edit && disable">
                {{$t('modeler.processDiagramRunTip')}}
                <a class="link" @click="addNewEdition()">{{$t('modeler.newVersion') }}</a>
              </span>
              <span class="gray" v-else> {{ $t('modeler.processDiagramTip') }}</span>
            </template>
          </template>
        </span>
        <div v-if="is_edit && !is_share" style="display: inline-block; float: right;position: relative;padding: 0 0 0 20px;">
          <el-tooltip effect="light" placement="top">
            <div slot="content" style="width: 320px">
              {{ $t('modeler.versionTips') }}
            </div>
            <span style="cursor: pointer; margin:0 5px  0 0; displa:inline-block; font-size:16px; position: absolute;top: -3px;left: 0;">
              <i class="el-icon-warning-outline" />
            </span>
          </el-tooltip>
          <el-popover ref="popoverTable" placement="bottom-end" width="225">
            <div v-loading="history_table_load" class="polist-link">
              <template v-if="history_data.length>0">
                <div v-for="item in history_data" :key="item.version" class="list">
                  <div class="text"  @click="changeVersion(item)">
                    <span class="title">{{$t('modeler.version')}}(V{{ item.version }})</span>
                    <span class="time">{{ item.pdCreateTime | formatDate }}</span>
                  </div>
                  <a class="close" type="danger" size="mini" @click="deleteProc(item)">
                    <i class="el-icon-close"></i>
                  </a>
                </div>
              </template>
              <template v-else>暂无数据</template>
            </div>
            <template slot="reference">
              <a
                @click="visible = !visible"
                >{{$t('modeler.version')}}(V{{ process_obj.version }})
                <i v-if="!visible" class="el-icon-arrow-down"></i>
                <i v-if="visible" class="el-icon-arrow-up"></i>
              </a>
            </template>
          </el-popover>
        </div>
      </div>-->
      <div class="canvas" ref="canvas">
        <el-drawer
          append-to-body
          modal-append-to-body
          size="80%"
          :visible.sync="drawer"
:custom-class="'no-header'">
          <basic-properties
            ref="basicPropertiesCh"
            :element="bpmn_modeler_select_element"
            :doc_audit_strategy_data.sync="doc_audit_strategy_data"
            :bpmn_modeler="bpmn_modeler"
            :process_obj.sync="process_obj"
            :proc_def_key="proc_def_key"
            :disable="disable"
            @processSave="save"
            @submitAuditStrategy="submitAuditStrategy"
          ></basic-properties>
        </el-drawer>
      </div>
    </div>
  </div>
</template>

<script>
import BpmnModeler from '../../../../public/js/bpmn-js/lib/Modeler'
import customTranslate from '../../../../bpmn-js/customTranslate/customTranslate'
import propertiesProviderModule from '../../../../bpmn-js/provider/magic'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import MoveModule from 'diagram-js/lib/features/move'
import BendpointsModule from 'diagram-js/lib/features/bendpoints'
import LabelEditingModule from '../../../../public/js/bpmn-js/lib/features/label-editing'
import lintModule from 'bpmn-js-bpmnlint'
import bpmnlintConfig from '../../../../packed-config'
import xeUtils from 'xe-utils'
import XEUtils from 'xe-utils'
import basicProperties from '../../../components/basicProperties'
import activitiExtension from 'ebpm-process-modeler-front/activiti.json'
import {getBusinessObject} from 'bpmn-js/lib/util/ModelUtil'
import {
  deleteProcDef,
  historyProcDef,
  procDefInfo as getProcDefObj,
  record as hasRecord
} from '@/api/processDefinition'
// @ts-ignore
import {getDefaultXml} from 'ebpm-process-modeler-front/src/utils/model.js'
import {getDocShareXml} from 'ebpm-process-modeler-front/src/utils/docShareModel.js'
import { savePro } from '@/api/processDefinition.js'

export default {
  name: 'ProcessModel',
  components: { basicProperties },
  filters: {
    formatDate(date) {
      return XEUtils.toDateString(date,'yyyy-MM-dd')
    }
  },
  props: {
    process_obj: { type: Object, required: true },
    proc_type: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      disable: true,
      drawer:false,
      bpmn_modeler: {},
      buttonDisabled: true,
      bpmn_modeler_select_element: {},
      history_data: [],
      history_table_load: false,
      visible: false,
      max_version: 0,
      anonymity_switch:'',
      rename_switch:''
    }
  },
  watch: {
    'process_obj.name': {
      deep: true,
      handler(nVal) {
        if (nVal) {
          const modeling = this.bpmn_modeler.get('modeling')
          const elementRegistry = this.bpmn_modeler.get('elementRegistry')
          modeling.updateProperties(elementRegistry.get(this.process_obj.key), { name: nVal })
        }
      }
    }
  },
  computed: {
    is_share() {
      return this.process_obj.type === 'doc_share'
    },
    is_edit() {
      return !['', 'null', 'undefined'].includes(this.proc_def_key + '')
    },
    scrollerHeight: function () {
      return window.innerHeight - 150 + 'px'
    },
    doc_audit_strategy_data: {
      get() {
        return this.process_obj.audit_strategy_list || []
      },
      set(value) {
        if(this.process_obj.audit_strategy_list && value){
          const oldVal = this.process_obj.audit_strategy_list.map(item=>item.doc_id + item.auditor_list).sort().join(',')
          const newVal = value.map(item=>item.doc_id + item.auditor_list).sort().join(',')
          if(oldVal != newVal){
            this.$emit('change', true)
          }
        }
        this.$set(this.process_obj, 'audit_strategy_list', value)
      }
    },
    flow_xml: {
      get() {
        return this.process_obj.flow_xml || ''
      },
      set(val) {
        this.$set(this.process_obj, 'flow_xml', val)
      }
    }
  },
  async mounted() {
    // this.fetchHistoryData();
    const module = this.createModule()
    this.bindModuleEvent(module)
    this.loading = true
    try {
      // 如果是编辑
      if (this.is_edit) {
        // 禁止修改
        this.bpmnModelerTrigger(true)
        // 如果没有执行过则可以修改
        if (!this.is_share) {
          await this.record()
        }
        // 获取流程图
        this.flow_xml = this.process_obj.flow_xml
        this.max_version = this.process_obj.version
      } else {
        // 获取流程图
        let process_id = 'Process_' + this.randomString(8)
        if(this.process_obj.type === 'doc_share'){
          if(this.proc_type === 'doc_realname_share'){
            process_id = 'Process_SHARE001'
          } else if(this.proc_type === 'doc_anonymity_share'){
            process_id = 'Process_SHARE002'
          }
          this.process_obj.key = process_id
          this.flow_xml = getDocShareXml(process_id)
          // 禁止修改
          this.bpmnModelerTrigger(true)
        }else{
          this.process_obj.key = process_id
          this.flow_xml = getDefaultXml(process_id)
        }
      }
      const _this = this
      // 导入流程图
      this.moduleImportXML(module, this.flow_xml, () => {
        const elementRegistry = module.get('elementRegistry')
        this.bpmn_modeler_select_element = elementRegistry.get(_this.process_obj.key)
        let canvas = module.get('canvas')
        // 调用设置高亮颜色class方法,这里可以根据接口获取的id集合情况，对不同的部分设置不同的class名，然后在css中设置样式
        _this.setNodeColor(elementRegistry, canvas)
        _this.setNodeLang(elementRegistry)
        _this.loading = false
      })
    } catch (error) {
      console.error(error)
      this.loading = false
    }

  },
  methods: {
    formatDate(time) {
      return xeUtils.toDateString(time)
    },
    deleteProc(row) {
      const self = this
      const obj_title = `${this.$i18n.tc('modeler.version')}(V${row.version})`
      this.$confirm(`${this.$i18n.tc('field.processDeleteTip')}${obj_title}${this.$i18n.tc('field.ma')}`, `${self.$i18n.tc('field.delete')}-${obj_title}`, {
        confirmButtonText: this.$i18n.tc('button.confirm'),
        cancelButtonText: this.$i18n.tc('button.cancel'),
        type: 'warning'
      })
        .then(() => {
          const del_data = { deployment_id: row.deployment_id, cascade: true }
          deleteProcDef(row.id, del_data).then(() => {
            self.$message.success(this.$i18n.tc('modeler.common.successTip'))
            if (this.history_data.length > 1) {
              if (row.id === this.process_obj.id) {
                this.process_obj.id = this.history_data[1].id
              }
              self.fetchHistoryData()
            } else {
              this.history_data.splice(0, 1)
            }
            this.$emit('refresh')
          }).catch(() => {})
        })
        .catch(() => {})
    },
    /**
     * 创建bpmn模块对象,并将对象绑定到bpmnModeler中
     */
    createModule() {
      let customTranslateModule = {
        translate: ['value', customTranslate]
      }
      // 获取到属性ref为“canvas”的dom节点
      const canvas = this.$refs.canvas
      let options = {
        container: canvas,
        additionalModules: [
          // 校验模块
          lintModule,
          // 左边的工具栏
          propertiesProviderModule,
          // 汉字转换模块
          customTranslateModule
          // 颜色
          // colors
          // customRenderer
        ],
        linting: {
          bpmnlint: bpmnlintConfig,
          active: false
        },
        moddleExtensions: {
          activiti: activitiExtension
        }
      }
      if(!this.is_share){
        options.additionalModules.push(MoveCanvasModule)
        options.additionalModules.push(MoveModule)
        options.additionalModules.push(BendpointsModule)
        options.additionalModules.push(LabelEditingModule)
      }

      const bpmn_modeler = new BpmnModeler(options)
      this.bpmn_modeler = bpmn_modeler
      return bpmn_modeler
    },
    bpmnModelerTrigger(flag) {
      if (flag) {
        this.bpmn_modeler.get('contextPadProvider').oldContextPadEntries = this.bpmn_modeler.get('contextPadProvider').getContextPadEntries
        this.bpmn_modeler.get('contextPadProvider').getContextPadEntries = () => {
          return {}
        }
      } else {
        this.bpmn_modeler.get('contextPadProvider').getContextPadEntries =
          this.bpmn_modeler.get('contextPadProvider').oldContextPadEntries || this.bpmn_modeler.get('contextPadProvider').getContextPadEntries
      }
      this.bpmn_modeler.get('palette').disable = flag
      this.bpmn_modeler.get('palette')._update()
    },
    addNewEdition() {
      if(this.history_data.length > 9){
        this.$message.info(this.$i18n.tc('message.max_version'))
        return
      }
      this.bpmnModelerTrigger(false)
      this.disable = false
      this.process_obj.version = this.max_version + 1
      this.save = () => {
        return new Promise(resolve => {
          this.deploy('new').then(res => {
            resolve(res)
          }).catch(() => {})
        })
      }
    },
    setNodeColor(elementRegistry, canvas) {
      let nodeList = []
      let userTaskList = []
      nodeList = elementRegistry.filter (
        (item) => item.type === 'bpmn:StartEvent' || item.type === 'bpmn:EndEvent'
      )
      userTaskList = elementRegistry.filter (
        (item) => item.type === 'bpmn:UserTask'
      )
      for (let i = 0; i < nodeList.length; i++) {
        canvas.addMarker(nodeList[i].id, 'highlight')
      }
      for (let i = 0; i < userTaskList.length; i++) {
        canvas.addMarker(userTaskList[i].id, 'highlight2')
      }
    },
    /**
     * 绑定模块事件
     */
    bindModuleEvent(bpmn_modeler) {
      const _this = this
      bpmn_modeler.on('commandStack.changed', function () {
        bpmn_modeler.saveXML({ format: true }, function (err, xml) {
          if(_this.flow_xml != xml){
            _this.flow_xml = xml
            _this.$emit('change', true)
          }
        })
      })
      bpmn_modeler.on('element.click', function (event) {
        if(_this.process_obj.type === 'doc_share' && _this.elementType(event.element) === 'Task'){
          _this.bpmn_modeler_select_element = event.element
          _this.drawer = true
        }
      })
    },
    elementType(element) {
      const { type } = element || {}
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
    /**
     *
     * @param bpmn_modeler
     * @param xmlStr
     * @param _fun 执行完成后的回调函数
     */
    moduleImportXML(bpmn_modeler, xmlStr, _fun) {
      // 将字符串转换成图显示出来
      bpmn_modeler.importXML(xmlStr, _fun)
      bpmn_modeler.get('canvas').zoom('fit-viewport', 'auto')
    },
    randomString(length) {
      let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
      let result = ''
      for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
      return result
    },
    fetchHistoryData() {
      this.history_table_load = true
      const self = this
      historyProcDef(this.process_obj.id).then(res => {
        if (!res.code) {
          self.history_data = res
          this.history_table_load = false
        }
      }).catch(() => {})
    },
    async record() {
      const { exists: flag } = await hasRecord(this.process_obj.id)
      if (!flag) {
        this.disable = false
        this.bpmnModelerTrigger(false)
      }
    },
    async changeVersion(obj) {
      this.loading = true
      this.disable = true
      this.bpmnModelerTrigger(true)
      const procDefObj = await getProcDefObj(obj.id)
      if (!['undefined', 'null', ''].includes(procDefObj.flow_xml + '')) {
        // 将字符串转换成图显示出来
        this.moduleImportXML(this.bpmn_modeler, procDefObj.flow_xml, () => {
          const elementRegistry = this.bpmn_modeler.get('elementRegistry')
          this.bpmn_modeler_select_element = elementRegistry.get(this.process_obj.key)
          this.$emit('update:process_obj', { ...procDefObj })
          this.loading = false
        })
        this.loading = false
      }
    },
    save() {
      const _this = this
      let valid = true
      let opt = 'new'
      if(_this.$refs.basicPropertiesCh !== undefined){
        valid = _this.$refs.basicPropertiesCh.checkValidate()
      }
      return new Promise(resolve => {
        if(_this.is_edit){
          opt = 'update'
        }
        if(valid){
          _this.deploy(opt).then(res => {
            resolve(res)
          }).catch(() => {})
        }
      })
    },
    // 字符串转base64
    encode(str) {
      // 对字符串进行编码
      let encode = encodeURI(str)
      // 对编码的字符串转化base64
      let base64 = btoa(encode)
      return base64
    },
    setNodeLang(elementRegistry){
      const _this = this
      const modeling = _this.bpmn_modeler.get('modeling')
      elementRegistry.forEach(e => {
        const businessObject = getBusinessObject(e)
        const attrs = businessObject.$attrs
        if(e.type === 'bpmn:StartEvent'){
          const originalVal = { name: _this.$i18n.tc('modeler.procLink.StartEvent'), ...attrs }
          modeling.updateProperties(e, { ...originalVal })
        } else if(e.type === 'bpmn:UserTask' &&
            (businessObject.name === '审核' || businessObject.name === 'Approval' || businessObject.name === '簽核')){
          const originalVal = { name: _this.$i18n.tc('modeler.procLink.UserTask'), ...attrs }
          modeling.updateProperties(e, { ...originalVal })
        } else if(e.type === 'bpmn:EndEvent'){
          const originalVal = { name: _this.$i18n.tc('modeler.procLink.EndEvent'), ...attrs }
          modeling.updateProperties(e, { ...originalVal })
        }
      })
    },
    // 部署流程（生成新版本）
    async deploy(type) {
      let _this = this
      const flag = await this.bpmnHasError()
      if (flag) {
        return
      }
      const _saveObj = {
        ...this.process_obj,
        auto_audit_switch: {
          anonymity_switch: _this.anonymity_switch,
          rename_switch: _this.rename_switch
        },
        flow_xml: this.encode(_this.flow_xml),
        audit_strategy_list: _this.doc_audit_strategy_data
      }
      return new Promise((resolve, reject) => {
        savePro(_saveObj,{type})
          .then(res => {
            _this.process_obj.flow_xml = _this.flow_xml
            this.process_obj.id = this.process_obj.id || res.id
            _this.$emit('change', false)
            resolve(res)
          })
          .catch(function (error) {
            _this.$message.warning(_this.$i18n.tc('modeler.common.saveErrorTip'))
            reject(error)
          })
      })
    },
    async bpmnHasError() {
      let errors = 0
      const linting = this.bpmn_modeler.get('linting')
      const res = await linting.lint()
      for (const id in res) {
        res[id].forEach(function (issue) {
          if (issue.category === 'error') {
            errors++
          }
        })
      }
      if (errors > 0) {
        linting._setActive(true)
      }
      return errors > 0
    },
    submitAuditStrategy(act_def_id, list) {
      const data = []
      this.doc_audit_strategy_data.forEach(item => {
        if (item.act_def_id !== act_def_id) {
          data.push(item)
        }
      })
      list.forEach(item => {
        data.push(item)
      })
      this.doc_audit_strategy_data = data
    }
  }
}
</script>

<style lang="scss" scoped>
/*左边工具栏以及编辑节点的样式*/
@import '~bpmn-js/dist/assets/diagram-js.css';
@import '~bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
@import '~bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
@import '~bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
/*!* 颜色样式 *!*/
@import '~ebpm-process-modeler-front/bpmn-js/colors/vendor/diagram-js.css';
@import '~ebpm-process-modeler-front/bpmn-js/colors/vendor/colors/color-picker.css';
@import '~ebpm-process-modeler-front/bpmn-js/colors/vendor/bpmn-font/css/bpmn-embedded.css';

@import '~bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';

.canvas {
  width: 100%;
  position: relative;
  padding: 0 0 0 0;
  box-sizing: border-box;
}
::v-deep .containers .djs-palette {
  left: 0;
  top: 0;
  height: 100%;
  border-color: #e6e9ed;
  border-top: 0 !important;
  display: none !important;
}

::v-deep .djs-palette.open {
  width: 200px !important;
  background-color: #fff !important;
}
::v-deep .djs-palette.open.disable {
  background-color: #fafafa !important;
}

::v-deep .djs-palette.open .djs-palette-entries {
  width: 100%;
}

::v-deep .djs-palette.open .djs-palette-entries .group {
  width: 100%;
  text-align: left;
  padding: 0 15px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

::v-deep .djs-palette.open .djs-palette-entries .group .entry {
  position: relative;
  width: 100%;
  margin-bottom: 10px;
  cursor: pointer;
}

::v-deep .djs-palette.open .djs-palette-entries .group .entry:before {
  position: absolute;
  left: 0;
  top: 9px;
}

::v-deep .djs-palette-entries .group .entry span {
  font-size: 14px;
  position: absolute;
  width: 100%;
  text-align: left;
  left: 0;
  box-sizing: border-box;
  padding: 0 0 0 40px;
}

::v-deep .djs-palette .separator {
  margin: 0 !important;
  padding: 0 !important;
}

::v-deep .bjsl-button {
  display: none;
}

::v-deep .djs-label {
  fill: #fff !important;
}
.basicProperties {
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  padding: 10px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  border: 1px solid #e6e9ed;
  border-top: 0;
  z-index: 99;
}
</style>

