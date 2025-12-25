<template>
    <el-container>
        <!-- <el-header>
          <div class="rzsj_header header-bg-1">
            <div class="header_logo">
              <img src="../../public/images/logo-he.png" >
            </div>
            <div class="header_logo" style="width: 190px;">AnyShare</div>
            <div class="header_btn_redio">
                <el-radio-group v-model="isCollapse" @change="$refs.sidebar.isCollapse = isCollapse">
                  <el-radio-button :label="false"><i class="icon iconfont icon-liebiaoxiangyou"></i></el-radio-button>
                  <el-radio-button :label="true"><i class="icon iconfont icon-liebiaoxiangzuo"></i></el-radio-button>
                </el-radio-group>
            </div>
            <div class="header_user">
              <el-input v-model="token" placeholder="请输入token" style="width: 200px;" @change="tokenChange"></el-input>
            </div>
          </div>
        </el-header> -->
        <!--el-header 顶部导航栏-->
        <el-container>
          <el-aside width="200px">
            <sidebar-component ref="sidebar" @handleCode="handleCode" :code="code"/>
          </el-aside>
          <el-main>
            <div id="el-main-content" class="el-main_cont main-full">
              <router-view/>
            </div>
          </el-main>
      </el-container>
    </el-container>
  </template>
<script>
import sidebarComponent from './components/sidebar.vue'
export default {
  name: 'index',
  components: {
    sidebarComponent
  },
  data () {
    return {
      userName: this.$store.getters.curUser.userName,
      logoutUrl: process.env.VUE_APP_BASE_PATH + process.env.VUE_APP_CONTEXT_PATH + 'logout',
      code: '',
      mainBoolean: true,
      isCollapse: false,
      token: ''
    }
  },
  watch: {
    '$store.getters.curUser.userName' (val) {
      this.userName = this.$store.getters.curUser.userName
    }
  },
  created () {
    this.code = this.$route.query.systemCode
    this.token = this.$utils.cookie('client.oauth2_token')
  },
  mounted () {
  },
  methods: {
    handleCode (val) {
      this.code = val
      this.mainBoolean = false
      this.$nextTick(() => (this.mainBoolean = true))
    },
    logout () {
      this.$axios.post(this.logoutUrl).then(res => {
        sessionStorage.removeItem('curUser')
        this.$router.push('login')
      }).catch(err => {
        console.log(err)
      })
    },
    tokenChange(value) {
      this.$utils.cookie('client.oauth2_token', value)
    }
  }
}
</script>

  <style scoped>

  </style>
