<!-- 已废弃，使用docShareForm替换 -->
<template>
  <div class="gjsz-box">
    <div class="sh-list padding-bottom-10">
      <div class="check">
        <p class="title">{{ $t('modeler.automaticTips') }}:</p>
        <div>
          <el-checkbox v-model="anonymityCheckbox" size="small" class="check" @change="enabledChange">{{ $t('modeler.anonymityAudit') }}</el-checkbox>
        </div>
        <div class="gray-text">{{ $t('modeler.anonymityCaution') }}</div>
      </div>
    </div>
    <div class="sh-list padding-bottom-10">
      <div style="padding-top: 12px;padding-bottom: 11px;">
        <el-checkbox v-model="countersignSwitch" true-label="Y" false-label="N" size="small" class="check" @change="countersignChange"><span style="margin-left:-5px;font-size: 13px">{{ $t('countersign.shareRuleText') }}</span></el-checkbox>
        <span style="margin-left: 5px;font-size: 13px">
          <span style="display: inline-block;position: relative;">
            <el-input :disabled="countersignSwitch !== 'Y'" size="mini" style="width: 50px" v-model="countersignCount" @input="countersignCount = countersignCount.replace(/\D|^0/g,'')" @change="countersignChange"></el-input>
            <span style="color: red;display: block;position: absolute;width: 150px;font-size: 13px;">
              <span v-if="countersignSwitch === 'Y' && countersignCount > 10">{{ $t('countersign.maxExceedCount') }}</span>
              <span v-if="countersignSwitch === 'Y' && countersignCount < 1">{{ $t('countersign.notEmpty') }}</span>
            </span>
          </span>
          {{ $t('countersign.ruleText2') }}{{ $t('countersign.ruleText3') }}
          <span style="display: inline-block;position: relative;">
            <el-input :disabled="countersignSwitch !== 'Y'" size="mini" style="width: 50px" v-model="countersignAuditors" @input="countersignAuditors = countersignAuditors.replace(/\D|^0/g,'')" @change="countersignChange"></el-input>
            <span style="color: red;display: block;position: absolute;width: 150px;font-size: 13px;">
                  <span  v-if="countersignSwitch === 'Y' && countersignAuditors > 10">{{ $t('countersign.maxExceedAuditors') }}</span>
                  <span  v-if="countersignSwitch === 'Y' && countersignAuditors < 1">{{ $t('countersign.notEmpty') }}</span>
            </span>
          </span>
          {{ $t('countersign.ruleText4') }}
        </span>
      </div>
      <div class="gray-text" style="padding-top: 0px;">{{ $t('countersign.tips') }}</div>
    </div>
  </div>
</template>

<script>
import { saveShareCountersignStrategy, getShareCountersignStrategy } from '@/api/docShareStrategy'
export default {
  name: 'AnonymityFrom',
  props:{
    process_obj: { type: Object, required: true }
  },
  data() {
    return {
      timeouter:null,
      anonymityCheckbox: false,
      countersignSwitch: false,
      countersignCount: '1',
      countersignAuditors: '1'
    }
  },
  created(){
    this.initCheckbox()
    this.getShareCountersign()
  },
  methods: {
    initCheckbox(){
      const _this = this
      _this.anonymityCheckbox = false
      if(_this.process_obj.advancedSetup.anonymity_switch === 'y'){
        _this.anonymityCheckbox = true
      }
    },
    enabledChange(val) {
      this.anonymityCheckbox = val
      this.$emit('change', true)
      this.$emit('processSave')
    },
    getShareCountersign(){
      const _this = this
      getShareCountersignStrategy(_this.process_obj.key).then(res => {
        if(res){
          _this.countersignSwitch = res.countersign_switch
          _this.countersignCount = res.countersign_count
          _this.countersignAuditors = res.countersign_auditors
        }
      })
    },
    countersignChange(){
      const _this = this
      if(_this.timeouter){
        clearTimeout(_this.timeouter)
      }
      _this.timeouter = setTimeout(function () {
        _this.saveShareCountersign()
      }, 800)
    },
    saveShareCountersign(){
      const _this = this
      const params = {
        countersign_switch: _this.countersignSwitch,
        countersign_count: _this.countersignCount,
        countersign_auditors: _this.countersignAuditors
      }
      if(_this.countersignSwitch === 'Y' && (_this.countersignCount < 1 || _this.countersignCount > 10 || _this.countersignAuditors < 1 || _this.countersignAuditors > 10)){
        return
      } else if(_this.countersignCount < 1 || _this.countersignCount > 10 || _this.countersignAuditors < 1 || _this.countersignAuditors > 10){
        getShareCountersignStrategy(_this.process_obj.key).then(res => {
          if(res){
            params.countersign_count = res.countersign_count
            params.countersign_auditors = res.countersign_auditors
            saveShareCountersignStrategy(params, _this.process_obj.key).then(() => {})
          }
        })
      } else {
        saveShareCountersignStrategy(params, _this.process_obj.key).then(() => {})
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
