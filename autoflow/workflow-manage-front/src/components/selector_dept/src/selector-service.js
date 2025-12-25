import axios from 'axios'
import request from '@/utils/request'
const urlMap = {
  type: {
    ORG: 'depart',
    USER: 'user',
    ALL: 'all',
    STAFF: 'user'
  },
  inputName: {
    ORGNAME: '组织',
    USERNAME: '姓名',
    ALL: '请输入'
  },
  getOrg: process.env.VUE_APP_AS_OPEN_API + `/user-management/v1/`,
  getUserAndOrg: process.env.VUE_APP_BASE_API + '/org/search/organduser'
}

/**
 * 搜索部门接口
 */
async function searchOrg(orgName, companyId, src) {
  return request({
    url:urlMap.getOrg+`search-in-org-tree?keyword=${orgName}&role=super_admin&type=department`
  })
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
  }).catch(error => {
    console.log('user-selector.js-->searchOrgAndUser' + error)
  })
  return rs
}

export default {
  urlMap,
  searchOrg,
  searchOrgAndUser
}
