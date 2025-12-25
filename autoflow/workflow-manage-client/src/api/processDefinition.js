import { tenantId } from '@/utils/config'
import request from '@/utils/request'

/**
 * 获取流程定义集合
 * @param params
 */
export function getList(params) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition`,
    method: 'get',
    params: { tenant_id: tenantId, ...params }
  })
}

/**
 * 保存流程定义
 * @param data
 * @param params
 */
export function savePro(data, params) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-model`,
    method: 'post',
    data,
    params:params
  })
}

/**
 * 删除流程定义
 * @param id
 * @param params
 */
export function deleteProcDef(id, params) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/${id}`,
    method: 'delete',
    params
  })
}

/**
 * 批量删除流程定义
 * @param data
 */
export function deleteBatchProcDef(data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition`,
    method: 'delete',
    data
  })
}

/**
 * 校验流程定义是否存在
 * @param params
 */
export function existence(params) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/existence`,
    method: 'get',
    params: { tenant_id: tenantId, ...params }
  })
}

/**
 * 获取流程定义详情
 * @param id
 */
export function procDefInfo(id) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-model/${id}`,
    method: 'get'
  })
}

/**
 * 判断流程定义是否有效
 * @param id
 */
export function processEffective(id) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/${id}`,
    method: 'get'
  })
}

/**
 * 获取流程定义版本信息
 * @param proc_def_id
 */
export function historyProcDef(proc_def_id) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/${proc_def_id}/versions`,
    method: 'get'
  })
}

/**
 * 判断流程定义是否存在执行记录
 * @param proc_def_id
 */
export function record(proc_def_id) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/${proc_def_id}/record`,
    method: 'get'
  })
}

/**
 * 获取流程分类集合
 */
export function categoryList() {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/process-definition/category/list`,
    method: 'get'
  })
}

/**
 * 涉密模式配置查询
 */
export function getSecretInfo() {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/secret-config/info`,
    method: 'get'
  })
}

/**
 * 知识仓库-审核流程管理，流程名称是否重复
 * params {name: string, process_id?: string}
 */
export function kcProcessNameExist(params) {
  return request({
    url: `api/kc-mc/v2/process-names`,
    method: 'get',
    params: params
  })
}
