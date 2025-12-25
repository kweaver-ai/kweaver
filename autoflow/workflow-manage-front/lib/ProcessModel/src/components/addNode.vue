<template>
  <div class="add-node-btn-box">
    <div class="add-node-btn">
      <el-popover v-model="visible" placement="right-start" :disabled="addNodeDisabled || nodeList.length > 10">
        <div class="add-node-popover-body">
          <a class="add-node-popover-item approver" @click="addType(1)">
            <div class="item-wrapper">
              <i class="el-icon-s-check"></i>
            </div>
          </a>
        </div>
        <button slot="reference" :class="'btn ' + (addNodeDisabled || nodeList.length > 10 ? '' : 'active')" type="button" v-if="!viewProcess" :data-title="$t('processCenter.guideStep2Title')" v-intro="introContent" v-intro-position="'right'" v-intro-step="2">
          <i class="el-icon-plus"></i>
        </button>
      </el-popover>
    </div>
  </div>
</template>
<script>
import { uuid8 } from '../utils/uuid.js'
export default {
  props: {
    nodeList: {
      required: false,
      type: Array
    },
    childNodeP: {
      required: false,
      type: Object
    },
    addNodeDisabled: {
      required: true,
      type: Boolean
    },
    viewProcess: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: false,
      introContent: this.$i18n.tc('processCenter.guideStep2')
    }
  },
  created(){
  },
  methods: {
    addType(type) {
      const _this = this
      if(_this.nodeList.length > 10){
        _this.$confirm(_this.$i18n.tc('processCenter.auditorRestrictTips'), '', {
          confirmButtonText: _this.$i18n.tc('button.confirm'),
          cancelButtonText: _this.$i18n.tc('button.cancel'),
          showCancelButton: false,
          iconClass: 'warning-blue',
          type: 'warning'
        }).then(() => {
        }).catch(() => {})
        return
      }
      if (type === 1) {
        const activityId = 'UserTask_' + uuid8(8, 62)
        let data = {
          'nodeId': activityId,
          'nodeName': _this.$i18n.tc('modeler.procLink.UserTask'),
          'error': false,
          'type': 1,
          'settype': 1,
          'selectMode': 0,
          'selectRange': 0,
          'directorLevel': 1,
          'examineMode': 1,
          'noHanderAction': 1,
          'examineEndDirectorLevel': 0,
          'childNode': this.childNodeP,
          'nodeUserList': [],
          'viewAuditors': null
        }
        _this.$emit('update:childNodeP', data)
        _this.$emit('updateIsChange')
      }
      _this.visible = false
    }
  }
}
</script>
