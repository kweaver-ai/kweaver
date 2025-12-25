<!-- 任务催办弹窗-->
<template>
  <div>
    <el-dialog
      :title="$t('common.detail.operation.remind')"
      :visible.sync="isDialogVisible"
      :before-close="close"
      width="570px"
      top="0"
      :modal-append-to-body="false"
      :append-to-body="false"
      :modal="!inDrawer"
      :close-on-click-modal="false"
      custom-class="custom-dialog-comment remind-dialog"
    >
      <div>
        <div class="remind-label">
          {{ $t('common.detail.remind.user') }}
        </div>
        <div
          class="remind-title-tip title_tip"
          style="display: block;width: 100%;"
        >
          <template v-if="temp.audit_type === 'tjsh'">
            <el-dropdown
              placement="bottom"
              v-on:command="handleSelectUser"
              v-on:visible-change="handleDropdownVisibleChange"
              trigger="click"
              :hide-on-click="false"
              style="width:100%"
            >
              <div class="custom-user-input">
                <div v-if="selectedAuditors.length > 0" class="tag-wrapper">
                  <el-tag
                    class="error"
                    v-for="auditor in selectedAuditors"
                    :key="auditor.id"
                    :disable-transitions="true"
                    closable
                    @close="deleteUser(auditor)"
                  >
                    <el-avatar
                      v-if="auditor.avatar_url && auditor.avatar_url !== ''"
                      class="default-avatar"
                      :src="auditor.avatar_url"
                    >
                    </el-avatar>
                    <el-avatar
                      v-else
                      class="default-avatar avatar-empty"
                      :data-name="auditor.name.substring(0, 1)"
                      style="background:#4A5C9B;"
                    >
                    </el-avatar>
                    <span class="el-tag-text" :title="auditor.name">
                      {{ auditor.name }}
                    </span>
                  </el-tag>
                </div>
                <template v-else>
                  <div class="custom-user-input-placeholder">
                    {{ $t('common.detail.remind.selectPlaceholder') }}
                  </div>
                </template>
                <div class="arrow-wrapper">
                  <i
                    v-if="dropdownOpen"
                    class="el-icon-arrow-up custom-user-input-arrow"
                  ></i>
                  <i
                    v-else
                    class="el-icon-arrow-down custom-user-input-arrow"
                  ></i>
                </div>
              </div>
              <el-dropdown-menu
                slot="dropdown"
                v-bind:append-to-body="false"
                class="custom-user-input-select"
              >
                <el-dropdown-item
                  v-for="auditor in optionalAuditors"
                  :key="auditor.id"
                  :command="auditor"
                  :class="{
                    'remind-user-selected':
                      auditor.select && auditor.select === true
                  }"
                >
                  <el-avatar
                    v-if="auditor.avatar_url && auditor.avatar_url !== ''"
                    class="default-avatar"
                    :src="auditor.avatar_url"
                  >
                  </el-avatar>
                  <el-avatar
                    v-else
                    class="default-avatar avatar-empty"
                    :data-name="auditor.name.substring(0, 1)"
                    style="background:#4A5C9B;"
                  >
                  </el-avatar>
                  <span class="custom-user-input-text" :title="auditor.name">
                    {{ auditor.name }}
                  </span>
                  <i
                    v-show="auditor.select"
                    class="el-icon-check selected-icon"
                  ></i>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
          <template v-else>
            <div
              style="width: 100%; display:flex;max-height: 192px;overflow-y: auto"
            >
              <el-tag
                class="error"
                v-for="auditor in selectedAuditors"
                :key="auditor.id"
                disable-transitions="true"
              >
                <el-avatar
                  v-if="auditor.avatar_url && auditor.avatar_url !== ''"
                  class="default-avatar"
                  :src="auditor.avatar_url"
                >
                </el-avatar>
                <el-avatar
                  v-else
                  class="default-avatar avatar-empty"
                  :data-name="auditor.name.substring(0, 1)"
                  style="background:#4A5C9B;"
                >
                </el-avatar>
                <span class="el-tag-text" :title="auditor.name">
                  {{ auditor.name }}
                </span>
              </el-tag>
            </div>
          </template>
        </div>
        <div
          v-if="selectedAuditors.length === 0 && !dropdownOpen"
          class="error-tip"
        >
          {{ $t('common.detail.remind.selectEmpty') }}
        </div>
        <div class="remind-label remind-label-top">
          {{ $t('common.detail.remind.comment') }}
        </div>
        <div class="comment-content">
          <div class="comment-textarea">
            <el-input
              slot="reference"
              type="textarea"
              :rows="5"
              resize="none"
              class="custom-dialog-comment-input"
              :placeholder="$t('common.detail.operation.remindPlaceholder')"
              style="width: 506px;height:109px;color: #000000"
              v-model="reminderMsg"
              maxlength="300"
              show-word-limit
            />
          </div>
        </div>
      </div>
      <span slot="footer">
        <el-button
          type="primary"
          class="as-btn"
          size="mini"
          :disabled="selectedAuditors.length === 0 || disabledSubmit"
          @click="handleConfirm()"
        >
          {{ $t('common.detail.operation.sure') }}
        </el-button>
        <el-button size="mini" class="as-btn" @click="close()">
          {{ $t('common.detail.operation.cancel') }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getUserImagesList } from '@/api/anyshareOpenApi'
import { remindAuditors, getAuditLogs } from '@/api/audit'
import { fecthLog } from '@/api/workflow'

export default {
  name: 'reminder',
  props: {
    temp: {
      type: Object,
      default: {}
    },
    logs: {
      type: Array,
      required: false
    },
    inDrawer: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isDialogVisible: false,
      disabledSubmit: false,
      hasChange: false,
      reminderMsg: '',
      optionalAuditors: [],
      selectedAuditors: [],
      dropdownOpen: false
    }
  },

  methods: {
    async openDialog() {
      this.isDialogVisible = true
      this.dropdownOpen = false
      this.hasChange = false
      this.reminderMsg = ''
      let auditors = this.temp.auditors
      let changeFlag = false
      try {
        // 会签存在加签时特殊处理，从logs获取加签用户
        if (this.temp.audit_type === 'hqsh') {
          const res = await fecthLog(this.temp.proc_inst_id)
          const procLogs = res.data
          let newAuditors = []
          procLogs.forEach(e => {
            if (e.act_status === '1') {
              e.auditor_logs.forEach(subArr => {
                subArr.forEach(subAuditor => {
                  newAuditors.push({
                    id: subAuditor.auditor,
                    name: subAuditor.auditor_name,
                    status:
                      subAuditor.audit_status == null
                        ? 'pending'
                        : subAuditor.audit_status
                  })
                })
              })
            }
          })
          auditors = newAuditors
          
          let oldAuditors = []
          if(this.logs.length) {
            this.logs.forEach(e => {
              if (e.act_status === '1') {
                e.auditor_logs.forEach(subArr => {
                  subArr.forEach(subAuditor => {
                    oldAuditors.push({
                      id: subAuditor.auditor,
                      name: subAuditor.auditor_name,
                      status:
                        subAuditor.audit_status == null
                          ? 'pending'
                          : subAuditor.audit_status
                    })
                  })
                })
              }
            })
            if (newAuditors.length !== oldAuditors.length) {
              changeFlag = true
              this.hasChange = true
            } else {
              for (let i = 0; i < newAuditors.length; i += 1) {
                if (
                  newAuditors[i].id !== oldAuditors[i].id ||
                  newAuditors[i].status !== oldAuditors[i].status
                ) {
                  changeFlag = true
                  this.hasChange = true
                  break
                }
              }
            }
          }else {
            changeFlag = true
            this.hasChange = true
          }
        } else {
          const res = await getAuditLogs(
            this.applyId ? this.applyId : this.temp.biz_id
          )
          const newAuditors = res.data.auditors
          if (newAuditors.length !== auditors.length) {
            changeFlag = true
          } else {
            for (let i = 0; i < newAuditors.length; i += 1) {
              if (
                newAuditors[i].id !== auditors[i].id ||
                newAuditors[i].status !== auditors[i].status
              ) {
                changeFlag = true
                break
              }
            }
          }

          if (changeFlag) {
            this.hasChange = true
            auditors = newAuditors
          }
        }
      } catch (e) {
        console.error(e)
      }

      let pendingUsers = auditors.filter(item => item.status === 'pending')
      if (this.temp.audit_type === 'zjsh') {
        pendingUsers = [pendingUsers[0]]
      }
      let userList = pendingUsers
      try {
        const auditorIds = pendingUsers.map(item => item.id)
        const { data } = await getUserImagesList(auditorIds)
        let userImage = {}
        data.forEach(user => {
          userImage[user.id] = user.avatar_url
        })
        userList = pendingUsers.map(item => ({
          ...item,
          avatar_url: userImage[item.id] || ''
        }))
      } catch (error) {
        console.error(error)
      } finally {
        this.optionalAuditors = userList.map(item => ({
          ...item,
          select: true
        }))
        this.selectedAuditors = userList
      }
    },
    handleSelectUser(auditor) {
      const filterArr = this.selectedAuditors.filter(
        item => item.id !== auditor.id
      )
      const isSelected = filterArr.length === this.selectedAuditors.length - 1
      if (isSelected) {
        this.selectedAuditors = filterArr
      } else {
        this.selectedAuditors.push(auditor)
      }
      this.toggleSelectStatus(auditor.id)
    },
    deleteUser(auditor) {
      const filterArr = this.selectedAuditors.filter(
        item => item.id !== auditor.id
      )
      this.selectedAuditors = filterArr
      this.toggleSelectStatus(auditor.id)
    },
    toggleSelectStatus(id) {
      this.optionalAuditors = this.optionalAuditors.map(item => {
        if (item.id === id) {
          return { ...item, select: !item.select }
        }
        return item
      })
    },
    handleDropdownVisibleChange(visible) {
      this.dropdownOpen = visible
    },
    async handleConfirm() {
      const _this = this
      const auditors = this.selectedAuditors.map(item => item.id)
      const remark = this.reminderMsg
      const is_arbitrary = typeof _this.temp.applyId === 'string' ? true : false
      try {
        _this.disabledSubmit = true
        await remindAuditors(
          is_arbitrary ? _this.temp.applyId : _this.temp.id,
          { auditors, remark, is_arbitrary }
        )
        _this.$toast('success', _this.$t('common.detail.remind.successInfo'))
        _this.isDialogVisible = false
        if (_this.hasChange) {
          if (is_arbitrary) {
            _this.$emit('reload')
          } else {
            _this.$emit('auditResult')
          }
        }
      } catch (error) {
        let refresh
        if (_this.inDrawer) {
          refresh = () => _this.$emit('reloadFlowLog')
        } else {
          refresh = () => _this.$emit('auditResult')
        }
        if (error.response && error.response.data) {
          let closeTag = true
          switch (error.response.data.code) {
            // 催办用户已处理完此申请
            case 403057001:
            // 用户不在当前环节
            case 403057003:
            case 403057011:
              _this.$toast(
                'info',
                _this.$t('common.detail.remind.userProcessed')
              )
              refresh()
              break
            // 已发起过一次催办
            case 403057002:
              _this.$toast('info', _this.$t('common.detail.remind.waitInfo'))
              break
            // 此条记录已失效或已审核完成
            case 403057004:
              _this.$dialog_alert(
                _this.$t('common.detail.auditMsg.title'),
                _this.$t('common.detail.remind.taskProcessed'),
                _this.$t('message.confirm'),
                refresh
              )
              break
            case 400057001:
            case 400:
            _this.$dialog_alert(_this.$t('message.title'), _this.$t('invalidParams'), _this.$t('message.confirm'))
            closeTag = false
            break
          }
          if(closeTag) {
            _this.isDialogVisible = false
          }
        }
      } finally {
        this.disabledSubmit = false
      }
    },
    close() {
      const _this = this
      _this.isDialogVisible = false
      if (_this.hasChange) {
        const is_arbitrary =
          typeof _this.temp.applyId === 'string' ? true : false
        if (is_arbitrary) {
          _this.$emit('reload')
        } else {
          _this.$emit('auditResult')
        }
      }
    }
  }
}
</script>

<style scoped>
.remind-label {
  margin-left: 32px;
}

.remind-label-top {
  margin-top: 16px;
  margin-left: 32px;
}

.error-tip {
  margin-left: 32px;
  padding-top: 1px;
  font-size: 12px;
  min-height: 20px;
  line-height: 18px;
  color: #ff4d4f;
}

.el-dialog.custom-dialog-comment .remind-title-tip {
  margin: 0;
  padding: 8px 32px 0 32px;
}

.remind-title-tip.title_tip .el-tag {
  margin: 0px 10px 4px 0px;
}

.title_tip .el-tag .el-tag-text {
  max-width: 86px;
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

.custom-user-input {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  padding-top: 4px;
  margin: 0;
  border: 1px solid rgb(220, 223, 230);
  border-radius: 4px;
  width: 100%;
  min-height: 42px;
  overflow: auto;
  cursor: default;
}

.tag-wrapper {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding-right: 20px;
  max-height: 144px;
  max-width: 508px;
  overflow: auto;
}

.arrow-wrapper {
  position: relative;
  width: 0;
  height: auto;
}

.custom-user-input-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(145, 151, 166);
}

.custom-user-input-select {
  padding: 4px 0;
  border: 1px solid #e0e0e0;
  box-shadow: 0 0 8px 0 #e0e0e0;
  transform: translateY(-12px);
  max-height: 210px;
  overflow: auto;
}

.custom-user-input-select >>> .popper__arrow {
  display: none;
}

.custom-user-input-placeholder {
  width: 100%;
  padding-left: 8px;
  color: #c0c4cc;
  font-size: 13px;
  line-height: 30px;
}

.custom-user-input-select .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  color: #000;
  padding: 3px 8px;
  width: 508px;
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  overflow: hidden;
}

.custom-user-input-select .el-dropdown-menu__item:not(.is-disabled):hover {
  color: #000;
  background: rgb(244, 244, 247);
}

.custom-user-input-select .el-dropdown-menu__item:focus {
  color: #000;
  background: #fff;
}

.custom-user-input-select
  .remind-user-selected.el-dropdown-menu__item:not(.is-disabled) {
  position: relative;
  background: rgb(238, 247, 255);
}

.custom-user-input-select .custom-user-input-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
}

.selected-icon {
  font-size: 16px;
  position: absolute;
  right: 6px;
  top: 13px;
  color: rgb(18, 111, 227);
}

.el-dialog__wrapper >>> .el-dialog {
  top: calc(50% - 180px);
}
@media screen and (max-height: 360px) {
  .el-dialog__wrapper >>> .el-dialog {
    top: 0;
  }
}
/* 弹窗遮罩不遮挡toast */
#app .btn-footer .btnfoot ~ div >>> .el-dialog__wrapper + .v-modal {
  z-index: 10 !important;
}
#app .btn-footer .btnfoot ~ div >>> .el-dialog__wrapper {
  z-index: 100 !important;
}
</style>

<style>
.remind-dialog .el-dialog__header {
  padding: 16px 0 16px 32px;
  height: auto;
}
.remind-dialog .el-textarea__inner {
  padding: 5px 8px;
}
.remind-dialog .comment-textarea .el-textarea .el-input__count {
  padding: 0 8px;
}
</style>
