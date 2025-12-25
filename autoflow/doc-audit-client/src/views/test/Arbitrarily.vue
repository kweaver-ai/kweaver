<template>
  <div id="list" class="main_cont_gray" v-loading="loadings" element-loading-text="">
    <!-- 表单头部（标题、按钮）start -->
    <div class="rzsj_form_btn">
      <div class="cell_title">
        <p class="title">发起任意审核流程</p>
      </div>
      <!-- 按钮组 -->
      <div class="cell_btn">
        <el-button size="small" icon="el-icon-position" type="primary" @click="submitForm">
          发送请求
        </el-button>
      </div>
    </div>
    <!-- 表单头部（标题、按钮）end -->
    <!-- 表单body start-->
    <div ref="print" class="form_body">
      <el-form ref="formData" :model="formData" :rules="formrules" label-width="110px" label-position="right">
        <!-- 表单控件区域 start-->
        <el-row :gutter="0" justify="start" align="top" type="flex">
          <!-- 列 -->
          <el-col :span="24">
            <el-form-item prop="process.apply_id" :inline="false" label="审核申请ID">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.process.apply_id"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入申请ID"></el-input>
            </el-form-item>

            <el-form-item prop="process.conflict_apply_id" :inline="false" label="上一个审核申请ID">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.process.conflict_apply_id"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入上一个审核申请ID"></el-input>
            </el-form-item>


            <el-form-item prop="process.user_name" :inline="false" label="申请人名称">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.process.user_name"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入申请人名称 "></el-input>
            </el-form-item>

            <el-form-item prop="process.audit_type"
                          :inline="false"
                          label="审核申请类型">
              <el-radio v-model="formData.process.audit_type"
                        label="sync"
                        :readonly="false"
                        :disabled="false"
                        style="display: inline-block;">
                文档同步
              </el-radio>
              <el-radio v-model="formData.process.audit_type"
                        label="flow"
                        :readonly="false"
                        :disabled="false"
                        style="display: inline-block;">
                文档流转
              </el-radio>
            </el-form-item>
            <el-form-item prop="process.proc_def_key"
                          :inline="false"
                          label="流程定义KEY">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.process.proc_def_key"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入流程定义KEY"></el-input>
            </el-form-item>

            <el-form-item prop="workflow.top_csf"
                          :inline="false"
                          label="最高密级">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.workflow.top_csf"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入最高密级"></el-input>
            </el-form-item>

            <el-form-item prop=""
                          :inline="false"
                          label="摘要">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.workflow.content"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入摘要"></el-input>
            </el-form-item>

            <el-form-item prop=""
                          :inline="false"
                          label="国际化资源">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.workflow.locale"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入国际化资源"></el-input>
            </el-form-item>

          </el-col>
        </el-row>
        <!-- 表单控件区域 end-->
      </el-form>
    </div>
    <!-- 表单body end -->
  </div>
</template>

<script>
import { save } from '@/api/audit'
export default {
  data () {
    return {
      // 表单加载状态
      loadings: false,
      // 表单数据
      formData: {
        process: {
          audit_type: 'sync',
          apply_id: 'cd290632-2b60-4693-ae0b-6c10ea730b76',
          conflict_apply_id: '',
          user_id: '',
          user_name: '张三',
          proc_def_key: 'Process_iFx5Ddaw'
        },
        data: '',
        workflow: {
          top_csf: 5,
          msg_for_abstract: ['source','target'],
          msg_for_email: ['target','source'],
          msg_for_log: ['source','target','mode'],
          content: '',
          locale: '',
          front_plugin_info: ''
        }
      },
      // 表单验证规则
      formrules: {
        apply_id: [
          { required: true, message: '该项不能为空', trigger: 'blur' }
        ],
        proc_def_key: [
          { required: true, message: '该项不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created () {
    this.formData.apply_id = this.guid()
  },
  methods: {
    submitForm () {
      let self = this
      this.$refs['formData'].validate((valid) => {
        if (valid) {
          self.loadings = true
          save(self.formData,'arbitrarily')
            .then((res) => {
              if (res.status === 200) {
                self.$message({
                  type: 'success',
                  dangerouslyUseHTMLString: true,
                  message: '请求成功'

                })
                this.formData.process.apply_id = this.guid()
              } else {
                self.$message({
                  type: 'warning',
                  dangerouslyUseHTMLString: true,
                  message:
                      '发起失败！<br />返回值为：' + JSON.stringify(res.data)
                })
              }
              self.loadings = false
            })
            .catch((res) => {
              self.loadings = false
            })
        }
      })
    },
    add (type) {
      this.formData[type].push({
        id: '',
        path: '',
        version: '',
        key: Math.random()
      })
    },
    remove (type) {
      if (this.formData[type].length > 1) {
        this.formData[type].pop()
      }
    },
    guid () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (
        c,
      ) {
        let r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
  }
}
</script>
<style>
  .inline {
    display: inline-block !important;
    width: 18%;
    margin-right: 8px;
  }
</style>
