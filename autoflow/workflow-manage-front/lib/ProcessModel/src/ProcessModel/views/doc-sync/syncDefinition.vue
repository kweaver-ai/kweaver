<!-- 同步流程，流程定义页面 -->
<template>
  <div>
    <div>
      <a class="back" @click="go_back()"><i class="el-icon-arrow-left"></i>{{$t('button.back')}}</a>
      <div class="el-steps-new">
        <el-steps :active="active" simple >
          <el-step v-for="(item, index) in steps" :key="item.title" @click.native="setIndex(index)">
            <template slot="title">{{ item.title }}</template>
          </el-step>
        </el-steps>
      </div>
      <div class="fixed-btn-box" >
        <el-button :data-title="$t('processCenter.guideStep3Title')" v-intro="introContent" v-intro-position="'bottom'" v-intro-step="3" size="mini" type="primary" style="min-width: 80px" @click="processModelSave" >{{ $t('modeler.common.save') }}</el-button>
      </div>
    </div>
    <div v-loading="loading" class="over-box1">
      <div v-show="is_setting">
        <processSyncSetting
          v-if="!loading"
          ref="processSetting"
          :tenant_id="tenant_id"
          :process_obj.sync="process_obj"
          :proc_def_key="proc_def_key"
          :proc_type="proc_type"
          :proc_copy_name="proc_copy_name"
          :visit="visit"
          :is_setting_change="is_setting_change"
          @change="setSettingChange"
          @goBack="go_back()">
        </processSyncSetting>
      </div>
      <div v-show="is_advancedSetup">
        <advancedSetup ref="advancedSetup" v-if="!loading" v-on="$listeners" :process_obj.sync="process_obj" @saveAdvancedSetup="saveAdvancedSetup"></advancedSetup>
      </div>
    </div>
  </div>
</template>

<script>
import processSyncSetting from '../process-center/processSetting'
import { procDefInfo } from '@/api/processDefinition'
import advancedSetup from './advancedSetup'
export default {
  name: 'ProcessDefinition',
  components: { processSyncSetting, advancedSetup },
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
    }
  },
  computed: {
    is_edit() {
      return !['null', '', 'undefined'].includes(this.proc_def_key + '')
    },
    is_setting() {
      return this.active === 0
    },
    is_advancedSetup() {
      return this.active === 1
    },
    syncVal() {
      return this.$store.state.app.sync
    }
  },
  data() {
    return {
      active: 0,
      steps: [{ title: this.$i18n.tc('modeler.StepTwo') },{ title: this.$i18n.tc('modeler.StepThree') }],
      process_obj: {},
      is_setting_change: false,
      loading: true,
      introContent: this.$i18n.tc('processCenter.guideStep3'),
      old_name:''
    }
  },
  async created() {
    this.loading = true
    await this.init()
    this.loading = false
  },
  mounted(){
    let newVisitor = this.isNewVisitor()// 如果是新访客
    if(newVisitor === true){
      this.startGuide()
      this.setCookie('workflow-visited','true', 360000)
    }
  },
  methods: {
    /**
       * 初始化
       */
    async init() {
      this.process_obj = await this.openProcessInit()
    },
    /**
       * 打开流程初始化
       */
    openProcessInit() {
      const _this = this
      if (['', 'null', 'undefined'].includes(_this.proc_def_key + '')) {
        return { tenant_id: _this.tenant_id, type: 'doc_sync', type_name: _this.$i18n.tc('modeler.procType.DOC_SYNC') }
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
    go_back(){
      const _this = this
      if(_this.is_setting_change){
        _this.$confirm(_this.$i18n.tc('sync.backShowTips'), '', {
          confirmButtonText: _this.$i18n.tc('button.confirm'),
          cancelButtonText: _this.$i18n.tc('button.cancel'),
          iconClass: 'warning-blue',
          type: 'warning'
        }).then(() => {
          _this.back()
        }).catch(() => {})
      } else {
        _this.back()
      }
    },
    /**
       * 设置配置是否改变的状态
       * @param flag
       */
    setSettingChange(flag){
      this.is_setting_change = flag
    },
    saveAdvancedSetup(_rule){
      const _this = this
      _this.$refs.processSetting.repeat_audit_rule = _rule
    },
    processModelSave(){
      this.$refs.processSetting.saveProcessPre()
    },
    /**
       * 开始新手引导
       */
    startGuide(){
      setTimeout(() =>{
        this.$nextTick(()=>{
          let introJS = require('@/components/intro.js')
          introJS().setOptions({
            prevLabel:this.$i18n.tc('processCenter.guideStepLast'),
            nextLabel:this.$i18n.tc('processCenter.guideStepNext'),
            showBullets:false,
            showStepNumbers: true,
            doneLabel:this.$i18n.tc('processCenter.guideStepEnd')
          }).start()
        })
      },500)
    },
    /**
       * 选择页签
       */
    setIndex(e){
      e === 0 ? this.active = 0 : this.active = 1
    },
    /**
       * 返回
       */
    back(){
      if(!['', 'null', 'undefined'].includes(this.syncVal + '') && JSON.stringify(this.syncVal) !== '{}'){
        this.syncVal.onCloseAuditFlow && this.syncVal.onCloseAuditFlow()
      } else {
        this.$emit('close')
      }
    },
    isNewVisitor(){
      // 从cookie读取“已经向访客提示过消息”的标志位
      let flg = this.getCookie('workflow-visited')
      if (flg === '') {
        return true
      } else {
        return false
      }
    },
    setCookie(cname, cvalue, exdays) {
      let d = new Date()
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
      let expires = 'expires=' + d.toUTCString()
      document.cookie = cname + '=' + cvalue + '; ' + expires + ';path=/'
    },
    getCookie(cname) {
      let name = cname + '='
      let ca = document.cookie.split(';')
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length)
      }
      return ''
    }
  }
}
</script>
