<!-- 流程中心，流程复制表单界面 -->
<template>
  <div>
    <el-dialog
       :title="$t('processCenter.copyProcess')"
       :visible="visible"
       :close-on-click-modal="false"
       :append-to-body="false"
       :modal="false"
       @close="close"
       v-dialogDrag
       custom-class="new-dialog"
       width="420px"
       :destroy-on-close="true">
      <el-form ref="processForm" label-position="left" :model="current_proc_obj" :label-width="$i18n.locale === 'en-us'?'145px':'86px'" size="small" :rules="rules">
        <el-form-item :label="$t('deptAuditorRule.templateName') + ':'" prop="name">
          <el-input v-model.trim="current_proc_obj.name" show-word-limit :placeholder="$t('sync.inputProcessNameTip')" clearable :style="{ width: '94%' }" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button style="width: 80px" type="primary" size="mini" @click="confirm" :disabled="current_proc_obj.name === ''" v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
        <el-button style="width: 80px" size="mini" @click="visible = false">{{ $t('button.cancel') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getList } from '@/api/processDefinition.js'
import { procDefInfo } from '@/api/processDefinition.js'
export default {
  name: 'ProcessCopyForm',
  data () {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if (['', 'null', 'undefined'].includes(value + '')) {
        callback()
      } else if (/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)) {
        callback(new Error(this.$i18n.tc('modeler.illegalCharacterTemplatePrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 128) {
        callback(new Error(this.$i18n.tc('modeler.templateNameLengthErrorBack')))
      } else if (this.nameExistenceErr) {
        callback(new Error(this.$i18n.tc('sync.processNameHasTips')))
      } else {
        callback()
      }
    }
    return {
      current_proc_obj: {},
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
     * @param _process
     * @returns {Promise<void>}
     */
    async openProcessName (_process) {
      this.current_proc_obj = { ..._process }
      this.current_proc_obj.name = this.$i18n.tc('processCenter.copyFrom') + '“' + _process.name + '”'
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
          let processItem = { ..._this.current_proc_obj }
          _this.$emit('output', processItem)
          _this.visible = false
        }).catch(() => {
        })
      })
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
    /**
     * 判断同步流程是否存在
     * @returns {Promise<any>}
     */
    existence () {
      const _this = this
      const query = {
        type_id: 'doc_flow',
        name: _this.current_proc_obj.name.indexOf(' ') !== -1 ? '' : _this.current_proc_obj.name,
        template:'Y'
      }
      return new Promise((resolve) => {
        getList(query).then(res => {
          if (res !== null && res !== '') {
            res.entries.forEach(e => {
              if (e.name === _this.current_proc_obj.name) {
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
    }
  }
}
</script>
