<template>
  <el-container>
    <el-main>
      <el-form v-model="form" label-width="130px">
        <el-form-item label="Token设置">
          <el-input v-model="token" placeholder="请输入内容" class="input-with-select" style="width: 50%">
            <template slot="prepend">token:</template>
            <el-button slot="append" icon="el-icon-check" @click="setToken">保存</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="语言">
          <el-select v-model="lang" @change="changeLang">
            <el-option label="简体中文" value="zh-cn" />
            <el-option label="繁體中文" value="zh-tw" />
            <el-option label="English" value="en-us" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import { setToken, getToken, setLang, getLang } from '@/utils/auth'

export default {
  name: 'TokenSet',
  data() {
    return {
      token: getToken(),
      lang: 'zh-cn',
      form: {}
    }
  },
  mounted() {
    const lang = getLang()
    if (lang !== null) {
      this.lang = lang
    } else {
      this.lang = 'zh-cn'
    }
    this.$i18n.locale = this.lang
  },
  methods: {
    setToken() {
      if (!this.token) {
        this.$message.error('token不能为空')
        return
      }
      setToken(this.token)
      this.$message.success('token设置成功')
    },
    changeLang(val) {
      this.$i18n.locale = val
      setLang(val)
    }
  }
}
</script>

<style scoped>

</style>
