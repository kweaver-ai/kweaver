<template>
  <div>
    <el-form-item>
      <el-form-item prop="strategy_tag" class="strategyTagTips">
        <label class="font-bold">
          {{ $t('deptAuditorRule.setOwnerAuditorStrategy') }}：
        </label>
        <div class="red-zs" style="display:inline-block;">
          <span class="selectValue-adapt">{{tagLabel}}</span>
          <el-select v-model="strategy_tag">
            <div style="overflow: auto;">
              <el-option
                v-for="item in tagList"
                :key="item.key"
                :value="item.key"
                :label="item.label"
              >
              </el-option>
            </div>
          </el-select>
        </div>
      </el-form-item>
    </el-form-item>
    <el-form-item v-if="showLevel" prop="level_type" class="strategyTagTips">
      <label class="font-bold">
        {{ $t('deptAuditorRule.setOwnerLevel') }}：
      </label>
      <div class="red-zs" style="display:inline-block;">
        <span class="selectValue-adapt">{{levelLabel}}</span>
        <el-select v-model="level_type">
          <div style="overflow: auto;">
            <el-option
              v-for="item in levelList"
              :key="item.key"
              :value="item.key"
              :label="item.label"
            >
            </el-option>
          </div>
        </el-select>
      </div>
    </el-form-item>
    <el-form-item style="margin-top: 16px">
      <label class="font-bold">{{ $t('modeler.auditMode') }}：</label>
      <div>
        <el-radio-group v-model="audit_model">
          <p>
            <el-radio label="tjsh">{{
              $t('modeler.dealTypeTips.tjsh')
            }}</el-radio>
          </p>
          <p>
            <el-radio label="hqsh">{{
              $t('modeler.dealTypeTips.hqsh')
            }}</el-radio>
          </p>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'n'">
      <label class="font-bold">{{
        $t('deptAuditorRule.namedNoAuditorTypeLabel')
      }}</label>
      <el-tooltip
        v-if="$i18n.locale === 'en-us' || $i18n.locale === 'vi-vn'"
        effect="light"
        placement="bottom"
        style="
          cursor: pointer;
          position: absolute;
          top: -5px;
          left: 290px;
          display: inline-block;
          width: 32px;
          height: 32px;
        "
      >
        <div slot="content" style="width: 320px" class="sm-box1">
          <p class="title">
            {{ $t('deptAuditorRule.namedNoAuditorTypeExplainTitle') }}
          </p>
          <p>{{ $t('deptAuditorRule.namedNoAuditorTypeExplain1') }}</p>
          <p>{{ $t('deptAuditorRule.namedNoAuditorTypeExplain2') }}</p>
          <p>{{ $t('deptAuditorRule.namedNoAuditorTypeExplain3') }}</p>
        </div>
        <span style="cursor: pointer"
          ><i class="icon-state" style="margin-left: 8px"
        /></span>
      </el-tooltip>
      <el-tooltip
        v-else
        effect="light"
        placement="bottom"
        style="
          cursor: pointer;
          position: absolute;
          top: -5px;
          left: 110px;
          display: inline-block;
          width: 32px;
          height: 32px;
        "
      >
        <div slot="content" style="width: 320px" class="sm-box1">
          <p class="title">
            {{ $t('deptAuditorRule.namedNoAuditorTypeExplainTitle') }}
          </p>
          <p>{{ $t('deptAuditorRule.namedNoAuditorTypeExplain1') }}</p>
          <p>{{ $t('deptAuditorRule.namedNoAuditorTypeExplain2') }}</p>
          <p>{{ $t('deptAuditorRule.namedNoAuditorTypeExplain3') }}</p>
        </div>
        <span style="cursor: pointer"
          ><i class="icon-state" style="margin-left: 8px"
        /></span>
      </el-tooltip>
      <div>
        <el-radio-group v-model="no_auditor_type">
          <el-radio label="auto_reject">{{
            $t('deptAuditorRule.autoReject')
          }}</el-radio>
          <el-radio label="auto_pass">{{
            $t('deptAuditorRule.autoPass')
          }}</el-radio>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'n'">
      <label class="font-bold">{{
        $t('deptAuditorRule.namedOwnAuditorTypeLabel')
      }}</label>
      <el-radio-group v-model="own_auditor_type">
        <el-radio label="auto_reject">{{
          $t('deptAuditorRule.autoReject')
        }}</el-radio>
        <el-radio label="auto_pass">{{
          $t('deptAuditorRule.autoPass')
        }}</el-radio>
        <el-radio label="self_audit">{{
          $t('deptAuditorRule.selfAudit')
        }}</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="$store.state.app.secret.status === 'y'">
      <p style="color: rgba(0, 0, 0, 0.45)">
        {{ $t('deptAuditorRule.autoRejectSecretTip') }}
      </p>
    </el-form-item>
  </div>
</template>

<script>
/**
 * 所有者审核，strategy_type类型沿用excuting auditor
 */
export default {
  name: 'OwnerAuditorStrategy',
  props: {
    approver_config: {
      required: true,
      type: Object
    },
    doc_audit_strategy_data: {
      required: true,
      type: Array
    },
    processDisable: {
      type: Boolean
    }
  },
  data() {
    return {
      strategy_tag: 'as_doc_inhconfperm_audit',
      level_type: 'directlyLevel',
      audit_model: 'tjsh',
      no_auditor_type: 'auto_reject',
      own_auditor_type: 'auto_reject',
      tagList: [
        { key: 'as_doc_confperm_audit',label:this.$tc(`deptAuditorRule.as_doc_confperm_audit`) },
        { key: 'as_doc_inhconfperm_audit',label:this.$tc(`deptAuditorRule.as_doc_inhconfperm_audit`)  },
        { key: 'as_belongdir_inhconfperm_audit',label:this.$tc(`deptAuditorRule.as_belongdir_inhconfperm_audit`)  }
      ],
      levelList:[
        { key: 'directlyLevel',label:this.$tc(`deptAuditorRule.owner.directlyLevel`) },
        { key: 'belongUp1',label:this.$tc(`deptAuditorRule.owner.belongUp1`) },
        { key: 'belongUp2',label:this.$tc(`deptAuditorRule.owner.belongUp2`) },
        { key: 'belongUp3',label:this.$tc(`deptAuditorRule.owner.belongUp3`) },
        { key: 'belongUp4',label:this.$tc(`deptAuditorRule.owner.belongUp4`) },
        { key: 'belongUp5',label:this.$tc(`deptAuditorRule.owner.belongUp5`) },
        { key: 'belongUp6',label:this.$tc(`deptAuditorRule.owner.belongUp6`) },
        { key: 'belongUp7',label:this.$tc(`deptAuditorRule.owner.belongUp7`) },
        { key: 'belongUp8',label:this.$tc(`deptAuditorRule.owner.belongUp8`) },
        { key: 'belongUp9',label:this.$tc(`deptAuditorRule.owner.belongUp9`) },
        { key: 'belongUp10',label:this.$tc(`deptAuditorRule.owner.belongUp10`) },
        { key: 'highestLevel',label:this.$tc(`deptAuditorRule.owner.highestLevel`) },
      ]
    }
  },
  created() {
    this.initStrategyList()
    this.initStrtegyAuditor(this.approver_config, this.doc_audit_strategy_data)
  },
  computed:{
    tagLabel(){
      const select = this.tagList.filter((i)=>
        i.key === this.strategy_tag
      )
      if(select[0].label) {
        return select[0].label
      }
      return ''
    },
    levelLabel(){
      const select = this.levelList.filter((i)=>
        i.key === this.level_type
      )
      if(select[0].label) {
        return select[0].label
      }
      return ''
    },
    showLevel(){
      return this.strategy_tag === "as_doc_confperm_audit"
    }
  },
  methods: {
    initStrategyList() {
    },
    initStrtegyAuditor(config, strategyList) {
      const strategy = strategyList.find(
        (item) =>
          item.act_def_id === config.nodeId &&
          item.strategy_type === 'excuting_auditor'
      )
      if (strategy) {
        this.audit_model = strategy.audit_model
        this.no_auditor_type = strategy.no_auditor_type
        this.own_auditor_type = strategy.own_auditor_type
        this.strategy_tag = strategy.strategy_tag
        this.level_type = strategy.level_type
      } else {
        this.audit_model = 'tjsh'
        this.no_auditor_type = 'auto_reject'
        this.own_auditor_type = 'auto_reject'
        this.strategy_tag = 'as_doc_inhconfperm_audit'
        this.level_type = 'directlyLevel'
      }
    },
    confirmProperties() {
      const item = {
        auditor_list:[],
        strategy_type: 'excuting_auditor',
        strategy_tag: this.strategy_tag,
        level_type: this.showLevel ? this.level_type : 'directlyLevel',
        audit_model: this.audit_model,
        no_auditor_type: this.no_auditor_type,
        own_auditor_type: this.own_auditor_type
      }
      this.$emit('output', item)
    },
    closeProperties() {
      this.$emit('closeProperties')
    }
  }
}
</script>
<style>
.strategyTagTips .el-form-item__error {
  top: 28px;
  left: 200px !important;
}

.selectValue-adapt {
  display: inline-block;
  width: 100%;
  min-width: 300px;
  opacity: 0;
  padding-right: 60px;
}
.selectValue-adapt+.el-select {
  position: absolute;
  z-index: 1;
  width: 100%;
  left: 0;
  top: 0;
}
</style>
