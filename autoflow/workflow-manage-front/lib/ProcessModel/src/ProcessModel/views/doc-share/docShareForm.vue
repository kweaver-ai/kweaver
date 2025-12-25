<template>
  <div class="gjsz-box">
    <div class="sh-list padding-bottom-10">
      <div class="check">
        <p class="title">{{ $t('modeler.automaticTips') }}:</p>
        <template v-if="shareType === 'realname'">
          <div>
            <el-checkbox
              v-model="renameCheckbox"
              size="small"
              class="check"
              @change="enabledChange"
              >{{
                $store.state.app.secret.status === 'y'
                  ? $t('modeler.secretRenameAudit')
                  : $t('modeler.renameAudit')
              }}</el-checkbox
            >
          </div>
          <div class="gray-text">
            {{
              $store.state.app.secret.status === 'y'
                ? $t('modeler.secretRenameCaution')
                : $t('modeler.renameCaution')
            }}
          </div>
        </template>
        <template v-else>
          <div>
            <el-checkbox
              v-model="anonymityCheckbox"
              size="small"
              class="check"
              @change="enabledChange"
            >
              {{ $t('modeler.anonymityAudit') }}
            </el-checkbox>
          </div>
          <div class="gray-text">{{ $t('modeler.anonymityCaution') }}</div>
        </template>
      </div>
    </div>
    <div class="sh-list padding-bottom-10">
      <div style="padding-top: 12px; padding-bottom: 11px">
        <el-checkbox
          v-model="countersignSwitch"
          true-label="Y"
          false-label="N"
          size="small"
          class="check"
          @change="countersignChange"
        >
          <span style="margin-left: -5px; font-size: 13px">
            {{ $t('countersign.shareRuleText') }}
          </span>
        </el-checkbox>
        <span style="margin-left: 5px; font-size: 13px">
          <span style="display: inline-block; position: relative">
            <el-input
              :disabled="countersignSwitch !== 'Y'"
              size="mini"
              style="width: 50px"
              :maxlength="2"
              v-model="countersignCount"
              @input="countersignCount = countersignCount.replace(/\D|^0/g, '')"
              @change="countersignChange"
            ></el-input>
            <span
              style="
                color: red;
                display: block;
                position: absolute;
                width: 150px;
                font-size: 13px;
              "
            >
              <span v-if="countersignSwitch === 'Y' && countersignCount > 10">{{
                $t('countersign.maxExceedCount')
              }}</span>
              <span v-if="countersignSwitch === 'Y' && countersignCount < 1">{{
                $t('countersign.notEmpty')
              }}</span>
            </span>
          </span>
          {{ $t('countersign.ruleText2') }}{{ $t('countersign.ruleText3') }}
          <span style="display: inline-block; position: relative">
            <el-input
              :disabled="countersignSwitch !== 'Y'"
              size="mini"
              style="width: 50px"
              :maxlength="2"
              v-model="countersignAuditors"
              @input="
                countersignAuditors = countersignAuditors.replace(/\D|^0/g, '')
              "
              @change="countersignChange"
            ></el-input>
            <span
              style="
                color: red;
                display: block;
                position: absolute;
                width: 150px;
                font-size: 13px;
              "
            >
              <span
                v-if="countersignSwitch === 'Y' && countersignAuditors > 10"
              >
                {{ $t('countersign.maxExceedAuditors') }}
              </span>
              <span v-if="countersignSwitch === 'Y' && countersignAuditors < 1">
                {{ $t('countersign.notEmpty') }}
              </span>
            </span>
          </span>
          {{ $t('countersign.ruleText4') }}
        </span>
      </div>
      <div class="gray-text" style="padding-top: 0px">
        {{ $t('countersign.tips') }}
      </div>
    </div>
    <!-- 转审配置 -->
    <div class="sh-list padding-bottom-10">
      <div style="padding-top: 12px; padding-bottom: 11px">
        <el-checkbox
          v-model="transferSwitch"
          true-label="Y"
          false-label="N"
          size="small"
          class="check"
          @change="transferChange"
        >
          <span style="margin-left: -5px; font-size: 13px">
            {{ $t('transfer.ruleText1') }}
          </span>
        </el-checkbox>
        <span style="margin-left: 5px; font-size: 13px">
          <span style="display: inline-block; position: relative">
            <el-input
              :disabled="transferSwitch !== 'Y'"
              size="mini"
              style="width: 50px"
              :maxlength="2"
              v-model="transferCount"
              @input="transferCount = transferCount.replace(/\D|^0/g, '')"
              @change="transferChange"
            ></el-input>
            <span
              style="
                color: red;
                display: block;
                position: absolute;
                width: 150px;
                font-size: 13px;
              "
            >
              <span v-if="transferSwitch === 'Y' && transferCount > 10">{{
                $t('transfer.maxExceedCount')
              }}</span>
              <span v-if="transferSwitch === 'Y' && transferCount < 1">{{
                $t('transfer.notEmpty')
              }}</span>
            </span>
          </span>
          {{ $t('transfer.ruleText2') }}
        </span>
      </div>
      <div class="gray-text" style="padding-top: 0px">
        {{ $t('transfer.tips') }}
      </div>
    </div>
    <div v-if="shareType === 'realname'" class="audit-subf">
      <free-audit ref="free" />
    </div>
  </div>
</template>

<script>
import {
  saveShareCountersignStrategy,
  getShareCountersignStrategy,
  setAdvanceConfig,
  getAdvanceConfig
} from '@/api/docShareStrategy'
import FreeAudit from '@/views/doc-share-audit/free-audit'
import debounce from '@/utils/debounce'

export default {
  name: 'docShareForm',
  components: { FreeAudit },
  props: {
    process_obj: { type: Object, required: true },
    shareType: {
      type: String,
      require: true
    }
  },
  data() {
    return {
      renameCheckbox: false,
      anonymityCheckbox: false,
      countersignSwitch: false,
      countersignCount: '1',
      countersignAuditors: '1',
      transferSwitch: false,
      transferCount: '1'
    }
  },
  created() {
    this.initCheckbox()
    this.getShareConfig()
  },
  methods: {
    initCheckbox() {
      const _this = this
      _this.renameCheckbox = false
      _this.anonymityCheckbox = false
      if (
        _this.shareType === 'realname' &&
        _this.process_obj.advancedSetup.rename_switch === 'y'
      ) {
        _this.renameCheckbox = true
      }
      if (
        _this.shareType === 'anonymity' &&
        _this.process_obj.advancedSetup.anonymity_switch === 'y'
      ) {
        _this.anonymityCheckbox = true
      }
    },
    enabledChange(val) {
      if (this.shareType === 'realname') {
        this.renameCheckbox = val
      } else {
        this.anonymityCheckbox = val
      }

      this.$emit('change', true)
      this.$emit('processSave')
    },
    getShareConfig() {
      const _this = this
      getAdvanceConfig(_this.process_obj.key).then((res) => {
        if (res) {
          _this.transferSwitch = res.transfer_switch
          _this.transferCount = res.transfer_count
          if (_this.countersignSwitch) {
            _this.countersignSwitch = res.countersign_switch
            _this.countersignCount = res.countersign_count
            _this.countersignAuditors = res.countersign_auditors
            // 兼容旧接口处理
          } else {
            getShareCountersignStrategy(_this.process_obj.key).then((res) => {
              if (res) {
                _this.countersignSwitch = res.countersign_switch
                _this.countersignCount = res.countersign_count
                _this.countersignAuditors = res.countersign_auditors
              }
            })
          }
        }
      }).catch((error)=>{
        console.error(error)
      })
    },
    countersignChange: debounce(function () {
      const _this = this
      _this.saveShareCountersign()
    }, 800),
    // 转审开关/次数配置
    transferChange: debounce(function () {
      const _this = this
      const params = {
        transfer_switch: _this.transferSwitch,
        transfer_count: _this.transferCount
      }
      try {
        if (
          _this.transferSwitch === 'Y' &&
          (_this.transferCount < 1 || _this.transferCount > 10)
        ) {
          return
        } else if (_this.transferCount < 1 || _this.transferCount > 10) {
          getAdvanceConfig(_this.process_obj.key).then((res) => {
            if (res) {
              params.transfer_count = res.transfer_count
              setAdvanceConfig(_this.process_obj.key, params)
            }
          })
        } else {
          setAdvanceConfig(_this.process_obj.key, params)
        }
      } catch (error) {
        console.error(error)
      }
    }, 800),

    saveShareCountersign() {
      const _this = this
      const params = {
        countersign_switch: _this.countersignSwitch,
        countersign_count: _this.countersignCount,
        countersign_auditors: _this.countersignAuditors
      }
      try {
        if (
          _this.countersignSwitch === 'Y' &&
          (_this.countersignCount < 1 ||
            _this.countersignCount > 10 ||
            _this.countersignAuditors < 1 ||
            _this.countersignAuditors > 10)
        ) {
          return
        } else if (
          _this.countersignCount < 1 ||
          _this.countersignCount > 10 ||
          _this.countersignAuditors < 1 ||
          _this.countersignAuditors > 10
        ) {
          getShareCountersignStrategy(_this.process_obj.key).then((res) => {
            if (res) {
              params.countersign_count = res.countersign_count
              params.countersign_auditors = res.countersign_auditors
              saveShareCountersignStrategy(params, _this.process_obj.key)
            }
          })
        } else {
          saveShareCountersignStrategy(params, _this.process_obj.key)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

<style lang="scss" scoped></style>
