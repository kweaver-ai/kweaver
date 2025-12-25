<template>
  <div id="list" class="main_cont_gray" v-loading="loadings" element-loading-text="">
    <!-- 表单头部（标题、按钮）start -->
    <div class="rzsj_form_btn">
      <div class="cell_title">
        <p class="title">发起文档流转</p>
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
            <el-form-item prop="apply_id" :inline="false" label="申请ID">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.apply_id"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入申请ID"></el-input>
            </el-form-item>
            <el-form-item label="文档对象信息" required>
              <div :key="index" v-for="(doc, index) in formData.docs">
                <el-form-item
                  class="inline"
                  label=""
                  :prop="'docs.' + index + '.id'"
                  :rules="{
                    required: true,
                    message: '请输入文档gns路径',
                    trigger: 'blur',
                  }">
                  <el-input placeholder="请输入文档gns路径" v-model="doc.id"></el-input>
                </el-form-item>
                <el-form-item
                  class="inline"
                  label=""
                  :prop="'docs.' + index + '.path'"
                  :rules="{
                    required: true,
                    message: '请输入文档全路径名称',
                    trigger: 'blur',
                  }">
                  <el-input placeholder="请输入文档全路径名称" v-model="doc.path"></el-input>
                </el-form-item>
                <el-form-item
                  class="inline"
                  style="width: 25%;"
                  label=""
                  :prop="'docs.' + index + '.type'"
                  :rules="{
                    required: true,
                    message: '请选择类型',
                    trigger: 'blur',
                  }">
                  <el-radio v-model="doc.type"
                            label="folder"
                            :readonly="false"
                            :disabled="false"
                            style="display: inline-block;">
                    文件夹
                  </el-radio>
                  <el-radio v-model="doc.type"
                            label="file"
                            :readonly="false"
                            :disabled="false"
                            style="display: inline-block;">
                    文件
                  </el-radio>
                </el-form-item>
                <el-form-item class="inline"
                              label="文件密级"
                              :prop="'docs.' + index + '.csf_level'"
                              :rules="{
                    required: true,
                    message: '请输入文件密级',
                    trigger: 'blur',
                  }">
                  <el-input placeholder="请输入文件密级" min="5" max="15" v-model="doc.csf_level"></el-input>
                </el-form-item>
                <el-button @click.prevent="add('docs')" v-if="index == 0">增加</el-button>
                <el-button @click.prevent="remove('docs')" v-if="index == 0">删除</el-button>
              </div>
            </el-form-item>

            <el-form-item prop="doc_lib_type"
                          :inline="false"
                          label="所属文件库类型">
              <el-radio v-model="formData.doc_lib_type"
                        label="user_doc_lib"
                        :readonly="false"
                        :disabled="false"
                        style="display: inline-block;">
                个人文档库
              </el-radio>
              <el-radio v-model="formData.doc_lib_type"
                        label="department_doc_lib"
                        :readonly="false"
                        :disabled="false"
                        style="display: inline-block;">
                部门文档库
              </el-radio>
              <el-radio v-model="formData.doc_lib_type"
                        label="custom_doc_lib"
                        :readonly="false"
                        :disabled="false"
                        style="display: inline-block;">
                自定义文档库
              </el-radio>
            </el-form-item>
            <el-form-item prop="proc_def_key"
                          :inline="false"
                          label="流程定义KEY">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.proc_def_key"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入流程定义KEY"></el-input>
            </el-form-item>
            <el-form-item prop="flow_name"
                          :inline="false"
                          label="流程名称">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.flow_name"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入流程名称"></el-input>
            </el-form-item>

            <el-form-item prop="flow_explain"
                          :inline="false"
                          label="流程说明">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.flow_explain"
                        maxlength="2"
                        :readonly="false"
                        placeholder="请输入流程说明"></el-input>
            </el-form-item>
            <el-form-item prop="flow_strategy_creator"
                          :inline="false"
                          label="流转创建者">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.flow_strategy_creator"
                        maxlength="4000"
                        :readonly="false"
                        placeholder="请输入流转创建者"></el-input>
            </el-form-item>
            <el-form-item prop="target_path"
                          :inline="false"
                          label="目标文档全路径名称">
              <el-input style="width: 100%;"
                        :disabled="false"
                        v-model="formData.target_path"
                        :readonly="false"
                        placeholder="请输入目标文档全路径名称"></el-input>
            </el-form-item>

            <el-form-item label="文档信息"
                          required>
              <div :key="index"
                   v-for="(doc, index) in formData.doc_list">
                <el-form-item class="inline"
                              label=""
                              style="width:28%"
                              :prop="'doc_list.' + index + '.id'"
                              :rules="{
                    required: true,
                    message: '请输入文档gns路径',
                    trigger: 'blur',
                  }">
                  <el-input placeholder="请输入文档gns路径"
                            v-model="doc.id"></el-input>
                </el-form-item>
                <el-form-item class="inline"
                              style="width:25%"
                              label=""
                              :prop="'doc_list.' + index + '.path'"
                              :rules="{
                    required: true,
                    message: '请输入文档全路径',
                    trigger: 'blur',
                  }">
                  <el-input placeholder="请输入文档全路径"
                            v-model="doc.path"></el-input>
                </el-form-item>

                <el-form-item class="inline"
                              label=""
                              :prop="'doc_list.' + index + '.version'"
                              :rules="{
                    required: true,
                    message: '请输入文件密级',
                    trigger: 'blur',
                  }">
                  <el-input placeholder="请输入文件密级"
                            min="5"
                            max="15"
                            v-model="doc.version"></el-input>
                </el-form-item>
                <el-button @click.prevent="add('doc_list')"
                           v-if="index == 0">
                  增加
                </el-button>
                <el-button @click.prevent="remove('doc_list')"
                           v-if="index == 0">
                  删除
                </el-button>
              </div>
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
          docs: [
            {
              id:
                'gns://71D0EA1ACD8E4C0EB3FDE60F7CD9C7D4/94E8701B4E7F4E308C665C776ADB547B',
              path: 'AnyShare://韩健cs/新建文件夹',
              type: 'folder',
              csf_level: 3
            },
            {
              id:
                'gns://71D0EA1ACD8E4C0EB3FDE60F7CD9C7D4/55B90642A2DF4BB9A0700715861A9E00',
              path: 'AnyShare://韩健cs/新建文件夹2',
              type: 'folder',
              csf_level: 3
            }
          ],
          doc_lib_type: 'user_doc_lib',
          apply_id: '',
          flow_name: '流程测试',
          flow_strategy_creator: '韩健',
          target_path: 'AnyShare://韩健cs',
          flow_explain: '申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容申请内容',
          proc_def_key: 'Process_qyfalZvo',
          doc_list: [
            {
              id:
                'gns://71D0EA1ACD8E4C0EB3FDE60F7CD9C7D4/94E8701B4E7F4E308C665C776ADB547B/B240B87DC62144DBA32B72AD3BC264CC',
              path: 'AnyShare://韩健cs/新建文件夹/需国际化翻译文字文档.txt',
              version: '5D3DC4EE54AE4D2B917DC1CBBBB64E32'
            },
            {
              id:
                'gns://71D0EA1ACD8E4C0EB3FDE60F7CD9C7D4/55B90642A2DF4BB9A0700715861A9E00',
              path: 'AnyShare://韩健cs/新建文件夹2/爱数技术文档.docx',
              version: '60029A4561494BAEA9B6A04663A37BE7'
            },
            {
              id:
                'gns://71D0EA1ACD8E4C0EB3FDE60F7CD9C7D4/94E8701B4E7F4E308C665C776ADB547B/D9D4EF5B657949B8B9515577DC88DD11',
              path: 'AnyShare://韩健cs/新建文件夹/工作文档.txt',
              version: '23CFDFB9D3AC444BB129B6230C33A772'
            }
          ]
        },
        // 表单验证规则
        formrules: {
          flow_strategy_creator: [
            { required: true, message: '该项不能为空', trigger: 'blur' }
          ],
          flow_explain: [
            { required: true, message: '该项不能为空', trigger: 'blur' }
          ],
          flow_name: [
            { required: true, message: '该项不能为空', trigger: 'blur' }
          ],
          apply_id: [
            { required: true, message: '该项不能为空', trigger: 'blur' }
          ],
          target_path: [
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
            save(self.formData, 'flow')
              .then((res) => {
                if (res.status === 200) {
                  self.$message({
                    type: 'success',
                    dangerouslyUseHTMLString: true,
                    message: '请求成功'

                  })
                  this.formData.apply_id = this.guid()
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
