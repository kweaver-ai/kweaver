import request from '@/utils/request'

/**
 * 分页获取部门审核员规则
 * @param params
 */
export function getDeptAuditorRulePage(params) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/dept-auditor-rule`,
    method: 'get',
    params: { ...params }
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

