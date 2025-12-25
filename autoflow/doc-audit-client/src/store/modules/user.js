import axios from 'axios'
const state = {
  curUser: {},
  staffUrl: process.env.VUE_APP_AUDIT_REST_PATH + '/staff/ivuser',
  sysAdminList: [],
  sysStatus: false
}

const mutations = {
  SET_USER: (state, curUser) => {
    sessionStorage.setItem('curUser', JSON.stringify(curUser))
    state.curUser = curUser
  },
  SET_SYS_STATUS: (state, sysStatus) => {
    state.sysStatus = sysStatus
  }
}

const actions = {
  // 关联后台接口数据
  async getAssociated ({ commit }, value) {
    let rs = []
    let url = value
    await axios
      .get(url)
      .then(res => {
        if (res.data instanceof Array) {
          rs = res.data
        } else {
          if (res.data.resultCode === 200) {
            rs = res.data.result
          }
        }
      })
      .catch(error => {
        console.log('getUrlConfig-->getDictValue' + error)
      })
    return rs
  },
  // 获取当前表单的用户
  getStaff ({ commit, state }, urlType) {
    return new Promise(function (resolve, reject) {
      axios.get(state.staffUrl).then(res => {
        let userInfo = res.data.result
        commit('SET_USER', userInfo)
        if (urlType === 'sys' && !userInfo.isAppAdmin) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('err')
        }
        resolve('ok')
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
