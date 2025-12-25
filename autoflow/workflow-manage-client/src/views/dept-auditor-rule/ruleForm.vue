<!-- 流程中心，流程基本表单信息界面 -->
<template>
  <div>
    <workflowDialog
      :title="$t('deptAuditorRule.templateName') + ':'"
      :visible="visible"
      :close-on-click-modal="false"
      :modal="false"
      @close="close"
      custom-class="new-dialog"
      width="420px"
      :destroy-on-close="true">
      <el-form ref="rulePropertiesForm" label-position="left" :model="form" :label-width="$i18n.locale === 'en-us'?'145px':'86px'" size="small" :rules="rules" class="sm_form1">
        <el-form-item :label="$t('deptAuditorRule.templateName') + ':'" prop="rule_name">
          <el-input v-model="form.rule_name" show-word-limit @change="dealFormName" :placeholder="$t('modeler.common.inputTip')" clearable :style="{ width: '100%' }" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button style="width: 80px" type="primary" size="mini" @click="confirm" :disabled="form.rule_name === ''" v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
        <el-button style="width: 80px" size="mini" @click="visible = false">{{ $t('button.cancel') }}</el-button>
      </span>
    </workflowDialog>
  </div>
</template>

<script>
import workflowDialog from '@/components/dialog'
import { getDeptAuditorRulePage } from '@/api/deptAuditorRule.js'
export default {
  name: 'ProcessSyncForm',
  components: { workflowDialog },
  data () {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (['', 'null', 'undefined'].includes(value + '')) {
        callback()
        // eslint-disable-next-line no-useless-escape
      } else if (/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)) {
        callback(new Error(this.$i18n.tc('modeler.illegalCharacterTemplatePrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 128) {
        callback(new Error(this.$i18n.tc('modeler.templateNameLengthErrorBack')))
      } else if (this.nameExistenceErr) {
        callback(new Error(this.$i18n.tc('deptAuditorRule.nameHasTips')))
      } else {
        callback()
      }
    }
    return {
      operation: 'new',
      form: {},
      nameExistenceErr: false,
      rules: {
        rule_name: [
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
     * 开启模板信息编辑
     * @param _process
     * @returns {Promise<void>}
     */
    async openProcessTitle (_form) {
      this.form = _form
      this.form.rule_name = ''
      this.nameExistenceErr = false
      this.visible = true
    },
    /**
     * 确认
     */
    confirm () {
      let _this = this
      _this.nameExistenceErr = false
      _this.$refs['rulePropertiesForm'].validate((valid) => {
        if (valid) {
          _this.checkNameExistence().then((res) => {
            if (res) {
              _this.nameExistenceErr = true
              _this.$refs.rulePropertiesForm.validateField('rule_name')
              return
            }else{
              _this.$emit('output',_this.form)
              this.visible = false
            }
          })
        }
      })
    },
    /**
     * 关闭
     */
    close () {
      this.visible = false
    },
    /**
     * 校验规则名称是否存在
     */
    checkNameExistence () {
      const _this = this
      return new Promise((resolve) => {
        if (_this.rule_id !== '' && _this.form.rule_name === _this.old_rule_name) {
          resolve(false)
          return
        }
        const ruleName = this.form.rule_name.indexOf(' ') !== -1 ? '' : this.form.rule_name
        getDeptAuditorRulePage({ name: ruleName, process_client: 1,template:'Y' })
          .then((res) => {
            if (res !== null && res !== '') {
              res.entries.forEach((e) => {
                if (e.rule_name === this.form.rule_name) {
                  resolve(true)
                  return
                }
              })
              resolve(false)
            }
          })
          .catch(() => { })
      })
    },
    /**
     * 处理规则名称
     */
    dealFormName () {
      this.form.rule_name = this.form.rule_name.replace(/(^\s*)|(\s*$)/g, '')
    }
  }
}
</script>
