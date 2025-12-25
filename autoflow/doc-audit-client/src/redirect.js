const base64 = require('js-base64');

if (!window.__POWERED_BY_QIANKUN__) {
  let args = window.location.href.split('?')[1]
  if (typeof args !== 'undefined') {
    let flag = navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    )
    const to = base64.Base64.decode(
      args.substring(args.indexOf('=') + 1)
    );

    if (flag) {
      const url = new URL(to);
      const { applyId, target } = url.search.slice(1).split("&").map(s => s.split("=")).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {})
      const endpoint = target == "todo" ? "tasks" : "applys";
      const path = encodeURIComponent(`${endpoint}/${applyId}/details`);
      url.pathname = url.pathname.replace(/anyshare.+/, `anyshare/m/micropage`)
      url.search = `?command=docAuditMobile&path=${path}`
      location.replace(url.toString())
    } else {
      window.location.href = to;
    }
  }
}
