const getters = {
  curUser: state => state.user.curUser,
  microWidgetProps: state => state.app.microWidgetProps,
  dictList: state => state.dict.dictList,
  arbitrailyAuditLog: state => state.app.arbitrailyAuditLog,
  secret: state => state.app.secret,
  isElectron: state => state.app.isElectron
}
export default getters
