<template>
    <div id="list" class="main_cont_gray" v-loading="loadings" element-loading-text="加载中">

        <!-- 表单头部（标题、按钮）start -->
        <div class="rzsj_form_btn">
            <div class="cell_title">
                <p class="title">
                    发起文档同步
                </p>
            </div>
            <!-- 按钮组 -->
            <div class="cell_btn">
                <el-button size="small" icon="el-icon-position" type="primary" @click="submitForm">发送请求</el-button>
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
                        <el-form-item prop="apply_id" :inline="false" label="申请ID">
                            <el-input style="width:100%" :disabled="false" v-model="formData.apply_id" maxlength="4000"
                                :readonly="false" placeholder="请输入申请ID"></el-input>
                        </el-form-item>
                        <el-form-item prop="doc_id" :inline="false" label="文档ID">
                            <el-input style="width:100%" :disabled="false" v-model="formData.doc_id" maxlength="4000"
                                :readonly="false" placeholder="请输入文档ID"></el-input>
                            <span></span>
                        </el-form-item>
                        <el-form-item prop="proc_def_key" :inline="false" label="流程定义key">
                            <el-input style="width:100%" :disabled="false" v-model="formData.proc_def_key"
                                maxlength="4000" :readonly="false" placeholder="请输入流程定义key"></el-input>
                        </el-form-item>
                        <el-form-item prop="mode" :inline="false" label="同步模式">
                            <el-radio v-model="formData.mode" label="sync" :readonly="false" :disabled="false"
                                style="display: inline-block">同步</el-radio>
                            <el-radio v-model="formData.mode" label="copy" :readonly="false" :disabled="false"
                                style="display: inline-block">拷贝</el-radio>
                            <el-radio v-model="formData.mode" label="move" :readonly="false" :disabled="false"
                                style="display: inline-block">移动</el-radio>
                        </el-form-item>
                        <el-form-item prop="target_path" :inline="false" label="目标文档全路径名称">
                            <el-input style="width:100%" :disabled="false" v-model="formData.target_path"
                                :readonly="false" placeholder="请输入目标文档全路径名称"></el-input>
                        </el-form-item>
                        <el-form-item prop="doc_blacklist" :inline="false" label="文件黑名单">
                            <el-select v-model="formData.doc_blacklist" multiple filterable allow-create
                                default-first-option placeholder="请输入文档ID">
                            </el-select>
                        </el-form-item>
                        <el-form-item prop="conflictApplyId" :inline="false" label="冲突申请ID">
                            <el-input style="width:100%" :disabled="false" v-model="formData.conflictApplyId"
                                :readonly="false" placeholder="请输入冲突申请ID"></el-input>
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
  data() {
    return {
      // 表单加载状态
      loadings: false,
      // 表单数据
      formData: {
        apply_id: '',
        proc_def_key: 'Process_T4iiPvEC',
        mode: 'sync',
        target_path: 'Anyshare://技术中心',
        doc_blacklist: ['gns://4C4FBE5C395E40E6B6F142456F01488E/92F93A969E0D43EFB6DAAE5C40978FE8/00FC80E3AEE545C7816D6134E4AEF2E5'],
        doc_id: 'gns://4C4FBE5C395E40E6B6F142456F01488E/92F93A969E0D43EFB6DAAE5C40978FE8',
        conflictApplyId: ''
      },
      // 表单验证规则
      formrules: {
        apply_id: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        proc_def_key: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        mode: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        target_path: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        doc_id: [{ required: true, message: '该项不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.formData.apply_id = this.guid()
  },
  methods: {
    submitForm() {
      let self = this
      this.$refs['formData'].validate((valid) => {
        if (valid) {
          self.loadings = true
          save(self.formData, 'sync').then(res => {
            self.$message({
              type: 'success',
              dangerouslyUseHTMLString: true,
              message: '请求发送成功'
            })
            self.formData.apply_id = this.guid()
            self.loadings = false
          }).catch(res => {
            self.loadings = false
          })
        }
      })
    },
    guid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

  }
}
</script>