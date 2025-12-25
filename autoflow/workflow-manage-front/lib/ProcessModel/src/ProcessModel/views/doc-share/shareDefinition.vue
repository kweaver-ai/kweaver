<template>
  <div>
      <div>
        <a class="back" @click="go_back()">
          <i class="el-icon-arrow-left"></i>
          <span v-if="$store.state.app.secret.status === 'y'">{{ proc_type === 'doc_anonymity_share' ? $t('modeler.docShareName.anonymity') : $t('modeler.docShareName.secretRealName')}}</span>
          <span v-else>{{ proc_type === 'doc_anonymity_share' ? $t('modeler.docShareName.anonymity') : $t('modeler.docShareName.realName')}}</span>
        </a>
      </div>
      <div class="el-steps-new">
        <el-steps :active="active" simple >
          <el-step v-for="(item, index) in steps" :key="item.title" @click.native="setIndex(index)">
            <template slot="title">{{ item.title }}</template>
          </el-step>
        </el-steps>
      </div>
      <div v-loading="loading" class="over-box1">
        <div v-show="is_model" style="height:100%">
          <processShareSetting v-if="!loading" ref="processShareSetting" :process_obj.sync="process_obj"  v-on="$listeners" :proc_type="proc_type" :proc_def_key="proc_def_key"></processShareSetting>
        </div>
        <div v-show="is_advancedSetup">
          <template v-if="!loading">
              <docShareForm key="proc_def_key" ref="shareForm" v-on="$listeners" :shareType="shareType" :process_obj.sync="process_obj" @processSave="processModelSave"></docShareForm>
          </template>
        </div>
      </div>
  </div>
</template>
<script>
import processShareSetting from './processShareSetting'
import { procDefInfo } from '@/api/processDefinition'
import docShareForm from './docShareForm'
export default {
  name: 'ShareDefinition',
  components: { processShareSetting, docShareForm },
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
    visit: {
      type: String
    }
  },
  computed: {
    is_model() {
      return this.active === 0
    },
    is_advancedSetup() {
      return this.active === 1
    },
    is_edit() {
      return !['null', '', 'undefined'].includes(this.proc_def_key + '')
    },
    shareType () {
      if(this.proc_def_key === 'Process_SHARE001'){
        return "realname"
      }else {
        return "anonymity"
      }
    }
  },
  data() {
    return {
      active: 0,
      steps: [{ title: this.$i18n.tc('modeler.StepTwo') },{ title: this.$i18n.tc('modeler.StepThree') }],
      process_obj: {},
      type_disabled: false,
      loading: false
    }
  },
  watch:{
    active(){
      this.$emit('currentStep', this.active)
    }
  },
  async created() {
    this.loading = true
    this.is_edit ? this.active = 0 : ''
    await this.init()
    this.$emit('change', false)
    this.loading = false
  },
  methods: {
    /**
     * 初始化
     */
    async init() {
      const _this = this
      _this.process_obj = await this.openProcessInit()
    },
    /**
     * 打开流程初始化
     */
    openProcessInit() {
      const _this = this
      if (['', 'null', 'undefined'].includes(_this.proc_def_key + '')) {
        return { tenant_id: _this.tenant_id, type: 'doc_share', type_name: _this.$i18n.tc('modeler.procType.DOC_SHARE') }
      }
      return new Promise((resolve, reject) => {
        procDefInfo(_this.proc_def_id)
          .then(res => {
            const result = res
            result.tenant_id = _this.tenant_id
            resolve(result)
          })
          .catch(error => {
            _this.$message.warning(error.getMessage)
            reject(error)
          })
      })
    },
    /**
     * 流程建模保存
     */
    async processModelSave() {
      const _this = this
      _this.$refs.processShareSetting.rename_switch = 'n'
      _this.$refs.processShareSetting.anonymity_switch = 'n'
      if(_this.proc_def_key === 'Process_SHARE001' && _this.$refs.shareForm.renameCheckbox){
        _this.$refs.processShareSetting.rename_switch = 'y'
      }else if(_this.proc_def_key === 'Process_SHARE002' && _this.$refs.shareForm.anonymityCheckbox){
        _this.$refs.processShareSetting.anonymity_switch = 'y'
      }
      await _this.$refs['processShareSetting'].save().then(()=>{
      }).catch(() => {})
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
    go_back(){
      this.$emit('close')
    }
  }
}
</script>
