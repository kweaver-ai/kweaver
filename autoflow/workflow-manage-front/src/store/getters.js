const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  port: state => state.app.port,
  trisystemstatus: state => state.app.trisystemstatus,
  context: state => state.app.context,
  roles: state => state.app.roles,
  share: state => state.app.share,
  sync: state => state.app.sync,
  arbitraily: state => state.app.arbitraily,
  secret: state => state.app.secret,
  plugrouter: state => state.app.plugrouter,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name
}
export default getters
