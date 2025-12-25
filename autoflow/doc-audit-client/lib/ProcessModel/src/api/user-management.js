import request from '@/utils/request'

/**
 * 顶级部门列举
 *
 * @returns {AxiosPromise}
 */
export function rootDepartment() {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/management/root-departments`,
    method: 'get',
  })
}

/**
 * 部门成员列举
 *
 * @param departmentId 部门ID
 * @returns {AxiosPromise}
 */
export function members(departmentId) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/management/departments/${departmentId}/members`,
    method: 'get',
  })
}

/**
 * 搜索用户信息
 *
 * @returns {AxiosPromise}
 */
export function userSearch(keyword) {
  const data = {
    "limit": 50,
    "offset": 0,
    "keyword": keyword,
    "type": "role",
    "method": "GET"
  }
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/management/user/search`,
    method: 'post',
    data
  })
}

/**
 * 批量转换
 *
 * @returns {AxiosPromise}
 */
export function transfer(type, data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/user-management/names?type=${type}`,
    method: 'post',
    data
  })
}
