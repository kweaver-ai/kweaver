import Request from '../request';
import ConceptGroupType from './type';

const baseUrl = '/api/ontology-manager/v1/knowledge-networks';

// 创建概念分组
export const createConceptGroup = (knId: string, data: ConceptGroupType.CreateRequest, mode?: 'ignore' | 'overwrite'): Promise<any> => {
  const url = mode ? `${baseUrl}/${knId}/concept-groups?import_mode=${mode}` : `${baseUrl}/${knId}/concept-groups`;
  return Request.post<any>(`${url}`, data, { isNoHint: true });
};

// 修改概念分组
export const updateConceptGroup = (knId: string, groupId: string, data: ConceptGroupType.UpdateRequest): Promise<any> => {
  return Request.put<any>(`${baseUrl}/${knId}/concept-groups/${groupId}`, data);
};

// (批量) 删除概念分组
export const deleteConceptGroup = (knId: string, groupIds: string[]): Promise<any> => {
  return Request.delete(`${baseUrl}/${knId}/concept-groups/${groupIds.join(',')}`);
};

// 获取概念分组列表
export const queryConceptGroups = (knId: string, params: ConceptGroupType.ListQuery): Promise<ConceptGroupType.List> => {
  return Request.get<ConceptGroupType.List>(`${baseUrl}/${knId}/concept-groups`, params);
};

// 获取概念分组详情
export const detailConceptGroup = (knId: string, groupId: string): Promise<ConceptGroupType.Detail> => {
  return Request.get<ConceptGroupType.Detail>(`${baseUrl}/${knId}/concept-groups/${groupId}`);
};

// 添加对象类
export const addObjectTypesToGroup = (knId: string, groupId: string, data: ConceptGroupType.AddObjectTypesRequest): Promise<any> => {
  return Request.post<any>(`${baseUrl}/${knId}/concept-groups/${groupId}/object-types`, data);
};

// 移除对象类
export const removeObjectTypesFromGroup = (knId: string, groupId: string, otIds: string[]): Promise<any> => {
  return Request.delete(`${baseUrl}/${knId}/concept-groups/${groupId}/object-types/${otIds.join(',')}`);
};

export default {
  createConceptGroup,
  updateConceptGroup,
  deleteConceptGroup,
  queryConceptGroups,
  detailConceptGroup,
  addObjectTypesToGroup,
  removeObjectTypesFromGroup,
};
