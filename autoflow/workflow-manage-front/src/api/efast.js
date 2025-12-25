import request from '@/utils/request'

/**
 * 查部门及子部门下所有用户个人文档库
 * @param departmentId
 * @param offset
 * @param limit
 */
export function queryUserDocLib(departmentId, offset, limit) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/efast/v1/doc-lib/user?search_in_departments=` + departmentId + '&offset=' + offset + '&limit=' + limit,
    method: 'get'
  })
}

/**
 * 获取AS配置信息
 */
export function asConfig() {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/auth1/getconfig`,
    method: 'get'
  })
}

/**
 * 顶级部门列举
 */
export function getRoots() {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/department/getroots`,
    method: 'post'
  })
}
/**
 * 获取子级部门
 * @param data
 */
export function getSubDeps(data) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/department/getsubdeps`,
    method: 'post',
    contentType: 'application/json;charset=UTF-8',
    data: data
  })
}

/**
 * 获取部门下成员
 * @param data
 */
export function getSubUsers(data) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/department/getsubusers`,
    method: 'post',
    data
  })
}

/**
 * 获取用户基本信息
 * @param data
 */
export function getUserBasicInfo(data) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/user/getbasicinfo`,
    method: 'post',
    data
  })
}
/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/user/get`,
    method: 'post'
  })
}

/**
 * 用户组列举
 * @param offset
 * @param limit
 */
export function userGroups(offset, limit) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/groups?offset=${offset}&limit=${limit}`,
    method: 'get'
  })
}

/**
 * 用户组成员列举
 * @param groupId
 * @param offset
 * @param limit
 */
export function groupMembers(groupId, offset, limit) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/group-members/${groupId}?offset=${offset}&limit=${limit}`,
    method: 'get'
  })
}

/**
 * 部门成员关键字查询
 * @param keyword
 * @param offset
 * @param limit
 */
export function searchUser(keyword, offset, limit) {
  const data = {
    'limit': limit,
    'start': offset,
    'key': keyword
  }
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/eacp/v1/department/search`,
    method: 'post',
    data
  })
}
