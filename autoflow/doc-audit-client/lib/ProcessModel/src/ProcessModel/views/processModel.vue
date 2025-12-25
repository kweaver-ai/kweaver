<template>
  <div>
    <div class="containers" ref="content" v-loading="loading">
      <div class="title-sm-1">
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
              <div v-for="item in history_data" :key="item.version" class="list">
                <div class="text"  @click="changeVersion(item)">
                  <span class="title">{{$t('modeler.version')}}(V{{ item.version }})</span>
                  <span class="time">{{ item.pdCreateTime | formatDate }}</span>
                </div>
                <a class="close" type="danger" size="mini" @click="deleteProc(item)">
                  <i class="el-icon-close"></i>
                </a>
              </div>
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
      </div>
      <div class="canvas" ref="canvas" :style="{ height: scrollerHeight }">
        <basic-properties
          :element="bpmn_modeler_select_element"
          :doc_audit_scope_data.sync="doc_audit_scope_data"
          :bpmn_modeler="bpmn_modeler"
          :process_obj.sync="process_obj"
          :proc_def_key="proc_def_key"
          :disable="disable"
          @submitAuditScope="submitAuditScope"
        ></basic-properties>
      </div>
    </div>
  </div>
</template>

<script>
import BpmnModeler from '../../../public/js/bpmn-js/lib/Modeler'
import customTranslate from '../../../bpmn-js/customTranslate/customTranslate'
import propertiesProviderModule from '../../../bpmn-js/provider/magic'
import lintModule from 'bpmn-js-bpmnlint'
import bpmnlintConfig from '../../../packed-config'
import xeUtils from 'xe-utils'
import basicProperties from '../../components/basicProperties'
import request from '@/utils/request'
import activitiExtension from 'ebpm-process-modeler-client/activiti.json'
import { deleteProcDef, historyProcDef, procDefObj as getProcDefObj, record as hasRecord } from '@/api/processDefinition'
import XEUtils from 'xe-utils'
// @ts-ignore
import { getDefaultXml } from 'ebpm-process-modeler-client/src/utils/model.js'

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
    proc_def_key: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      disable: true,
      bpmn_modeler: {},
      buttonDisabled: true,
      bpmn_modeler_select_element: {},
      history_data: [],
      history_table_load: false,
      visible: false,
      max_version: 0
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
      return this.process_obj.type === 'DOC_SHARE'
    },
    is_edit() {
      return !['', 'null', 'undefined'].includes(this.proc_def_key + '')
    },
    scrollerHeight: function () {
      return window.innerHeight - 150 + 'px'
    },
    doc_audit_scope_data: {
      get() {
        return this.process_obj.audit_scope_list || []
      },
      set(value) {
        this.$emit('change', true)
        this.$set(this.process_obj, 'audit_scope_list', value)
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
    this.fetchHistoryData();
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
        this.process_obj.key = process_id
        this.flow_xml = getDefaultXml(process_id)
      }
      const _this = this
      // 导入流程图
      this.moduleImportXML(module, this.flow_xml, () => {
        const elementRegistry = module.get('elementRegistry')
        this.bpmn_modeler_select_element = elementRegistry.get(_this.process_obj.key)
        _this.loading = false
      })
    } catch (error) {
      console.log(error);
      this.loading = false
    }

  },
  methods: {
    formatDate(time) {
      return xeUtils.toDateString(time)
    },
    deleteProc(row) {
      const self = this
      const obj_title = `${this.$i18n.tc('modeler.version')}(V${row.version})`;
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
          })
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
          //汉字转换模块
          customTranslateModule
          //颜色
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
      if(this.history_data.length>9){
        this.$message.info(this.$i18n.tc('message.max_version'))
        return;
      }
      this.bpmnModelerTrigger(false)
      this.disable = false
      this.process_obj.version = this.max_version + 1
      this.save = () => {
        return new Promise(resolve => {
          this.deploy('new').then(res => {
            resolve(res)
          })
        })
      }
    },
    /**
     * 绑定模块事件
     */
    bindModuleEvent(bpmn_modeler) {
      const _this = this
      bpmn_modeler.on('commandStack.changed', function () {
        bpmn_modeler.saveXML({ format: true }, function (err, xml) {
          _this.flow_xml = xml
          _this.$emit('change', true)
        })
      })
      bpmn_modeler.on('element.click', function (event) {
        _this.bpmn_modeler_select_element = event.element
      })
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
    },
    randomString(length) {
      var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
      var result = ''
      for (var i = length; i > 0; --i) {
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
      })
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
          this.$emit('update:process_obj', { ...procDefObj, app_id: this.process_obj.app_id })
          this.loading = false
        })
        this.loading = false
      }
    },
    save() {
      return new Promise(resolve => {
        this.deploy('update').then(res => {
          resolve(res)
        })
      })
    },
    // 字符串转base64
    encode(str) {
      // 对字符串进行编码
      var encode = encodeURI(str)
      // 对编码的字符串转化base64
      var base64 = btoa(encode)
      return base64
    },
    //部署流程（生成新版本）
    async deploy(type) {
      let _this = this
      const flag = await this.bpmnHasError()
      if (flag) {
        return
      }
      let url = process.env.VUE_APP_BASE_API + '/process-definition'
      const _saveObj = {
        ...this.process_obj,
        flow_xml: this.encode(_this.flow_xml),
        audit_scope_list: _this.doc_audit_scope_data
      }
      _this.loading = true
      return new Promise((resolve, reject) => {
        request
          .post(url, _saveObj,{params:{type}})
          .then(res => {
            _this.loading = false
            _this.process_obj.flow_xml = _this.flow_xml
            _this.$emit('change', false)
            _this.$message.success(this.$i18n.tc('modeler.common.successTip'))
            resolve(res)
          })
          .catch(function (error) {
            console.log(error)
            _this.$message.warning(_this.$i18n.tc('modeler.common.errorTip'))
            _this.loading = false
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
    submitAuditScope(act_def_id, list) {
      const data = []
      this.doc_audit_scope_data.forEach(item => {
        if (item.act_def_id !== act_def_id) {
          data.push(item)
        }
      })
      list.forEach(item => {
        data.push(item)
      })
      this.doc_audit_scope_data = data
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
@import '~ebpm-process-modeler-client/bpmn-js/colors/vendor/diagram-js.css';
@import '~ebpm-process-modeler-client/bpmn-js/colors/vendor/colors/color-picker.css';
@import '~ebpm-process-modeler-client/bpmn-js/colors/vendor/bpmn-font/css/bpmn-embedded.css';

@import '~bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';

.canvas {
  width: 100%;
  /* height: calc(100% - 48px); */
  position: relative;
  padding: 0 290px 0 0;
  box-sizing: border-box;
}

::v-deep .containers .djs-palette {
  left: 0;
  top: 0;
  height: 100%;
  border-color: #e6e9ed;
  border-top: 0 !important;
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

::v-deep .djs-label {
  fill: black !important;
}
.basicProperties {
  position: absolute;
  right: 0;
  width: 290px;
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

