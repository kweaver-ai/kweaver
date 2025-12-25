import request from '@/utils/request'

/**
 * 获取我的申请列表
 * @param {string} params 查询条件
 */
export function fecthApplyPage (params) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/applys`,
    method: 'get',
    params: { ...params }
  })
}

/**
 * 获取我的待办列表
 * @param {string} params 查询条件
 */
export function fecthTodoPage (params) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/tasks`,
    method: 'get',
    params: params
  })
}

/**
* 获取我的已办列表
* @param {string} params 查询条件
*/
export function fecthDonePage (params) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/historys`,
    method: 'get',
    params: params
  })
}

/**
 * 获取我的待办条目
 */
export function fecthTodoCount () {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/tasks/count`,
    method: 'get'
  })
}

/**
 * 获取审核详情
 */
export function fecthInfo (id) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/${id}`,
    method: 'get'
  })
}


/**
 * 获取审核日志详情
 */
export function getAuditLogs (bizId) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/biz/${bizId}`,
    method: 'get'
  })
}

/**
 * 发起审核流程
 * @param {string} data 数据
 */
export function save (data, bizType) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/${bizType}`,
    method: 'post',
    data
  })
}

/**
 * 审核流程
 * @param {string} data 数据
 */
export function audit (data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit`,
    method: 'put',
    data
  })
}

/**
 * 审核退回
 * @param {string} data 数据
 */
export function sendbackAudit (data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/sendback`,
    method: 'put',
    data
  })
}

/**
 * 检查待办任务是否有效
 * @param {string} params 查询参数
 */
export function fecthAuthority (params) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/authority`,
    method: 'get',
    params: params
  })
}

/**
 * 文件下载
 * @param {string} data 查询参数
 */
export function fecthDownload (data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/document/download`,
    method: 'post',
    data
  })
}

/**
 * 递归浏览目录协议
 * @param {string} data 查询参数
 */
export function fecthDirsList (data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/document/dirs/list`,
    method: 'post',
    data
  })
}

/**
 * 递归查询所有文件目录及文件目录下的下载地址
 * @param {string} data 查询参数
 */
export function folderdownload (data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/document/folder/download`,
    method: 'post',
    data
  })
}

/**
 * 流程作废
 * @param {string} applyId 申请ID
 */
export function cancel (applyId) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/${applyId}`,
    method: 'delete'
  })
}

/**
 * 流程加签
 * @param {string} applyId 申请ID
 */
export function countersign (applyId, data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/countersign/${applyId}`,
    method:  'post',
    data
  })
}

/**
 * 流程转审
 * @param {string} applyId 申请ID
 */
export function transferAudit (applyId, data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/transfer/${applyId}`,
    method: 'post',
    data
  })
}

/**
 * 流程加签信息集合
 * @param {string} applyId 申请ID
 * @param {string} task_id 任务ID
 */
export function countersignList (applyId, taskId) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/countersign/list/${applyId}/${taskId}`,
    method:  'get'
  })
}

/**
 * 流程加签信息日志集合
 * @param {string} applyId 申请ID
 * @param {string} task_id 任务ID
 */
export function countersignLogs (procInstId) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/countersign/logs/${procInstId}`,
    method:  'get'
  })
}

/**
 * 审核催办
 * @param {string} id 流程定义ID
 * @param {object} data 
 * @param {string[]} data.auditors 待催办的审核员列表
 * @param {string} data.remark 催办备注
 */
export function remindAuditors (id, data) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/${id}/reminder`,
    method: 'post',
    data
  })
}

/**
 * 判断审核催办状态
 * @param {string} id 流程定义ID
 */
export function getRemindStatus (id,is_arbitrary = false) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/${id}/reminder-status?is_arbitrary=${is_arbitrary}`,
    method: 'get'
  })
}

/**
 * 标记流程已处理
 * param: { applyId:string, handlerId: string}
 */
export function precessFinished ({ messageId, handlerId }) {
  return request({
    url: `${process.env.VUE_APP_AUDIT_REST_PATH}/doc-audit/to-do-list/${messageId}/handler_id`,
    method: 'put',
    data: {handlerId}
  })
}