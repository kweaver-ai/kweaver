import request from '@/utils/request'

/**
 * 分页获取部门审核员规则
 * @param params
 */
export function getUserRoleTitleList(params) {
  return request({
    url: 'api/kc-mc/v2/user-role-title-list',
    method: 'get',
    params: { ...params }
  })
}
