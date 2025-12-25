<template>
    <div id="list" class="main_cont_gray" v-loading="loadings" element-loading-text="">

        <!-- 表单头部（标题、按钮）start -->
        <div class="rzsj_form_btn">
            <div class="cell_title">
                <p class="title">
                    发起文档匿名共享
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
            <el-form ref="formData" :model="formData" :rules="formrules" label-width="130px" label-position="right">

                <!-- 表单控件区域 start-->
                <el-row :gutter="0" justify="start" align="top" type="flex">
                    <!-- 列 -->
                    <el-col :span="24">
                        <el-form-item prop="apply_id" :inline="false" label="申请ID">
                            <el-input style="width:100%" :disabled="false" v-model="formData.apply_id" maxlength="4000"
                                :readonly="false" placeholder="请输入申请ID"></el-input>
                        </el-form-item>
                        <el-form-item prop="doc.id" :inline="false" label="文档ID">
                            <el-input style="width:100%" :disabled="false" v-model="formData.doc.id" maxlength="4000"
                                :readonly="false" placeholder="请输入文档ID"></el-input>
                            <span></span>
                        </el-form-item>
                        <el-form-item prop="doc.path" :inline="false" label="文档名称">
                            <el-input style="width:100%" :disabled="false" v-model="formData.doc.path" maxlength="4000"
                                :readonly="false" placeholder="请输入文档名称"></el-input>
                        </el-form-item>
                        <el-form-item prop="doc.type" :inline="false" label="文件类型">
                            <el-radio v-model="formData.doc.type" label="file" :readonly="false" :disabled="false"
                                style="display: inline-block">文件</el-radio>
                            <el-radio v-model="formData.doc.type" label="folder" :readonly="false" :disabled="false"
                                style="display: inline-block">文件夹</el-radio>
                        </el-form-item>
                        <el-form-item prop="doc.doc_lib_type" :inline="false" label="文件库类型">
                            <el-radio v-model="formData.doc.doc_lib_type" label="user_doc_lib" :readonly="false"
                                :disabled="false" style="display: inline-block">个人文档库</el-radio>
                            <el-radio v-model="formData.doc.doc_lib_type" label="department_doc_lib" :readonly="false"
                                :disabled="false" style="display: inline-block">部门文档库</el-radio>
                            <el-radio v-model="formData.doc.doc_lib_type" label="custom_doc_lib" :readonly="false"
                                :disabled="false" style="display: inline-block">自定义文档库</el-radio>
                        </el-form-item>
                        <el-form-item prop="doc.csf_level" :inline="false" label="文件密级">
                            <el-input style="width:100%" :disabled="false" v-model.number="formData.doc.csf_level"
                                maxlength="2" :readonly="false" placeholder="请输入文件密级"></el-input>
                        </el-form-item>
                        <el-form-item prop="operation" :inline="false" label="权限操作类型">
                            <el-radio v-model="formData.operation" label="create" :readonly="false" :disabled="false"
                                style="display: inline-block">新增</el-radio>
                            <el-radio v-model="formData.operation" label="modify" :readonly="false" :disabled="false"
                                style="display: inline-block">编辑</el-radio>
                            <el-radio v-model="formData.operation" label="delete" :readonly="false" :disabled="false"
                                style="display: inline-block">删除</el-radio>
                        </el-form-item>
                        <el-form-item prop="perm" :inline="false" label="允许权限">
                            <el-checkbox-group v-model="formData.perm">
                                <el-checkbox label="delete">删除</el-checkbox>
                                <el-checkbox label="modify">修改</el-checkbox>
                                <el-checkbox label="create">新建</el-checkbox>
                                <el-checkbox label="preview">预览</el-checkbox>
                                <el-checkbox label="download">下载</el-checkbox>
                                <el-checkbox label="display">显示</el-checkbox>
                            </el-checkbox-group>
                        </el-form-item>
                        <el-form-item prop="expires_at" :inline="false" label="有效期至">
                            <el-input style="width:100%" :disabled="false" v-model="formData.expires_at"
                                maxlength="4000" :readonly="false" placeholder="请输入有效期至"></el-input>
                            <span style="color: gray; font-size: 12px;">永久有效为-1</span>
                        </el-form-item>
                        <el-form-item prop="link_id" :inline="false" label="link值">
                            <el-input style="width:100%" :disabled="false" v-model="formData.link_id" maxlength="4000"
                                :readonly="false" placeholder="请输入ShareedLink地址"></el-input>
                        </el-form-item>
                        <el-form-item prop="title" :inline="false" label="链接标题">
                            <el-input style="width:100%" :disabled="false" v-model="formData.title" maxlength="4000"
                                :readonly="false" placeholder="请输入链接标题"></el-input>
                        </el-form-item>
                        <el-form-item prop="password" :inline="false" label="提取码">
                            <el-input style="width:100%" :disabled="false" v-model="formData.password" maxlength="4000"
                                :readonly="false" placeholder="请输入提取码"></el-input>
                        </el-form-item>
                        <el-form-item prop="access_limit" :inline="false" label="打开次数限制">
                            <el-input style="width:100%" :disabled="false" v-model.number="formData.access_limit"
                                maxlength="4000" :readonly="false" placeholder="请输入打开次数限制"></el-input>
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
        type: 'anonymous',
        operation: 'create',
        expires_at: '2022-01-01 00:00',
        link_id: 'SDFASDAFXCZVWE',
        title: '文本文档.txt',
        password: '',
        access_limit: -1,
        doc: {
          id: 'gns://4BF07AC2123B4B448F455AEC7081102D/1FAD9291AE9F45ADADC5AEB41ED8ABE4',
          path: '/张三/文本文档.txt',
          type: 'file',
          doc_lib_type: 'user_doc_lib',
          csf_level: 5,
          max_csf_level: 5
        },
        perm: ['preview', 'download', 'display']
      },
      // 表单验证规则
      formrules: {
        apply_id: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        'doc.id': [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        'doc.path': [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        'doc.type': [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        'doc.doc_lib_type': [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        operation: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        expires_at: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        link_id: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        title: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        access_limit: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
        perm: [{ required: true, message: '该项不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.formData.apply_id = this.guid()
  },
  methods: {
    submitForm() {
      let self = this
      self.formData.max_csf_level = self.formData.doc.csf_level
      this.$refs['formData'].validate((valid) => {
        if (valid) {
          self.loadings = true
          save(self.formData, 'anonymous').then(res => {
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
