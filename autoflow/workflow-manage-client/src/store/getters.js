const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  port: state => state.app.port,
  trisystemstatus: state => state.app.trisystemstatus,
  context: state => state.app.context,
  roles: state => state.app.roles,
  arbitrailyAuditPreview: state => state.app.arbitrailyAuditPreview,
  arbitrailyAuditTemplate: state => state.app.arbitrailyAuditTemplate,
  plugrouter: state => state.app.plugrouter,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  microWidgetProps: state => state.app.microWidgetProps,
  timestamp: state => state.app.timestamp

}
export default getters
