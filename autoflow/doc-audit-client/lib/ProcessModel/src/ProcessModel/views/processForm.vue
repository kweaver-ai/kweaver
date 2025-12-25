<template>
  <div>
    <el-form ref="form" :model="process_obj" label-width="145px" size="small" :rules="rules">
      <el-form-item :label="$t('modeler.processName') + ':'" prop="name">
        <el-input
          v-model="process_obj.name"
          maxlength="50"
          show-word-limit
          :placeholder="$t('modeler.common.inputTip') + $t('modeler.processName')"
          @change="nameChangeForm()"
          clearable
          :style="{ width: '94%' }"
        />
      </el-form-item>
      <el-form-item :label="$t('modeler.processType') + ':'" prop="type">
        <el-select v-model="process_obj.type" :disabled="type_disabled" :placeholder="$t('modeler.common.selectTip') + $t('modeler.processType')" @change="changeForm()" :style="{ width: '94%' }">
          <el-option v-for="item in type_options" class="hoverTips" :key="item.value" :disabled="item.disabled" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('modeler.processDescription') + ':'">
        <el-input
          v-model="process_obj.description"
          type="textarea"
          rows="3"
          maxlength="800"
          show-word-limit
          @change="changeForm()"
          :style="{ width: '94%' }"
          :placeholder="$t('modeler.common.inputTip') + $t('modeler.processDescription')"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import request from '@/utils/request'
export default {
  name: 'ProcessFrom',
  props: {
    process_obj: { type: Object, required: true },
    type_disabled: { type: Boolean, required: true },
    proc_def_key: {
      type: String,
      required: true
    }
  },
  computed: {
    is_edit() {
      if (['', 'null', 'undefined'].includes(this.proc_def_key + '')) {
        return false
      } else {
        return true
      }
    },
    process_obj_type() {
      return this.process_obj.type
    }
  },
  data() {
    var validateName = (rule, value, callback) => {
      if (value.trim().length > 0) {
        this.getDataByName(value).then(response => {
          console.log(response.exists);
          if (response.exists) {
            if (this.is_edit && response.exists && this.old_name === value) {
              callback()
            } else {
              callback(new Error(this.$i18n.tc('modeler.duplicateTip')))
            }
          } else {
            callback()
          }
        })
      } else {
        callback()
      }
    }
    return {
      old_name: '',
      type_options: [
        { label: this.$i18n.tc('modeler.procType.DOC_SHARE'), value: 'DOC_SHARE' },
        /*{ label: this.$i18n.tc('modeler.procType.DOC_FLOW'), value: 'DOC_FLOW' },*/
        { label: this.$i18n.tc('modeler.procType.DOC_SYNC'), value: 'DOC_SYNC' }
        /*{ label: this.$i18n.tc('modeler.procType.DOC_SECRET'), value: 'DOC_SECRET' }*/
      ],
      rules: {
        name: [
          { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'blur' },
          { required: true, trigger: 'blur', validator: validateName },
          {
            required: true,
            pattern: /^[^\\/:*?<>|]*$/g,
            message: this.$i18n.tc('modeler.illegalCharacterPrefix') + '\\ / : * ? " < > |' + this.$i18n.tc('modeler.illegalCharacterSuffix'),
            trigger: 'blur'
          }
        ],
        type: { required: true, message: this.$i18n.tc('modeler.isNotNull'), trigger: 'change' }
      }
    }
  },
  watch: {
    process_obj_type(val) {
      const map = {
        DOC_SHARE: this.$i18n.tc('modeler.procType.DOC_SHARE'),
        DOC_FLOW: this.$i18n.tc('modeler.procType.DOC_FLOW'),
        DOC_SYNC: this.$i18n.tc('modeler.procType.DOC_SYNC'),
        DOC_SECRET: this.$i18n.tc('modeler.procType.DOC_SECRET')
      }
      this.$set(this.process_obj, 'type_name', map[val])
    }
  },
  async mounted() {
    if (!this.type_disabled) {
      const { exists: shareList } = await this.getTypeDataList('DOC_SHARE')
      if (shareList) {
        this.type_options.splice(0, 1)
      }
      const { exists: secretList } = await this.getTypeDataList('DOC_SECRET')
      if (secretList) {
        const index = this.type_options.map(el => el.value).indexOf('DOC_SECRET')
        console.log(index)
        this.type_options.splice(index, 1)
      }
    }
    this.old_name = this.process_obj.name
  },
  methods: {
    submitForm(_fun) {
      this.$refs['form'].validate(valid => {
        if (valid) {
          _fun(this.process_obj)
        } else {
          return false
        }
      })
    },
    changeForm() {
      this.$emit('change', true)
    },
    nameChangeForm() {
      this.$emit('change', true)
    },
    /**
     * 获取分类数据
     * @param {String} type 类型
     */
    getTypeDataList(type) {
      const url = `${process.env.VUE_APP_BASE_API}/process-definition/existence`
      const params = { type_id: type }
      return new Promise((resolve, reject) => {
        request
          .get(url, { params })
          .then(response => {
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    /**
     * 根据名称获取流程数据
     * @param {String} name 名称
     */
    getDataByName(name) {
      const url = `${process.env.VUE_APP_BASE_API}/process-definition/existence`
      const params = { name: name }
      return new Promise((resolve, reject) => {
        request
          .get(url, { params })
          .then(response => {
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
