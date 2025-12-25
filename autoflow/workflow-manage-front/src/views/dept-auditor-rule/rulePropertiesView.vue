<!-- 部门审核员规则配置界面 -->
<template>
  <div style="padding: 8px; box-sizing: border-box">
    <div
      style="font-size: 13px; color: #000; line-height: 19px; margin: 0 0 9px 0"
    >
      {{ $t('menu.deptAuditor') }}：
    </div>
    <el-table
      :data="deptTableData"
      :height="tableHeight"
      tooltip-effect="light"
      class="table-ellip"
      style="border-bottom: 0px"
    >
      <el-table-column :label="$t('deptAuditorRule.deptName')">
        <template slot-scope="scope">
          <span :title="scope.row.name">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="auditorNames"
        :label="$t('deptAuditorRule.deptAuditor')"
      >
        <template slot-scope="scope">
          <el-popover
            :ref="`innerPop-${scope.$index}`"
            placement="bottom-start"
            popper-class="dept-view"
            :title="auditorNamesPopover ? $t('strategy.table.auditor') : ''"
            width="200"
            visible-arrow="false"
            trigger="click"
            :append-to-body="false"
          >
            <div class="popo-list" v-if="auditorNamesPopover" @click="(e)=>e.preventDefault()">
              <div class="audit-list">
                <template
                  v-for="(item, index) in getAuditorNameList(scope.row)"
                >
                  <div
                    v-title
                    :title="item"
                    :key="index"
                    style="
                      width: 100%;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: pre;
                      word-break: keep-all;
                    "
                  >
                    {{ item }}
                  </div>
                </template>
              </div>
            </div>
            <span
              slot="reference"
              onmouseover="this.style.cursor='pointer',this.style.color='#3461EC',this.style.opacity='75%'"
              onmouseleave="this.style.color='',this.style.opacity=''"
            >
              <span class="tooltip-text-overflow" @click="openPopo">
                <span v-title :title="getAuditorNames(scope.row)">{{
                  formatString(scope.row)
                }}</span>
              </span>
            </span>
          </el-popover>
        </template>
      </el-table-column>
      <div slot="empty" class="empty-box" v-if="loading">
        <div>
          <div class="empty-text"></div>
          <p>{{ $t('message.noAuditor') }}</p>
        </div>
      </div>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'rulePropertiesView',
  props: {
    deptAuditorSetResult: {
      type: Array,
      required: true
    },
    deptTableData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      tableHeight: 280,
      auditorNamesPopover: true,
      loading: false
    }
  },
  created() {
    this.loading = true
  },
  mounted() {},
  filters: {
    ellipsis(value, len) {
      if (!value) return ''
      if (value.length > len) {
        return value.slice(0, len) + '...'
      }
      return value
    }
  },
  methods: {
    closePop(){
      let obj = this.$refs
      for (let key in obj) {
        if (key.indexOf('innerPop') > -1) {
          obj[key].doClose()
        }
      }
    },
    getAuditorNames(_obj) {
      let auditorNames = ''
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNames = e.auditor_names
        }
      })
      return auditorNames
    },
    /**      
     * 分解获取审核员列表
     * @param auditorNames
     */
    getAuditorNameList(_obj) {
      let auditorNameArr = []
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNameArr = e.auditor_names
            .split('、')
            .filter((res) => res !== '')
        }
      })
      return auditorNameArr
    },
    checkAuditorShowTooltip(e) {
      this.tooltipDisabled = e.fromElement.innerText.indexOf('...') === -1
    },
    formatString(_obj) {
      let auditorNames = ''
      this.deptAuditorSetResult.forEach((e) => {
        if (e.org_id === _obj.id || e.org_id === _obj.depid) {
          auditorNames = e.auditor_names
        }
      })
      if (auditorNames.length > 42) {
        return auditorNames.substring(0, 42) + '...'
      } else {
        return auditorNames
      }
    },
    openPopo() {
      // const _this = this
      // _this.$nextTick(function () {
      //   const array = document.getElementsByClassName('dept-view')
      //   array.forEach((v, i) => {
      //     v.onclick = function () {
      //       _this.$emit('showView')
      //     }
      //   })
      // })
      // _this.auditorNamesPopover = true
    }
    // showView() {
    //   this.$emit('showView')
    // }
  }
}
</script>

<style lang="scss">
.el-table-column--selection >>> .cell {
  padding-left: 0px !important;
}
.ruleNameTips .el-form-item__error {
  top: 0px;
  left: 385px !important;
}
.el-popover .el-popover__title {
  background: #eee;
}
</style>
<style lang="scss">
.required::before {
  position: absolute;
  left: -10px;
  content: '*';
  color: #f56c6c;
}
.empty-box {
  padding: 20px 0 20px 0;
  text-align: center;
}
.el-popover__title,
.popo-list {
  cursor: default;
}
</style>
