/**
 * 行列权限管理服务
 * 提供行列权限规则的查询、创建、更新、删除等接口
 * 基于 '/api/mdl-data-model/v1/data-view-row-column-rules' 基础路径
 */
import Request from '../request';
import RowColumnPermissionType from './type';

const baseUrl = '/api/mdl-data-model/v1/data-view-row-column-rules';

/**
 * 根据视图ID查询视图行列规则列表
 * @param ids 视图ID或多个ID（逗号分隔）
 * @param params 查询参数
 * @returns 行列规则列表数据
 */
export const getRowColumnRulesByViewId = (params?: RowColumnPermissionType.QueryParams): Promise<RowColumnPermissionType.List> => {
  const queryParams = {
    view_id: params?.view_id || '',
    sort: params?.sort || 'update_time',
    direction: params?.direction || 'desc',
    limit: params?.limit || 20,
    offset: params?.offset || 0,
    keyword: params?.keyword || '',
  };

  return Request.get<RowColumnPermissionType.List>(`${baseUrl}`, queryParams);
};

/**
 * 创建行列规则
 * @param data 规则数据
 * @returns 创建结果
 */
export const createRowColumnRule = (data: RowColumnPermissionType.CreateRuleParams[]): Promise<{ id: string }> => {
  return Request.post<{ id: string }>(baseUrl, data);
};

/**
 * 更新行列规则
 * @param id 规则ID
 * @param data 更新数据
 * @returns 更新结果
 */
export const updateRowColumnRule = (id: string, data: RowColumnPermissionType.CreateRuleParams): Promise<any> => {
  return Request.put<any>(`${baseUrl}/${id}`, data);
};

/**
 * 删除行列规则
 * @param ids 规则ID或多个ID数组
 * @returns 删除结果
 */
export const deleteRowColumnRule = (ids: string | string[]): Promise<any> => {
  const ruleIds = Array.isArray(ids) ? ids.join(',') : ids;
  return Request.delete<any>(`${baseUrl}/${ruleIds}`);
};

/**
 * 根据ID查询单个行列规则详情
 * @param id 规则ID
 * @returns 规则详情
 */
export const getRowColumnRuleById = (id: string): Promise<RowColumnPermissionType.Rule> => {
  return Request.get<RowColumnPermissionType.Rule>(`${baseUrl}/${id}`);
};

/**
 * 复制行列规则
 * @param id 规则ID
 * @param newName 新规则名称
 * @returns 复制结果
 */
export const copyRowColumnRule = (id: string, newName: string): Promise<{ id: string }> => {
  return Request.post<{ id: string }>(`${baseUrl}/${id}/copy`, { name: newName });
};

export default {
  getRowColumnRulesByViewId,
  createRowColumnRule,
  updateRowColumnRule,
  deleteRowColumnRule,
  getRowColumnRuleById,
  copyRowColumnRule,
};
