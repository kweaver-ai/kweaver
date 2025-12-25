import request from '@/utils/anyshareRequest'

/**
 * 检查单个权限
 * @param {*} docid 文档gnsID
 * @param {*} perm 权限 "display" "preview" "download" "create" "modify" "delete"
 * @returns result 0表示OK 1表示未配置该权限 2表示拒绝该权限
 */
export function docPermCheck(docid, perm) {
  let data = { 'docid': docid, 'perm': perm }
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/eacp/v1/perm1/check`,
    method: 'post',
    data
  })
}

/**
 * 获取用户头像
 *
 * @param departmentId 用户ID
 */
export function getUserImagesList(userIds) {
  const ids = Array.isArray(userIds) ? [...userIds.filter(Boolean)] : userIds
  
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/user-management/v1/avatars/${ids}`,
    method: 'get'
  })
}

/**
 * 转换路径协议
 * @param {*} docid 文档gnsID
 * @returns namepath 名字路径
 */
export function docConvertpath(docid) {
  let data = { 'docid': docid }
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/efast/v1/file/convertpath`,
    method: 'post',
    data
  })
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/eacp/v1/user/get`,
    method: 'post'
  })
}

/**
 * 获取缩略图
 */
export function getFileThumbnail(id,type = '24*24',token,redirect = false) {
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/open-doc/v1/file-thumbnail`,
    method: 'get',
    params:{
      id,
      type,
      token,
      redirect
    }
  })
}

/**
 * 获取文件信息
 */
export function getFileAttribute(docid) {
  let data = { 'docid': docid }
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/efast/v1/file/attribute`,
    method: 'post',
    data
  })
}

/**
 * 获取文档收集提交记录详情
 */
export function getFileCollectorRecord(id) {
  return request({
    url: `${process.env.VUE_APP_ANYSHARE_URL}/api/file-collector/v1/record/${id}/objects`,
    method: 'get'
  })
}