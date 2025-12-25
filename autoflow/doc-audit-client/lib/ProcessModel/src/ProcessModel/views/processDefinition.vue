<template>
  <div>
    <div class="el-steps-new">
      <el-steps :active="active" simple>
        <el-step v-for="item in steps" :key="item.title" :title="item.title"></el-step>
      </el-steps>
    </div>
    <div v-loading="loading">
      <div v-show="is_from" class="from-group-1">
        <processForm v-if="!loading" ref="processForm" :is_change="is_change" v-on="$listeners" :process_obj="process_obj" :proc_def_key="proc_def_key" :type_disabled="type_disabled || is_edit"></processForm>
        <div class="btn-box">
          <el-button type="primary" size="mini" style="min-width: 80px" @click="formNext">{{ $t('modeler.common.nextStep') }}</el-button>
          <el-button size="mini" style="min-width: 80px" @click="postClose">{{ $t('modeler.common.cancel') }}</el-button>
        </div>
      </div>
      <div v-show="is_model">
        <processModel v-if="!loading" ref="processModel" :is_change="is_change" v-on="$listeners" :process_obj.sync="process_obj" :proc_def_key="proc_def_key"></processModel>
        <div class="btn-box-2">
          <!-- <el-button size="mini" type="primary" @click="processModelDeploy" :disabled="is_change">部署流程(生成新版本)</el-button> -->
          <el-button size="mini" type="primary" style="min-width: 80px" @click="processModelSave" :disabled="!is_change">{{ $t('modeler.common.save') }}</el-button>
          <el-button size="mini" style="min-width: 80px" @click="back">{{ $t('modeler.common.preStep') }}</el-button>
          <el-button size="mini" style="min-width: 80px" @click="postClose">{{ $t('modeler.common.cancel') }}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ts-ignore
import request from '@/utils/request'
import processModel from './processModel'
import processForm from './processForm'
export default {
  name: 'ProcessDefinition',
  components: { processForm, processModel },
  computed: {
    is_from() {
      return this.active === 0
    },
    is_model() {
      return this.active === 1
    },
    is_edit() {
      return !['null', '', 'undefined'].includes(this.proc_def_key + '')
    }
  },
  props: {
    app_id: {
      type: String,
      required: true
    },
    proc_def_key: {
      type: String,
      required: true
    },
    is_change: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      active: 0,
      steps: [{ title: this.$i18n.tc('modeler.StepOne') }, { title: this.$i18n.tc('modeler.StepTwo') }],
      process_obj: {},
      type_disabled: false,
      loading: false
    }
  },
  async created() {
    this.loading = true
    if (this.is_edit) {
      this.active = 1
    }
    await this.init()
    this.$emit('change', false)
    this.loading = false
  },
  methods: {
    async init() {
      this.process_obj = await this.openProcessUrl()
    },
    openProcessUrl() {
      if (['', 'null', 'undefined'].includes(this.app_id + '')) {
        this.$message.warning(`app_id${this.$i18n.tc('message.paramError')}!`)
        return {}
      }
      if (['', 'null', 'undefined'].includes(this.proc_def_key + '')) {
        return { app_id: this.app_id }
      }
      const url = process.env.VUE_APP_BASE_API + '/process-definition/' + this.proc_def_key
      return new Promise((resolve, reject) => {
        request
          .get(url)
          .then(res => {
            const result = res
            result.app_id = this.app_id
            resolve(result)
          })
          .catch(error => {
            console.log(error)
            this.$message.warning(error.getMessage)
            reject(error)
          })
      })
    },
    /**
     * 表单下一步
     */
    formNext() {
      this.$refs['processForm'].submitForm(() => {
        this.type_disabled = true
        this.next()
      })
    },
    /**
     * 下一步
     */
    next() {
      if (++this.active > this.steps.length) this.active = 0
    },
    back() {
      if (--this.active < 0) this.active = 0
    },
    postClose() {
      this.$emit('close')
    },
    /* processModelDeploy() {
      this.$refs['processModel'].deploy();
    }, */
    async processModelSave() {
      console.log(1)
      await this.$refs['processModel'].save()
      console.log(2)
      this.$emit('refresh')
      console.log(3)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
