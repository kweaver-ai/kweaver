import Cookies from 'js-cookie'

const state = {
  sidebar: {
    opened: true,
    withoutAnimation: false
  },
  device: 'desktop',
  port: '443',
  adaptToElectron: false,
  secret: {},
  trisystemstatus: false,
  context: {},
  roles: [],
  arbitrailyAuditPreview: {},
  arbitrailyAuditTemplate: {},
  custom: {},
  timestamp:null,
  plugrouter: '',
  advanceSetup:{
    allowEditPerm: true
  },
  microWidgetProps: null
}

const mutations = {
  TOGGLE_SIDEBAR: state => {
    state.sidebar.opened = !state.sidebar.opened
    state.sidebar.withoutAnimation = false
    if (state.sidebar.opened) {
      Cookies.set('sidebarStatus', 1)
    } else {
      Cookies.set('sidebarStatus', 0)
    }
  },
  CLOSE_SIDEBAR: (state, withoutAnimation) => {
    Cookies.set('sidebarStatus', 0)
    state.sidebar.opened = false
    state.sidebar.withoutAnimation = withoutAnimation
  },
  TOGGLE_DEVICE: (state, device) => {
    state.device = device
  },
  SET_PORT: (state, port) => {
    state.port = port
  },
  SET_ADAPTTOELECTRON: (state, adaptToElectron) => {
    state.adaptToElectron = adaptToElectron
  },
  SET_SECRET: (state, secret) => {
    const data = Object.assign({}, state.secret, secret)
    state.secret = data
  },
  SET_TRISYSTEMSTATUS: (state, status) => {
    state.trisystemstatus = status
  },
  SET_CONTEXT: (state, context) => {
    state.context = context
  },
  SET_ROLES: (state, roles) => {
    const data = Object.assign([], state.roles, roles)
    state.roles = data
  },
  SET_ARBITRAILY_AUDIT_PREVIEW: (state, arbitrailyAuditPreview) => {
    state.arbitrailyAuditPreview = typeof arbitrailyAuditPreview === 'undefined' ? {} : arbitrailyAuditPreview
  },
  SET_ARBITRAILY_AUDIT_TEMPLATE: (state, arbitrailyAuditTemplate) => {
    state.arbitrailyAuditTemplate = typeof arbitrailyAuditTemplate === 'undefined' ? {} : arbitrailyAuditTemplate
  },
  SET_CUSTOM: (state, custom) => {
    state.custom = typeof custom === 'undefined' ? {} : custom
  },
  SET_PLUGROUTER: (state, plugrouter) => {
    state.plugrouter = plugrouter
  },
  SET_ADVANCESETUP: (state, advanceSetup) => {
    state.advanceSetup = advanceSetup
  },
  SET_MICROWIDGETPROPS: (state, microWidgetProps) => {
    state.microWidgetProps = microWidgetProps
  },
  SET_TIMESTAMP: (state, timestamp) => {
    state.timestamp = timestamp
  }
}

const actions = {
  toggleSideBar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  closeSideBar({ commit }, { withoutAnimation }) {
    commit('CLOSE_SIDEBAR', withoutAnimation)
  },
  toggleDevice({ commit }, device) {
    commit('TOGGLE_DEVICE', device)
  },
  setPort({ commit }, port) {
    commit('SET_PORT', port)
  },
  setAdaptToElectron({ commit }, adaptToElectron) {
    commit('SET_ADAPTTOELECTRON', adaptToElectron)
  },
  setSecret({ commit }, secret) {
    commit('SET_SECRET', secret)
  },
  setTrisystemstatus({ commit }, status) {
    commit('SET_TRISYSTEMSTATUS', status)
  },
  setContext({ commit }, context) {
    commit('SET_CONTEXT', context)
  },
  setRoles({ commit }, roles) {
    commit('SET_ROLES', roles)
  },
  setArbitrailyAuditPreview({ commit }, arbitrailyAuditPreview) {
    commit('SET_ARBITRAILY_AUDIT_PREVIEW', arbitrailyAuditPreview)
  },
  setArbitrailyAuditTemplate({ commit }, arbitrailyAuditTemplate) {
    commit('SET_ARBITRAILY_AUDIT_TEMPLATE', arbitrailyAuditTemplate)
  },
  setCustom({ commit }, custom) {
    commit('SET_CUSTOM', custom)
  },
  setPlugrouter({ commit }, plugrouter) {
    commit('SET_PLUGROUTER', plugrouter)
  },
  setAdvanceSetup({ commit }, advanceSetup) {
    commit('SET_ADVANCESETUP', advanceSetup)
  },
  setMicroWidgetProps({ commit }, microWidgetProps) {
    commit('SET_MICROWIDGETPROPS', microWidgetProps)
  },
  setTimestamp({ commit }, timestamp) {
    commit('SET_TIMESTAMP', timestamp)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
