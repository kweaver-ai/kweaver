<template>
  <div>
    <el-dialog title="" :visible.sync="msgVisible" width="30%" :show-close="false" modal-append-to-body :append-to-body="false" :modal="false" custom-class="custum-box-1">
      <div class="custum-box-cont">
        <div class="icon"><i class="el-icon-warning-outline" /></div>
        <div class="text">
          <div>{{ $t('common.error') }}</div>
          <div class="gray-box" style="height: 100px;overflow-y: auto">
            <p v-for="(item, index) in warnMsgList" :key="index">{{item}}</p>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="mini" @click="close">{{ $t('button.confirm') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: 'warnMsg',
  props: ['msgVisible', 'warnMsgList'],
  data () {
    return {
    }
  },
  methods: {
    close () {
      this.$emit('closeWarnMsg')
    }
  }
}
</script>

<style scoped>
</style>
