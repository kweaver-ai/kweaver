import Request from '../request';
import ActionType from './type';

const baseUrl = '/api/ontology-manager/v1/knowledge-networks';

// 获取行动类列表
export const getActionTypes = (knId: string, params: ActionType.GetActionTypesRequest): Promise<ActionType.GetActionTypesResponse> => {
  return Request.get(`${baseUrl}/${knId}/action-types`, params);
};

// 删除行动类
export const deleteActionType = (knId: string, atIds: string[]): Promise<void> => {
  return Request.delete(`${baseUrl}/${knId}/action-types/${atIds.join(',')}`);
};

// 新建行动类
export const createActionType = (knId: string, data: ActionType.CreateActionTypeRequest) => {
  return Request.post(`${baseUrl}/${knId}/action-types`, { entries: data });
};

// 编辑行动类
export const editActionType = (knId: string, atId: string, data: ActionType.EditActionTypeRequest) => {
  return Request.put(`${baseUrl}/${knId}/action-types/${atId}`, data);
};

// 获取行动类详情
export const getActionTypeDetail = (knId: string, atIds: string[]): Promise<ActionType.ActionType[]> => {
  return Request.get<{ entries: ActionType.ActionType[] }>(`${baseUrl}/${knId}/action-types/${atIds.join(',')}`).then((response) => response.entries);
};

export default {
  getActionTypes,
  deleteActionType,
  createActionType,
  editActionType,
  getActionTypeDetail,
};
