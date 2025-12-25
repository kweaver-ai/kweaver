import request from '@/utils/request'

// 模块基础路由
const parm = '/free-audit/'
const base = `${process.env.VUE_APP_BASE_API}` + parm

/**
 * 查询配置
 * @returns
 */
export function config() {
  return request({
    url: base + '',
    method: 'get'
  })
}
/**
 * 修改配置
 * @param {String} data
 * @returns
 */
export function update(data) {
  return request({
    url: base,
    method: 'put',
    data
  })
}
/**
 * 分页(搜索)查询免审部门接口
 * @param {参数} params
 * @returns
 */
export function page_search_dept(params) {
  return request({
    url: base + 'department',
    method: 'get',
    params
  })
}
/**
 * 添加免审部门接口
 * @param {参数} data
 * @returns
 */
export function save_dept(data) {
  return request({
    url: base + 'department',
    method: 'post',
    data,
    headers:{'Content-Type':'application/json; charset=UTF-8'}
  })
}
/**
 * 删除免审部门接口
 * @param {id} id
 * @returns
 */
export function delete_dept(ids) {
  return request({
    url: base + `department/${ids}`,
    method: 'delete'
  })
}
