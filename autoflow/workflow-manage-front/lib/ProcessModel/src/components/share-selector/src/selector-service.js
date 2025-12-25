import request from '@/utils/request'

let urlMap = {
  type: {
    ORG: 'depart',
    USER: 'user',
    ALL: 'all'
  },
  inputName: {
    ORGNAME: '组织',
    USERNAME: '姓名',
    ALL: '请输入'
  },
  getOrg: process.env.VUE_APP_BASE_API + '/org/searchOrg',
  getUserAndOrg: process.env.VUE_APP_BASE_API + '/org/search/organduser'
}

async function searchOrg(orgName, companyId) {
  let params = {
    orgName: orgName
  }
  if (companyId !== '') {
    params.companyId = companyId
  }
  let rs = []

  const url = urlMap.getOrg
  await request.get(url, { params: params }).then(res => {
    if (!res.code) {
      rs = res
    } else {
      return null
    }
  }).catch(error => {
    console.error('user-selector.js-->serachOrg' + error)
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
  let rs = []
  const url = urlMap.getUserAndOrg
  await request.get(url, { params: params }).then(res => {
    if (!res.code) {
      rs = res
    } else {
      return null
    }
  }).catch(error => {
    console.error('user-selector.js-->serachOrgAndUser' + error)
  })
  return rs
}

export default {
  urlMap,
  searchOrg,
  searchOrgAndUser
}
