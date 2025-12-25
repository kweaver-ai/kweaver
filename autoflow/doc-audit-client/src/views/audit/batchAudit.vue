<template>
  <div>
    <el-dialog
      :title="$t('common.handleAudit', { num: currentProgress })"
      :visible.sync="isDialogVisible"
      width="500px"
      top="20vh"
      :modal-append-to-body="false"
      :append-to-body="false"
      :close-on-click-modal="false"
      custom-class="custom-dialog-comment progress-dialog"
    >
      <div>
        <el-progress
          :percentage="currentProgress"
          :stroke-width="8"
          :show-text="false"
          :color="'#8BA7DD'"
        ></el-progress>
      </div>
    </el-dialog>
    <el-dialog
      :visible.sync="isMessageBoxVisible"
      :show-close="false"
      :modal-append-to-body="false"
      :append-to-body="false"
      :close-on-click-modal="false"
      width="420px"
      top="15vh"
      custom-class="message-dialog"
    >
      <div>
        <div class="messagebox-body">
          <span
            ><svg-icon icon-class="infoCircle" class="info-icon"> </svg-icon
          ></span>
          <span class="messagebox-title">
            {{ $t('message.title') }}
          </span>
          <div class="messagebox-message">
            {{ errorMessage }}
          </div>
        </div>
        <div class="messagebox-footer">
          <el-checkbox v-model="checked" size="medium">{{
            $t('common.noPrompt')
          }}</el-checkbox>
          <el-button
            slot="reference"
            style="margin-left: 8px"
            class="as-btn"
            type="primary"
            size="mini"
            @click="closeMessage"
          >
            {{ $t('common.detail.operation.sure') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
    <audit-comment
      ref="auditComment"
      :temp="temp"
      :inDrawer="false"
      @callbackSubmit="handleBatch"></audit-comment>
  </div>
</template>

<script>
import { fecthInfo, audit, fecthAuthority } from '@/api/audit'
import auditComment from './auditComment'
export default {
  name: 'batchAudit',
  components: { auditComment },
  props: {
    selectData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      mode: '',
      temp: {},
      isRequesting: false,
      checked: false,
      isDialogVisible: false,
      isMessageBoxVisible: false,
      currentProgress: 0.0,
      resolve: null,
      errorMessage: '',
      errorList: {},
      errorCode: ''
    }
  },
  methods: {
    async openDialog(mode) {
      this.currentProgress = 0.0
      this.isMessageBoxVisible = false
      this.errorList = {}
      this.temp = {}
      this.resolve = null
      this.mode = mode
      // 打开 审核意见窗口
      let isLoading = true
      this.$refs.auditComment.openCommentDialog(mode, false, isLoading)
      // 获取审核意见配置
      let isRequired = false
      try {
        const { data } = await fecthInfo(this.selectData.map((item) => item.id))
        if (data && data.length) {
          data.forEach((item) => {
            const config = item.strategy_configs
            if (
              config &&
              config.audit_idea_config &&
              config.audit_idea_config.audit_idea_switch === true
            ) {
              if (
                config.audit_idea_config.status === '2' ||
                (config.audit_idea_config.status === '1' && mode === 'reject')
              ) {
                isRequired = true
              }
            }
          })
        }
      } catch (error) {
        console.error(error.response)
      } finally {
        isLoading = false
      }
      this.$refs.auditComment.openCommentDialog(mode, isRequired, isLoading)
    },
    async handleBatch(comment, auditMsg, selectFile) {
      const auditIdea = comment === 'pass'

      if (this.isRequesting) {
        return
      }
      this.$refs.auditComment.close()
      this.isRequesting = true
      this.isDialogVisible = true
      const _this = this
      let errorNum = 0
      for (let i = 0; i < _this.selectData.length; i += 1) {
        _this.temp = _this.selectData[i]
        try {
          const { data } = await fecthInfo(_this.temp.id)
          _this.temp = Object.assign(_this.temp, data)
          // 已被处理.
          if (data.task_id === null) {
            const user = _this.$options.filters['formatApplyUserName'](
              _this.temp.apply_user_name
            )
            const apply =
              _this.$store.state.app.secret.status === 'y' &&
              ['realname', 'perm', 'owner', 'inherit'].includes(
                _this.temp.biz_type
              )
                ? _this.$t('common.detail.founding.batch.secretRealName')
                : ['realname', 'perm', 'owner', 'inherit'].includes(
                    _this.temp.biz_type
                  ) || _this.temp.biz_type === 'anonymous'
                ? _this.$t(
                    'common.detail.founding.batch.' + _this.temp.biz_type
                  )
                : _this.$t('common.detail.founding.batch.startTitle') +
                  _this.getBizType()
            const message = _this.$t('message.UndoFailedNotTaskDetail', {
              user,
              apply
            })
            await _this.confirmModal(message, 401001101)
          } else {
            await fecthAuthority({
              proc_inst_id: _this.temp.proc_inst_id,
              type: 'task'
            })
            let params = {
              id: _this.temp.id,
              task_id: data.task_id,
              audit_idea: auditIdea,
              audit_msg: auditMsg,
              attachments: selectFile.map((i) => i.docid)
            }
            await audit(params)
          }
        } catch (error) {
          errorNum += 1
          if (!navigator.onLine) {
            message = _this.$t('message.noNetwork')
            code = 'noNetwork'
            await _this.confirmModal(message, code)
          } else if (error.response && error.response.data) {
            if (error.response.status === 401) {
              console.error(error)
              continue
            }
            let message = error.response.data.message
            let code = error.response.data.code
            if (!navigator.onLine) {
              message = _this.$t('message.noNetwork')
              code = 'noNetwork'
            } else {
              switch (code) {
                case 400057001:
                  message = _this.$t('invalidParams')
                  break
                // 附件无下载权限
                case 403057012: {
                  if (error.response.data.detail.ids) {
                    const ids = res.response.data.detail.ids
                    const errFiles = selectFile
                      .filter((i) => ids.includes(i))
                      .map((i) => i.name)
                    message = _this.$t('message.fileNoDownloadPrem', {
                      name: errFiles.join('、')
                    })
                    break
                  }
                }
                // 附件不存在
                case 403057012: {
                  if (error.response.data.detail.ids) {
                    const ids = res.response.data.detail.ids
                    const errFiles = selectFile
                      .filter((i) => ids.includes(i))
                      .map((i) => i.name)
                    message = _this.$t('message.filesNotExist', {
                      name: errFiles.join('、')
                    })
                    break
                  }
                }

                case 401001101: {
                  const user = _this.$options.filters['formatApplyUserName'](
                    _this.temp.apply_user_name
                  )
                  const apply =
                    _this.$store.state.app.secret.status === 'y' &&
                    ['realname', 'perm', 'owner', 'inherit'].includes(
                      _this.temp.biz_type
                    )
                      ? _this.$t('common.detail.founding.batch.secretRealName')
                      : ['realname', 'perm', 'owner', 'inherit'].includes(
                          _this.temp.biz_type
                        ) || _this.temp.biz_type === 'anonymous'
                      ? _this.$t(
                          'common.detail.founding.batch.' + _this.temp.biz_type
                        )
                      : _this.$t('common.detail.founding.batch.startTitle') +
                        _this.getBizType()
                  message = _this.$t('message.UndoFailedNotTaskDetail', {
                    user,
                    apply
                  })
                  break
                }
                case 401001102: {
                  const user = _this.$options.filters['formatApplyUserName'](
                    _this.temp.apply_user_name
                  )
                  const apply =
                    _this.$store.state.app.secret.status === 'y' &&
                    ['realname', 'perm', 'owner', 'inherit'].includes(
                      _this.temp.biz_type
                    )
                      ? _this.$t('common.detail.founding.batch.secretRealName')
                      : ['realname', 'perm', 'owner', 'inherit'].includes(
                          _this.temp.biz_type
                        ) || _this.temp.biz_type === 'anonymous'
                      ? _this.$t(
                          'common.detail.founding.batch.' + _this.temp.biz_type
                        )
                      : _this.$t('common.detail.founding.batch.startTitle') +
                        _this.getBizType()
                  message = _this.$t('message.csfLevelDetail', {
                    user,
                    apply
                  })
                  break
                }
                case 400057002:
                  message = _this.$t('message.emptyIdea')
                  break
                case 401000001:
                  message = _this.$t('message.auditErrorMsgStrategy')
                  break
                case 401000002:
                case 401000003:
                  message = _this.$t('message.auditErrorMsgAuditor')
                  break
                case 401000004:
                  message = _this.$t('message.auditErrorMsgCsfLevel')
                  break
                case 500001101:
                  message = _this.$t('message.errorMsgNotFile')
                  break
                // 被禁用
                case 401001004:
                  message = _this.$t('message.forbidden')
                  break
                // 账号被冻结
                case 403001171:
                  message = _this.$t('message.frozen')
                  break
              }
              await _this.confirmModal(message, code)
            }
          } else {
            console.error(error)
          }
        } finally {
          _this.currentProgress = Number(
            (((i + 1) * 100) / _this.selectData.length).toFixed(2)
          )
          if (i === _this.selectData.length - 1) {
            if (errorNum < _this.selectData.length) {
              _this.$toast('success', _this.$t('message.batchHandle'))
            }
            _this.close()
          }
        }
      }
      this.isRequesting = false
    },
    async confirmModal(message, errorCode) {
      if (!this.errorList[String(errorCode)]) {
        return new Promise((resolve) => {
          this.errorCode = String(errorCode)
          this.resolve = resolve
          this.isMessageBoxVisible = true
          this.errorMessage = message
        })
      }
      return Promise.resolve()
    },
    close() {
      this.isDialogVisible = false
      this.isMessageBoxVisible = false
      // 刷新列表
      this.$emit('auditResult')
    },
    closeMessage() {
      this.isMessageBoxVisible = false
      this.errorList[this.errorCode] = this.checked
      this.checked = false
      if (this.resolve) {
        this.resolve()
      }
    }
  },
  computed: {
    getBizType() {
      return function () {
        const _this = this
        let arr = this.$store.getters.dictList.bizTypes.filter(
          (bizTypeItem) => bizTypeItem.value === _this.temp.biz_type
        )
        return arr.length > 0 ? arr[0].label : _this.temp.biz_type
      }
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
  }
}
</script>

<style>
.el-dialog.custom-dialog-comment.progress-dialog {
  min-height: 116px;
}

.progress-dialog .el-dialog__header {
  padding: 0 32px;
  height: 56px;
  line-height: 56px;
  white-space: nowrap;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
}

.progress-dialog .el-dialog__body {
  padding: 0 32px;
}

.message-dialog .el-dialog__header {
  border-bottom-color: transparent;
  height: 32px;
}

.message-dialog .messagebox-body {
  margin: 0 32px;
  flex-shrink: 0;
  flex-grow: 1;
  min-height: 84px;
}

.message-dialog .messagebox-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  line-height: 32px;
  padding: 32px 32px 20px;
  color: #000;
  font-size: 13px;
  background: #fff;
}

.message-dialog .messagebox-footer .el-checkbox__input + .el-checkbox__label {
  color: #000;
  padding-left: 8px;
}

.message-dialog
  .messagebox-footer
  .el-checkbox__input.is-checked
  .el-checkbox__inner {
  background-color: #8ba7dd;
  border-color: #8ba7dd;
}

.message-dialog .info-icon {
  color: #1890ff;
  font-size: 28px;
  margin-right: 16px;
  float: left;
}

.message-dialog .messagebox-title {
  font-size: 15px;
  font-weight: 700;
  color: #000;
  line-height: 28px;
  display: block;
  margin-left: 44px;
}

.message-dialog .messagebox-message {
  margin-left: 44px;
  margin-top: 8px;
  color: #000;
  word-wrap: break-word;
}
</style>
