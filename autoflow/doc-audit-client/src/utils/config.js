export let tenantId = 'as_workflow'

export function setTenantId(id) {
  tenantId = id
}

export let isSafari = false

export function setIsSafari() {
  try {
    const userAgent = window.navigator.userAgent

    if (!(/Chrome\/[\d\.]+/i.test(userAgent))) {
      if (/Safari\/[\d\.]+$/i.test(userAgent)) {
        isSafari = true
      }
    }
  } catch { }
}
