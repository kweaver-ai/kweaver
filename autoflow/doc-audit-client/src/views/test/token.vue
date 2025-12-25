<template>
    <div id="list" class="main_cont_gray" v-loading="loadings" element-loading-text="">

        <!-- 表单头部（标题、按钮）start -->
        <div class="rzsj_form_btn">
            <div class="cell_title">
                <p class="title">
                    Token 设置
                </p>
            </div>
            <!-- 按钮组 -->
            <div class="cell_btn">
            </div>
        </div>
        <!-- 表单头部（标题、按钮）end -->

        <!-- 表单body start-->
        <div ref="print" class="form_body">
            <el-form ref="formData" :model="formData" :rules="formrules" label-width="60px" label-position="right">

                <!-- 表单控件区域 start-->
                <el-row :gutter="8" justify="start" align="top" type="flex">
                    <!-- 列 -->
                    <el-col :span="20">
                        <el-form-item prop="token" :inline="false" label="token">
                            <el-input style="width:100%" :disabled="false" v-model="formData.token" maxlength="4000"
                                :readonly="false" placeholder="请输入token"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-button plain @click="saveToken">保存</el-button>
                    </el-col>
                </el-row>
                <el-row>
                </el-row>
                <el-row :gutter="8" justify="start" align="top" type="flex">
                    <!-- 列 -->
                    <el-col :span="20">
                        <el-form-item prop="lang" :inline="false" label="语言">
                            <el-select v-model="formData.lang" placeholder="请选择" @change="saveLang">
                                <el-option label="中文简体" value="zh-cn"></el-option>
                                <el-option label="中文繁体" value="zh-tw"></el-option>
                                <el-option label="英文" value="en-us"></el-option>
                            </el-select>
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
import i18n from '../../assets/lang'
export default {
  data() {
    return {
      // 表单加载状态
      loadings: false,
      // 表单数据
      formData: {
        token: '',
        lang: ''
      },
      // 表单验证规则
      formrules: {
      }
    }
  },
  created() {
    this.formData.token = this.$utils.cookie('client.oauth2_token')
    this.formData.lang = i18n.locale
  },
  methods: {
    saveToken() {
      this.$utils.cookie('client.oauth2_token', this.formData.token, { path:'/' })
    },
    saveLang(lang) {
      this.$utils.cookie('lang', lang, { path:'/' })
      i18n.locale = lang
    }
  }
}
</script>
