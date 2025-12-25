<!-- 流程中心，流程复制表单界面 -->
<template>
  <div>
    <el-dialog
       :title="$t('button.rename')"
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
import { procDefInfo,savePro } from '@/api/processDefinition.js'
import processSetting from '../../../lib/ProcessModel/src/mixins/processSetting'
export default {
  name: 'ProcessRenameForm',
  mixins: [processSetting],
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
      loading:false,
      flow_xml:'',
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
    async openProcessName(_process) {
      let _this = this
      procDefInfo(_process.id)
        .then(res => {
          const result = res
          result.tenant_id = _process.tenant_id
          _this.current_proc_obj = result
          this.initProcessConfig( _this.current_proc_obj .flow_xml,  _this.current_proc_obj .key, _this.current_proc_obj .name)
          _this.nameExistenceErr = false
          _this.visible = true
        }).catch(error => {
          _this.$message.warning(error.getMessage)
        })


    },

    /**
     * 确认
     */
    confirm() {
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
          _this.save()
          _this.visible = false
        }).catch(() => {
        })
      })
    },
    /**
     * 获取流程建模信息
     * @param _procDefId
     */
    getProcessInfo(_procDefId) {
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
     * 判断流程名称是否存在
     * @returns {Promise<any>}
     */
    existence() {
      const _this = this
      const query = {
        type_id: 'process_center',
        name: _this.current_proc_obj.name.indexOf(' ') !== -1 ? '' : _this.current_proc_obj.name,
        template:'Y'
      }
      return new Promise((resolve) => {
        getList(query).then(res => {
          if (res !== null && res !== '') {
            res.entries.forEach(e => {
              if (e.name === _this.current_proc_obj.name && e.key !== _this.current_proc_obj.key) {
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
    close() {
      this.visible = false
    },    /**
     * 保存流程
     * @param rqType
     * @returns {Promise<any>}
     */
    save () {
      const _this = this
      return new Promise(resolve => {
        _this.processConfig.workFlowDef.name = _this.current_proc_obj.name
        _this.deployPre('update', resolve)
      })
    },
    deployPre (opt, resolve) {
      const _this = this
      _this.getBpmnXml().then(res => {
        _this.flow_xml = res
        _this.deploy(opt).then(res => {
          resolve(res)
          _this.$emit('output')
        }).catch((res) => {})
      })
    },
    /**
     * 部署流程
     * @param opt
     * @returns {Promise<*>}
     */
    async deploy (type) {
      const _this = this
      const _saveObj = {
        ..._this.current_proc_obj,
        is_copy: 0,
        advanced_setup: _this.current_proc_obj.advancedSetup,
        flow_xml: _this.encode(_this.flow_xml),
        audit_strategy_list: _this.current_proc_obj.docShareStrategyList
      }
      _this.loading = true
      return new Promise((resolve, reject) => {
        savePro(_saveObj, { type })
          .then(res => {
            _this.current_proc_obj.flow_xml = _this.flow_xml
            _this.current_proc_obj.id = res.id
            _this.$message.success(_this.$i18n.tc('modeler.common.renameTip'))
            _this.loading = false
            resolve(res)
          })
          .catch(function (error) {
            console.error(error)
            reject(error)
            _this.loading = false
          })
      })
    },    /**
     * 字符串转base64
     * @param str
     * @returns {string}
     */
    encode (str) {
      const encode = encodeURI(str)
      const base64 = btoa(encode)
      return base64
    }
  }
}
</script>
