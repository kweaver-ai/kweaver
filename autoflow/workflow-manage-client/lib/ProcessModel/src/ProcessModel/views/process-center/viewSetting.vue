<!-- 流程预览，预览流程设置 -->
<template>
  <div class="view-setting-content view-setting-content-template">
    <div :class="visible ? 'tjs-box':''">
      <el-button
        v-if="visible"
        class="el-button--text"
        size="mini"
        @click="close"
        style="border-color: #fff;-webkit-app-region:no-drag"
      ><i class="el-icon el-icon-close"></i></el-button>
      <div class="fd-nav-content" style="position:inherit;cursor:grab;">
        <section class="dingflow-design" style="height: 460px;overflow-x: hidden;">
          <div class="forbidden" v-if="nodeConfig.nodeId" v-drag="{thisVue}" :style="'height:' + siteHeight + 'px;transform: translate(' + siteX + 'px,' + siteY + 'px); '">
            <div id="box-scale" :style="'transform: scale('+nowVal/100+'); transform-origin: 50% 0px 0px;'" class="box-scale">
              <nodeWrap
                :node-config.sync="nodeConfig"
                :flow-permission.sync="flowPermission"
                :add-node-disabled.sync="addNodeDisabled"
                :view-process="true"
                :view-auditors="getViewAuditors"
                :multiChoiceSearch="multiChoiceSearch"
              />
              <nodeEnd :view-process="true"></nodeEnd>
            </div>
          </div>
        </section>
      </div>
      <div class="zoom" :style="visible?'bottom: 70px':''">
      <div :class="'zoom-out'+ (nowVal==50?' disabled':'')" @click="zoomSize(1)"></div>
      <span>{{nowVal}}%</span>
      <div :class="'zoom-in'+ (nowVal==200?' disabled':'')" @click="zoomSize(2)"></div>
    </div>
    </div>
    <div v-if="visible" style="position: absolute; bottom: 0; background: #fff; width: 100%; padding: 15px;  box-sizing: border-box; text-align: right">
      <el-button
         :data-title="$t('processCenter.useTemplate')"
         v-intro-position="'bottom'"
         v-intro-step="3"
         size="mini"
         type="primary"
         style="min-width: 80px"
         @click="useTheTemplate">
        {{ $t('processCenter.useTemplate') }}
      </el-button>
    </div>
  </div>
</template>
<script>
import nodeWrap from '../../../components/nodeWrap'
import nodeEnd from '../../../components/nodeEnd'
import processSetting from '../../../mixins/processSetting'
import { procDefInfo } from '@/api/processDefinition.js'
export default {
  name: 'ViewSetting',
  components: { nodeWrap, nodeEnd },
  mixins: [processSetting],
  props: {
    tenant_id: {
      type: String,
      required: true
    },
    process_obj: {
      type: Object,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    },
    proc_type: {
      type: String,
      required: true
    },
    multiChoiceSearch: {
      type: Object
    },
    visible:{
      type: Boolean
    }
  },
  data () {
    return {
      current_proc_obj: {},
      thisVue: this,
      siteHeight: 460,
      siteX: 0,
      siteY: 0,
      disX: 0,
      disY: 0,
      nowVal: 100
    }
  },
  // 自定义指令
  directives: {
    drag: {
      // 指令的定义
      bind: function (el, binding) {
        let oDiv = el  // 获取当前元素
        let _this = binding.value.thisVue
        oDiv.onmousedown = (e) => {
          // 算出鼠标相对元素的位置
          _this.disX = e.clientX - _this.siteX
          _this.disY = e.clientY - _this.siteY
          document.onmousemove = (e) => {
            // 用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
            let moveX = e.clientX - _this.disX
            let moveY = e.clientY - _this.disY
            _this.siteX = moveX
            _this.siteY = moveY
          }
          document.onmouseup = () => {
            document.onmousemove = null
            document.onmouseup = null
          }
        }
      }
    }
  },
  computed: {
    getViewAuditors: {
      get () {
        let viewAuditors = []
        this.process_obj.docShareStrategyList.forEach(e => {
          let item = {}
          let separator = '、'
          if (this.$i18n.locale === 'en-us') {
            separator = ','
          }
          item['strategyType'] = e.strategy_type
          item['ruleId'] = e.rule_id
          item['actDefId'] = e.act_def_id
          item['auditModel'] = this.type_name(e.audit_model)
          item['noAuditorType'] = e.no_auditor_type
          let auditorNames = ''
          if (e.audit_model === 'zjsh') {
            e.auditor_list.forEach((d, index) => {
              auditorNames === '' ? auditorNames = '（' + (index + 1) + this.$i18n.tc('modeler.level') + '）' + d.user_name + '（' + d.user_code + '）' : auditorNames += separator + '（' + (index + 1) + this.$i18n.tc('modeler.level') + '）' + d.user_name + '（' + d.user_code + '）'
            })
          } else {
            e.auditor_list.forEach(d => {
              auditorNames === '' ? auditorNames = d.user_name + '（' + d.user_code + '）' : auditorNames += separator + d.user_name + '（' + d.user_code + '）'
            })
          }
          item['auditorNames'] = auditorNames
          viewAuditors.push(item)
        })
        return viewAuditors
      }
    }
  },
  created () {
    this.addNodeDisabled = false
    this.current_proc_obj = this.process_obj
    this.initProcessConfig(this.process_obj.flow_xml, this.proc_def_key, this.process_obj.name)
  },
  methods: {
    type_name (type) {
      const map = {
        tjsh: this.$i18n.tc('flow.auditTypes.tjsh'),
        hqsh: this.$i18n.tc('flow.auditTypes.hqsh'),
        zjsh: this.$i18n.tc('flow.auditTypes.zjsh')
      }
      return map[type]
    },
    /**
     * 获取流程建模信息
     * @param _procDefId
     */
    getProcessInfo (_procDefId) {
      return new Promise((resolve, reject) => {
        procDefInfo(_procDefId)
          .then(res => {
            resolve(res)
          }).catch(error => {
            reject(error)
          })
      })
    },
    zoomSize (type) {
      if (type == 1) {
        if (this.nowVal == 50) {
          return
        }
        this.nowVal -= 10
        this.siteHeight -= 50
      } else {
        if (this.nowVal == 200) {
          return
        }
        this.nowVal += 10
        this.siteHeight += 50
      }
    },
    /**
     * 使用此模板
     */
    useTheTemplate(){
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('processCenter.useTemplateTitle'), _this.$i18n.tc('processCenter.useTemplateTitle1'), _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        this.$emit('output')
      }).catch(() => { })

    },
    /**
     * 关闭弹窗
     */
    close(){
      this.$emit('close')
    }

  }
}
</script>
<style>
@import "../../../../public/css/workflow.css";
.forbidden {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
