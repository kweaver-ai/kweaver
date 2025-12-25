import request from '@/utils/request'

/**
 * 获取流程文本流转日志
 * @param {string} proc_inst_id 流程实例ID
 */
export function procTextLogs(proc_inst_id) {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/process-instance/${proc_inst_id}/text-logs`,
    method: 'get'
  })
}

export function procImageLogs(proc_inst_id) {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/process-instance/${proc_inst_id}/image-logs`,
    method: 'get'
  })
}

/**
 * 获取流程环节定义信息
 * @param {string} proc_def_id 环节定义ID
 * @param {string} act_def_id 流程定义ID
 */
export function procDefInfo(proc_def_id, act_def_id) {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/process-definition/${proc_def_id}/activity/${act_def_id}`,
    method: 'get'
  })
}

/**
 * 获取流程的XML内容
 * @param {String}} proc_def_id 流程定义ID
 */
export function processXml(proc_def_id) {
  return request({
    url: `${process.env.VUE_APP_WORKFLOW_REST_PATH}/process-definition/${proc_def_id}/xml`,
    method: 'get'
  })
}
