<!-- 同步流程，流程基本表单信息界面（同流程中心一致，这里为了以后可扩展） -->
<template>
  <div>
    <el-dialog :title="$t('modeler.processName')" :visible="visible" :close-on-click-modal="false" :append-to-body="true" @close="close" v-dialogDrag custom-class="new-dialog" width="420px" :destroy-on-close="true">
      <el-form ref="processForm" label-position="left" :model="current_proc" :label-width="$i18n.locale === 'en-us'?'145px':'86px'" size="small" :rules="rules">
        <el-form-item :label="$t('modeler.processName') + ':'" prop="name">
          <el-input
            v-model.trim="current_proc.name"
            show-word-limit
            :placeholder="$t('sync.inputProcessNameTip')"
            clearable
            :style="{ width: '100%' }"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button style="width: 80px" type="primary" size="mini" @click="confirm" :disabled="current_proc.name === ''" v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
        <el-button style="width: 80px" size="mini" @click="visible = false">{{ $t('button.cancel') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { uuid8 } from '../../../utils/uuid.js'
import { getList } from '@/api/processDefinition.js'
export default {
  name: 'ProcessSyncForm',
  props: {
    process_obj: {
      type: Object,
      required: true
    }
  },
  data() {
    let validateName = (rule, value, callback) => {
      // eslint-disable-next-line no-useless-escape
      if(['', 'null', 'undefined'].includes(value + '')){
        callback()
        // eslint-disable-next-line no-useless-escape
      }else if(/^.*[\[\\/:\*\?<>"\|\]]+.*$/g.test(value)){
        callback(new Error(this.$i18n.tc('modeler.illegalCharacterProcessPrefix') + ' \\ / : * ? < > | "' + this.$i18n.tc('modeler.illegalCharacterSuffix')))
      } else if (value.length > 20){
        callback(new Error(this.$i18n.tc('modeler.processNameLengthErrorBack')))
      } else if(this.nameExistenceErr){
        callback(new Error(this.$i18n.tc('sync.processNameHasTips')))
      }else {
        callback()
      }
    }
    return {
      operation:'new',
      current_proc:{},
      nameExistenceErr: false,
      rules: {
        name: [
          {required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'blur'},
          {required: true, trigger: 'blur', validator: validateName},
          {required: true, trigger: 'change', validator: validateName}
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
    async openProcessTitle(operation, _process) {
      this.operation = operation
      this.current_proc = {..._process}
      this.nameExistenceErr = false
      this.visible = true
    },
    /**
     * 确认
     */
    confirm(){
      const _this = this
      this.nameExistenceErr = false
      _this.$refs['processForm'].validate(valid => {
        if(!valid){
          return
        }
        this.existence().then(res => {
          if(res){
            _this.nameExistenceErr = true
            _this.$refs.processForm.validateField('name')
            return
          }
          let processItem = {... _this.current_proc}
          if(_this.operation === 'new'){
            const process_id = 'Process_' + uuid8(8, 62)
            processItem.key = process_id
          }
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
    existence(){
      const _this = this
      const query = {
        type_id: _this.process_obj.type,
        name: _this.current_proc.name.indexOf(' ') !== -1 ? '' : _this.current_proc.name
      }
      return new Promise((resolve) => {
        if(_this.operation === 'update' && _this.process_obj.name === _this.current_proc.name){
          resolve(false)
          return
        }
        getList(query).then(res => {
          if (res !== null && res !== '') {
            res.entries.forEach(e => {
              if(e.name === _this.current_proc.name){
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
    }
  }
}
</script>
