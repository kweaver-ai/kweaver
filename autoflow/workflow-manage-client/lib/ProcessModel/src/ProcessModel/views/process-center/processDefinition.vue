<!-- 流程中心，流程定义页面 -->
<template>
  <div>
    <div>
      <a class="back" @click="go_back()"  style="-webkit-app-region:no-drag"><i class="el-icon-arrow-left"></i>{{$t('button.back')}}</a>
      <div class="el-steps-new" style="-webkit-app-region:no-drag">
        <el-steps :active="active" simple>
          <el-step v-for="(item, index) in steps" :key="item.title" @click.native="setIndex(index)">
            <template slot="title">{{ item.title }}</template>
          </el-step>
        </el-steps>
      </div>
      <div class="fixed-btn-box">
        <el-button
          :data-title="$t('processCenter.guideStep3Title')"
           v-intro="introContent"
           v-intro-position="'bottom'"
           v-intro-step="3"
           size="mini"
           type="primary"
           style="min-width: 80px"
           @click="processModelSave">
          {{ !isTemplate ? $t('modeler.complete')  : $t('modeler.common.save') }}
        </el-button>
        <el-button 
          v-if="!isTemplate && !this.$store.state.app.custom.onlyProcess" 
          :data-title="$t('processCenter.saveAndGenerateTemplate')" 
          size="mini" 
          style="min-width: 104px" @click="processModelSave('Y')"
        >
          {{ $t('modeler.common.saveAndGenerateTemplate') }}
        </el-button>
      </div>
    </div>
    <div v-loading="loading" class="over-box1">
      <div v-show="is_setting">
        <processSetting
          v-if="!loading"
          ref="processSetting"
          :tenant_id="tenant_id"
          :process_obj.sync="process_obj"
          :proc_def_key="proc_def_key"
          :proc_type="proc_type"
          :proc_copy_name="proc_copy_name"
          :visit="visit"
          :is_setting_change="is_setting_change"
          :isTemplate="isTemplate"
          @change="setSettingChange"
          @updateAdvancedSetup="updateAdvancedSetup"
          @goBack="go_back()"
        />
      </div>
      <div v-show="is_advancedSetup">
        <advancedSetup ref="advancedSetup" v-if="!loading" v-on="$listeners" :process_obj.sync="process_obj" @saveAdvancedSetup="saveAdvancedSetup"></advancedSetup>
      </div>
    </div>
  </div>
</template>

<script>
import processSetting from './processSetting'
import { procDefInfo, categoryList } from '@/api/processDefinition'
import advancedSetup from './advancedSetup'
export default {
  name: 'ProcessDefinition',
  components: { processSetting, advancedSetup },
  props: {
    tenant_id: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    },
    proc_def_id: {
      type: String,
      required: true
    },
    proc_type: {
      type: String,
      required: true
    },
    proc_copy_name: {
      type: String,
      required: false
    },
    visit: {
      type: String
    },isTemplate:{
      type: Boolean
    }
  },
  computed: {
    arbitrailyAuditTemplateVal () {
      return this.$store.state.app.arbitrailyAuditTemplate
    },
    is_edit () {
      return !['null', '', 'undefined'].includes(this.proc_def_key + '')
    },
    is_setting () {
      return this.active === 0
    },
    is_advancedSetup () {
      return this.active === 1
    }
  },
  data () {
    return {
      active: 0,
      steps: [{ title: this.$i18n.tc('modeler.StepTwo') }, { title: this.$i18n.tc('modeler.StepThree') }],
      process_obj: {},
      is_setting_change: false,
      loading: true,
      introContent: this.$i18n.tc('processCenter.guideStep3'),
      old_name: ''
    }
  },
  async created () {
    this.loading = true
    await this.init()
    this.loading = false
  },
  mounted () {
  },
  methods: {
    /**
     * 初始化
     */
    async init () {
      if(typeof this.arbitrailyAuditTemplateVal.process_data !== 'undefined'){
        await this.renderProcessData()
      }else{
        this.process_obj = await this.openProcessInit()
      }
    },
    renderProcessData(){
      let configData =  Object.assign({},this.arbitrailyAuditTemplateVal.process_data.configData)
      let xml = decodeURI(configData.flow_xml)
      let process_obj = {
        flow_xml:decodeURIComponent(window.atob(xml)),
        advancedSetup:configData.advanced_setup
      }
      this.process_obj =  Object.assign(configData,process_obj)

    },
    /**
     * 打开流程初始化
     */
    openProcessInit () {
      const _this = this
      if (['', 'null', 'undefined'].includes(_this.proc_def_key + '')) {
        return { tenant_id: _this.tenant_id, type: _this.proc_type, type_name: _this.getTypeName(_this.proc_type) }
      }
      return new Promise((resolve, reject) => {
        procDefInfo(_this.proc_def_id)
          .then(res => {
            const result = res
            result.tenant_id = _this.tenant_id
            resolve(result)
          }).catch(error => {
            _this.$message.warning(error.getMessage)
            reject(error)
          })
      })
    },
    /**
     * 返回确认
     */
    go_back () {
      const _this = this
      if (_this.is_setting_change) {
        _this.$dialog_confirm('', _this.$i18n.tc('sync.backShowTips'), _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
          _this.back()
        }).catch(() => { })
      } else {
        _this.back()
      }
    },
    /**
     * 设置配置是否改变的状态
     * @param flag
     */
    setSettingChange (flag) {
      this.is_setting_change = flag
    },
    updateAdvancedSetup(setup){
      this.$refs.advancedSetup.initrepeat_audit_rule(setup)
    },
    saveAdvancedSetup (_rule) {
      const _this = this
      _this.$refs.processSetting.advancedSetup = _rule
    },
    loadProcessCategory(){
      return new Promise((resolve, reject) => {
        categoryList().then(res => {
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },
    getTypeName(type) {
      this.loadProcessCategory().then(res => {
        let selectedCategoryList = res.filter(e => e.category === type)
        return selectedCategoryList.length > 0 ? selectedCategoryList[0].label[this.$i18n.locale] : ''
      })
    },
    /**
     * 保存流程
     * @param
     */
    processModelSave (_obj) {
      // 如果是从我的流程模板进来点击保存默认设置为模板
      this.$refs.processSetting.saveProcessPre(_obj)
    },
    /**
     * 开始新手引导
     */
    startGuide () {
      setTimeout(() => {
        this.$nextTick(() => {
          let introJS = require('@/components/intro.js')
          introJS().setOptions({
            prevLabel: this.$i18n.tc('processCenter.guideStepLast'),
            nextLabel: this.$i18n.tc('processCenter.guideStepNext'),
            showBullets: false,
            showStepNumbers: true,
            doneLabel: this.$i18n.tc('processCenter.guideStepEnd')
          }).start()
        })
      }, 500)
    },
    /**
     * 选择页签
     */
    setIndex (e) {
      e === 0 ? this.active = 0 : this.active = 1
    },
    /**
     * 返回
     */
    back () {
      let _this = this
      if(!_this.isTemplate){
        _this.arbitrailyAuditTemplateVal.close()
      }else{
        _this.$emit('close')
      }
    }
  }
}
</script>
