<template>
  <div class="cell-right" v-loading="loading" :class="{[`${clazz}`]:inDrawer}">
    <template v-if="temp !== null && (typeof temp.apply_detail.workflow !== 'undefined' || enableFlow)">
      <detail v-if="temp !== null && showDetail" :temp="temp" :id="id" ref="detail" audit-page :inDrawer="inDrawer" @auditResult="auditResult" @reloadInfo="handleSearch"/>
    </template>
    <template v-else>
      <el-tabs v-model="activeName" :class="clazz" @tab-click="tabClick">
        <el-tab-pane :label="$t('common.detail.tab.audit')" name="audit">
          <detail v-if="temp !== null && showDetail" :temp="temp" :id="id" ref="detail" audit-page :inDrawer="inDrawer" @auditResult="auditResult" @reloadInfo="handleSearch"/>
        </el-tab-pane>
        <el-tab-pane :label="$t('common.detail.tab.file')" name="file">
          <file-list v-if="temp !== null" :temp="temp" ref="fileList"/>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
  <!---cell-right右侧详情---->
</template>
<script>
import detail from './detail'
import fileList from './fileList'
import { fecthInfo } from '@/api/audit'
export default {
  components: { detail, fileList },
  props: {
    id: {
      type: String,
      required: true
    },clazz:{
      type:String,
      default:'new-tabs-1 new-tabs-2 no-padding'
    },
    inDrawer:{
      type:Boolean,
      default:false
    }
  },
  data () {
    return {
      loading: false,
      activeName: 'audit',
      temp: null,
      logs: [],
      loadFile: true,
      showDetail: false
    }
  },
  computed:{
    enableFlow(){
      if (this.temp.biz_type === 'flow') {
        const flowConfig = this.$store.getters.dictList.bizTypes.filter(
          item => item.value === 'flow'
        )
        if (flowConfig.length === 1) {
          return true
        }
      }
      return false
    }
  },
  watch: {
    id (value) {
      this.loadFile = true
      this.activeName = 'audit'
      this.handleSearch()
    }
  },
  created () {
    this.handleSearch()
  },
  methods: {
    /**
     * @description 初始化流程日志信息
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    handleSearch () {
      let _this = this
      _this.loading = true
      fecthInfo(_this.id).then(res => {
        const temp = res.data
        temp.id = _this.id
        _this.temp = temp
        _this.$nextTick(function () {
          _this.reloadDetail()
        })
      }).catch(res => {
        _this.$nextTick(function () {
          _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('message.taskNotPrem'), _this.$t('message.confirm'), function () {
            _this.loading = false
            _this.$emit('closeDetail')
          })
        })
      })
    },
    tabClick () {
      let _this = this
      if (_this.activeName === 'file' && _this.loadFile) {
        _this.temp = _this.$refs.detail.temp
        _this.$nextTick(function () {
          _this.$refs.fileList.handleSearch()
        })
      }
    },
    /**
     * @description 触发列表查询数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    auditResult () {
      if(this.inDrawer) {
        this.$emit('closeDetail')
      }
      this.$emit('auditResult')
    },
    reloadDetail(){
      const _this = this
      _this.showDetail = false
      _this.$nextTick(function () {
        _this.showDetail = true
        _this.loading = false
      })
    },
    isIE() {
      if(!!window.ActiveXObject || 'ActiveXObject' in window)
        return true
      else
        return false
    }
  }
}

</script>
