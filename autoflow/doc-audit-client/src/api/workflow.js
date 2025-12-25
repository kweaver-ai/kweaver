import request from '@/utils/request'
import { tenantId } from '@/utils/config'

/**
 * 根据流程实例ID获取审批日志
 * @param {string} id 流程实例ID
 */
export function fecthLog(id) {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/process-instance/${id}/logs`,
    method: 'get'
  })
}

/**
 * 涉密模式配置查询
 */
export function secretInfo() {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/secret-config/info`,
    method: 'get'
  })
}

/**
 * 获取流程分类集合
 */
export function processCategory() {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/process-definition/category/list`,
    method: 'get',
    params: { tenant_id: tenantId }
  })
}
