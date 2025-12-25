<template>
  <div>
    <!-- 流程日志 -->
    <div class="lc-list" :class="{ 'no-padding-bottom': !auditPage }">
      <template v-if="temp.audit_status !== 'failed'">
        <!-- 流程： -->
        <div class="title">{{ $t('common.detail.flow') }}：</div>
        <div class="time-list">
          <!---class加上finish是已完成状态，加上review是审核中，加上unstar是未开始--->
          <div
            v-for="(item, index1) in logs"
            v-if="showAct(item)"
            class="list"
            :class="{...userTaskStatusClass(index1, item),isSendbackLog:item.sendback==='Y'}"
          >
            <!-- class判断显示用户头像或系统图标 -->
            <div
              class="user-ico"
              :class="{
                user:
                  item.act_type === 'startEvent' ||
                  item.act_type === 'transferEvent',
                'user-xt':
                  item.act_type === 'autoPass' || item.act_type === 'autoReject'
              }"
            >
              <template v-if="item.act_type === 'startEvent'">
                <el-avatar
                  v-if="
                    temp.apply_user_avatar_url && item.act_type === 'startEvent'
                  "
                  style="line-height:32px;width:32px;height:32px"
                  :src="temp.apply_user_avatar_url"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  :style="
                    `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                  "
                  v-html="temp.apply_user_name.substring(0, 1)"
                >
                </el-avatar>
              </template>
              <template v-if="item.act_type === 'transferEvent'">
                <el-avatar
                  v-if="
                    userAvatars[item.transfer_by] &&
                      item.act_type === 'transferEvent'
                  "
                  style="line-height:32px;width:32px;height:32px"
                  :src="userAvatars[item.transfer_by]"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  :style="
                    `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                  "
                  v-html="item.transfer_by_name.substring(0, 1)"
                >
                </el-avatar>
              </template>
              <span
                v-if="isSuccess(item) && item.act_type !== 'transferEvent'"
                class="state"
              ></span>
            </div>
            <div class="text">
              <p
                v-if="item.act_type === 'transferEvent'"
                :title="item.transfer_by_name"
              >
                {{ item.transfer_by_name }}
              </p>
              <!-- 用户名/审核（同级审核） -->
              <p
                v-else
                :title="
                  item.act_type === 'startEvent' ? temp.apply_user_name : ''
                "
              >
                {{
                  item.act_type === 'startEvent'
                    ? temp.apply_user_name
                    : actDefName(item.act_type, item.act_def_name)
                }}
                <template
                  v-if="
                    item.act_type !== 'startEvent' &&
                      item.act_type !== 'autoPass' &&
                      item.act_type !== 'autoReject'
                  "
                >
                  <span v-if="item.act_model === 'tjsh'">{{
                    $t('common.detail.auditTypes.tjsh')
                  }}</span>
                  <span v-else-if="item.act_model === 'hqsh'">{{
                    $t('common.detail.auditTypes.hqsh')
                  }}</span>
                  <span v-else-if="item.act_model === 'zjsh'">{{
                    $t('common.detail.auditTypes.zjsh')
                  }}</span>
                </template>
              </p>
              <p>
                <!-- 审核状态（已发起/审核中） -->
                <span v-if="item.act_type === 'startEvent'" class="green">{{
                  $t('common.detail.created')
                }}</span>
                <span
                  v-else-if="item.act_type === 'transferEvent'"
                  class="green"
                  >{{
                    $t('common.detail.transfer.to', {
                      name: item.transfer_auditor_name
                    })
                  }}</span
                >
                <span v-else-if="item.act_type === 'autoPass'" class="green">{{
                  $t('common.detail.approvedAutomatically')
                }}</span>
                <span v-else-if="item.act_type === 'autoReject'" class="red">{{
                  $t('common.detail.rejectedAutomatically')
                }}</span>
                <span
                  v-else-if="
                    item.act_status === '1' &&
                      (index1 == 0 ||
                        (index1 > 0 && logs[index1 - 1].act_status === '2'))
                  "
                  class="orange"
                >
                  <span v-if="donePage">{{
                    $t('common.detail.status.pending2')
                  }}</span>
                  <span v-else>{{ $t('common.detail.status.pending') }}</span>
                </span>
                <!-- 已退回 -->
                <span v-else-if="getActStatus(item) === 'sendback'" class="sendback-idea">{{
                  $t('common.detail.sendback.backTo',{name: temp.apply_user_name})
                }}</span>
                <span v-else-if="getActStatus(item) === 'reject'" class="red">{{
                  $t('common.detail.status.reject')
                }}</span>
                <span v-else-if="getActStatus(item) === 'pass'" class="green">{{
                  $t('common.detail.status.pass')
                }}</span>
              </p>
              <div class="btn" v-if="item.act_type !== 'startEvent'">
                <div
                  v-if="item.act_type === 'transferEvent' && item.reason"
                  class="fl-div"
                >
                  <div class="transfer-reason">{{ item.reason }}</div>
                </div>
                <!-- 审核环节日志 -->
                <template v-for="(subAuditors, index) in item.auditor_logs">
                  <div class="fl-div">
                    <!-- 只显示审核中的或处理过的审核员 -->
                    <template
                      v-for="(auditor, index) in subAuditors"
                      v-if="
                        item.act_status === '1' ||
                          (auditor.audit_status != null &&
                            auditor.audit_idea !== 'revocation' &&
                            (auditor.proc_status !== '70' || auditor.audit_status === 'pass') &&
                            auditor.audit_idea !== 'proc_def_delete' &&
                            auditor.audit_idea !== 'flow_del_file_cancel') ||
                            donePage && item.act_model === 'tjsh' // 已处理页面 && 同级审核，显示所有审核员
                      "
                    >
                      <template v-if="auditor.audit_status != null">
                        <div class="user_list">
                          <a
                            class="user-btn"
                            :class="{
                              active: auditor.audit_status === 'pass',
                              nopass: auditor.audit_status === 'reject' || auditor.audit_status === 'sendback'
                            }"
                            style="white-space: normal"
                          >
                            <!-- 审核意见 -->
                            <!-- <span
                              v-if="
                                auditor.audit__idea !== null &&
                                  auditor.audit_idea !== '' &&
                                  auditor.audit_idea !== 'default_comment'
                              "
                              class="news"
                              v-tooltip="{
                                content: getAuditIdeaTootip(auditor),
                                boundariesElement: '#element-ui-mount-content',
                                autoHide: false,
                                trigger: 'hover',
                                container: '#element-ui-mount-content',
                                classes: ['black-tooltip']
                              }"
                            ></span> -->
                            <el-avatar
                              v-if="userAvatars[auditor.auditor]"
                              :src="userAvatars[auditor.auditor]"
                            >
                            </el-avatar>
                            <el-avatar
                              v-else
                              :style="`background:#4A5C9B`"
                              v-html="auditor.auditor_name.substring(0, 1)"
                            >
                            </el-avatar>
                            <span
                              v-title
                              :title="auditor.auditor_name"
                              style="display:block;max-width:60px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;"
                              >{{ auditor.auditor_name }}</span
                            >
                            <!-- 审核通过/拒绝图标 -->
                            <span class="icon"></span>
                            <span
                              v-if="
                                showCountersign(auditor, item.countersign_logs)
                              "
                              v-tooltip="{
                                content: getCountersignReasonTootip(
                                  auditor,
                                  item.countersign_logs
                                ),
                                boundariesElement: '#element-ui-mount-content',
                                autoHide: false,
                                trigger: 'hover',
                                container: '#element-ui-mount-content',
                                classes: ['black-tooltip']
                              }"
                              :style="
                                'position: absolute;' +
                                  (internationalization === 'en-us'
                                    ? 'left: 0px;top:14px'
                                    : 'left: 8px;top:14px')
                              "
                            >
                              <svg-icon
                                v-if="internationalization === 'zh-tw'"
                                icon-class="countersign_tw"
                                class="countersign-icon"
                              >
                              </svg-icon>
                              <svg-icon
                                v-else-if="internationalization === 'en-us'"
                                icon-class="countersign_en"
                                class="countersign-en-icon"
                              >
                              </svg-icon>
                              <svg-icon
                                v-else
                                icon-class="countersign_zh"
                                class="countersign-icon"
                              >
                              </svg-icon>
                            </span>
                          </a>
                          <!-- 审核处理时间 -->
                          <span
                            v-if="
                              auditor.audit__idea !== null &&
                                auditor.audit_idea !== ''
                            "
                            style="font-size: 12px;float: right;line-height: 39px;color: rgba(0,0,0,0.45)"
                            >{{ getAuditIdeaDateTime(auditor) }}</span
                          >
                        </div>
                        <div
                          v-if="
                            auditor.audit__idea !== null &&
                            auditor.audit_idea !== '' &&
                            auditor.audit_idea !== 'default_comment'
                          "
                          class="audit-idea"
                        >
                          <span>{{transferAuditIdea(auditor.audit_idea)}}</span>
                        </div>
                        <AttachmentLog v-if="!applyPage || (applyPage &&(temp.audit_status === 'pass' || temp.audit_status === 'reject' || auditor.audit_status === 'sendback'))"
                        :files="auditor.attachments !==null && typeof auditor.attachments==='object'?auditor.attachments:[]" />
                      </template>
                      <!-- 审核中 -->
                      <template v-else>
                        <div class="user_list">
                          <a class="user-btn" style="white-space: normal">
                            <el-avatar
                              v-if="userAvatars[auditor.auditor]"
                              :src="userAvatars[auditor.auditor]"
                            >
                            </el-avatar>
                            <el-avatar
                              v-else
                              :style="`background:#4A5C9B`"
                              v-html="auditor.auditor_name.substring(0, 1)"
                            ></el-avatar>
                            <span
                              v-if="
                                showCountersign(auditor, item.countersign_logs)
                              "
                              v-tooltip="{
                                content: getCountersignReasonTootip(
                                  auditor,
                                  item.countersign_logs
                                ),
                                boundariesElement: '#element-ui-mount-content',
                                autoHide: false,
                                trigger: 'hover',
                                container: '#element-ui-mount-content',
                                classes: ['black-tooltip']
                              }"
                              :style="
                                'position: absolute;' +
                                  (internationalization === 'en-us'
                                    ? 'left: 0px;top:14px'
                                    : 'left: 8px;top:14px')
                              "
                            >
                              <svg-icon
                                v-if="internationalization === 'zh-tw'"
                                icon-class="countersign_tw"
                                class="countersign-icon"
                              >
                              </svg-icon>
                              <svg-icon
                                v-else-if="internationalization === 'en-us'"
                                icon-class="countersign_en"
                                class="countersign-en-icon"
                              >
                              </svg-icon>
                              <svg-icon
                                v-else
                                icon-class="countersign_zh"
                                class="countersign-icon"
                              >
                              </svg-icon>
                            </span>
                            <!-- 审核员名称 -->
                            <span
                              v-title
                              :title="auditor.auditor_name"
                              style="display:block;max-width:60px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;"
                              >{{ auditor.auditor_name }}</span
                            >
                            <!-- 审核通过/拒绝图标 -->
                            <span class="icon"></span>
                          </a>
                        </div>
                      </template>
                      <!-- 依次审核分隔箭头 -->
                      <span
                        v-if="
                          item.act_model === 'zjsh' &&
                            index !== subAuditors.length - 1 &&
                            subAuditors[index + 1].audit_idea !==
                              'revocation' &&
                            (subAuditors[index + 1].proc_status !== '70' || subAuditors[index + 1].audit_status === 'pass') &&
                            subAuditors[index + 1].audit_idea !==
                              'proc_def_delete' &&
                            subAuditors[index + 1].audit_idea !==
                              'flow_del_file_cancel' &&
                            (temp.audit_status === 'pending' ||
                              subAuditors[index + 1].audit_status !== null)
                        "
                        class="right-icon"
                        ><i class="el-icon-arrow-down"></i
                      ></span>
                    </template>
                  </div>
                  <!-- 按匹配规则连续多级审核分隔箭头 -->
                  <div
                    v-if="
                      item.auditor_logs.length > 1 &&
                        index !== item.auditor_logs.length - 1
                    "
                  >
                    <span style="margin: 0px 0px 5px 25.5px"
                      ><i class="el-icon-arrow-down"></i
                    ></span>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <!-- 系统自动拒绝 -->
          <template v-if="temp.audit_status === 'reject' && !temp.proc_inst_id">
            <div class="list finish">
              <div class="user-ico">
                <el-avatar
                  v-if="temp.apply_user_avatar_url"
                  style="line-height:32px;width:32px;height:32px"
                  :src="temp.apply_user_avatar_url"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  :style="
                    `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                  "
                  v-html="temp.apply_user_name.substring(0, 1)"
                >
                </el-avatar>
                <span class="state"></span>
              </div>
              <div class="text">
                <p :title="temp.apply_user_name">{{ temp.apply_user_name }}</p>
                <p class="green">{{ $t('common.detail.created') }}</p>
              </div>
            </div>
            <div class="list finish">
              <div class="user-ico user-xt"><span class="state"></span></div>
              <div class="text">
                <p>{{ $t('common.detail.audit') }}</p>
                <p class="red">
                  {{ $t('common.detail.rejectedAutomatically') }}
                </p>
              </div>
            </div>
          </template>
          <!-- 自动审核通过 -->
          <template v-if="temp.audit_status === 'avoid'">
            <div class="list finish">
              <div class="user-ico">
                <el-avatar
                  v-if="temp.apply_user_avatar_url"
                  style="line-height:32px;width:32px;height:32px"
                  :src="temp.apply_user_avatar_url"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  :style="
                    `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                  "
                  v-html="temp.apply_user_name.substring(0, 1)"
                >
                </el-avatar>
                <span class="state"></span>
              </div>
              <div class="text">
                <p :title="temp.apply_user_name">{{ temp.apply_user_name }}</p>
                <p class="green">{{ $t('common.detail.created') }}</p>
              </div>
            </div>
            <div class="list finish">
              <!---加上finish是已完成状态，加上review是审核中，加上unstar是未开始--->
              <div class="user-ico"><span class="state"></span></div>
              <div class="text">
                <p>{{ $t('common.detail.audit') }}</p>
                <p class="green">{{ $t('common.detail.status.avoid') }}</p>
              </div>
            </div>
          </template>
          <!-- 免审流程（audit_status为pass，proc_inst_id为空）显示：系统自动通过 -->
          <template v-if="temp.audit_status === 'pass' && !temp.proc_inst_id">
            <div class="list finish">
              <div class="user-ico">
                <el-avatar
                  v-if="temp.apply_user_avatar_url"
                  style="line-height:32px;width:32px;height:32px"
                  :src="temp.apply_user_avatar_url"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  :style="
                    `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                  "
                  v-html="temp.apply_user_name.substring(0, 1)"
                >
                </el-avatar>
                <span class="state"></span>
              </div>
              <div class="text">
                <p :title="temp.apply_user_name">{{ temp.apply_user_name }}</p>
                <p class="green">{{ $t('common.detail.created') }}</p>
              </div>
            </div>
            <div class="list finish">
              <!---加上finish是已完成状态，加上review是审核中，加上unstar是未开始--->
              <div class="user-ico user-xt"><span class="state"></span></div>
              <div class="text">
                <p>{{ $t('common.detail.audit') }}</p>
                <p class="green">{{ $t('common.detail.approvedAutomatically') }}</p>
              </div>
            </div>
          </template>
          <!-- 已撤销 -->
          <template v-if="temp.audit_status === 'undone'">
            <!-- 管理员已删除流程 -->
            <div v-if="temp.audit_msg === 'A0701'" class="list unstar">
              <div class="user-ico user-gly"><span class="state"></span></div>
              <div class="text">
                <p>{{ $t('common.detail.revoke') }}</p>
                <p class="red">
                  {{ $t('common.detail.undoneForProcDefDelete') }}
                </p>
              </div>
            </div>
            <!-- 删除审核流程 -->
            <div v-else-if="temp.audit_msg === 'A0702'" class="list unstar">
              <div class="user-ico">
                <el-avatar
                  v-if="temp.apply_user_avatar_url"
                  style="line-height:32px;width:32px;height:32px"
                  :src="temp.apply_user_avatar_url"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  :style="
                    `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                  "
                  v-html="temp.apply_user_name.substring(0, 1)"
                >
                </el-avatar>
                <span class="state"></span>
              </div>
              <div class="text">
                <p>{{ $t('common.detail.revoke') }}</p>
                <p class="red" :title="temp.apply_user_name">
                  {{ temp.apply_user_name
                  }}{{ $t('common.detail.delAuditFlow') }}
                </p>
              </div>
            </div>
            <div v-else class="list finish">
              <!-- xx已撤销 -->
              <template v-if="temp.audit_msg === 'revocation'">
                <div class="user-ico">
                  <el-avatar
                    v-if="temp.apply_user_avatar_url"
                    style="line-height:32px;width:32px;height:32px"
                    :src="temp.apply_user_avatar_url"
                  >
                  </el-avatar>
                  <el-avatar
                    v-else
                    :style="
                      `background:#4A5C9B;line-height:32px;width:32px;height:32px`
                    "
                    v-html="temp.apply_user_name.substring(0, 1)"
                  >
                  </el-avatar>
                  <span class="state"></span>
                </div>
                <div class="text">
                  <p :title="temp.apply_user_name">
                    {{ temp.apply_user_name }}
                  </p>
                  <p class="green">
                    {{ $t('common.detail.undone').replace('{}', '') }}
                  </p>
                </div>
              </template>
              <!-- 撤销申请 -->
              <template v-else>
                <div class="user-ico user-gly"><span class="state"></span></div>
                <div class="text">
                  <p>{{ $t('common.detail.revoke') }}</p>
                  <p class="green" :title="temp.audit_msg">{{ temp.audit_msg }}</p>
                </div>
              </template>
            </div>
          </template>
          <!-- 审核中/审核结束 -->
          <div
            class="list"
            v-if="
              temp.audit_msg !== 'A0701' &&
                temp.audit_msg !== 'A0702' &&
                !loading
            "
          >
            <p v-if="temp.audit_status === 'pending'" class="padding-top-10">
              {{ $t('common.detail.status.flow') }}
            </p>
            <p v-else class="padding-top-10">
              {{ $t('common.detail.status.end') }}
            </p>
          </div>
        </div>
        <!-----time-list------>
      </template>
      <!-- audit_status为failed，涉密有单独提示语 -->
      <template v-else>
        <div class="red-text-1">
          <i class="el-icon-warning"></i>
          <!-- 当前无匹配的审核员 -->
          <span
            v-if="
              temp.audit_msg === 'S0001' ||
                temp.audit_msg === 'S0002' ||
                temp.audit_msg === 'S0003'
            "
          >
            <template
              v-if="
                $store.state.app.secret.status === 'y' &&
                  ['realname', 'perm', 'owner', 'inherit'].includes(
                    temp.biz_type
                  )
              "
            >
              {{ $t('common.detail.failedMsg.secretRealname.noAuditor') }}
            </template>
            <template v-else>
              {{
                $t('common.detail.failedMsg.' + temp.biz_type + '.noAuditor')
              }}
            </template>
          </span>
          <!-- 当前审核员密级不足 -->
          <span v-else-if="temp.audit_msg === 'S0004'">
            <template
              v-if="
                $store.state.app.secret.status === 'y' &&
                  ['realname', 'perm', 'owner', 'inherit'].includes(
                    temp.biz_type
                  )
              "
            >
              {{
                $t(
                  'common.detail.failedMsg.secretRealname.noMatchingLevelAuditor'
                )
              }}
            </template>
            <template v-else>
              {{
                $t(
                  'common.detail.failedMsg.' +
                    temp.biz_type +
                    '.noMatchingLevelAuditor'
                )
              }}
            </template>
          </span>
        </div>
      </template>
      <!-----time-list------>
    </div>
  </div>
</template>
<script>
import { cancel, countersignLogs } from '@/api/audit'
import { fecthLog } from '@/api/workflow'
import XEUtils from 'xe-utils'
import { getUserImagesList } from '@/api/anyshareOpenApi'
import AttachmentLog from "./attachmentLog.vue"
export default {
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
    }
  },
  components:{AttachmentLog},
  data() {
    return {
      loading: false,
      logs: [],
      userAvatars: {},
      internationalization: 'zh-cn'
    }
  },
  computed: {
    procInstId: function() {
      return this.temp.proc_inst_id
    }
  },
  // watch: {
  //   temp (value) {
  //     this.getSelectFlowLog()
  //     this.getApplyUserImage()
  //   }
  // },
  created() {
    this.internationalization = XEUtils.cookie('lang')
    this.getApplyUserImage()
    // 加载日志
    this.getSelectFlowLog()
  },
  methods: {
    /**
     * @description 加载日志
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    getSelectFlowLog() {
      let _this = this
      // 如果审核状态为自动通过或发起失败，或流程实例ID不存在，则不显示审核员日志
      if (
        _this.temp.audit_status === 'avoid' ||
        _this.temp.audit_status === 'failed' ||
        !_this.temp.proc_inst_id
      ) {
        _this.logs = []
        return
      }
      _this.loading = true
      fecthLog(_this.temp.proc_inst_id)
        .then(res => {
          let _data = res.data
          // 待获取头像用户
          const allUser = []
          // 转审列表
          let transferArr = []
          for (let index in _data) {
            // 如果为逐级审核，合并业务数据的审核员，临时方案
            if (
              _data[index].act_status === '1' &&
              _data[index].act_model === 'zjsh' &&
              _data.length > 1
            ) {
              // 获取审核详情中不包含在日志里的审核员
              let _array = _this.temp.auditors.filter(function(item) {
                return (
                  _data[index].auditor_logs[
                    _data[index].auditor_logs.length - 1
                  ].filter(item2 => item2.auditor === item.id).length === 0
                )
              })
              // 将缺少的zjsh审核员加到日志中
              for (index2 in _array) {
                _data[index].auditor_logs[
                  _data[index].auditor_logs.length - 1
                ].push({
                  audit_idea: null,
                  audit_status: null,
                  auditor: _array[index2].id,
                  auditor_name: _array[index2].name,
                  account: _array[index2].account,
                  countersign: _array[index2].countersign || 'n',
                  end_time: null,
                  start_time: new Date()
                })
              }
            }
            // 转审用户处理
            if (
              _data[index].transfer_logs &&
              _data[index].transfer_logs.length
            ) {
              let revertArr = []
              _data[index].transfer_logs.forEach(log => {
                allUser.push({ auditor: log.transfer_by })
                revertArr.unshift([
                  Number(index),
                  {
                    act_def_key: 'transfer-node',
                    act_def_name: '转审',
                    act_status: '2',
                    act_model: 'tjsh',
                    act_type: 'transferEvent',
                    transfer_auditor: log.transfer_auditor,
                    transfer_auditor_name: log.transfer_auditor_name,
                    transfer_by: log.transfer_by,
                    transfer_by_name: log.transfer_by_name,
                    reason: log.reason,
                    batch: log.batch
                  }
                ])
              })
              transferArr = transferArr.concat(revertArr)
            }

            // 批量设置待获取头像用户
            _data[index].auditor_logs &&
              _data[index].auditor_logs.forEach(subItem => {
                subItem.forEach(item => {
                  allUser.push(item)
                })
              })
            
            // 已处理页面，同级审核结束，将该审核员放到第一个
            if(
              this.donePage && index > 0 && _data[index] && _data[index].act_model === 'tjsh' &&  _data[index].act_status !== '1'
            ) {
              let auditor_logs = _data[index].auditor_logs

              for (let i = 0; i < auditor_logs.length; i++) {
                const targetIndex = auditor_logs[i].findIndex((item) => item.audit_status)

                if (targetIndex > 0) {
                  // 将该项置移到最前面
                  const target =  _data[index].auditor_logs[i].splice(targetIndex, 1)
                  _data[index].auditor_logs[i].unshift(target[0])
                }
              }
            }
          }

          // 插入转审用户
          let offset = 0
          for (val of transferArr) {
            _data.splice(val[0] + offset, 0, val[1])
            offset++
          }
          // 如果审核已撤销，则日志中为已撤销的记录不显示
          if (_this.temp.audit_status === 'undone') {
            for (index in _data) {
              for (j in _data[index].auditor_logs) {
                const _arr = _data[index].auditor_logs[j].filter(
                  item =>
                    item.audit_status !== null &&
                    item.audit_idea !== 'revocation' &&
                    (item.proc_status !== '70' || item.audit_status === 'pass') &&
                    item.audit_idea !== 'proc_def_delete' &&
                    item.audit_idea !== 'flow_del_file_cancel'
                )
                if (
                  _data[index].act_type !== 'startEvent' &&
                  _arr.length === 0
                ) {
                  _data[index].auditor_logs.splice(j, 1)
                  if (_data[index].auditor_logs.length === 0) {
                    _data.splice(index, 1)
                  }
                }
              }
            }
          }
          _this.logs = _data
          const userIds = _this.$utils
            .uniq(allUser.map(item => item.auditor))
            .filter(Boolean)
          const getImage = ids => {
            if (ids && ids.length > 0) {
              getUserImagesList(ids)
                .then(res => {
                  res.data &&
                    res.data.forEach(user => {
                      _this.userAvatars[user.id] = user.avatar_url
                        ? user.avatar_url
                        : ''
                    })
                  _this.$nextTick(function() {
                    _this.loading = false
                  })
                })
                .catch(err => {
                  // 过滤掉不存在的用户
                  if (err.response.data.code === 404019001) {
                    getImage(
                      ids.filter(item => {
                        if (err.response.data.detail.ids.includes(item)) {
                          return false
                        }
                        return true
                      })
                    )
                  } else {
                    ids.forEach(item => {
                      _this.userAvatars[item] = ''
                    })
                    _this.$nextTick(function() {
                      _this.loading = false
                    })
                  }
                })
            }
          }
          getImage(userIds)
        })
        .catch(res => {
          console.error(res)
          _this.$nextTick(function() {
            _this.loading = false
          })
        })
    },
    transferAuditIdea(idea) {
      return idea.replace(/<br(\/)?>/g, '\n').replace(/&nbsp;/g," ")
    },
    /**
     * @description 获取流程日志审核员头像
     * @param _auditorObj  审核员日志对象
     * */
    getAuditorAvatars(_auditorObj) {
      return new Promise(resolve => {
        getUserImagesList(_auditorObj.auditor)
          .then(res => {
            _auditorObj['avatar_url'] = res.data[0].avatar_url
              ? res.data[0].avatar_url
              : ''
            resolve(res)
          })
          .catch(err => {
            _auditorObj['avatar_url'] = ''
            resolve(err)
          })
      })
    },
    /**
     * @description 根据审核环节状态添加类
     * @author xiashneghui
     * @param index  审核环节索引
     * @param item  审核环节日志
     * @updateTime 2022/3/2
     * */
    userTaskStatusClass(index, item) {
      // 审核环节运行中
      if (item.act_status === '1') {
        if (index > 0 && this.logs[index - 1].act_status === '1') {
          return { unstar: true }
        } else {
          return { review: true }
        }
        // 审核环节已执行
      } else if (item.act_status === '2') {
        let _logs = this.formatAuditorLogs(item.auditor_logs)
        // 退回
        if(_logs.some(i=>i.audit_status==='sendback')){
          return {finish: true}
        }
        let _array = _logs.filter(
          item =>
            item.audit_status === 'reject' &&
            item.audit_idea !== 'revocation' &&
            item.proc_status !== '70' &&
            item.audit_idea !== 'proc_def_delete' &&
            item.audit_idea !== 'flow_del_file_cancel'
        )
        if (_array.length > 0 || item.act_type === 'autoReject') {
          return { reject: true }
        }
        if (item.act_model === 'tjsh' || this.temp.audit_status === 'undone') {
          return { finish: true }
        } else {
          _array = _logs.filter(item => item.audit_status === 'pass')
          return _array.length === _logs.length
            ? { finish: true }
            : { review: true }
        }
      }
      return ''
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
     * @description 流程日志-是否展示该环节
     * @author xiashneghui
     * @param _act 流程日志信息
     * @updateTime 2022/3/2
     * */
    showAct(_act) {
      if (
        _act.act_type === 'startEvent' ||
        _act.act_type === 'transferEvent' ||
        _act.act_type === 'autoPass' ||
        _act.act_type === 'autoReject' ||
        _act.act_status === '1'
      ) {
        return true
      }
      // 合并成一个数组，判断已审核环节中存在展示数据
      let _logs = this.formatAuditorLogs(_act.auditor_logs)
      return (
        _logs.filter(
          item =>
            item.audit_status !== null &&
            item.audit_idea !== 'revocation' &&
            (item.proc_status !== '70' || item.audit_status === 'pass') &&
            item.audit_idea !== 'proc_def_delete' &&
            item.audit_idea !== 'flow_del_file_cancel'
        ).length > 0
      )
    },
    /**
     * @description 流程日志-是否展示已通过图标
     * @author xiashneghui
     * @param _obj 流程日志信息
     * @updateTime 2022/3/2
     * */
    isSuccess(_obj) {
      let _logs = this.formatAuditorLogs(_obj.auditor_logs)
      // 存在已撤销
      if (
        _logs.filter(
          item =>
            item.audit_status === 'reject' && (item.audit_idea === 'revocation' || item.proc_status === '70')
        ).length > 0
      ) {
        return ''
      }
      return true
    },
    /**
     * @description 流程日志-环节审核状态
     * @author xiashneghui
     * @param _obj 流程日志信息
     * @updateTime 2022/3/2
     * */
    getActStatus(_obj) {
      if (_obj.act_status !== '2') {
        return ''
      }
      let _logs = this.formatAuditorLogs(_obj.auditor_logs)
      if (
        _logs.filter(
          item =>
            item.audit_status === 'reject' && (item.audit_idea === 'revocation' || item.proc_status === '70')
        ).length > 0
      ) {
        return ''
      }
      if(_logs.some(i=>i.audit_status==='sendback')) {
        return 'sendback'
      }
      const _array = _logs.filter(
        item =>
          item.audit_status === 'reject' &&
          item.audit_idea !== 'revocation' &&
          item.proc_status !== '70' &&
          item.audit_idea !== 'proc_def_delete' &&
          item.audit_idea !== 'flow_del_file_cancel'
      )
      return _array.length > 0 ? 'reject' : 'pass'
    },
    /**
     * @description 审核员意见悬浮信息
     * @author xiashneghui
     * @param _auditor 审核员信息
     * @updateTime 2022/3/2
     * */
    getAuditIdeaTootip(_auditor) {
      let auditIdea = _auditor.audit_idea
      if (this.$i18n.locale === 'en-us') {
        return (
          '<span>' +
          this.$t('common.detail.auditIdea') +
          ':' +
          auditIdea +
          '</span>'
        )
      }
      return (
        '<span>' +
        this.$t('common.detail.auditIdea') +
        '：' +
        auditIdea +
        '</span>'
      )
    },
    /**
     * @description 审核员审核时间
     * */
    getAuditIdeaDateTime(_auditor) {
      const nowDateTime = this.$utils.toStringDate(this.$utils.now())
      const yesterday = this.$utils.toDateString(
        this.$utils.getWhatDay(nowDateTime, -1),
        'yyyy/MM/dd'
      )
      const today = this.$utils.toDateString(nowDateTime, 'yyyy/MM/dd')
      const thisYear = this.$utils.toDateString(nowDateTime, 'yyyy')

      const auditedday = this.$utils.toDateString(
        _auditor.end_time,
        'yyyy/MM/dd'
      )
      const auditedYear = this.$utils.toDateString(_auditor.end_time, 'yyyy')
      if (auditedday === today) {
        return (
          this.$t('common.detail.today') +
          ' ' +
          this.$utils.toDateString(_auditor.end_time, 'HH:mm')
        )
      } else if (auditedday === yesterday) {
        return (
          this.$t('common.detail.yesterday') +
          ' ' +
          this.$utils.toDateString(_auditor.end_time, 'HH:mm')
        )
      } else if (auditedYear === thisYear) {
        return this.$utils.toDateString(_auditor.end_time, 'MM/dd HH:mm')
      } else {
        return this.$utils.toDateString(_auditor.end_time, 'yyyy/MM/dd HH:mm')
      }
    },
    /**
     * @description 加签理由悬浮信息
     * @author hanj
     * @param _auditor 加签理由悬浮信息
     * @updateTime 2023/1/4
     * */
    getCountersignReasonTootip(_auditor, _countersignLogs) {
      let countersignAuditorArr = _countersignLogs.filter(
        e => e.countersign_auditor === _auditor.auditor
      )
      let countersignAuditor =
        countersignAuditorArr.length > 0
          ? countersignAuditorArr[0].countersign_by_name
          : ''
      let reason =
        countersignAuditorArr.length > 0 ? countersignAuditorArr[0].reason : ''
      return (
        '<p>' +
        this.$t('common.detail.countersign.by') +
        countersignAuditor +
        this.$t('common.detail.countersign.countersign') +
        '</p>' +
        reason
      )
    },
    showCountersign(_auditor, _countersignLogs) {
      let countersignAuditorArr = _countersignLogs.filter(
        e => e.countersign_auditor === _auditor.auditor
      )
      return countersignAuditorArr.length > 0 && _auditor.countersign === 'y'
    },
    /**
     * @description 格式化流程日志信息
     * @author xiashneghui
     * @param _auditorLogs 审核员日志信息
     * @updateTime 2022/3/2
     * */
    formatAuditorLogs(_auditorLogs) {
      let _result = []
      for (let i in _auditorLogs) {
        _result = _result.concat(_auditorLogs[i])
      }
      return _result
    },
    /**
     * @description 获取审核员头像信息
     * @author xiashneghui
     * @updateTime 2022/10/9
     * */
    // eslint-disable-next-line consistent-return
    getApplyUserImage() {
      const _this = this
      let userID = []
      userID[0] = _this.temp.apply_user_id
      getUserImagesList(userID)
        .then(res => {
          let avatar_url = ''
          if (res.data[0].avatar_url !== '') {
            avatar_url = res.data[0].avatar_url
          }
          _this.temp['apply_user_avatar_url'] = avatar_url
        })
        .catch(err => {
          return ''
        })
    }
  }
}
</script>

<style scoped>
.transfer-reason {
  background: #f6f6f6;
  color: #000;
  padding: 6px 10px;
  border-radius: 4px;
}

.countersign-icon {
  position: relative;
  top: 4px;
  font-size: 25px;
}
.countersign-en-icon {
  width: 44px;
  height: 12px;
}

.audit-idea {
  position: relative;
  margin-top: 4px;
  margin-bottom: 8px;
  padding: 8px;
  background: rgb(245,246,247);
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.75);
}

.audit-idea span {
  white-space: pre-wrap;
  user-select: text;
}

.audit-idea::before{
  content: "";
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 10px solid rgb(245,246,247);
  position: absolute;
  top: -10px;
  left: 16px;
}

.sendback-idea {
  color: #ff4d4f;
}
</style>
