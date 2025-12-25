<template>
  <div>
    <el-dialog
      :title="comment === 'sendback'? $t('common.detail.operation.sendbackTitle'):$t('common.detail.operation.' + comment)"
      :visible.sync="commentVisible"
      width="570px"
      top="0"
      :modal-append-to-body="false"
      :append-to-body="false"
      :modal="!inDrawer"
      :close-on-click-modal="false"
      custom-class="custom-dialog-comment audit-dialog">
      <div v-loading="isLoading">
        <div class="title_tip">
          <template v-if="comment === 'countersign'">
            <vuedraggable :disabled="temp.audit_type !== 'zjsh'"  class="wrapper" v-model="countersignAuditorTags" style="display: block;width: 100%;max-height: 192px;overflow-y: auto">
              <transition-group>
                <el-tag class="error" v-for="(countersignAuditorTag, index) in countersignAuditorTags" :key="countersignAuditorTag.userid" closable @close="deleteAuditor(countersignAuditorTag)">
                  <el-avatar v-if="countersignAuditorTag.avatar_url !== ''" style="line-height:22px;width:22px;height:22px" :src="countersignAuditorTag.avatar_url"> </el-avatar>
                  <el-avatar v-else :style="`background:#4A5C9B;line-height:22px;width:22px;height:22px`" v-html="countersignAuditorTag.name.substring(0,1)"> </el-avatar>
                  <span class="el-tag-text" :title="countersignAuditorTag.name">
                    <span v-if="temp.audit_type === 'zjsh'">
                      <template v-if="$i18n.locale === 'en-us'">{{$t('common.detail.countersign.level')}}{{index + 1}} {{ countersignAuditorTag.name }}</template>
                      <template v-else>{{index + 1}}{{$t('common.detail.countersign.level')}} {{ countersignAuditorTag.name }}</template>
                     </span>
                    <span v-else>
                      {{ countersignAuditorTag.name }}
                    </span>
                  </span>
                </el-tag>
              </transition-group>
            </vuedraggable>
            <el-button size="mini" icon="el-icon-plus" class="as-btn" @click="chooseAuditor">{{ $t('common.detail.operation.add') }}</el-button>
          </template>
          <template v-else-if="comment === 'transfer'">
            <div style="width: 100%">
                <el-tag
                    v-for="transferAuditor in transferAuditors"
                    :key="transferAuditor.userid"
                    closable
                    @close="deleteAuditor(transferAuditor)"
                    disable-transitions="true"
                >
                    <el-avatar
                        v-if="transferAuditor.avatar_url !== ''"
                        style="line-height: 22px; width: 22px; height: 22px"
                        :src="transferAuditor.avatar_url"
                    >
                    </el-avatar>
                    <el-avatar
                        v-else
                        class="default-avatar avatar-empty"
                        style="background:#4A5C9B;"
                        :data-name="transferAuditor.name.substring(0, 1)"
                    >
                    </el-avatar>
                    <span class="el-tag-text" :title="transferAuditor.name">
                        {{ transferAuditor.name }}
                    </span>
                </el-tag>
            </div>
            <div v-if="transferAuditors.length === 0">
              <el-button size="mini" icon="el-icon-plus" class="as-btn" @click="chooseAuditor">{{ $t('common.detail.operation.add') }}</el-button>
            </div>
          </template>
          <div v-else-if="comment === 'sendback'" class="sendback-description">
            <span :class="isCommentRequired?'required':''">{{$t('common.detail.sendback.applyUser')}}</span>
            <el-tag
              class="error"
              :disable-transitions="true"
            >
              <el-avatar
                v-if="apply_user_avatar_url && apply_user_avatar_url !== ''"
                class="default-avatar"
                :src="apply_user_avatar_url"
              >
              </el-avatar>
              <el-avatar
                v-else
                class="default-avatar avatar-empty"
                :data-name="temp.apply_user_name.substring(0, 1)"
                style="background:#4A5C9B;"
              >
              </el-avatar>
              <span class="el-tag-text" :title="temp.apply_user_name">
                {{ temp.apply_user_name }}
              </span>
            </el-tag>
            <span>{{$t('common.detail.sendback.reason')}}</span>
          </div>
          <template v-else>
            <span style="margin-bottom: 8px" :class="isCommentRequired?'required':''">{{ comment === 'pass' ? $t('common.detail.auditMsg.agree.yes') :  $t('common.detail.auditMsg.reject.no') }}</span>
          </template>
        </div>
        <div class="comment-content">
          <div class="comment-textarea">
            <el-popover
              placement="top"
              width="175"
              trigger="manual"
              :content="$t('common.detail.auditMsg.error')"
              popper-class="el-popover-red"
              v-model="showError">
              <el-input
                slot="reference"
                type="textarea"
                :rows="5"
                resize="none"
                class="custom-dialog-comment-input"
                :placeholder="defaultPlaceholder"
                style="width: 506px;height:109px;color: #000000"
                v-model="auditMsg"
                :maxlength="messageMaxLength"
                show-word-limit
              />
            </el-popover>
          </div>
        </div>
        <AttachmentFiles v-if="allowAttachmentFiles" :selectFileList.sync="selectFileList" />
      </div>
      <!-- 加签超出次数或人数提示  -->
      <span style="float: left; color: #F56C6C;line-height: 24px;padding-left: 32px;padding-top: 8px" v-if="showMaxAuditorErr">
          <template v-if="$i18n.locale === 'en-us'">{{$t('common.detail.countersign.maxUnitsA') }}{{ showMaxAuditor }}</template>
          <template v-else>{{$t('common.detail.countersign.maxAdd') }}{{ showMaxAuditor }}{{$t('common.detail.countersign.maxUnitsA') }}{{$t('common.detail.countersign.personnel') }}</template>
      </span>
      <span style="float: left; color: #F56C6C;line-height: 24px;padding-left: 32px;padding-top: 8px" v-if="showMaxCountErr && comment === 'countersign'">
          <template v-if="$i18n.locale === 'en-us'">{{$t('common.detail.countersign.maxUnitsCount') }}{{ showMaxCount }}{{$t('common.detail.countersign.personnel') }}</template>
          <template v-else>{{$t('common.detail.countersign.maxAdd') }}{{ showMaxCount }}{{$t('common.detail.countersign.maxUnitsCount') }}{{$t('common.detail.countersign.personnel') }}</template>
      </span>
      <span style="float: left; color: #F56C6C;line-height: 24px;padding-left: 32px;padding-top: 8px" v-if="showMaxCountErr && comment === 'transfer'">
          <template v-if="$i18n.locale === 'en-us'">{{$t('common.detail.countersign.maxUnitsCount') }}{{ showMaxCount }}{{$t('common.detail.transfer.personnel') }}</template>
          <template v-else>{{$t('common.detail.countersign.maxAdd') }}{{ showMaxCount }}{{$t('common.detail.countersign.maxUnitsCount') }}{{$t('common.detail.transfer.personnel') }}</template>
      </span>
      <span slot="footer">
        <el-button
            type="primary"
            class="as-btn"
            size="mini"
            :disabled="isSubmitDisable"
            @click="submitComment()"
            >{{ $t("common.detail.operation.sure") }}</el-button
        >
        <el-button size="mini" class="as-btn" @click="close()">{{
            $t("common.detail.operation.cancel")
        }}</el-button>
    </span>
    </el-dialog>
  </div>
</template>

<script>
import {countersign, transferAudit,  countersignLogs} from '@/api/audit'
import {fecthLog} from '@/api/workflow'
import vuedraggable from 'vuedraggable'
import AttachmentFiles from "./attachmentFiles"
import {getUserImagesList, getUserInfo} from '@/api/anyshareOpenApi'

export default {
  name: 'auditComment',
  props: {
    temp: {
      type: Object,
      required: true
    },
    inDrawer:{
      type:Boolean,
      default:false
    }
  },
  components: { vuedraggable, AttachmentFiles },
  data () {
    return {
      comment: '',
      isLoading: false,
      // currentUserId: '',
      apply_user_avatar_url:'',
      disabledSubmit: false,
      commentVisible: false,
      showError: false,
      logs:[],
      countersignAuditorTags: [],
      transferAuditors: [],
      selectFileList:[],
      showMaxAuditorErr: false,
      showMaxAuditor: 0,
      showMaxCountErr: false,
      showMaxCount: 0,
      curentActDefKey: '',
      isCommentRequired: false,
      auditMsg: ''
    }
  },
  computed:{
    defaultPlaceholder(){
      switch(this.comment){
        case "transfer": return this.$t('common.detail.operation.transferPlaceholder')
        case "countersign": return this.$t('common.detail.operation.countersignPlaceholder')
        case "sendback": {
          if(this.isCommentRequired) {
            return this.$t('common.detail.operation.sendbackRequiredPlaceholder')
          }
          return this.$t('common.detail.operation.sendbackPlaceholder')
        }
        default :{
          if(this.isCommentRequired) {
            return this.$t('common.detail.operation.requiredPlaceholder')
          }
           return this.$t('common.detail.operation.placeholder')
        }
      }
    },
    messageMaxLength(){
      switch(this.comment){
        case "pass":
        case "reject":
          return 500
        default: 
          return 300
      }
    },
    allowAttachmentFiles(){
      if(this.$store.state.app.microWidgetProps 
      && this.$store.state.app.microWidgetProps.contextMenu 
      && this.$store.state.app.microWidgetProps.contextMenu.selectFn) {
        if(this.comment==='pass' || this.comment==='reject' || this.comment==='sendback') {
          return true
        }
      }
      return false
    },
    isSubmitDisable(){
      if(this.showError || this.disabledSubmit) {
        return true
      }
      if(this.comment === 'countersign' && this.countersignAuditorTags.length === 0) {
        return true
      }
      if(this.comment === 'transfer' && this.transferAuditors.length === 0) {
        return true
      }
      if(this.isCommentRequired && this.auditMsg.length === 0) {
        return true
      }
      return false
    }
  },
  methods: {
    openCommentDialog (comment, isCommentRequired=false, isLoading = false) {
      const _this = this
      this.countersignAuditorTags = []
      this.transferAuditors = []
      this.showMaxAuditorErr = false
      this.showMaxCountErr = false
      this.showMaxAuditor = 0
      this.showMaxCount = 0
      this.auditMsg = ''
      this.comment = comment
      this.selectFileList = []
      this.commentVisible = true
      if(isCommentRequired === true) {
        this.isCommentRequired = true
      }else {
         this.isCommentRequired = false
      }
      this.isLoading = isLoading
      // if(this.comment === 'transfer'){
      //   getUserInfo().then((res)=>{
      //     _this.currentUserId = res.data.userid
      //   }).catch(e => console.error(e))
      // }
      if(this.comment === 'sendback') {
        getUserImagesList([this.temp.apply_user_id]).then(res=>{
          if(res.data[0] && res.data[0].avatar_url) {
            this.apply_user_avatar_url = res.data[0].avatar_url
          }
        }).catch(err=>{ console.error(err) })
      }
    },
    async submitComment(){
      if(this.isLoading) {
        return
      }
      const _this = this
      _this.disabledSubmit = true
      // 加签
      if(_this.comment === 'countersign'){
        _this.checkCountersign().then(res => {
          if(res){
            let countersignAuditors = _this.countersignAuditorTags.map(item => item.userid)
            countersign(_this.temp.biz_id, { task_id: _this.temp.task_id, reason: _this.auditMsg, audit_model: _this.temp.audit_type, auditors: countersignAuditors }).then(res => {
              _this.$emit('auditResult')
              _this.commentVisible = false
              _this.disabledSubmit = false
            }).catch((error) => {
              _this.disabledSubmit = false
              // 此条记录已失效或已被其他审核员审核完成。
              if (error.response.data.code === 401001101) {
                _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('message.taskNotPrem'), _this.$t('message.confirm'), function () {
                  _this.$emit('auditResult')
                  _this.commentVisible = false
                })
              // 超过加签最大次数
              } else if (error.response.data.code === 500001103) {
                _this.$dialog_error(_this.$t('message.title'), _this.$t('common.detail.countersign.maxAddErrCount'), _this.$t('message.confirm'))
              // 存在重复加签的用户
              } else if (error.response.data.code === 500001104) {
                _this.$dialog_error(_this.$t('message.title'), _this.$t('common.detail.countersign.addErrRepeat'), _this.$t('message.confirm'))
              // 存在已被删除的用户
              } else if (error.response.data.code === 400019001) {
                _this.$dialog_error(_this.$t('message.title'), _this.$t('common.detail.countersign.addErrNotFound'), _this.$t('message.confirm'))
              // xxx已审核过此申请，无法再次添加
              } else if (error.response.data.code === 500001105) {
                let approvedUserNames = ''
                const intervalSymbol = this.$i18n.locale === 'en-us' ? ',' : '、'
                _this.countersignAuditorTags.forEach(e => {
                  if(error.response.data.detail.indexOf(e.userid) !== -1){
                    approvedUserNames = approvedUserNames === '' ? e.name : approvedUserNames + intervalSymbol + e.name
                  }
                })
                if(this.$i18n.locale === 'en-us'){
                  _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), 'This approval has already been processed by ' + approvedUserNames + '. You cannot add them again.', _this.$t('message.confirm'))
                } else {
                  _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), approvedUserNames +  _this.$t('message.countersignApprovedError'), _this.$t('message.confirm'))
                }
              } else if(error.response.data.code === 400 || error.response.data.code === 400057001) {
                _this.$dialog_alert(_this.$t('message.title'), _this.$t('invalidParams'), _this.$t('message.confirm'))
              }
            })
          }
        })
      // 转审
      } else if(_this.comment === 'transfer'){
        try {
          // 校验
          const isValid = await _this.checkTransfer()
          if(!isValid){
            return
          }
          // 保存转审变更
          await transferAudit(_this.temp.biz_id, { reason: _this.auditMsg, auditor: _this.transferAuditors[0].userid })
          _this.$toast('success', _this.$t('common.detail.transfer.success'))
          // 刷新列表
          _this.$emit('auditResult')
          _this.commentVisible = false
        } catch (error) {
          const refresh = () => {
            _this.$emit('auditResult')
            _this.commentVisible = false
          }
          // 已达到最大转审次数
          if (error.response.data.code === 403057009) {
            _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('common.detail.transfer.overLimit'), _this.$t('message.confirm'), refresh)
          }
          // 转审用户不存在
          if (error.response.data.code === 400019001) {
            _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('common.detail.transfer.usersNotFound'), _this.$t('message.confirm'))
          }
          // 非法转审，指定已转审用户
          if (error.response.data.code === 403057006) {
            _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('common.detail.transfer.hasTransferUser'), _this.$t('message.confirm'))
          }
          // 非法转审，指定同级审核员
          if (error.response.data.code === 403057008) {
            _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('common.detail.auditMsg.transferErrorTip'), _this.$t('message.confirm'))
          }
          // 此条记录已失效或已被其他审核员审核完成
          if (error.response.data.code === 401001101 || error.response.data.code === 403057004) {
            _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('message.taskNotPrem'), _this.$t('message.confirm'), refresh)
          }
          // xxx已审核过此申请，无法再次添加
          if (error.response.data.code === 403057010) {
            let approvedUserNames = _this.transferAuditors[0].name
            if(this.$i18n.locale === 'en-us'){
              _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), 'This approval has already been processed by ' + approvedUserNames + '. You cannot add them again.', _this.$t('message.confirm'))
            } else {
              _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), approvedUserNames +  _this.$t('message.countersignApprovedError'), _this.$t('message.confirm'))
            }
          } 
          if (error.response.data.code === 400  || error.response.data.code === 400057001) {
            _this.$dialog_alert(_this.$t('message.title'), _this.$t('invalidParams'), _this.$t('message.confirm'))
          }
        } finally {
          _this.disabledSubmit = false
        }
      }
      // 同意或拒绝
      else {
        // let result = _this.comment === 'pass' ? true : false
        _this.$emit('callbackSubmit', _this.comment, _this.auditMsg, _this.selectFileList)
        // _this.commentVisible = false
        _this.disabledSubmit = false
      }
    },
    /**
     * 获取加签/转审 当前环节所有审核员id
     */
    getAuditorIds(){
      const _this = this
      return new Promise(function (resolve, reject) {
        fecthLog(_this.temp.proc_inst_id).then(res => {
          let procLogs = res.data
          _this.logs = procLogs
          let auditorIds = []
          procLogs.forEach(e => {
            if(e.act_status === '1'){
              e.auditor_logs.forEach(subArr => {
                subArr.forEach(subAuditor => {
                  auditorIds.push(subAuditor.auditor)
                })
              })
              // 设置当前加签的环节
              _this.curentActDefKey = e.act_def_key
            }
          })
          if(_this.temp.audit_type === 'zjsh'){
            _this.temp.auditors.forEach(item => {
              auditorIds.push(item.id)
            })
            auditorIds = _this.$utils.uniq(auditorIds)
          }
          resolve(auditorIds)
        })
      })

    },
    /**
       * 根据名字提取颜色
       * @param name 名字
       */
    // extractColorByName(name){
    //   let temp = []
    //   temp.push('#')
    //   for (let index = 0; index < name.length; index++) {
    //     let charLength = name[index].charCodeAt(0) < 135 ? name[index].charCodeAt(0) + 75000 : name[index].charCodeAt(0)
    //     temp.push(parseInt(charLength, 10).toString(16))
    //   }
    //   return temp.slice(0, 5).join('').slice(0, 4)
    // },
    checkCountersign(){
      const _this = this
      return new Promise(function (resolve, reject) {
        _this.getAuditorIds().then(res => {
          // 是否包含当前环节已有审核员
          let hasExistUser = false
          let hasApplyUser = false
          _this.countersignAuditorTags.forEach(chooseUser => {
            if(chooseUser.userid === _this.temp.apply_user_id){
              hasApplyUser = true
            }
            let existUserArr = res.filter(e => e === chooseUser.userid)
            if(existUserArr.length > 0){
              hasExistUser = true
            }
          })
          if(hasExistUser){
            _this.$toast('info', _this.$t('common.detail.auditMsg.countersignErrorTip'))
            resolve(false)
          }
          if(hasApplyUser){
            _this.$toast('info', _this.$t('common.detail.auditMsg.countersignApplyUserErrorTip'))
            resolve(false)
          }
          // 判断是否超出加签限制
          countersignLogs(_this.temp.proc_inst_id).then(res => {
            if(_this.temp.customDescription){
              let maxAuditors = _this.temp.customDescription.max_auditors
              let maxCount = _this.temp.customDescription.max_count
              let curentActCountersignArr = res.data.filter(item => item.taskDefKey === _this.curentActDefKey)
              if(curentActCountersignArr.length > 0 && parseInt(maxCount) === parseInt(curentActCountersignArr[0].batch)){
                _this.showMaxCount = maxCount
                _this.showMaxCountErr = true
                resolve(false)
              } else if(_this.countersignAuditorTags.length > parseInt(maxAuditors - curentActCountersignArr.length)){
                _this.showMaxAuditor = parseInt(maxAuditors - curentActCountersignArr.length)
                _this.showMaxAuditorErr = true
                resolve(false)
              }
              resolve(true)
            } else {
              resolve(false)
            }
          })
        })
      })
    },
    async checkTransfer(){
      const _this = this
      try {
        const allAuditors = await _this.getAuditorIds()
        let hasExistUser = false
        let hasApplyUser = false
        _this.transferAuditors.forEach(chooseUser => {
          if(chooseUser.userid === _this.temp.apply_user_id){
            hasApplyUser = true
          }
          let existUserArr = allAuditors.filter(e => e === chooseUser.userid)
          if(existUserArr.length > 0){
            hasExistUser = true
          }
        })
        if(hasExistUser){
          _this.$toast('info', _this.$t('common.detail.auditMsg.transferErrorTip'))
          return false
        }
        if(hasApplyUser){
          _this.$toast('info', _this.$t('common.detail.auditMsg.transferApplyUserErrorTip'))
          return false
        }
        if(_this.logs && _this.temp.customDescription.transfer){
          const maxCount = Number(_this.temp.customDescription.transfer.maxCount)
          const curentArr = _this.logs.filter(item => item.taskDefKey === _this.curentActDefKey)
          if(curentArr.transfer_logs && curentArr.transfer_logs.length > 0 && curentArr.transfer_logs.length >= maxCount){
            _this.showMaxCount = maxCount
            _this.showMaxCountErr = true
            return false
          }else {
            return true
          }
        }
        return false
      } catch (error) {
        return false
      }
    },

    // 处理选择的用户，进行验证和添加到列表
    processSelectedUsers(userArr, type) {
      const _this = this
      let hasExistUser = false
      let hasApplyUser = false
      let chooseAuditResult = []
      let allTransferAuditLogs = []
      // 是否有已转审用户
      let hasPreTransfer = false
      
      _this.getAuditorIds().then(res => {
        if(_this.comment === "transfer") {
          _this.logs.forEach((log)=>{
            if(log.transfer_logs && log.transfer_logs.length) {
              allTransferAuditLogs = allTransferAuditLogs.concat(log.transfer_logs)
            }
          })
        }
        userArr.forEach(chooseUser => {
          let isLegal = true
          // 从用户组选择的人员
          if(chooseUser.sel_type){
            if(chooseUser.sel_type !== 'user'){
              return
            }
            chooseUser['userid'] = chooseUser.id
          }
          // 判断是否为发起人
          if(chooseUser.userid === _this.temp.apply_user_id){
            hasApplyUser = true
            isLegal = false
          }
          // 判断是否环节已有审核员
          let existUserArr = res.filter(e => e === chooseUser.userid)
          if(existUserArr.length > 0){
            hasExistUser = true
            isLegal = false
          }
          // 不允许将申请转审给已转审的用户
          if(_this.comment === "transfer"){
            allTransferAuditLogs.forEach((item)=>{
              if(item.transfer_by === chooseUser.userid
                // && item.transfer_auditor === _this.currentUserId
                ) {
                hasPreTransfer = true
                isLegal = false
              }
            })
          }
          if(isLegal){
            chooseAuditResult.push(chooseUser)
          }
        })
        if(hasExistUser){
          _this.$toast('info', type === "transfer" ? _this.$t('common.detail.auditMsg.transferErrorTip') : _this.$t('common.detail.auditMsg.countersignErrorTip'))
        } else if(hasApplyUser){
          _this.$toast('info', type === "transfer" ? _this.$t('common.detail.auditMsg.transferApplyUserErrorTip') : _this.$t('common.detail.auditMsg.countersignApplyUserErrorTip'))
        } else if(hasPreTransfer) {
          _this.$toast('info', _this.$t('common.detail.transfer.hasTransferUser'))
        }
        let auditorIds = chooseAuditResult.map(item => item.userid)
        getUserImagesList(auditorIds).then(res=>{
          chooseAuditResult.forEach(chooseUser => {
            let userArr = res.data.filter(item => item.id === chooseUser.userid)
            chooseUser['avatar_url'] = userArr.length > 0 ? userArr[0]['avatar_url'] : ''
            const selectedAuditors = type === "transfer" ? _this.transferAuditors : _this.countersignAuditorTags
            // 不重复则加到已选
            let existArr = selectedAuditors.filter(item => item.userid === chooseUser.userid)
            if(existArr.length === 0){
              selectedAuditors.push(chooseUser)
            }
          })
        }).catch(err =>{
          console.error(err)
        })
      })
    },

    chooseAuditor(){
      const type = this.comment
      const _this = this
      const params = {
        functionid: 'chooseAuditor',
        title: type === "transfer" ? _this.$t('common.detail.transfer.select'): _this.$t('common.detail.operation.countersign'),
        selectPermission: 2,
        groupOptions: {
          select:3,
          drillDown:1
        },
        multiple: type === "transfer" ? false : true,
        // 不支持选择用户本人
        isSelectOwn:false,
        selectedVisitorsCustomLabel: _this.$t('common.detail.operation.selected')
      }
      const { systemType } = this.$store.state.app.context || ''
      if(systemType && systemType === 'adp') {
          // ADP的选择用户插件
          const accessorPicker = _this.$store.state.app.microWidgetProps.contextMenu.addAccessorFn.mountComponent(
          _this.$store.state.app.microWidgetProps.contextMenu.components.AccessorPicker,
          {
            range: ["user"],
            tabs: ['organization'],
            title: type === "transfer" ? _this.$t('common.detail.transfer.select'): _this.$t('common.detail.operation.countersign'),
            isAdmin: false,
            isSelectOwn: false,
            multiple: type === "transfer" ? false : true,
            // role: roleType,
            onSelect: (selections) => {
              let userArr = type === "transfer" ? [selections[0]] : selections
              _this.processSelectedUsers(userArr, type)
              accessorPicker();
            },
            onCancel: () => {
              accessorPicker();
            },
          },
          document.createElement('div')
        );
      } else {
        // AS和AF的选择用户插件
        _this.$store.state.app.microWidgetProps.contextMenu.addAccessorFn(params).then(res => {
          let userArr = res
          _this.processSelectedUsers(userArr, type)
        }).catch((e) => {
          console.error(e)
        })
      }
    },
    deleteAuditor(item){
      const _this = this
      const selectedAuditors = _this.comment === "transfer" ? _this.transferAuditors : _this.countersignAuditorTags
      selectedAuditors.splice(
        selectedAuditors.findIndex((data) => item.userid === data.userid),
        1,
      )
      _this.showMaxAuditorErr = false
      _this.showMaxCountErr = false
      _this.disabledSubmit = false
    },
    close () {
      this.auditMsg = ''
      this.commentVisible = false
    }
  }
}
</script>

<style scoped>
.required {
  position: relative;
}
.required::before {
  position: absolute;
  left: -10px;
  top: 4px;
  display: inline-block;
  color: rgb(255, 77, 79);
  font-size: 13px;
  font-family: inherit;
  line-height: 1;
  content: "*";
}
.default-avatar {
  margin-right: 8px;
  line-height: 22px;
  width: 22px;
  height: 22px;
}
.avatar-empty::after {
  content: attr(data-name);
  font-size: 14px;
}
.el-dialog__wrapper >>> .el-dialog {
  top: 50%;
  transform: translateY(-50%);
}
@media screen and (max-height:360px) {
  .el-dialog__wrapper >>> .el-dialog {
    top: 0;
    transform: translateY(0);
    margin-top: 10vh !important;
  }
}
/* 弹窗遮罩不遮挡toast */
#app .btn-footer .btnfoot~div >>> .el-dialog__wrapper+.v-modal {
  z-index: 10 !important;
}
#app .btn-footer .btnfoot~div >>> .el-dialog__wrapper {
  z-index: 100 !important;
}
</style>

<style>
.audit-dialog .el-dialog__header {
  padding: 16px 0 16px 32px;
  height: auto;
}
.audit-dialog .el-textarea__inner {
  padding: 5px 8px;
}
.audit-dialog .comment-textarea .el-textarea .el-input__count {
  padding: 0 8px;
}

.sendback-description {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.title_tip .sendback-description .el-tag {
  margin-bottom: 0;
  margin-left: 10px;
}
</style>
