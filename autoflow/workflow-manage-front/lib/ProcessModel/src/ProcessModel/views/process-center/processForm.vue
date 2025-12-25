<!-- 流程中心，流程基本表单信息界面 -->
<template>
  <div>
    <el-dialog :title="template === 'Y' || isTemplate?$t('deptAuditorRule.templateName'):$t('modeler.processName')"
               :visible="visible"
               :close-on-click-modal="false"
               :append-to-body="true"
               @close="close"
               v-dialogDrag
               custom-class="new-dialog"
               width="420px"
               :destroy-on-close="true">
      <el-form ref="processForm"
               label-position="left"
               :model="current_proc"
               :label-width="$i18n.locale === 'en-us'?'145px':'86px'"
               size="small"
               :rules="rules">
        <el-form-item :label="template === 'Y' || isTemplate ? $t('deptAuditorRule.templateName'):$t('modeler.processName') + ':'"
                      prop="name">
          <span class="red" style="margin-right: 5px">*</span>
          <el-input v-model.trim="current_proc.name"
                    show-word-limit
                    :placeholder="template === 'Y' || isTemplate? $t('sync.inputTemplateNameTip') :$t('sync.inputProcessNameTip')"
                    clearable
                    :style="{ width: '90%' }" />
        </el-form-item>
        <!-- <template v-if="!current_proc.id && process_obj.type === ''">
          <el-form-item :label="$t('modeler.processCategory') + ':'"
                        prop="type">
            <span class="red" style="margin-right: 5px">*</span>
            <el-select v-model="current_proc.type"
                       :placeholder="$t('modeler.common.selectTip')"
                       @change="handleSelectedChange"
                       style="width: 90%;">
              <div style="overflow: auto;max-height: 141px;">
                <el-option v-for="(item, index) in processCategoryList"
                           :key="index"
                           :label="item.label[$i18n.locale]"
                           :value="item.category">
                  <template scop="label">
                    <el-tooltip class="item"
                                effect="light"
                                placement="top-start"
                                :content="item.label[$i18n.locale]"
                                :open-delay="500">
                      <div style="width: 200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;">{{item.label[$i18n.locale]}}</div>
                    </el-tooltip>
                  </template>
                </el-option>
              </div>
            </el-select>
          </el-form-item>
        </template> -->
      </el-form>
      <span slot="footer"
            class="dialog-footer">
        <el-button style="width: 80px"
                   type="primary"
                   size="mini"
                   @click="confirm"
                   :disabled="current_proc.name === ''"
                   v-preventReClick="1000">{{ $t('button.confirm') }}</el-button>
        <el-button style="width: 80px"
                   size="mini"
                   @click="visible = false">{{ $t('button.cancel') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { uuid8 } from '../../../utils/uuid.js'
import { getList, categoryList } from '@/api/processDefinition.js'
import { tenantId } from '@/utils/config'
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
        callback(new Error(this.$i18n.tc('sync.processNameHasTips')))
      } else {
        callback()
      }
    }
    return {
      operation: 'new',
      current_proc: {},
      nameExistenceErr: false,
      processCategoryList: [],
      rules: {
        name: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'blur' },
          { required: true, trigger: 'blur', validator: validateName },
          { required: true, trigger: 'change', validator: validateName }
        ],
        type: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'blur' }
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
      const _this = this
      if(operation === 'skip'){
        _this.$emit('output', "update", { ..._process})
        return 
      }
      this.operation = operation
      this.loadProcessCategory().then(res => {
        this.current_proc = { ..._process }
        this.nameExistenceErr = false
        if(tenantId === 'af_workflow'){
          this.processCategoryList = res
        }else{
          this.processCategoryList = res.filter(e => e.category_belong === 'control')
        }
        this.visible = true
      })
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
      let selectedCategoryList = this.processCategoryList.filter(e => e.category === type)
      return selectedCategoryList.length > 0 ? selectedCategoryList[0].label[this.$i18n.locale] : ''
    },
    handleSelectedChange(value){
      const _this = this
      let selectedCategoryList = _this.processCategoryList.filter(e => e.category === value)
      _this.current_proc.type_name = selectedCategoryList[0].label[_this.$i18n.locale]

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
          if (_this.operation === 'new') {
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
    existence () {
      const _this = this
      const query = {
        // type_id: _this.process_obj.type,
        name: _this.current_proc.name.indexOf(' ') !== -1 ? '' : _this.current_proc.name,
        template: 'Y'
      }
      return new Promise((resolve) => {
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
    restValidateName () {
      this.nameExistenceErr = false
      this.$refs.processForm.validateField('name')
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
