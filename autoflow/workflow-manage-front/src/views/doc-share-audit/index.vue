<!-- 共享流程开发测试首页 -->
<template>
  <div id="app">
    <el-tabs v-model="activeName">
      <el-tab-pane label="共享给指定用户" name="doc_realname_share">
        <div class="sh-list">
          <div class="check">
            <el-checkbox v-model="enabled" size="small" class="check" @change="enabledChange">
              启用共享给指定用户的审核机制
            </el-checkbox>
            <div class="gray-text">（勾选后，当用户设置指定用户的共享权限时需审核，审核通过后，共享才能生效）</div>
          </div>
        </div>
        <realname ref="process" :proc_type="activeName" :status="enabled" v-if="activeName === 'doc_realname_share'"/>
      </el-tab-pane>
      <el-tab-pane label="共享给任意用户" name="doc_anonymity_share">
        <div class="sh-list">
          <div class="check">
            <el-checkbox v-model="anonymityEnabled" size="small" class="check" @change="anonymityChange">
              启用共享给任意用户的审核机制
            </el-checkbox>
            <div class="gray-text">（勾选后，当用户设置任意用户的共享权限时需审核，审核通过后，共享才能生效）</div>
          </div>
        </div>
        <anonymity ref="anonymity" :proc_type="activeName" :status="anonymityEnabled" v-if="activeName === 'doc_anonymity_share'"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>

import anonymity from './anonymity'
import realname from './realname'
export default {
  name: 'DocShareAudit',
  components: { realname, anonymity },
  data() {
    return {
      activeName: 'doc_realname_share',
      enabled: true,
      anonymityEnabled: true
    }
  },
  created() {
  },
  mounted() {
  },
  methods: {
    enabledChange(val) {
      this.$refs.process.disabled = !val
    },
    anonymityChange(val) {
      this.$refs.anonymity.disabled = !val
    }
  }
}
</script>
