<template>
  <div v-loading="loading" class="el-tabs__content">
    <!-- 申请明细 -->
    <div :style="detailContentHeight()">
      <div class="texts-box">
        <!-- 转审状态图标 -->
        <div
          v-if="donePage && (doneStatus === 'transfer' || doneStatus === 'sendback')"
          class="block-icon"
          style="
            position: absolute;
            right: 10px;
            top: 10px;
            z-index: 9;
            line-height: 24px;
            width: 70px;
            height: 70px;
          "
        >
          <badge :status="doneStatus" 
            :text="doneStatus==='transfer'?
            $t('common.auditStatuss.transfer') :
            $t('common.auditStatuss.sendback') " 
          />
        </div>
        <span v-else :class="statusClass"></span>
        <div class="box-head">
          <span
            v-title
            :title="
              temp.apply_user_name +
                getAuditTypeName
            "
          >
            {{ temp.apply_user_name | formatApplyUserName
            }}{{
              getAuditTypeName
            }}
          </span>
        </div>
        <div
          class="box-body"
          v-if="
            typeof temp.apply_detail.workflow === 'undefined' &&
              enableFlow === false
          "
        >
          <div class="text">
            <div class="clums">{{ $t('common.detail.applyTime') }}：</div>
            <div class="texts">
              {{ $utils.toDateString(temp.apply_time, 'yyyy/MM/dd HH:mm') }}
            </div>
          </div>
          <template v-if="typeof temp.apply_detail !== 'undefined'">
            <!-- 动态属性 -->
            <component
              :is="bizPropertyComponent"
              v-bind="{ temp: temp }"
              :key="temp.biz_id"
            ></component>
          </template>
        </div>
        <!-- 流程详情挂载容器 -->
        <div
          v-loading="microAppLoading"
          id="audit-viewport"
          :class="(typeof temp.apply_detail.workflow !== 'undefined' ||enableFlow === true) &&!inDrawer?'audit-viewport':'audit-viewport-hidden'"
        ></div>
        <div
          v-loading="microAppLoading"
          id="drawer-audit-viewport"
          :class="(typeof temp.apply_detail.workflow !== 'undefined' || enableFlow === true) && inDrawer?'audit-viewport':'audit-viewport-hidden'"
        ></div>
      </div>
      <!-- 流程日志 -->
      <template>
        <flow-log-detail
          v-if="showFlowLogDetail"
          ref="flowLogDetail"
          :applyPage="applyPage"
          :auditPage="auditPage"
          :donePage="donePage"
          :doneStatus="doneStatus"
          @auditResult="auditResult"
          :temp="temp"
        />
      </template>
    </div>
    <div class="btn-footer">
      <div
        class="btnfoot detail-footer"
        :style="((allowResubmit || temp.audit_status === 'pending')?'border-top: 1px solid #ddd;':'border-top: none;')+ 'position: inherit; width: auto'"
        v-if="applyPage"
      >
        <el-button
          v-if="temp.audit_status === 'pending'"
          :disabled="loading"
          @click="openRemindDialog()"
          class="as-btn"
          type="primary"
          size="mini"
        >
          {{ $t('common.detail.operation.Remind') }}
        </el-button>
        <el-button
          v-if="temp.audit_status === 'pending'"
          :disabled="loading"
          @click="revoke"
          class="as-btn"
          style="color: #393939; border-color: #d3d4db"
          size="mini"
        >
          {{ $t('common.detail.operation.revoke') }}
        </el-button>
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
      <div
        class="btnfoot detail-footer"
        v-if="
          auditPage &&
            typeof temp.task_id !== 'undefined' &&
            temp.audit_status === 'pending'
        "
      >
        <el-button
          style="margin-left: 22px"
          class="as-btn"
          :disabled="showError || loading"
          type="primary"
          size="mini"
          @click="openAuditComment('pass')"
        >
          {{ $t('common.detail.operation.pass') }}
        </el-button>
        <el-button
          style="margin-left: 8px"
          class="as-btn"
          :disabled="showError || loading"
          size="mini"
          @click="openAuditComment('reject')"
          >{{ $t('common.detail.operation.reject') }}
        </el-button>
        <template
          v-if="
            temp.customDescription && (showTransferBtn || showCountersignBtn || showSendbackBtn)
          "
        >
          <!-- 更多中动态显示加签和转审 -->
          <el-dropdown
            placement="top-start"
            v-on:command="handleSelectMore"
            trigger="click"
            style="margin-left: 8px"
          >
            <el-button size="mini" class="as-btn" style="margin: 0">
              {{ $t('common.detail.operation.more') }}
            </el-button>
            <el-dropdown-menu
              slot="dropdown"
              v-bind:append-to-body="false"
              class="dropdown-menu-more"
            >
              <el-dropdown-item
                v-if="showTransferBtn"
                command="transfer"
                :title="$t('common.detail.operation.Transfer')"
              >
                <svg-icon icon-class="transfer" class="details-ops-icon">
                </svg-icon>
                {{ $t('common.detail.operation.Transfer') }}
              </el-dropdown-item>
              <el-dropdown-item
                v-if="
                  temp.customDescription.custom_type === 'countersign' &&
                    showCountersignBtn
                "
                command="countersign"
                :title="$t('common.detail.operation.countersignBtn')"
              >
                <svg-icon icon-class="countersign" class="details-ops-icon">
                </svg-icon>
                {{ $t('common.detail.operation.countersignBtn') }}
              </el-dropdown-item>
              <el-dropdown-item
                v-if="showSendbackBtn"
                command="sendback"
                :title="$t('common.detail.operation.sendback')"
              >
                <svg-icon icon-class="sendback" class="details-ops-icon"></svg-icon>
                {{ $t('common.detail.operation.sendback') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </div>
      <audit-comment
        ref="auditComment"
        :temp="temp"
        :inDrawer="inDrawer"
        @callbackSubmit="submit"
        @auditResult="auditResult"
      ></audit-comment>
      <reminder
        ref="reminder"
        :temp="temp"
        :logs="logs"
        :inDrawer="inDrawer"
        @auditResult="auditResult"
        @reloadFlowLog="reloadFlowLog"
      ></reminder>
    </div>
  </div>
</template>
<script>
import {
  audit,
  sendbackAudit,
  cancel,
  fecthAuthority as fecthTask,
  countersignLogs,
  getRemindStatus
} from '@/api/audit'
import { fecthLog } from '@/api/workflow'
import { getUserInfo, getFileCollectorRecord } from '@/api/anyshareOpenApi'
import badge from '@/components/badge'
import i18n from '../../assets/lang'
import flowLogDetail from './flowLogDetail'
import auditComment from './auditComment'
import { processCategory } from '@/api/workflow'
import reminder from './reminder'
import XEUtils from 'xe-utils'
import { loadMicroApp } from 'qiankun'

export default {
  components: { flowLogDetail, auditComment, reminder, badge },
  props: {
    temp: {
      type: Object,
      required: true
    },
    applyPage: {
      type: Boolean,
      default: false
    },
    auditPage: {
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
    inDrawer: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      isRequesting: false,
      microAppLoading: false,
      logs: [],
      userid: '',
      auditMsg: '',
      enableFlow: false,
      showError: false,
      showCountersignBtn: false,
      showTransferBtn: false,
      showSendbackBtn: false,
      showFlowLogDetail: true,
      auditDetailMicroApp: null,
      reSubmitMicroApp: null,
      resubmitConfig: null,
      allowResubmit: false,
      resubmitPluginType: "component"
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
    bizPropertyComponent: function() {
      return require(`../biz-property/${this.temp.biz_type}.vue`).default
    },
    getAuditTypeName(){
      if(this.$store.state.app.secret.status === 'y' 
        && ['realname', 'perm', 'owner', 'inherit'].includes(this.temp.biz_type)) {
          return this.$t('common.detail.founding.secretRealName')
      }
      if(['realname', 'perm', 'owner', 'inherit'].includes(this.temp.biz_type) || this.temp.biz_type === 'anonymous'){
        return this.$t('common.detail.founding.' + this.temp.biz_type)
      }
      if(this.temp.biz_type === 'automation' && this.temp.apply_detail.data && this.temp.apply_detail.data.automation_flow_name) {
        return this.$t('common.detail.founding.startTitle') + this.temp.apply_detail.data.automation_flow_name
      }
      return this.$t('common.detail.founding.startTitle') + this.getBizType()
    },
    // eslint-disable-next-line consistent-return
    statusClass: function() {
      if (i18n.locale === 'zh-cn') {
        if (
          this.temp.audit_status === 'pass' ||
          this.temp.audit_status === 'avoid'
        ) {
          return { 'icon-ytg': true, 'block-icon': true }
        }
        if (this.temp.audit_status === 'reject') {
          return { 'icon-ybh': true, 'block-icon': true }
        }
        if (this.temp.audit_status === 'undone') {
          return { 'icon-ycx': true, 'block-icon': true }
        }
      } else if (i18n.locale === 'zh-tw') {
        if (
          this.temp.audit_status === 'pass' ||
          this.temp.audit_status === 'avoid'
        ) {
          return { 'icon-ytg-ft': true, 'block-icon': true }
        }
        if (this.temp.audit_status === 'reject') {
          return { 'icon-ybh-ft': true, 'block-icon': true }
        }
        if (this.temp.audit_status === 'undone') {
          return { 'icon-ycx-ft': true, 'block-icon': true }
        }
      } else if (i18n.locale === 'en-us') {
        if (
          this.temp.audit_status === 'pass' ||
          this.temp.audit_status === 'avoid'
        ) {
          return { 'icon-ytg-eng': true, 'block-icon': true }
        }
        if (this.temp.audit_status === 'reject') {
          return { 'icon-ybh-eng': true, 'block-icon': true }
        }
        if (this.temp.audit_status === 'undone') {
          return { 'icon-ycx-eng': true, 'block-icon': true }
        }
      }
    },
    procInstId: function() {
      return this.temp.proc_inst_id
    },
    /*auditMsgHtml: function() {
      return this.auditMsg
        .replace(/\r\n/g, '<br/>')
        .replace(/\n/g, '<br/>')
        .replace(/\s/g, '&nbsp;')
    },*/
    revokable() {
      const context = this.$store.state.app.context
      if (
        context &&
        Array.isArray(context.irrevocableAuditType) &&
        this.temp &&
        context.irrevocableAuditType.includes(this.temp.biz_type)
      ) {
        return false
      }
      return true
    }
  },
  filters: {
    /**
     * @description 格式化字符串
     * @param obj 值
     * */
    formatApplyUserName(obj) {
      if (obj.length > 12) {
        return obj.substring(0, 12) + '...'
      } else {
        return obj
      }
    }
  },
  async mounted() {
    const _this = this
    // 适配URL前缀
    let urlPrefix = XEUtils.cookie('X-Forwarded-Prefix')
    if(!urlPrefix || urlPrefix === '/' || urlPrefix === 'undefined') {
      urlPrefix = ''
    }
    try {
      const microWidgetProps = this.$store.state.app.microWidgetProps
      let enableFlow = false
      let flowConfig = []
      if (this.temp.biz_type === 'flow') {
        flowConfig = this.$store.getters.dictList.bizTypes.filter(
          item => item.value === 'flow'
        )
        try {
          if(!flowConfig[0].entry) {
            const res = await processCategory()
            flowConfig = res.data.filter(
              item => item.audit_type === 'flow'
            )
          }
        } catch (error) {
          console.warn(error)
        }
        if (flowConfig.length === 1) {
          enableFlow = true
          this.enableFlow = true
        }else {
          this.enableFlow = false
        }
      }

      // 加载详情插件
      if (
        microWidgetProps !== null &&
        (typeof this.temp.apply_detail.workflow !== 'undefined' || enableFlow)
      ) {
        this.setMicroAppLoading(true)
        let params
        if (typeof this.temp.apply_detail.workflow !== 'undefined') {
          let entry =  microWidgetProps.config.systemInfo.realLocation.origin + urlPrefix +
          this.temp.workflow.front_plugin_info.entry

          let data = this.temp.apply_detail.data

          let name = this.temp.workflow.front_plugin_info.name

          if(this.temp.workflow.front_plugin_info.name === 'wikidoc-publish-plugin') {
            // KC多文档发布
            if(!!this.temp.apply_detail.data.hook){
              try {
                const { config: { getMicroWidgets, systemInfo: { functionid } } } = microWidgetProps
                const applist = getMicroWidgets({ functionid })
                const appinfo = applist.find((app) => app.command === "file-transfer")

                let parts = appinfo.entry.split('/')
                parts[parts.length -1] = 'flowPlugin.html'

                entry = parts.join('/')
                name = 'file-transfer'
                data = {
                  ...this.temp.apply_detail.data,
                  apply_type: 'wikidoc-publish-plugin'
                }
              } catch (error) {
                
              }
            } 
          }
          params = [
            {
              name,
              entry,
              container: this.inDrawer
                ? '#drawer-audit-viewport'
                : '#audit-viewport',
              props: {
                microWidgetProps: microWidgetProps,
                apply_id: this.temp.biz_id,
                process: this.temp.apply_detail.process,
                data,
                apply_time: this.temp.apply_time,
                target:
                  (this.applyPage && 'applyPage') ||
                  (this.auditPage && 'auditPage') ||
                  (this.donePage && 'donePage'),
                audit_status: this.temp.audit_status
              }
            },
            this.isIE() ? {} : { sandbox: { experimentalStyleIsolation: true } },
            {
              afterMount: () => this.setMicroAppLoading(false)
            }
          ]
        } else {
          params = [
            {
              name: flowConfig[0].name,
              entry:
                microWidgetProps.config.systemInfo.realLocation.origin + urlPrefix +
                flowConfig[0].entry,
              container: this.inDrawer
                ? '#drawer-audit-viewport'
                : '#audit-viewport',
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
                target:
                  (this.applyPage && 'applyPage') ||
                  (this.auditPage && 'auditPage') ||
                  (this.donePage && 'donePage'),
                audit_status: this.temp.audit_status
              }
            },
            this.isIE() ? {} : { sandbox: { experimentalStyleIsolation: true } },
            {
              afterMount: () => this.setMicroAppLoading(false)
            }
          ]
        }

        // 支持本地套壳调试
        let devConfig
        try {
          const storageConfig = sessionStorage.getItem(
            'anyshare.audit.devTool.config'
          )
          if (storageConfig && storageConfig!=="undefined") {
            const config = JSON.parse(storageConfig)
            let matchType = false
            if (enableFlow && config.audit_type === 'flow') {
              matchType = true
            } else if (
              typeof config.audit_type === 'string' &&
              config.audit_type === this.temp.biz_type
            ) {
              matchType = true
            }
            // 对应多个类型为数组时
            else if (typeof config.audit_type === 'object') {
              for (value of config.audit_type) {
                if (value === this.temp.biz_type) {
                  matchType = true
                  break
                }
              }
            }


            if (matchType) {
              devConfig = config
              params[0].name = config.name
              params[0].entry = config.entry
            }
          }
        } catch (error) {
          console.warn(error)
        }
        if (this.auditDetailMicroApp !== null) {
          this.auditDetailMicroApp.unmount()
        }
        
        this.$nextTick(()=>{
          this.auditDetailMicroApp =
          microWidgetProps._qiankun && microWidgetProps._qiankun.loadMicroApp
            ? microWidgetProps._qiankun.loadMicroApp(...params)
            : loadMicroApp(...params)
        })

        // 加载重新提交插件
        try{
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
              if (this.temp.workflow.front_plugin_info.resubmit.command) {
                resubmitConfig = {
                  command: this.temp.workflow.front_plugin_info.resubmit.command,
                  path: this.temp.workflow.front_plugin_info.resubmit.path
                }
              }
            }
            
            if(entry) {
              if(enableFlow) {
                submitParams = [
                  {
                    name: flowConfig[0].resubmit.name || flowConfig[0].name,
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
                      switchResubmit: switchResubmitStatus
                    }
                  },
                  this.isIE() ? {} : { sandbox: { experimentalStyleIsolation: true } }
                ]
              }else {
                submitParams = [
                  {
                    name: this.temp.workflow.front_plugin_info.resubmit.name ||this.temp.workflow.front_plugin_info.name,
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
                      switchResubmit: switchResubmitStatus
                    }
                  },
                  this.isIE() ? {} : { sandbox: { experimentalStyleIsolation: true } }
                ]
              }
            }

            if(devConfig && devConfig.resubmit) {
              if (devConfig.resubmit.entry) {
                let props = {
                  microWidgetProps: microWidgetProps,
                  apply_id: this.temp.biz_id,
                  process: this.temp.apply_detail.process,
                  data: this.temp.apply_detail.data,
                  apply_time: this.temp.apply_time,
                  target: 'applyPage',
                  audit_status: this.temp.audit_status,
                  updateList,
                  revoke: this.revokeInstance,
                  switchResubmit: switchResubmitStatus
                }
                if (devConfig.audit_type === 'flow') {
                  props = {
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
                    target: 'applyPage',
                    audit_status: this.temp.audit_status,
                    updateList,
                    switchResubmit: switchResubmitStatus
                  }
                }
                submitParams = [
                  {
                    name: devConfig.resubmit.name || devConfig.name,
                    entry: devConfig.resubmit.entry,
                    container: '#resubmit-container',
                    props
                  },
                  this.isIE()
                    ? {}
                    : {
                        sandbox: {
                          experimentalStyleIsolation: true
                        }
                      }
                ]
              } else if (devConfig.resubmit.command) {
                resubmitConfig = {
                  command: devConfig.resubmit.command,
                  path: devConfig.resubmit.path
                }
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
        }catch(err) {
          console.error(err)
        }
      }
    } catch (error) {
      console.warn(error)
    }

    if (
      this.applyPage &&
      this.temp.proc_inst_id &&
      this.temp.audit_status !== 'avoid' &&
      this.temp.audit_status !== 'failed'
    ) {
      fecthLog(this.temp.proc_inst_id)
        .then(res => {
          const procLogs = res.data
          this.logs = procLogs
        })
        .catch(e => console.error(e))
    }

    if (
      !this.auditPage ||
      this.temp.audit_status === 'avoid' ||
      this.temp.audit_status === 'failed' ||
      !this.temp.proc_inst_id
    ) {
      return
    }
    fecthLog(this.temp.proc_inst_id)
      .then(res => {
        const procLogs = res.data
        this.logs = procLogs
        this.checkCountersignBtn(procLogs)
        this.checkTransferBtn(procLogs)
        if (this.temp.customDescription && this.temp.customDescription.send_back_switch) {
          if (this.temp.customDescription.send_back_switch === 'Y') {
            this.showSendbackBtn = true
          }else{
            this.showSendbackBtn = false
          }
        }
      })
      .catch(e => console.error(e))
    // 判断是否自己已处理转审
    getUserInfo()
      .then(res => {
        this.userid = res.data.userid
      })
      .catch(e => console.warn('getUserInfo',e))
  },
  destroyed() {
    this.unmountMicroApp()
  },
  methods: {
    setMicroAppLoading(flag) {
      this.microAppLoading = flag
    },
    handleSelectMore(value) {
      this.openAuditComment(value)
    },
    updateList(delay=100){
      this.loading = true
      setTimeout(()=>{
        this.$emit('auditResult','resubmit')
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
    async openRemindDialog() {
      if (this.isRequesting) {
        return
      }
      const _this = this
      _this.isRequesting = true
      try {
        await _this.checkFlow({
          proc_inst_id: _this.temp.proc_inst_id,
          type: 'apply'
        })
        const res = await getRemindStatus(_this.temp.id)
        if (res.data.status) {
          _this.$toast('info', _this.$t('common.detail.remind.waitInfo'))
        } else {
          _this.$refs.reminder.openDialog()
        }
        _this.isRequesting = false
      } catch (error) {
        // 此条记录已失效或已被其他审核员审核完成
        if (error.response && error.response.data.code === 403057004) {
          _this.$toast('info', _this.$t('common.detail.remind.taskProcessed'))
          _this.$emit('auditResult')
        }
        _this.isRequesting = false
      }
    },
    openAuditComment(comment) {
      const _this = this
      if (comment === 'countersign' || comment === 'transfer' || comment === 'sendback') {
        // 加签校验审核是否有效
        _this.loading = true
        _this
          .checkFlow({ proc_inst_id: _this.temp.proc_inst_id, type: 'task' })
          .then(res => {
            if (res) {
              // 获取审核意见配置
              let isRequired = false
              const config = _this.temp.strategy_configs
              if(comment === "sendback" && config && config.audit_idea_config && config.audit_idea_config.audit_idea_switch === true ) {
                if(config.audit_idea_config.status === "2" || config.audit_idea_config.status === "1") {
                  isRequired = true
                }
              }
              _this.$refs.auditComment.openCommentDialog(comment,isRequired)
              _this.loading = false
            }
          })
          .catch(res => {
            _this.loading = false
          })
      } else {
        // 获取审核意见配置
        let isRequired = false
        const config = _this.temp.strategy_configs
        if(config && config.audit_idea_config && config.audit_idea_config.audit_idea_switch === true) {
          if(config.audit_idea_config.status === "2" || (config.audit_idea_config.status === "1" && comment === "reject")) {
            isRequired = true
          }
        }
        _this.$refs.auditComment.openCommentDialog(comment,isRequired)
      }
    },
    detailContentHeight() {
      const microWidgetProps = this.$store.state.app.microWidgetProps
      let headBarOffset = 0
      try{
        const config = localStorage.getItem('commonOEMConfig')
        if(config
          && microWidgetProps
          && microWidgetProps.config.systemInfo.isInElectronTab === false
        ) {
          const json = JSON.parse(config)
          const topBarHeight = json.topBarHeight
          if(topBarHeight) {
            headBarOffset = topBarHeight - 52
          }
        }
      }catch(error) {
        console.warn(error)
      }
      let insetTop = 0
      if(this.inDrawer && microWidgetProps.config.systemInfo.isInElectronTab === false && microWidgetProps.config.systemInfo.platform === "browser") {
        insetTop = 52 + headBarOffset
        try{
          const headDom = document.querySelector(".as-components-electron-option-head-box")
          if(headDom && headDom.clientHeight !== 52) {
            const drawerDom = document.querySelector('.ayshareDrawer.insetDrawer')
            const modalDom = document.querySelector('.ayshareDrawer.insetDrawer+.v-modal')
            const headHeight = headDom.clientHeight ? `${headDom.clientHeight}px` : 0
            if(drawerDom) {
              drawerDom.style.inset = `${headHeight} 0 0`
            }
            if(modalDom) {
              modalDom.style.top = headHeight
            }
          }
        }catch(err){
          console.error(err)
        }
      }
      // 我处理的 处理详情抽屉
      if(this.donePage && this.inDrawer) {
          return `height: calc(100vh - 80px - ${insetTop}px);overflow: auto`
      }
      // 我的待办/我的申请页审核中的记录
      if (
        (this.applyPage && (this.temp.audit_status === 'pending' || this.allowResubmit)) ||
          (this.auditPage && typeof this.temp.task_id !== 'undefined' && this.temp.audit_status === 'pending')
      ) {
        if (this.inDrawer === true) {
          if (
            typeof this.temp.apply_detail.workflow !== 'undefined' ||
            this.applyPage
          ) {
            if (microWidgetProps.config.systemInfo.isInElectronTab) {
              // 富客户端 审核待办 栏高度
              insetTop = 40
            }

            // 46 抽屉标题高度  51 按钮高度
            return `height: calc(100vh - 46px - 51px - ${insetTop}px);overflow: auto`
          } else {
            return `height: calc(100vh - 152px - ${insetTop}px);overflow: auto`
          }
        } else if (
          this.$store.state.app.microWidgetProps &&
          this.$store.state.app.microWidgetProps.config.systemInfo
            .isInElectronTab
        ) {
          if (
            typeof this.temp.apply_detail.workflow !== 'undefined' ||
            this.applyPage || this.temp.biz_type === "flow"
          ) {
            return 'height: calc(100vh - 216px);overflow: auto'
          } else {
            return 'height: calc(100vh - 240px);overflow: auto'
          }
        } else {
          if (
            typeof this.temp.apply_detail.workflow !== 'undefined' ||
            this.applyPage || this.temp.biz_type === "flow"
          ) {
            return `height: calc(100vh - 221px - ${headBarOffset}px);overflow: auto`
          } else {
            return `height: calc(100vh - 265px - ${headBarOffset}px);overflow: auto`
          }
        }
      } else {
        if (
          this.$store.state.app.microWidgetProps &&
          this.$store.state.app.microWidgetProps.config.systemInfo
            .isInElectronTab
        ) {
          return 'height: calc(100vh - 165px);overflow: auto'
        }
        return `height: calc(100vh - 200px - ${headBarOffset}px);overflow: auto`
      }
    },
    /**
     * @description 提交审核
     * @param auditIdea 是否提交审核
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    async submit(comment, auditMsg, selectFile) {
      let auditIdea = true
      if(comment === 'reject') {
        auditIdea = false
      }

      let _this = this
      _this.auditMsg = auditMsg
      if(this.loading === true) {
        return
      }
      _this.loading = true

      try{
        let params = {
          proc_inst_id: _this.temp.proc_inst_id,
          type: 'task'
        }
        await _this.checkFlow(params)
        
        _this.loading = true
        try{
          if(comment === 'sendback') {
            await sendbackAudit({
              id: _this.temp.id,
              task_id: _this.temp.task_id,
              audit_msg: auditMsg,
              attachments: selectFile.map(i => i.docid)
            })
            this.$refs.auditComment.close()
            _this.$emit('auditResult')
            _this.$toast('success', _this.$t('message.approved'))
          }else {
            let params = {
              id: _this.temp.id,
              task_id: _this.temp.task_id,
              audit_idea: auditIdea,
              audit_msg: auditMsg,
              attachments: selectFile.map(i => i.docid)
            }
            await audit(params)
            _this.$refs.auditComment.close()
            _this.$emit('auditResult')
            _this.$toast('success', _this.$t('message.approved'))
          }
        }catch (res) {
          _this.loading = false
          // 附件无下载权限
          if(res.response.data.code === 403057012 && res.response.data.detail.ids) {
            const ids = res.response.data.detail.ids
            const errFiles = selectFile.filter((i)=>ids.includes(i)).map(i => i.name)
              this.$dialog_alert(
              _this.$t('message.errTitle'),
              _this.$t('message.fileNoDownloadPrem', {
                name: errFiles.join('、')
              }),
              _this.$t('message.confirm')
            )
            return
          }
          // 附件不存在
          if(res.response.data.code === 404057004 && res.response.data.detail.ids) {
            const ids = res.response.data.detail.ids
            const errFiles = selectFile.filter((i)=>ids.includes(i)).map(i => i.name)
              this.$dialog_alert(
              _this.$t('message.errTitle'),
              _this.$t('message.filesNotExist', {
                name: errFiles.join('、')
              }),
              _this.$t('message.confirm')
            )
            return
          }
          if (
            res.response.data.code === 400 ||
            res.response.data.code === 400057001
          ) {
            closeTag = false
            _this.$dialog_alert(
              _this.$t('message.title'),
              _this.$t('invalidParams'),
              _this.$t('message.confirm')
            )
            return
          }
          if (res.response.data.code === 401001101) {
            _this.$refs.auditComment.close()
            _this.$dialog_error(
              _this.$t('message.submitErr'),
              _this.$t('message.UndoFailedNotTask'),
              _this.$t('message.confirm'),
              function() {
                _this.$emit('auditResult')
              }
            )
          } else if (res.response.data.code === 401001102) {
            _this.$refs.auditComment.close()
            _this.$dialog_error(
              _this.$t('message.submitErr'),
              _this.$t('message.csfLevel'),
              _this.$t('message.confirm'),
              function() {}
            )
          } else if (res.response.data.code === 401000001) {
            _this.$refs.auditComment.close()
            _this.$dialog_error(
              _this.$t('message.submitErr'),
              _this.$t('message.auditErrorMsgStrategy'),
              _this.$t('message.confirm')
            )
          } else if (
            res.response.data.code === 401000002 ||
            res.response.data.code === 401000003
          ) {
            _this.$refs.auditComment.close()
            _this.$dialog_error(
              _this.$t('message.submitErr'),
              _this.$t('message.auditErrorMsgAuditor'),
              _this.$t('message.confirm')
            )
          } else if (res.response.data.code === 401000004) {
            _this.$refs.auditComment.close()
            _this.$dialog_error(
              _this.$t('message.submitErr'),
              _this.$t('message.auditErrorMsgCsfLevel'),
              _this.$t('message.confirm')
            )
          } else if (res.response.data.code === 500001101) {
            _this.$refs.auditComment.close()
            _this.$dialog_error(
              _this.$t('message.submitErr'),
              _this.$t('message.errorMsgNotFile'),
              _this.$t('message.confirm')
            )
          }else if(res.response.data.message) {
            _this.$toast('info', res.response.data.message)
          }
        }
      }catch(error) {
        _this.loading = false
      }
    },
    /**
     * @description 检查当前待办是否有效
     * @param params 查询条件
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    async checkFlow(params) {
      let _this = this
      _this.loading = true
      return new Promise(function(resolve, reject) {
        fecthTask(params)
          .then(res => {
            _this.loading = false
            if (!res.data.result) {
              reject(false)
            } else {
              resolve(true)
            }
          })
          .catch(async res => {
            if (res.response.data.code === 401001101) {
              // 判断是否是已转审过的记录
              let flag = false
              if (_this.temp.proc_inst_id && _this.auditPage) {
                try {
                  const res = await fecthLog(_this.temp.proc_inst_id)
                  let procLogs = res.data
                  let allTransferAuditLogs = []
                  procLogs.forEach(log => {
                    if (log.transfer_logs && log.transfer_logs.length) {
                      allTransferAuditLogs = allTransferAuditLogs.concat(
                        log.transfer_logs
                      )
                    }
                  })
                  if (allTransferAuditLogs) {
                    allTransferAuditLogs.forEach(item => {
                      if (item.transfer_by === _this.userid) {
                        flag = true
                      }
                    })
                  }
                  // 转审过后再次审核场景
                  const lastLog = procLogs[procLogs.length - 1]
                  lastLog.auditor_logs.forEach(log => {
                    if (
                      log.auditor === _this.userid &&
                      log.audit_status === null
                    ) {
                      flag = false
                    }
                  })
                } catch (e) {
                  console.error(e)
                }
              }

              if (flag) {
                _this.$dialog_alert(
                  _this.$t('common.detail.transfer.err.title'),
                  _this.$t('common.detail.transfer.err.transferred'),
                  _this.$t('message.confirm'),
                  function() {
                    _this.$emit('auditResult')
                  }
                )
              } else {
                _this.$dialog_alert(
                  _this.$t('common.detail.auditMsg.title'),
                  _this.$t('message.taskNotPrem'),
                  _this.$t('message.confirm'),
                  function() {
                    _this.$emit('auditResult')
                  }
                )
              }
            } else if (res.response.data.code === 401001102) {
              _this.$dialog_alert(
                _this.$t('common.detail.auditMsg.title'),
                _this.$t('message.csfLevel'),
                _this.$t('message.confirm')
              )
            }
            reject(false)
            _this.loading = false
          })
      })
    },
    /**
     * @description 检查是否展示加签按钮
     * */
    checkCountersignBtn(procLogs) {
      const _this = this
      countersignLogs(_this.temp.proc_inst_id).then(countersignLogsRes => {
        procLogs.forEach(e => {
          if (
            _this.temp.customDescription &&
            _this.temp.customDescription.countersign_switch === 'Y' &&
            e.act_status === '1'
          ) {
            let maxAuditors = _this.temp.customDescription.max_auditors
            let maxCount = _this.temp.customDescription.max_count
            let curentActCountersignArr = countersignLogsRes.data.filter(
              item => item.taskDefKey === e.act_def_key
            )
            if (
              curentActCountersignArr.length > 0 &&
              parseInt(maxCount) === parseInt(curentActCountersignArr[0].batch)
            ) {
              _this.showCountersignBtn = false
            } else if (
              parseInt(maxAuditors) === curentActCountersignArr.length
            ) {
              _this.showCountersignBtn = false
            } else {
              _this.showCountersignBtn = true
            }
          }
        })
      })
    },
    // 检查是否展示转审按钮
    checkTransferBtn(procLogs) {
      if (this.temp.customDescription && this.temp.customDescription.transfer) {
        if (this.temp.customDescription.transfer.transferSwitch !== 'Y') {
          this.showTransferBtn = false
          return
        }
        // 判断是否超出转审次数
        procLogs.forEach(log => {
          if (this.temp.customDescription && log.act_status === '1') {
            const currentTransferArr = log.transfer_logs
            const maxCount = this.temp.customDescription.transfer.maxCount
            // 每次转审只能给一人
            if (
              currentTransferArr.length > 0 &&
              parseInt(currentTransferArr.length) >= parseInt(maxCount)
            ) {
              this.showTransferBtn = false
            } else {
              this.showTransferBtn = true
            }
          }
        })
      } else {
        this.showTransferBtn = false
      }
    },
    /**
     * @description 格式环节名称
     * @author xiashneghui
     * @param type 环节类型
     * @param name 环节名称
     * @updateTime 2022/3/2
     * */
    actDefName(type, name) {
      if (type === 'startEvent') {
        return this.$t('common.detail.createApply')
      } else if (name === '审核' || name === '簽核' || name === 'Approval') {
        return this.$t('common.detail.audit')
      } else {
        return name
      }
    },
    /**
     * @description 撤销流程
     * @author xiashneghui
     * @updateTime 2022/3/2
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
          _this.$t('common.detail.auditMsg.cancel'),
          true
        )
        .then(() => {
          _this.loading = true
          cancel(_this.temp.biz_id)
            .then(res => {
              _this.$toast(
                'success',
                _this.$t('common.detail.revokeMsg.confirmMSg')
              )
              _this.$emit('auditResult')
              _this.loading = false
            })
            .catch(res => {
              _this.loading = false
              if (res.response.data.code === 401001101) {
                _this.$dialog_alert(
                  _this.$t('message.UndoFailed'),
                  _this.$t('message.UndoFailedNotTask'),
                  _this.$t('message.confirm'),
                  function() {
                    _this.$emit('auditResult')
                  }
                )
              }
            })
        })
        .catch(e => {})
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
    resubmit(){
      const microWidgetProps = this.$store.state.app.microWidgetProps
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
        target: 'applyPage',
        audit_status: this.temp.audit_status,
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
              dialogParams: params,
              onMessage: async ({delay}) => {
                if (typeof delay === 'number' && delay > 0) {
                  this.updateList(delay);
                } else {
                  this.updateList()
                }
              }
            }
          )
      }
      }catch(err){
        console.error(err)
      }
      
    },
    /**
     * @description 刷新列表数据
     * */
    auditResult() {
      // 触发列表查询数据
      this.$emit('auditResult')
    },
    unmountMicroApp() {
      if (this.auditDetailMicroApp !== null) {
        this.auditDetailMicroApp.unmount()
      }
      if(this.reSubmitMicroApp !== null) {
        this.reSubmitMicroApp.unmount()
      }
    },
    reloadFlowLog() {
      const _this = this
      _this.showFlowLogDetail = false
      _this.$nextTick(function() {
        _this.showFlowLogDetail = true
        _this.$emit('reloadInfo')
      })
    },
    isIE() {
      if (!!window.ActiveXObject || 'ActiveXObject' in window) return true
      else return false
    }
  }
}
</script>

<style>
.as-btn {
  margin: 0;
}
.details-ops-icon {
  font-size: 16px;
  margin-right: 8px;
}

.dropdown-menu-more {
  padding: 4px 0;
  border: 1px solid #e0e0e0;
  box-shadow: 0 0 8px 0 #e0e0e0;
  transform: translateY(12px);
}

.dropdown-menu-more .popper__arrow {
  display: none !important;
}

.dropdown-menu-more .el-dropdown-menu__item {
  color: #000;
  padding: 3px 8px;
  min-width: 130px;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 24px;
}

.dropdown-menu-more .el-dropdown-menu__item:focus,
.dropdown-menu-more .el-dropdown-menu__item:not(.is-disabled):hover {
  background: #f4f4f7;
  color: #000;
}
.dropdown-menu-more .el-dropdown-menu__item.active {
  background: #f4f4f7;
  color: #000;
  border-color: #f4f4f7;
  font-weight: 400;
}
.detail-footer.btnfoot {
  padding: 10px 0 0;
  height: auto;
}
.el-tabs__content .el-loading-mask {
  z-index: 9 !important;
}
</style>
