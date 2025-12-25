<!-- 流转流程集成-->
<template>
  <div id="app">
    <div
      class="fa-preview-box"
      v-loading="loading"
      :style="{ overflow: isCancel ? 'hidden' : '' }"
    >
      <div
        :style="{
          width: '100%',
          height: isCancel ? 'calc(100% - 60px)' : 'calc(100% - 92px)',
          minHeight: '120px',
          maxHeight: '430px',
          margin: isCancel ? '-32px' : '',
          overflow: 'auto'
        }"
      >
        <template v-if="isCancel">
          <div class="cancel-box">
            <div class="img-box"><img :src="cancelImg" /></div>
          </div>
        </template>
        <template v-else>
          <flow-log-detail
            v-if="temp != null"
            ref="flowLogDetail"
            :applyPage="applyPage"
            :auditPage="auditPage"
            :donePage="donePage"
            @auditResult="auditResult"
            :temp="temp"
          />
        </template>
      </div>
      <div>
        <div
          class="btnfoot"
          :style="((allowResubmit || temp.audit_status === 'pending')?'border-top: 1px solid #ddd;':'border-top: none;')+ 'position: inherit; width: auto'"
          v-if="applyPage && temp != null"
        >
          <el-button
            v-if="temp.audit_status === 'pending'"
            :disabled="loading"
            @click="openRemindDialog()"
            class="as-btn"
            type="primary"
            size="mini"
          >
            {{ $t('common.detail.operation.remind') }}
          </el-button>
          <el-button
            v-if="temp.audit_status === 'pending'"
            :disabled="loading"
            class="as-btn"
            style="color: #393939;border-color:#D3D4DB"
            size="mini"
            @click="revoke"
            >{{ $t('common.detail.operation.revoke') }}</el-button
          >
          <el-button
            v-if="resubmitPluginType==='dialog' && allowResubmit"
            :disabled="loading"
            @click="resubmit"
            type="primary"
            class="as-btn"
            style="color: #393939; border-color: #d3d4db"
            size="mini"
          >
            {{ $t('common.detail.operation.resubmit') }}
          </el-button>
          <div id="resubmit-container" :style="'display: inline-block;overflow:hidden;vertical-align:top;' 
            + (temp.audit_status === 'pending'? 'margin-left:8px;' : 'margin-left:16px;')">
            <!-- 加载重新提交插件 -->
          </div>
        </div>
      </div>
      <reminder
        ref="reminder"
        :temp="temp"
        @auditResult="auditResult"
        @reload="reload"
      ></reminder>
    </div>
  </div>
</template>

<script>
import { getAuditLogs, cancel, getRemindStatus } from '@/api/audit'
import { processCategory } from '@/api/workflow'
import { getFileCollectorRecord } from '@/api/anyshareOpenApi'
import flowLogDetail from '../audit/flowLogDetail'
import reminder from '../audit/reminder.vue'
import i18n from '../../assets/lang'
import XEUtils from 'xe-utils'
export default {
  name: 'ArbitrailyAuditLogIntegration',
  components: { flowLogDetail, reminder },
  data() {
    return {
      applyId: '',
      applyPage: true,
      auditPage: false,
      donePage: false,
      temp: null,
      isCancel: false,
      loading: false,
      reSubmitMicroApp: null,
      resubmitConfig: null,
      allowResubmit: false,
      resubmitPluginType: 'component'
    }
  },
  computed: {
    getBizType() {
      return function() {
        let arr = this.$store.getters.dictList.bizTypes.filter(
          bizTypeItem => bizTypeItem.value === this.temp.biz_type
        )
        return arr.length > 0 ? arr[0].label : this.temp.biz_type
      }
    },
    arbitrailyAuditLogVal() {
      return this.$store.state.app.arbitrailyAuditLog
    },
    cancelImg() {
      // 适配URL前缀
      let urlPrefix = XEUtils.cookie('X-Forwarded-Prefix')
      if(!urlPrefix || urlPrefix === '/' || urlPrefix === 'undefined') {
        urlPrefix = ''
      }
      if (i18n.locale === 'zh-cn') {
        return (
          urlPrefix + process.env.VUE_APP_CONTEXT_PATH + '/images/process_cancel_zh.svg'
        )
      } else if (i18n.locale === 'zh-cn') {
        return (
          urlPrefix + process.env.VUE_APP_CONTEXT_PATH + '/images/process_cancel_tw.svg'
        )
      } else if (i18n.locale === 'en-us') {
        return (
          urlPrefix + process.env.VUE_APP_CONTEXT_PATH + '/images/process_cancel_en.svg'
        )
      }
      return ''
    }
  },
  async created() {
    if (JSON.stringify(this.arbitrailyAuditLogVal) !== '{}') {
      this.applyId = this.$store.state.app.arbitrailyAuditLog.applyId
    }
    this.loading = true
    await this.initProcessCategory()
    await this.handleSearch()
    this.loading = false
    this.loadMicroApp()
  },
  destroyed() {
    if(this.reSubmitMicroApp !== null) {
      this.reSubmitMicroApp.unmount()
    }
  },
  methods: {
    async handleSearch() {
      let _this = this
      try {
        const res = await getAuditLogs(_this.applyId)
        const temp = res.data
        temp.applyId = _this.applyId
        _this.temp = temp
        _this.isCancel = _this.temp.audit_status === 'cancel' ? true : false
      } catch (error) {
        console.error(error)
      }
    },
    async initProcessCategory() {
      const _this = this
      try {
        const res = await processCategory()
        let processCategoryList = res.data
        let bizTypesArr = this.$store.getters.dictList.bizTypes.filter(
              bizTypeItem => bizTypeItem.value === ''
            )
        const lang = XEUtils.cookie('lang') || 'zh-cn'
        processCategoryList.forEach(e => {
          // 实名共享/匿名共享使用默认配置
          if (
            ['perm', 'owner', 'inherit', 'anonymous'].includes(e.audit_type) ||
            typeof e.audit_type !== 'string'
          ) {
            return
          }
          let item = {
            label: e.label[lang] + this.$t('common.column.apply'),
            value: e.audit_type,
            entry: e.entry,
            name: e.name,
            resubmit: e.resubmit

          }
          const arr = bizTypesArr.filter(
            bizTypeItem => bizTypeItem.value === e.audit_type
          )
          if (arr.length === 0) {
            bizTypesArr.push(item)
          }
        })
        this.$store.getters.dictList.bizTypes = bizTypesArr
      } catch (error) {
        console.error('initProcessCategory~',error)
      }
    },
    async loadMicroApp(){
      const _this = this
      // 适配URL前缀
      let urlPrefix = XEUtils.cookie('X-Forwarded-Prefix')
      if(!urlPrefix || urlPrefix === '/' || urlPrefix === 'undefined') {
        urlPrefix = ''
      }
      const microWidgetProps = this.$store.state.app.microWidgetProps

      try {
        let enableFlow = false
        let flowConfig = []
        if (this.temp.biz_type === 'flow') {
          flowConfig = this.$store.getters.dictList.bizTypes.filter(
            item => item.value === 'flow'
          )
          if (flowConfig.length === 1) {
            enableFlow = true
          }
        }
        let enableResubmit = false
        if(this.temp.biz_type === 'flow' && this.temp.apply_detail.apply_type === "docflow") {
          enableResubmit = true
        }
        if(this.applyPage && microWidgetProps && this.temp.audit_status === 'sendback' && enableResubmit) {
            let entry = ""
            let submitParams
            let resubmitConfig
            const updateList = this.updateList
            const switchResubmitStatus = this.switchResubmitStatus

            if (enableFlow && flowConfig[0].resubmit) {
              // 判断来源是文档流转或是文档收集
              let type = "docFlow";
              if (
                  this.temp.apply_detail.apply_type === "docflow"
              ) {
                  type = "docFlow";
              } else if (
                  this.temp.apply_detail.apply_type ===
                  "doccollect"
              ) {
                  type = "fileTransfer";
              } else {
                try {
                    // 通过id判断是否为文档收集
                    await getFileCollectorRecord(
                        this.temp.biz_id
                    );
                    type = "fileTransfer";
                } catch (err) {
                    if (
                        err.response.data.code ===
                        "FileCollector.RecordNotFound"
                    ) {
                        type = "docFlow";
                    } else {
                        console.error(err);
                    }
                }
              }
              if (type === "fileTransfer") {
                  entry = flowConfig[0].resubmit.entry2 || "";
                  if (flowConfig[0].resubmit.command2) {
                      resubmitConfig = {
                        command:flowConfig[0].resubmit.command2,
                        path:flowConfig[0].resubmit.path2
                      }
                  }
              } else {
                  entry = flowConfig[0].resubmit.entry || "";
                  if (flowConfig[0].resubmit.command) {
                      resubmitConfig = {
                        command:flowConfig[0].resubmit.command,
                        path:flowConfig[0].resubmit.path
                      }
                  }
              }
            }else if(typeof this.temp.apply_detail.workflow !== 'undefined' 
              && this.temp.workflow.front_plugin_info
              && this.temp.workflow.front_plugin_info.resubmit) {
              entry = this.temp.workflow.front_plugin_info.resubmit.entry || ''
            }
            
            if(entry) {
              const arbitrailyAuditLog = this.$store.state.app.arbitrailyAuditLog
              if(enableFlow) {
                submitParams = [
                  {
                    name: flowConfig[0].name,
                    entry: 
                      microWidgetProps.config.systemInfo.realLocation.origin + urlPrefix + entry,
                    container: '#resubmit-container',
                    props: {
                      microWidgetProps: microWidgetProps,
                      apply_id: this.temp.biz_id,
                      process: {
                        audit_type: this.temp.biz_type,
                        apply_id: this.temp.biz_id,
                        user_id: this.temp.apply_user_id,
                        user_name: this.temp.apply_user_name
                      },
                      data: {
                        ...this.temp.apply_detail,
                        apply_time: this.temp.apply_time
                      },
                      apply_time: this.temp.apply_time,
                      target:'applyPage',
                      audit_status: this.temp.audit_status,
                      updateList,
                      revoke: this.revokeInstance,
                      switchResubmit: switchResubmitStatus,
                      arbitrailyAuditLog
                    }
                  },
                  this.isIE() ? {} : { sandbox: { experimentalStyleIsolation: true } }
                ]
              }else {
                submitParams = [
                  {
                    name: this.temp.workflow.front_plugin_info.name,
                    entry:
                      microWidgetProps.config.systemInfo.realLocation.origin + urlPrefix + entry,
                    container: '#resubmit-container',
                    props: {
                      microWidgetProps: microWidgetProps,
                      apply_id: this.temp.biz_id,
                      process: this.temp.apply_detail.process,
                      data: this.temp.apply_detail.data,
                      apply_time: this.temp.apply_time,
                      target:'applyPage',
                      audit_status: this.temp.audit_status,
                      updateList,
                      revoke: this.revokeInstance,
                      switchResubmit: switchResubmitStatus,
                      arbitrailyAuditLog
                    }
                  },
                  this.isIE() ? {} : { sandbox: { experimentalStyleIsolation: true } }
                ]
              }
            }

            if (submitParams) {
              if (this.reSubmitMicroApp !== null) {
                this.reSubmitMicroApp.unmount()
              }
              this.$nextTick(() => {
                this.allowResubmit = true
                this.reSubmitMicroApp =
                  microWidgetProps._qiankun &&
                  microWidgetProps._qiankun.loadMicroApp
                    ? microWidgetProps._qiankun.loadMicroApp(...submitParams)
                    : loadMicroApp(...submitParams)
              })
            } else if (resubmitConfig) {
              this.resubmitPluginType = 'dialog'
              this.resubmitConfig = resubmitConfig
              this.allowResubmit = true
            }
        }

      } catch (error) {
        console.warn('loadMicroApp~',error)
      }
    },
    async openRemindDialog() {
      const _this = this
      try {
        const res = await getRemindStatus(_this.applyId, true)
        if (res.data.status) {
          _this.$toast('info', _this.$t('common.detail.remind.waitInfo'))
        } else {
          _this.$refs.reminder.openDialog()
        }
      } catch (error) {
        // 此条记录已失效或已被其他审核员审核完成
        if (error.response && error.response.data.code === 403057004) {
          _this.$toast('info', _this.$t('common.detail.remind.taskProcessed'))
          _this.auditResult()
        }
        console.error(error)
      }
    },
    auditResult() {
      this.applyPage = false
      this.handleSearch()
    },
    isIE() {
      if (!!window.ActiveXObject || 'ActiveXObject' in window) return true
      else return false
    },
    async reload() {
      this.loading = true
      await this.handleSearch()
      this.loading = false
    },
    revokeInstance(){
      return new Promise((resolve,reject) => {
        cancel(this.temp.biz_id)
          .then(res => {
           resolve(true)
          })
          .catch(err => {
            reject(err)
          })
      })
    },
    updateList(delay=100){
      this.loading = true
      setTimeout(()=>{
        this.reload()
      },delay)
    },
    switchResubmitStatus(allow) {
       if(allow) {
          this.allowResubmit = true
        }else {
          this.allowResubmit = false
          if(this.reSubmitMicroApp !== null) {
            this.reSubmitMicroApp.unmount()
          }
        }
    },
    resubmit(){
      const microWidgetProps = this.$store.state.app.microWidgetProps
      const arbitrailyAuditLog = this.$store.state.app.arbitrailyAuditLog
      const command = this.resubmitConfig.command
      const path = this.resubmitConfig.path ? this.resubmitConfig.path : undefined
      const app = microWidgetProps.config.getMicroWidgetByCommand({
        functionid: microWidgetProps.config.systemInfo.functionid,
        command
      })
      if(!app){
        if(command.indexOf('sponsorflow')>-1){
          this.$toast('info', this.$t('message.docflowDisabled'))
        }else if(command.indexOf('file-transfer') >-1){
          this.$toast('info', this.$t('message.doccollectDisabled'))
        }else {
          this.$toast('info', this.$t('message.pluginDisabled'))
        }
        return
      }
      let params = {
        apply_id: this.temp.biz_id,
        apply_time: this.temp.apply_time,
        target:'applyPage',
        audit_status: this.temp.audit_status,
        updateList:this.updateList,
        revoke: this.revokeInstance,
        switchResubmit: this.switchResubmitStatus,
        arbitrailyAuditLog
      }
      if (
        typeof this.temp.apply_detail.workflow !== 'undefined' &&
        this.temp.workflow.front_plugin_info &&
        this.temp.workflow.front_plugin_info.resubmit
      ) {
        params = {
          ...params,
          process: this.temp.apply_detail.process,
          data: this.temp.apply_detail.data
        }
      }else {
         params = {
          ...params,
          process: {
            audit_type: this.temp.biz_type,
            apply_id: this.temp.biz_id,
            user_id: this.temp.apply_user_id,
            user_name: this.temp.apply_user_name
          },
          data: {
            ...this.temp.apply_detail,
            apply_time: this.temp.apply_time
          }
        }
      }
      try{
        if(microWidgetProps) {
          microWidgetProps.history.navigateToMicroWidget(
            {
              command,
              path,
              dialogParams: params
            }
          )
      }
      }catch(err){
        console.error(err)
      }
      
    },
    /**
     * @description 撤销流程
     * */
    revoke() {
      let _this = this
      let applyTypeName =
        i18n.locale === 'en-us'
          ? ''
          : ['realname', 'perm', 'owner', 'inherit'].includes(
              _this.temp.biz_type
            ) || _this.temp.biz_type === 'anonymous'
          ? _this.$i18n.tc('common.detail.founding.' + _this.temp.biz_type)
          : _this.getBizType()
      _this
        .$dialog_confirm(
          _this.$t('common.detail.auditMsg.title'),
          _this.$store.state.app.secret.status === 'y' &&
            ['realname', 'perm', 'owner', 'inherit'].includes(
              _this.temp.biz_type
            )
            ? _this.$i18n.tc('common.detail.revokeMsg.info.secretRealname')
            : _this.$t('common.detail.revokeMsg.info.sureRevoke1') +
                applyTypeName +
                _this.$t('common.detail.revokeMsg.info.sureRevoke2'),
          _this.$t('common.detail.auditMsg.confirm'),
          _this.$t('common.detail.auditMsg.cancel')
        )
        .then(() => {
          _this.loading = true
          cancel(_this.temp.biz_id)
            .then(res => {
              _this.$toast(
                'success',
                _this.$t('common.detail.revokeMsg.confirmMSg')
              )
              _this.handleSearch()
              _this.loading = false
            })
            .catch(res => {
              _this.loading = false
              if (res.response.data.code === 401001101) {
                _this.$dialog_alert(
                  _this.$t('message.UndoFailed'),
                  _this.$t('message.UndoFailedNotTask'),
                  _this.$t('message.confirm'),
                  _this.auditResult
                )
              }
            })
        })
        .catch(e => {})
    }
  }
}
</script>
<style>
.cancel-box {
  display: block;
  margin: 0;
  padding: 0;
}
.cancel-box .img-box {
  display: block;
  margin: 0;
  padding: 0;
  text-align: center;
}
.cancel-box .img-box img {
  display: block;
  width: auto;
  margin: 0 auto;
  max-width: 100%;
  padding-left: 0;
}
.fa-preview-box {
  background-color: #ffffff !important;
}
</style>
