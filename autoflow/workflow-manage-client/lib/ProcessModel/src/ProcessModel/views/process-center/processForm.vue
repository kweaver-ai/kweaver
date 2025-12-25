<!-- 流程中心，流程基本表单信息界面 -->
<template>
  <div>
    <workflowDialog
      :title="isTemplate?$t('deptAuditorRule.templateName'):$t('modeler.processName')"
      :visible="visible"
      :close-on-click-modal="false"
      :modal="false"
      @close="close"
      custom-class="new-dialog"
      width="420px"
      :destroy-on-close="true">
        <el-form ref="processForm" label-position="left" :model="current_proc" :label-width="$i18n.locale === 'en-us'?'145px':'86px'" size="small" :rules="rules" @submit.native.prevent class="sm_form1">
          <el-form-item :label="isTemplate?$t('deptAuditorRule.templateName'):$t('modeler.processName') + ':'" prop="name">
            <el-input v-model="current_proc.name" @change="dealFormName" show-word-limit :placeholder="$t('sync.inputProcessNameTip')" clearable :style="{ width: '100%' }" />
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button style="width: 80px" type="primary" size="mini" @click="confirm" :disabled="current_proc.name === ''" v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
          <el-button style="width: 80px" size="mini" @click="visible = false">{{ $t('button.cancel') }}</el-button>
        </span>
    </workflowDialog>
  </div>
</template>

<script>
import { getList, kcProcessNameExist } from '@/api/processDefinition.js'
import workflowDialog from '@/components/dialog'
export default {
  name: 'ProcessSyncForm',
  props: {
    process_obj: {
      type: Object,
      required: true
    },
    template:{
      type: String,
      default:''
    },
    isTemplate:{
      type: Boolean,
      default:false
    }
  },
  components: { workflowDialog },
  data () {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (['', 'null', 'undefined'].includes(value + '')) {
        callback()
        // eslint-disable-next-line no-useless-escape
      } else if (/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)) {
        callback(new Error(this.isTemplate ? this.$i18n.tc('modeler.illegalCharacterTemplatePrefix')  + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix') : this.$i18n.tc('modeler.illegalCharacterProcessPrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 128) {
        callback(new Error(this.isTemplate ? this.$i18n.tc('modeler.templateNameLengthErrorBack') : this.$i18n.tc('modeler.processNameLengthErrorBack')))
      } else if (this.nameExistenceErr) {
        callback(new Error(
          this.$store.state.app.custom.onlyProcess
            ? this.$i18n.tc('sync.flowNameExist')
            : this.$i18n.tc('sync.processNameHasTips')
        ))
      } else {
        callback()
      }
    }
    return {
      operation: 'new',
      current_proc: {},
      nameExistenceErr: false,
      rules: {
        name: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'blur' },
          { required: true, trigger: 'blur', validator: validateName },
          { required: true, trigger: 'change', validator: validateName }
        ]
      },
      visible: false
    }
  },

  methods: {
    /**
     * 开启流程信息编辑
     * @param operation
     * @param _process
     * @returns {Promise<void>}
     */
    async openProcessTitle (operation, _process) {
      this.operation = operation
      this.current_proc = { ..._process }
      this.nameExistenceErr = false
      this.visible = true
    },
    /**
     * 确认
     */
    confirm () {
      const _this = this
      this.nameExistenceErr = false
      _this.$refs['processForm'].validate(valid => {
        if (!valid) {
          return
        }
        this.existence().then(res => {
          if (res) {
            _this.nameExistenceErr = true
            _this.$refs.processForm.validateField('name')
            return
          }
          let processItem = { ..._this.current_proc }
          _this.$emit('output', _this.operation, processItem)
          _this.visible = false
        }).catch(() => {
        })
      })
    },
    /**
     * 判断同步流程是否存在
     * @returns {Promise<any>}
     */
    existence () {
      const _this = this
      const query = {
        type_id: _this.process_obj.type,
        name: _this.current_proc.name.indexOf(' ') !== -1 ? '' : _this.current_proc.name,
        template: 'Y'
      }
      return new Promise((resolve) => {
        // kc审核流程管理
        if (this.$store.state.app.custom.onlyProcess) {
          const { process_id } = this.$store.state.app.arbitrailyAuditTemplate
          
          kcProcessNameExist({name: _this.current_proc.name, ...process_id ?{ process_id } :{}})
            .then(res => resolve(false))
            .catch(err => resolve(true))

          return
        }

        // 判断是保存流程还是保存模板，保存流程的流程名称不需要做去重处理
        if(_this.template !== 'Y' && !_this.isTemplate){
          resolve(false)
          return
        }
        if (_this.operation === 'update' && _this.process_obj.name === _this.current_proc.name && _this.template !== 'Y' ) {
          resolve(false)
          return
        }
        getList(query).then(res => {
          if (res !== null && res !== '') {
            res.entries.forEach(e => {
              if (e.name === _this.current_proc.name) {
                resolve(true)
                return
              }
            })
            resolve(false)
          }
        })
      })
    },
    /**
     * 关闭
     */
    close () {
      this.visible = false
    },
    /**
     * 处理模板
     */
    dealFormName () {
      this.current_proc.name = this.current_proc.name.replace(/(^\s*)|(\s*$)/g, '')
    }
  }
}
</script>
