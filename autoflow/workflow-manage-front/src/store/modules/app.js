import Cookies from 'js-cookie'

const state = {
  sidebar: {
    opened: true,
    withoutAnimation: false
  },
  device: 'desktop',
  port: '443',
  trisystemstatus: false,
  context: {},
  roles: [],
  share: {},
  sync: {},
  arbitraily: {},
  previewBox:{
    width:590,
    height:520,
    background: '#f5f5f5'
  },
  secret: {},
  plugrouter: ''
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
  SET_SHARE: (state, share) => {
    const data = Object.assign({}, state.share, share)
    state.share = data
  },
  SET_SYNC: (state, sync) => {
    const data = Object.assign({}, state.sync, sync)
    state.sync = data
  },
  SET_ARBITRAILY: (state, arbitraily) => {
    const data = Object.assign({}, state.arbitraily, arbitraily)
    state.arbitraily = data
  },
  SET_PREVIEWBOX: (state, previewBox) => {
    const data = Object.assign({}, state.previewBox, previewBox)
    state.previewBox = data
  },
  SET_SECRET: (state, secret) => {
    const data = Object.assign({}, state.secret, secret)
    state.secret = data
  },
  SET_PLUGROUTER: (state, plugrouter) => {
    state.plugrouter = plugrouter
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
  setTrisystemstatus({ commit }, status) {
    commit('SET_TRISYSTEMSTATUS', status)
  },
  setContext({ commit }, context) {
    commit('SET_CONTEXT', context)
  },
  setRoles({ commit }, roles) {
    commit('SET_ROLES', roles)
  },
  setShare({ commit }, share) {
    commit('SET_SHARE', share)
  },
  setSync({ commit }, sync) {
    commit('SET_SYNC', sync)
  },
  setArbitraily({ commit }, arbitraily) {
    commit('SET_ARBITRAILY', arbitraily)
  },
  setPreviewBox({ commit }, previewBox) {
    commit('SET_PREVIEWBOX', previewBox)
  },
  setSecret({ commit }, secret) {
    commit('SET_SECRET', secret)
  },
  setPlugrouter({ commit }, plugrouter) {
    commit('SET_PLUGROUTER', plugrouter)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
