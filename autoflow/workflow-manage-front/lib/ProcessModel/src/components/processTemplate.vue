 <!-- 流程中心，流程模板页面-->
<template>
  <div name="scrollWrap" style="height: 100%;overflow: auto"  v-if="loading">
      <div v-if="processTemplateList.length === 0" class="user-group-empty-box" :style="'height: ' +150 + 'px;padding-top: ' + 150 + 'px;'">
        <div class="icon"></div>
        <p>{{ $t('modeler.common.noTemplateCreated') }}</p>
      </div>
      <div v-else class="processTemplateView">
      <ul>
        <el-popover :ref="'popoverRef-' + item.id" placement="left-end"    width="590" :offset="100" trigger="manual" :popper-class="'view-process-popover-template view-process-popover'" :append-to-body="true" v-for="(item) in processTemplateList" :key="item.id">
          <div style="background-color:#f5f5f5 !important;width: 590px;height: 537px">
            <processModel
               v-if="viewProcessVisible && viewProcessObj.procDefId === item.id"
               :tenant_id="viewProcessObj.tenantId"
               :proc_def_key="viewProcessObj.procDefKey"
               :proc_def_id="viewProcessObj.procDefId"
               :proc_type="'process_view'"
               :visit="visit"
               :isTemplateView="isTemplateView"
               @output="useTheTemplate"
               @close="close"
            />
          </div>
          <li slot="reference"  @click="viewProcess(item)"  :class="index === item.id ?'process-li active':'process-li'">
            <span style="cursor:pointer" v-title :title="item.name">{{ item.name }}</span>
          </li>
        </el-popover>
      </ul>
    </div>
  </div>
</template>

<script>
import processModel from 'ebpm-process-modeler-front'
import { getList, procDefInfo } from '@/api/processDefinition.js'
import { tenantId } from '@/utils/config'
export default {
  name: 'ProcessTemplate',
  components: { processModel},
  props: {
    time:{
      type:Date
    }
  },
  data(){
    return{
      processTemplateList:[],
      viewProcessVisible: false,// 是否打开流程详情弹窗
      viewProcessObj: { tenantId: tenantId, procDefKey: '', procDefId: '' },// 流程详情对象
      visit: 'new',// 新建流程
      isTemplateView: true,
      show:true,
      loading:false,
      process_obj:null,
      index:-1,
      rootScrollLoad: true,
      isShow:false,
      // 流程列表搜索条件对象
      query: {
        filter_share: 1,
        type_id: '',
        offset: 1,
        limit: 20,
        template: 'Y'
      }
    }
  },
  watch: {
    time(){
      this.show = true
      this.index = -1
      this.initData()
      this.loadProcessTableData()
      // 绑定滚动条事件
      this.$nextTick(() => {
        setTimeout(() => {
          document.querySelector('div[name=scrollWrap]').addEventListener('scroll', this.processTableDataScroll)
        }, 1000)
      })
    }
  },
  mounted(){
    // 绑定滚动条事件
    this.$nextTick(() => {
      setTimeout(() => {
        document.querySelector('div[name=scrollWrap]').addEventListener('scroll', this.processTableDataScroll)
      }, 1000)
    })
  },
  created() {
    this.loadProcessTableData()
  },
  methods: {
    /**
     * @description 加载流程模板列表数据
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    loadProcessTableData () {
      const _this = this
      _this.loading = false
      const query = { ..._this.query, offset: (_this.query.offset - 1) * _this.query.limit }
      getList(query).then(response => {
        _this.processTemplateList = response.entries
        _this.loading = true
        _this.rootScrollLoad = true
      }).catch(() => { })
    },
    /**
     * @description 打开流程详情页面
     * @author xiashneghui
     * @param _obj 流程信息
     * @updateTime 2022/8/15
     * */
    viewProcess(_obj){
      if(this.index !== -1){
        // 关闭已打开的模板弹窗
        this.$refs['popoverRef-' + this.index][0].doClose()
      }
      this.index = _obj.id
      this.viewProcessObj.tenantId = _obj.tenant_id
      this.viewProcessObj.procDefKey = _obj.id.split(':')[0]
      this.viewProcessObj.procDefId = _obj.id
      this.viewReload(_obj.id)
    },
    viewReload(_id){
      this.viewProcessVisible = false
      this.$nextTick(() => {
        this.$refs['popoverRef-' + _id][0].doShow()
        this.viewProcessVisible = true
      })
    },
    /**
     * @description 使用模板回调
     * @author xiashneghui
     * @updateTime 2022/8/15
     * */
    async useTheTemplate(){
      this.process_obj = await this.openProcessInit()
      await this.$refs['popoverRef-' + this.index][0].doClose()
      this.$emit('useTheTemplate',this.process_obj)
    },
    /**
     * 打开流程初始化
     */
    openProcessInit() {
      const _this = this
      return new Promise((resolve, reject) => {
        procDefInfo(_this.viewProcessObj.procDefId)
          .then(res => {
            const result = res
            result.tenant_id = _this.viewProcessObj.tenantId
            resolve(result)
          }).catch(error => {
            _this.$message.warning(error.getMessage)
            reject(error)
          })
      })
    },
    /**
     * 滚动加载
     */
    processTableDataScroll(){
      const _this = this
      const scrollTop = document.querySelector('div[name=scrollWrap]').scrollTop
      const scrollHeight = document.querySelector('div[name=scrollWrap]').scrollHeight
      const clientHeight = document.querySelector('div[name=scrollWrap]').clientHeight
      if (scrollTop > (scrollHeight - clientHeight) * 0.7 ) {
        if (_this.rootScrollLoad) {
          _this.query.limit += 20
          _this.scrollProcessTableData()
          _this.rootScrollLoad = false
        }
      }
    },
    scrollProcessTableData () {
      const _this = this
      const query = { ..._this.query, offset: (_this.query.offset - 1) * _this.query.limit }
      getList(query).then(response => {
        _this.processTemplateList = response.entries
        _this.loading = true
        _this.rootScrollLoad = true
      }).catch(() => { })
    },
    async close(){
      if(this.index !== -1){
        await this.$refs['popoverRef-' + this.index][0].doClose()
      }
      this.$emit('close')
    },
    /**
     * 初始数据
     */
    initData(){
      const _this = this
      _this.query.offset = 1
      _this.query.limit = 20
    }
  }
}
</script>
<style >

</style>
