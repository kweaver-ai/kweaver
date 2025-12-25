import request from '@/utils/request'
let urlMap = {
  type: {
    ORG: 'org',
    USER: 'user',
    ROLE: 'role',
    ALL: 'all'
  },
  inputName: {
    ORGNAME: '组织',
    USERNAME: '姓名',
    ALL: '请输入'
  },
  getTree: process.env.VUE_APP_BASE_API + '/org/get',
  getUser: process.env.VUE_APP_BASE_API + '/staff/searchUser',
  getOrg: process.env.VUE_APP_BASE_API + '/org/searchOrg',
  getUserAndOrg: process.env.VUE_APP_BASE_API + '/org/search/organduser',
  getOrgOrUserByIds: process.env.VUE_APP_BASE_API + '/org/search/ids',
  roleService: process.env.VUE_APP_BASE_API + '/role'
}

/**
 * 列举角色列表
 *
 * @returns {Promise<[]>}
 */
async function listRole() {
  let url = urlMap.roleService
  let rs = []
  await request.get(url).then(res => {
    rs = res
  }).catch(error => {
    console.error('user-selector.js-->listRole' + error)
  })
  return rs
}

/**
 * 批量角色ID获取角色详情列表
 *
 * @param roleIds
 * @returns {Promise<[]>}
 */
async function transferRole(roleIds) {
  let url = urlMap.roleService + `/${roleIds}/info`
  let rs = []
  await request.get(url).then(res => {
    rs = res
  }).catch(error => {
    console.error('user-selector.js-->transferRole' + error)
  })
  return rs
}

/**
 * 搜索角色
 *
 * @param roleName
 * @returns {Promise<[]>}
 */
async function searchRole(roleName) {
  let params = {
    roleName: roleName
  }
  let url = urlMap.roleService
  let rs = []
  await request.get(url, { params: params }).then(res => {
    rs = res
  }).catch(error => {
    console.error('user-selector.js-->searchRole' + error)
  })
  return rs
}

async function searchOrg(orgName, companyId) {
  let params = {
    orgName: orgName
  }
  if (companyId !== '') {
    params.companyId = companyId
  }
  let url = urlMap.getOrg
  let rs = []
  await request.get(url, { params: params }).then(res => {
    if (!res.code) {
      rs = res
    } else {
      return null
    }
  }).catch(error => {
    console.error('user-selector.js-->searchOrg' + error)
  })
  return rs
}

async function searchOrgAndUser(inputName, companyId) {
  let params = {
    inputName: inputName
  }
  if (companyId !== '') {
    params.companyId = companyId
  }
  let url = urlMap.getUserAndOrg
  let rs = []
  await request.get(url, { params: params }).then(res => {
    if (!res.code) {
      rs = res
    } else {
      return null
    }
  }).catch(error => {
    console.error('user-selector.js-->searchOrgAndUser' + error)
  })
  return rs
}


export default {
  urlMap,
  searchOrg,
  searchOrgAndUser,
  listRole,
  searchRole,
  transferRole
}
