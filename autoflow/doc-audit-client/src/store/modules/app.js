const state = {
  context: null,
  microWidgetProps: null,
  arbitrailyAuditLog: {},
  isElectron: false,
  secret: {}
}

const mutations = {
  SET_MICROWIDGETPROPS: (state, microWidgetProps) => {
    state.microWidgetProps = microWidgetProps
  },
  SET_ARBITRAILY_AUDIT_LOG: (state, arbitrailyAuditLog) => {
    const data = Object.assign({}, state.arbitrailyAuditLog, arbitrailyAuditLog)
    state.arbitrailyAuditLog = data
  },
  SET_SECRET: (state, secret) => {
    const data = Object.assign({}, state.secret, secret)
    state.secret = data
  },
  SET_IS_ELECTRON: (state, isElectron) => {
    state.isElectron = isElectron
  },
  SET_CONTEXT: (state, context) => {
    state.context = context
  }
}

const actions = {
  setContext({ commit }, context) {
    commit('SET_CONTEXT', context)
  },
  setMicroWidgetProps ({ commit }, microWidgetProps) {
    commit('SET_MICROWIDGETPROPS', microWidgetProps)
  },
  setArbitrailyAuditLog ({ commit }, arbitrailyAuditLog) {
    commit('SET_ARBITRAILY_AUDIT_LOG', arbitrailyAuditLog)
  },
  setSecret({ commit }, secret) {
    commit('SET_SECRET', secret)
  },
  setIsElectron({ commit }, isElectron) {
    commit('SET_IS_ELECTRON', isElectron)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
