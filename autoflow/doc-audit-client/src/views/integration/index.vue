<!-- 爱数插件化集成入口 -->
<template>
  <div>
    <component :is="dashboard" />
  </div>
</template>

<script>
import { fecthTodoPage as fecthPage, fecthInfo, precessFinished } from '@/api/audit'
import {fecthLog} from '@/api/workflow'
import checkAuditPower from '@/mixins/checkAuditPower'
import { getUserInfo } from '@/api/anyshareOpenApi'
export default {
  name: 'index',
  mixins: [checkAuditPower],
  data () {
    return {
      dashboard: null,
      type: ''
    }
  },
  computed: {
    arbitrailyAuditLogVal () {
      return this.$store.state.app.arbitrailyAuditLog
    }
  },
  created () {
    this.type = JSON.stringify(this.arbitrailyAuditLogVal) !== '{}' && 'arbitraily-audit-log'
    let applyId = this.$route.query.applyId
    if (['', 'null', 'undefined'].includes(applyId + '')) {
      this.loader()
    }
  },
  mounted () {
    let applyId = this.$route.query.applyId
    let target = this.$route.query.target || "todo"
    if (!['', 'null', 'undefined'].includes(applyId + '')) {
      this.checkAuditPower(applyId,target)
    }
  },
  methods: {
    loader () {
      switch (this.type) {
      case 'arbitraily-audit-log':
        this.dashboard = () => import('../arbitraily-audit-log/integration.vue')
        break
      default:
        this.dashboard = () => import('../audit/index.vue')
      }
    },
    checkAuditPower(applyId,target){
      let _this = this
      if(target === 'done') {
        _this.loader()
        return
      }
      // 校验当前申请是否办结
      fecthInfo(applyId).then(async(resp) => {
        const messageId = this.$route.query.messageId
        const {data:{auditors}} = resp
        // 获取当前用户信息
        let {data: {userid: userId}} = await getUserInfo()

        if(resp.data.audit_status !== 'pending' && resp.data.applicationAuditor && target === 'todo') {
          let handlerId = ''
          const auditor = auditors.filter(({status}) => status !== 'pending' && status !== null)
          if (auditor.length) {
            if (auditor.length === 1) {
              handlerId = auditor[0].id
            } else {
              const isAuditedByUser = auditor.find(({id}) => id === userId)
              handlerId = isAuditedByUser ? userId : auditor[0].id
            }
          }

          if (messageId && handlerId) {
            precessFinished({messageId, handlerId})
          }

          _this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('message.taskNotPrem'), _this.$t('message.confirm'), function () {
          })

          _this.$router.push({ query: { ..._this.$route.query, applyId: undefined } })
          _this.loader()
          return
        }
        let type = 'task'
        if(target === 'apply'){
          type = 'apply'
        }
        let params = {
          'proc_inst_id': resp.data.proc_inst_id,
          'type': type
        }
        _this.checkFlow(params).then(res => {
          this.loader()
        }).catch(async (res) => {
          if(target === 'apply'){
            // 您对该申请详情没有查看权限
            this.$router.replace('/applyViewRoute')
          }else{
            // 消息已转审，没权限
            if (!resp.data.task_id) {
              // 获取审批日志
              const {data} = await fecthLog(resp.data.proc_inst_id)
              const [first, ...logs] = data

              const allAuditorStatus = [
                ...resp.data.auditors.map(a => [a.id, a.status]), 
                ...logs.flatMap(log => log.auditor_logs.flatMap(logs => logs.map(log => [log.auditor, log.audit_status])))
              ].toReversed()

              
              const isAuditedByUser = allAuditorStatus.some(([auditor, status]) => auditor === userId && status !== 'pending' && status !== null)

              if (isAuditedByUser) {
                const auditor = allAuditorStatus.find(([auditor, status]) => status !== 'pending' && status !== null)
                const auditorId = isAuditedByUser || !auditor ? userId : auditor[0]
                precessFinished({messageId, handlerId: auditorId})
              }
            }

            // 您对该审核待办没有审核权限
            this.$router.replace('/auditViewRoute')

          }
        })
      }).catch(err=>{
        // 该审核详情不存在，本次操作无法生效
        if(err.response.data.code === 400) {
          this.$dialog_alert(_this.$t('common.detail.auditMsg.title'), _this.$t('message.taskNotPrem'), _this.$t('message.confirm'), function () {})
          _this.$router.push({ query: { ..._this.$route.query, applyId: undefined } })
          this.loader()
          return
        }
        console.error(err.response)
      })
    }

  }
}
</script>
