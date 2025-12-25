import request from '@/utils/request'

/**
 * 获取列表数据
 * @param {string} bizType 业务类型
 * @param {string} params 查询条件
 */
export function fecthPage(bizType, params) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/${bizType}`,
    method: 'get',
    params: params
  })
}

/**
 * 发起审核流程
 * @param {string} bizType 业务类型
 * @param {string} data 数据
 */
export function save(bizType, data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/${bizType}`,
    method: 'post',
    data
  })
}

/**
 * 提交审核流程
 * @param {string} bizType 业务类型
 * @param {string} data 数据
 */
export function audit(bizType, data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/${bizType}/audit`,
    method: 'post',
    data
  })
}

/**
 * 获取申请信息
 * @param {string} bizType 业务类型
 * @param {string} applyId 申请ID
 */
export function fecthApplyInfo(bizType, applyId) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/${bizType}/${applyId}`,
    method: 'get'
  })
}

/**
 * 获取待办信息
 * @param {string} bizType 业务类型
 * @param {string} taskId 任务ID
 */
export function fecthPendingInfo(bizType, taskId) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/${bizType}/task/${taskId}`,
    method: 'get'
  })
}

/**
 * 流程作废
 * @param {string} bizType 业务类型
 * @param {string} id ID
 */
export function cancel(bizType, id) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/${bizType}/${id}/cancel`,
    method: 'delete'
  })
}