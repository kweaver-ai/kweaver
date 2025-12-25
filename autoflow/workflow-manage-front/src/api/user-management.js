import request from '@/utils/request'
import store from '@/store'

/**
 * 顶级部门列举
 * @param offset
 * @param limit
 */
export function rootDepartment(offset, limit) {
  let role = getUserRole()
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/department-members/00000000-0000-0000-0000-000000000000/departments,users?role=` + role + `&offset=${offset}&limit=${limit}`,
    method: 'get'
  })
}

/**
 * 获取用户信息
 * @param data
 */
export function getUserInfos (data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/user-management/users`,
    method: 'post',
    data
  })
}

/**
 * 搜索部门审核员规则的审核员信息
 * @returns {AxiosPromise}
 */
export function deptAuditorSearch(ruleId, names, auditors) {
  const query = {
    'names': names,
    'auditors': auditors,
    'id': ruleId
  }
  return request({
    url: `${process.env.VUE_APP_BASE_API}/user-management/dept-auditor-search`,
    method: 'get',
    params: query
  })
}

/**
 * 用户组列举
 * @param offset
 * @param limit
 */
export function userGroups(offset, limit) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/management/groups?direction=desc&sort=date_created&offset=${offset}&limit=${limit}`,
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
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/management/group-members/${groupId}?direction=desc&sort=date_created&offset=${offset}&limit=${limit}`,
    method: 'get'
  })
}

/**
 * 部门成员列举
 *
 * @param departmentId 部门ID
 * @returns {AxiosPromise}
 */
export function members(departmentId, offset, limit) {
  let role = getUserRole()
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/department-members/${departmentId}/departments,users?role=` + role + `&offset=${offset}&limit=${limit}`,
    method: 'get'
  })
}

/**
 * 搜索用户信息
 *
 * @returns {AxiosPromise}
 */
export function userSearch(keyword, type, offset, limit) {
  let role = getUserRole()
  const query = {
    'limit': limit,
    'offset': offset,
    'keyword': keyword,
    'role': role
  }
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/search-in-org-tree?type=${type}`,
    method: 'get',
    params: query
  })
}

/**
 * 搜索用户组信息
 *
 * @returns {AxiosPromise}
 */
export function userMemberSearch (keyword, offset, limit) {
  const query = {
    'limit': limit,
    'offset': offset,
    'keyword': keyword
  }
  return request({

    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/search-in-group?type=member`,
    method: 'get',
    params: query
  })
}

/**
 * 批量转换
 *
 * @returns {AxiosPromise}
 */
export function transfer(userIds) {
  let role = getUserRole()
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/users/${userIds}/parent_dep_paths,name,account?role=` + role,
    method: 'get'
  })
}

/**
 * 获取三权分立开启状态
 */
export function getTriSystemStatus() {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/user-management/tri-system-status`,
    method: 'get'
  })
}

/**
 * 根据用户id获取详细信息
 */
export function usrmGetUserInfo(userId) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/user-management/usrm-get-user-info/${userId}`,
    method: 'get'
  })
}

/**
 * id转换名称
 * @param data
 */
export function getInfoByTypeAndIds(type, data) {
  return request({
    url: `${process.env.VUE_APP_BASE_API}/user-management/names?type=${type}`,
    method: 'post',
    data
  })
}

function getUserRole(){
  const roles = store.getters.roles
  let role = ''
  roles.forEach(e => {
    role === '' ?  role = e.id :  role += ',' + e.id
  })
  if(role.indexOf('7dcfcc9c-ad02-11e8-aa06-000c29358ad6') !== -1){
    return 'super_admin'
  }
  if(role.indexOf('d8998f72-ad03-11e8-aa06-000c29358ad6') !== -1){
    return 'sec_admin'
  }
  if(role.indexOf('e63e1c88-ad03-11e8-aa06-000c29358ad6') !== -1){
    return 'org_manager'
  }
  return 'super_admin'
}


/**
 * 用户组搜索
 * @param offset
 * @param limit
 */
export function userGroupsSearch(keyword,offset, limit) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/user-management/v1/search-in-group?type=group&type=member&offset=${offset}&limit=${limit}&keyword=${keyword}`,
    method: 'get'
  })
}