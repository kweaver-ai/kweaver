import axios from 'axios'
const urlMap = {
  type: {
    ORG: 'org',
    USER: 'user',
    ALL: 'all',
    STAFF: 'user'
  },
  inputName: {
    ORGNAME: '组织',
    USERNAME: '姓名',
    ALL: '请输入'
  },
  getOrg: process.env.VUE_APP_BASE_API + '/org/searchOrg',
  getUserAndOrg: process.env.VUE_APP_BASE_API + '/org/search/organduser'
}

async function searchOrg(orgName, companyId, src) {
  const params = {
    orgName: orgName
  }
  if (companyId !== '') {
    params.companyId = companyId
  }
  let url = ''
  let rs = []
  if (src && src !== '') {
    url = src
  } else {
    url = urlMap.getOrg
  }
  await axios.get(url, { params: params }).then(res => {
    if (!res.code) {
      rs = res
    } else {
      return null
    }
  }).catch(() => {})
  return rs
}

async function searchOrgAndUser(inputName, companyId, src) {
  const params = {
    inputName: inputName
  }
  if (companyId !== '') {
    params.companyId = companyId
  }
  let url = ''
  let rs = []
  if (src && src !== '') {
    url = src
  } else {
    url = urlMap.getUserAndOrg
  }
  await axios.get(url, { params: params }).then(res => {
    if (!res.code) {
      rs = res
    } else {
      return null
    }
  }).catch(() => {})
  return rs
}

export default {
  urlMap,
  searchOrg,
  searchOrgAndUser
}
