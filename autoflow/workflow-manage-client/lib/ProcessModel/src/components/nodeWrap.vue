<template xmlns:v-title="http://www.w3.org/1999/xhtml">
  <div>
    <div class="node-wrap" v-if="nodeConfig.type !== 4 && nodeCustomClass(nodeConfig)">
      <div class="node-wrap-box del-node-class" :class="highlightClass" :style="{width: viewProcess ? '300px' : '240px',cursor: viewProcess ? 'grab' : 'pointer'}">
        <div :class="'process-node ' + (nodeConfig.error ? 'process_node_error_tip' : '')"
             :data-title="$t('processCenter.guideStep1Title')"
             v-intro="introContent"
             v-intro-if="nodeConfig.type !== 0"
             v-intro-position="'right'"
             v-intro-step="1">
          <div class="title">
            <span :title="showNodeName(nodeConfig)">{{ showNodeName(nodeConfig) | ellipsis(30)  }}</span>
            <i class="el-icon-close" style="right: 10px;position: absolute" v-if="nodeConfig.type !== 0 && nodeList.length > 2 && !viewProcess" @click="delNode()"></i>
          </div>
          <div class="content" @click="setPerson" v-if="!viewProcess">
            <div class="text" v-if="nodeConfig.type === 0"></div>
            <div class="text" v-if="nodeConfig.type === 1">
              <div v-if="nodeConfig.viewAuditors">
                <template v-if="nodeConfig.viewAuditors.strategyType === 'dept_auditor'">
                  <span style="margin-right: 20px;word-break: break-word;">{{ $t('deptAuditorRule.linkDeptAuditorName') }}</span>
                </template>
                <template v-else-if="nodeConfig.viewAuditors.strategyType === 'multilevel'">
                  <span style="margin-right: 20px;word-break: break-word;">{{ $t('deptAuditorRule.linkMultilevelName') }}</span>
                </template>
                <template v-else-if="nodeConfig.viewAuditors.strategyType === 'predefined_auditor'">
                  <span style="margin-right: 20px;word-break: break-word;">{{ $t('predefinedAuditor.linkPredefinedAuditorName') }}</span>
                </template>
                <template v-else-if="nodeConfig.viewAuditors.strategyType === 'manager'">
                  <span style="margin-right: 20px;word-break: break-word;">
                    {{ $t('predefinedAuditor.linkManagerName') }}
                  </span>
                </template>
                <template v-else-if="nodeConfig.viewAuditors.strategyType === 'kc_admin'">
                  <span style="margin-right: 20px;word-break: break-word;">
                    {{ $t('predefinedAuditor.linkKnowledgeName') }} {{' '}} {{ getUserName(nodeConfig) }}
                  </span>
                </template>
                <template v-else>
                  <span style="margin-right: 20px;">{{ nodeConfig.viewAuditors.auditModel }}</span>
                  <span v-if="nodeConfig.viewAuditors.auditorNames !== ''" v-title :title="nodeConfig.viewAuditors.auditorNames">{{ nodeConfig.viewAuditors.auditorNames | ellipsis(30) }}</span>
                  <span v-else>
                    <template v-if="nodeConfig.viewAuditors.noAuditorType === 'auto_pass'">{{ $t('deptAuditorRule.autoPassDeatil') }}</template>
                    <template v-if="nodeConfig.viewAuditors.noAuditorType === 'auto_reject'">{{ $t('deptAuditorRule.autoRejectDeatil') }}</template>
                  </span>
                  <span><i class="el-icon-arrow-right"></i></span>
                </template>
              </div>
              <div v-else>
                <span :style="{wordBreak:'break-word',color: procType !== 'doc_realname_share' && procType !== 'doc_anonymity_share' ? '#a6a9ad' : ''}">{{ $t('sync.settingAuditScop') }}</span>
                <span style="color: #a6a9ad"><i class="el-icon-arrow-right"></i></span>
              </div>
            </div>
          </div>
          <div class="content" v-else>
            <div class="text" style="text-overflow:inherit;white-space:normal">
              <template v-for="(item, index) in viewAuditors">
                <span :key="index" v-if="item.actDefId === nodeConfig.nodeId">
                  <template v-if="item.strategyType === 'dept_auditor'">
                    <span style="margin-right: 20px;word-break: break-word;">{{ $t('deptAuditorRule.linkDeptAuditorName') }}</span>
                  </template>
                  <template v-else-if="item.strategyType === 'multilevel'">
                    <span style="margin-right: 20px;word-break: break-word;">{{ $t('deptAuditorRule.linkMultilevelName') }}</span>
                  </template>
                  <template v-else>
                    <span style="margin-right: 20px;">{{item.auditModel }}</span>
                    <span v-title :title="item.auditorNames" v-if="item.auditorNames !== ''">{{ item.auditorNames | ellipsis(30) }}</span>
                    <span v-else>
                      <template v-if="item.noAuditorType === 'auto_pass'">{{ $t('deptAuditorRule.autoPassDeatil') }}</template>
                      <template v-if="item.noAuditorType === 'auto_reject'">{{ $t('deptAuditorRule.autoRejectDeatil') }}</template>
                    </span>
                  </template>
                </span>
              </template>
            </div>
          </div>
          <div class="error_tip">
            <i class="el-icon-warning"></i>
            <span>{{ $t('sync.settingAuditScopTips') }}</span>
          </div>
        </div>
      </div>
      <addNode
         :nodeList="nodeList"
         :childNodeP.sync="nodeConfig.childNode"
         :addNodeDisabled="addNodeDisabled"
         :view-process="viewProcess"
         @updateIsChange="updateIsChange"
      />
    </div>
    <nodeWrap
      v-if="nodeConfig.childNode && nodeConfig.childNode"
      :nodeConfig.sync="nodeConfig.childNode"
      :addNodeDisabled="addNodeDisabled"
      :nodeList="nodeList"
      :procType="procType"
      :view-process="viewProcess"
      :view-auditors="viewAuditors"
      :multiChoiceSearch="multiChoiceSearch"
      @openPropertiesDrawer="openPropertiesDrawer"
      @updateIsChange="updateIsChange"
    />
  </div>
</template>
<script>
import nodeWrap from '../components/nodeWrap'
import addNode from '../components/addNode'
import { getDeptAuditorRule } from '@/api/deptAuditorRule.js'
export default {
  name: 'nodeWrap',
  props: {
    nodeConfig: {
      required: true,
      type: Object
    },
    flowPermission: {
      required: false,
      type: Array
    },
    addNodeDisabled: {
      required: true,
      type: Boolean
    },
    nodeList: {
      required: false,
      type: Array,
      default: function _default () {
        return []
      }
    },
    procType: {
      type: String,
      required: false
    },
    viewProcess: {
      required: false,
      type: Boolean,
      default: false
    },
    viewAuditors: {
      required: false,
      type: Array
    },
    multiChoiceSearch: {
      type: Object
    }
  },
  components: { nodeWrap, addNode },
  data () {
    return {
      flowPermission1: this.flowPermission,
      approverConfig: {},
      highlightClass: '',
      introContent: this.$i18n.tc('processCenter.guideStep1')
    }
  },
  filters: {
    ellipsis (value, len) {
      if (!value) return ''
      if (value.length > len) {
        return value.slice(0, len) + '...'
      }
      return value
    }
  },
  mounted () {
  },
  methods: {
    /**
       * 显示节点名称
       * @param _config
       * @returns {default.methods.form.name|string|string|*|string}
       */
    showNodeName (_config) {
      const _this = this
      if (_config.type === 0) {
        return _this.$i18n.tc('sync.startProcess')
      }
      return _config.nodeName
    },
    getUserName(_config) {
      return _config.viewAuditors.auditorNames
    },
    /**
       * 配置节点审核员
       */
    setPerson () {
      const _this = this
      const { type } = _this.nodeConfig
      if (type === 0) {
        _this.flowPermission1 = _this.flowPermission
      } else if (type === 1) {
        _this.approverConfig = JSON.parse(JSON.stringify(_this.nodeConfig))
        _this.approverConfig.settype = _this.approverConfig.settype ? _this.approverConfig.settype : 1
        _this.$emit('openPropertiesDrawer', _this.approverConfig)
      }
    },
    /**
       * 开启属性配置界面
       * @param _config
       */
    openPropertiesDrawer (_config) {
      this.$emit('openPropertiesDrawer', _config)
    },
    /**
       * 更新流程变更状态
       */
    updateIsChange () {
      this.$emit('updateIsChange')
    },
    /**
       * 删除节点
       */
    delNode () {
      const _this = this
      _this.$dialog_confirm(_this.$i18n.tc('processCenter.deleteNodeTips'), '', _this.$i18n.tc('button.confirm'), _this.$i18n.tc('button.cancel'), true).then(() => {
        _this.$emit('update:nodeConfig', this.nodeConfig.childNode)
        _this.$emit('updateIsChange')
      }).catch(() => { })
    },
    /**
       * 节点自定义class
       * @param nodeConfig
       */
    nodeCustomClass (nodeConfig) {
      const _this = this
      if (nodeConfig.type === 0) {
        _this.highlightClass = 'start-node'
      } else if (nodeConfig.type === 1) {
        if (_this.viewProcess) {
          let _array = _this.viewAuditors.filter((data) => nodeConfig.nodeId === data.actDefId)
          if (_array.length > 0) {
            _this.checkHighlight(_array).then(res => {
              _this.highlightClass = res ? 'orange-shadow' : ''
            })
          }
        }
      }
      return true
    },
    /**
       * 校验节点高亮背景提示
       * @param _array
       */
    checkHighlight (_array) {
      const _this = this
      const viewAuditor = _array[0]
      return new Promise((resolve) => {
        if (['', 'null', 'undefined'].includes(_this.multiChoiceSearch + '')) {
          resolve(false)
        } else {
          const auditors = !['', 'null', 'undefined'].includes(_this.multiChoiceSearch.auditors + '') ? _this.multiChoiceSearch.auditors : []
          const rules = !['', 'null', 'undefined'].includes(_this.multiChoiceSearch.rules + '') ? _this.multiChoiceSearch.rules : []
          const ruleId = !['', 'null', 'undefined'].includes(viewAuditor.ruleId + '') ? viewAuditor.ruleId : ''
          auditors.forEach(e => {
            if (viewAuditor.auditorNames.indexOf(e) !== -1) {
              resolve(true)
            }
          })
          if (ruleId === '') {
            resolve(false)
          } else {
            _this.getRuleName(ruleId).then(ruleName => {
              rules.forEach(e => {
                if (ruleName.indexOf(e) !== -1) {
                  resolve(true)
                }
              })
            })
          }
        }
      })
    },
    /**
       * 获取部门审核员规则名称
       * @param _ruleId
       */
    getRuleName (_ruleId) {
      return new Promise((resolve) => {
        if (!['', 'null', 'undefined'].includes(_ruleId + '')) {
          getDeptAuditorRule(_ruleId).then(res => {
            if (res.rule_name) {
              resolve(res.rule_name)
            } else {
              resolve('')
            }
          }).catch(error => {
            console.error(error)
          })
        } else {
          resolve('')
        }
      })
    }
  }
}
</script>
