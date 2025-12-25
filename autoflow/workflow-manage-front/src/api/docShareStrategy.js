import request from '@/utils/request'

/**
 * 分页获取共享审核策略
 * @param params
 */
export function getStrategyPage(params) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/`,
    method: 'get',
    params: { ...params }
  })
}

/**
 * 保存共享审核策略
 * @param data
 * @param proc_def_id
 */
export function saveStrategy(data, proc_def_id) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/${proc_def_id}`,
    method: 'post',
    timeout: 0,
    data
  })
}

/**
 * 更新共享审核策略
 * @param data
 * @param proc_def_id
 */
export function updateStrategy(data, proc_def_id) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/${proc_def_id}/batch/`,
    method: 'put',
    data
  })
}

/**
 * 删除共享审核策略
 * @param data
 */
export function deleteStrategy(data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy`,
    method: 'delete',
    data
  })
}

/**
 * 校验共享审核策略
 * @param data
 * @param procDefId
 */
export function checkStrategy(data, procDefId) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/${procDefId}/check`,
    method: 'post',
    timeout: 0,
    data
  })
}

/**
 * 保存共享加签策略
 * @param data
 * @param procDefKey
 */
export function saveShareCountersignStrategy(data, procDefKey) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/countersign/${procDefKey}`,
    method: 'post',
    data
  })
}

/**
 * 获取共享加签策略
 * @param procDefKey
 */
export function getShareCountersignStrategy(procDefKey) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/countersign/${procDefKey}`,
    method: 'get'
  })
}

/**
 * 获取高级设置（转审）
 */
export function getAdvanceConfig(key) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/advanced-config/${key}`,
    method: 'get'
  })
}

/**
 * 高级设置（转审）
 */
export function setAdvanceConfig(key, data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/doc-share-strategy/advanced-config/${key}`,
    method: 'post',
    data
  })
}