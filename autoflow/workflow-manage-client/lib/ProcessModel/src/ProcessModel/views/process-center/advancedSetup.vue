<!-- 流程中心，流程高级设置页面 -->
<template>
  <div class="gjsz-box">
    <div class="padding-bottom-10">
      <el-form
        label-position="left"
        hide-requied-aterisk
        label-width="0px"
        size="small"
      >
        <el-form-item>
          <label class="font-bold">{{
            $t('deptAuditorRule.advancedLabel1')
          }}</label>
          <div>
            <el-radio-group
              v-model="advancedSetup.repeat_audit_rule"
              @change="handleChange"
            >
              <p>
                <el-radio label="once">{{
                  $t('deptAuditorRule.advancedLabel2')
                }}</el-radio>
              </p>
              <p>
                <el-radio label="always">{{
                  $t('deptAuditorRule.advancedLabel3')
                }}</el-radio>
              </p>
            </el-radio-group>
          </div>
        </el-form-item>
        <div class="form-divider"></div>
        <el-form-item>
          <label class="font-bold">{{
            $t('deptAuditorRule.advancedLabel2_1')
          }}</label>
          <p>{{ $t('deptAuditorRule.advancedLabel2_2') }}</p>
          <div>
            <el-checkbox
              v-model="advancedSetup.perm_config.perm_switch"
              @change="handleChange"
            >
              <span>{{ $t('deptAuditorRule.advancedLabel2_3') }}</span>
            </el-checkbox>
            <el-select
              v-if="$i18n.locale !== 'en-us'"
              v-model="advancedSetup.perm_config.status"
              style="width: 110px; margin-left: 8px"
              @change="handleChange"
              :popper-append-to-body="false"
            >
              <el-option
                value="1"
                :label="$t('deptAuditorRule.advancedLabel2_pass')"
              ></el-option>
              <el-option
                value="2"
                :label="$t('deptAuditorRule.advancedLabel2_finish')"
              >
                <span>{{ $t('deptAuditorRule.advancedLabel2_finish') }}</span>
                <span style="color: #999">{{
                  $t('deptAuditorRule.advancedLabel2_finishDescription')
                }}</span>
              </el-option>
            </el-select>
            <el-select
              v-model="advancedSetup.perm_config.expired"
              style="width: 60px; margin: 0 8px"
              @change="handleChange"
              :popper-append-to-body="false"
            >
              <el-option value="7" label="7"></el-option>
              <el-option value="15" label="15"></el-option>
              <el-option value="30" label="30"></el-option>
            </el-select>
            <span>{{ $t('deptAuditorRule.advancedLabel2_4') }}</span>
            <el-select
              v-if="$i18n.locale === 'en-us'"
              v-model="advancedSetup.perm_config.status"
              style="margin-left: 8px"
              @change="handleChange"
              :popper-append-to-body="false"
            >
              <el-option
                value="1"
                :label="$t('deptAuditorRule.advancedLabel2_pass')"
              ></el-option>
              <el-option
                value="2"
                :label="$t('deptAuditorRule.advancedLabel2_finish')"
              >
                <span>{{ $t('deptAuditorRule.advancedLabel2_finish') }}</span>
                <span style="color: #999">{{
                  $t('deptAuditorRule.advancedLabel2_finishDescription')
                }}</span>
              </el-option>
            </el-select>
          </div>
        </el-form-item>
        <div class="form-divider"></div>
        <el-form-item>
          <label class="font-bold">{{
            $t('deptAuditorRule.advancedLabel_auditIdea')
          }}</label>
          <div>
            <el-checkbox
              v-model="advancedSetup.audit_idea_config.audit_idea_switch"
              @change="handleChange"
            >
              <span>{{ $t('deptAuditorRule.advancedLabel_auditIdea1') }}</span>
            </el-checkbox>
            <el-select
              v-model="advancedSetup.audit_idea_config.status"
              :style="'margin: 0 8px;'+ ($i18n.locale !== 'en-us'?'width: 110px; ':'')"
              @change="handleChange"
              :popper-append-to-body="false"
            >
              <el-option
                value="2"
                :label="$t('deptAuditorRule.advancedLabel2_finish')"
              >
                <span>{{ $t('deptAuditorRule.advancedLabel2_finish') }}</span>
                <span style="color: #999">{{
                  $t('deptAuditorRule.advancedLabel2_finishDescription')
                }}</span>
              </el-option>
              <el-option
                value="1"
                :label="$t('deptAuditorRule.advancedLabel_reject')"
              ></el-option>
            </el-select>
            <span>{{ $t('deptAuditorRule.advancedLabel_auditIdea2') }}</span>
          </div>
        </el-form-item>
        <div class="form-divider"></div>
        <!-- 审核超时设置 -->
        <el-form-item >
          <label class="font-bold">{{
            $t('deptAuditorRule.timeoutSetting')
          }}</label>
          <div>
            <el-checkbox
              v-model="advancedSetup.expire_reminder.reminder_switch"
              @change="handleChange"
            >
              <span>{{ $t('deptAuditorRule.timeoutSetting_setting') }}</span>
            </el-checkbox>
            <div v-if="advancedSetup.expire_reminder.reminder_switch">
              <span style="margin-left: 24px;">{{ $t('deptAuditorRule.timeoutSetting_setting1') }}</span>
              <el-input size="mini" style="margin: 0 8px;width: 60px;" 
                v-model="advancedSetup.expire_reminder.internal" 
                @input="handleReminderInput" 
                @blur="handleReminderBlur">
              </el-input>
              <span>{{ $t('deptAuditorRule.timeoutSetting_setting2') }}</span>
              <el-select
                v-model="advancedSetup.expire_reminder.frequency"
                :style="'margin: 0 8px;'+ ($i18n.locale !== 'en-us'?'width: 60px;':'width: 100px')"
                @change="handleChange"
                :popper-append-to-body="false"
              >
                <el-option
                  value="1"
                  :label="$t('deptAuditorRule.timeoutSetting_option1')"
                ></el-option>
                <el-option
                  value="2"
                  :label="$t('deptAuditorRule.timeoutSetting_option2')"
                ></el-option>
                <el-option
                  value="3"
                  :label="$t('deptAuditorRule.timeoutSetting_option3')"
                ></el-option>
                <el-option
                  value="7"
                  :label="$t('deptAuditorRule.timeoutSetting_option4')"
                ></el-option>
              </el-select>
            </div>
          </div>
        </el-form-item>
        <div class="form-divider"></div>
        <el-form-item :hidden="!allowEditPerm">
          <div class="setup-row">
            <span class="font-bold" style="flex-shrink: 0">{{
              $t('deptAuditorRule.editPerm')
            }}</span>
            <div class="setup-wrapper">
              <el-checkbox
                v-model="advancedSetup.edit_perm_switch"
                @change="handleChange"
              >
                <span class="label">{{
                  $t('deptAuditorRule.editPermLabel')
                }}</span>
              </el-checkbox>
              <div class="description">
                {{ $t('deptAuditorRule.editPermDescription') }}
              </div>
            </div>
          </div>
        </el-form-item>
        <div class="form-divider" :hidden="!allowEditPerm"></div>
      </el-form>
    </div>
  </div>
</template>
<script>
export default {
  name: 'AdvancedSetup',
  props: {
    process_obj: { type: Object, required: true }
  },
  data() {
    return {
      prevInternal:"7",
      advancedSetup: {
        repeat_audit_rule: 'once',
        edit_perm_switch: false,
        audit_idea_config: {
          audit_idea_switch: false,
          status: '2'
        },
        expire_reminder:{
          reminder_switch: false,
          internal: "7",
          frequency: "1"
        },
        perm_config: {
          perm_switch: true,
          status: '1',
          expired: '7'
        }
      }
    }
  },
  computed: {
    allowEditPerm() {
      return this.$store.state.app.advanceSetup.allowEditPerm
    }
  },
  created() {
    this.initrepeat_audit_rule()
  },
  methods: {
    initrepeat_audit_rule(setup) {
      let advancedSetup = this.process_obj.advancedSetup
      if (setup) {
        advancedSetup = setup
      }
      const _this = this
      if (advancedSetup) {
        _this.advancedSetup.repeat_audit_rule =
          advancedSetup.repeat_audit_rule || 'once'
        if (advancedSetup.perm_config) {
          if (typeof advancedSetup.perm_config.perm_switch === 'boolean') {
            _this.advancedSetup.perm_config.perm_switch =
              advancedSetup.perm_config.perm_switch
          }

          _this.advancedSetup.perm_config.status =
            advancedSetup.perm_config.status || '1'
          _this.advancedSetup.perm_config.expired =
            advancedSetup.perm_config.expired || '7'
        }
        if (advancedSetup.audit_idea_config) {
          _this.advancedSetup.audit_idea_config.audit_idea_switch =
            advancedSetup.audit_idea_config.audit_idea_switch
          _this.advancedSetup.audit_idea_config.status =
            advancedSetup.audit_idea_config.status
        }
        if (advancedSetup.expire_reminder && advancedSetup.expire_reminder.reminder_switch) {
          _this.advancedSetup.expire_reminder.reminder_switch =
            advancedSetup.expire_reminder.reminder_switch
          _this.advancedSetup.expire_reminder.internal =
            advancedSetup.expire_reminder.internal
          _this.advancedSetup.expire_reminder.frequency =
            advancedSetup.expire_reminder.frequency
        }
        if (typeof advancedSetup.edit_perm_switch === 'boolean') {
          _this.advancedSetup.edit_perm_switch = advancedSetup.edit_perm_switch
        }
      }

      this.$emit('saveAdvancedSetup', _this.advancedSetup)
    },
    handleChange() {
      this.$emit('change', true)
      this.$emit('saveAdvancedSetup', this.advancedSetup)
    },
    handleReminderInput(){
      this.advancedSetup.expire_reminder.internal = this.advancedSetup.expire_reminder.internal.replace(/\D|^0/g,'')
      if(Number(this.advancedSetup.expire_reminder.internal) > 999) {
        this.advancedSetup.expire_reminder.internal = this.prevInternal
      }
      this.prevInternal = this.advancedSetup.expire_reminder.internal
    },
    handleReminderBlur(){
      if(!this.advancedSetup.expire_reminder.internal) {
        this.advancedSetup.expire_reminder.internal = "7"
        this.prevInternal = this.advancedSetup.expire_reminder.internal
      }
    }
  }
}
</script>

<style scoped>
.form-divider {
  margin: 8px 0;
  height: 1px;
  width: calc(100% - 16px);
  background: #eee;
}

.setup-row {
  display: flex;
}

.setup-wrapper {
  display: flex;
  flex-direction: column;
  margin-left: 16px;
}

.label {
  color: #000;
}

.description {
  color: gray;
}

.gjsz-box >>> .el-checkbox__label {
  font-size: 13px;
}
</style>
