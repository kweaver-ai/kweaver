<template>
  <div class="cell-right" v-loading="loading">
    <div :class="clazz">
      <detail v-if="temp !== null && showDetail" :temp="temp" :inDrawer="inDrawer" :apply-page="applyPage" :done-page="donePage" :doneStatus="doneStatus" @auditResult="auditResult" @reloadInfo="handleSearch"/>
    </div>
  </div>
</template>
<script>
import detail from './detail'
import {fecthInfo} from '@/api/audit'

export default {
  components: { detail },
  props: {
    id: {
      type: String,
      required: true
    },
    applyPage: {
      type: Boolean,
      default: false
    },
    donePage: {
      type: Boolean,
      default: false
    },
    doneStatus: {
      type: String,
      default: ''
    },
    clazz:{
      type:String,
      default:'new-tabs-1 new-tabs-2'
    },
    inDrawer:{
      type:Boolean,
      default:false
    }
  },
  data () {
    return {
      loading: false,
      showDetail: false,
      temp: null
    }
  },
  watch: {
    id (value) {
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
        console.error(res)
        _this.$nextTick(function () {
          _this.loading = false
        })
      })
    },
    /**
       * @description 刷新列表数据
       * @author xiashneghui
       * @updateTime 2022/3/2
       * */
    auditResult (_type) {
      if(this.inDrawer) {
        this.$emit('closeDetail')
      }
      this.$emit('auditResult',_type)
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
