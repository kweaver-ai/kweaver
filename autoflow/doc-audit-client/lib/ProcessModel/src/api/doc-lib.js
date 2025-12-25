import request from '@/utils/request'

export function getDocLibList(type, params) {
  return request({
    url: `${process.env.VUE_APP_AS_OPEN_API}/efast/v1/doc-lib/${type}?offset=0&limit=20`,
    method: 'get',
    params
  })
}
