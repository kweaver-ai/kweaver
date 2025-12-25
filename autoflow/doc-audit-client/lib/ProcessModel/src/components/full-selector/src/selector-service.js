import request from '@/utils/request'
var urlMap = {
  type: {
    ORG: 'org',
    USER: 'user',
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
  getOrgOrUserByIds: process.env.VUE_APP_BASE_API + '/org/search/ids'
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
    console.log('user-selector.js-->searchOrg' + error)
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
    console.log('user-selector.js-->searchOrgAndUser' + error)
  })
  return rs
}


export default {
  urlMap,
  searchOrg,
  searchOrgAndUser,
}
