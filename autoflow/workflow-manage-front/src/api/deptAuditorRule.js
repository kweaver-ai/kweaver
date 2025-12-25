import request from '@/utils/request'
import { tenantId } from '@/utils/config'

/**
 * 分页获取部门审核员规则
 * @param params
 */
export function getDeptAuditorRulePage(params) {
  const tenant_id = tenantId === 'af_workflow' ? { tenant_id: tenantId } : {}

  return request({
    url: `${process.env.VUE_APP_BASE_API}/dept-auditor-rule`,
    method: 'get',
    params: { ...params, ...tenant_id }
  })
}

export function getStrategyList() {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/strategy/tags`,
    method: 'get'
  })
}

/**
 * 获取部门审核员规则详情
 * @param ruleId
 */
export function getDeptAuditorRule(ruleId) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/dept-auditor-rule/${ruleId}`,
    method: 'get'
  })
}

/**
 * 保存部门审核员规则
 * @param data
 */
export function saveDeptAuditorRule(data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/dept-auditor-rule`,
    method: 'post',
    timeout: 0,
    data
  })
}

/**
 * 删除部门审核员规则
 * @param data
 */
export function deleteDeptAuditorRule(data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/dept-auditor-rule`,
    method: 'delete',
    data
  })
}
