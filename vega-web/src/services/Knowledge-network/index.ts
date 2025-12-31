import frameworkProps from '@/utils/axios-http/frameworkProps';
import Request from '../request';
import KnowledgeNetworkType from './type';

const baseUrl = '/api/ontology-manager/v1/knowledge-networks';

// 查询业务知识网络列表
export const queryNetworks = (params: KnowledgeNetworkType.ListQuery): Promise<KnowledgeNetworkType.List> => {
  const xBusinesDomain = frameworkProps.data?.businessDomainID;
  return Request.get<KnowledgeNetworkType.List>(`${baseUrl}`, params, { headers: { 'x-business-domain': xBusinesDomain } });
};

// 创建新的业务知识网络
export const createNetwork = (data: KnowledgeNetworkType.CreateRequest, params?: 'ignore' | 'overwrite'): Promise<any> => {
  const xBusinesDomain = frameworkProps.data?.businessDomainID;
  const url = params ? `${baseUrl}?import_mode=${params}` : baseUrl;
  return Request.post<any>(`${url}`, data, { isNoHint: true, headers: { 'x-business-domain': xBusinesDomain } });
};

// 修改业务知识网络
export const updateNetwork = (knId: string, data: KnowledgeNetworkType.UpdateRequest): Promise<KnowledgeNetworkType.Detail> => {
  return Request.put<KnowledgeNetworkType.Detail>(`${baseUrl}/${knId}`, data);
};

// 获取业务知识网络详情
export const detailNetwork = (val: {
  knIds: string[];
  mode?: 'export';
  includeDetail?: boolean;
  include_statistics?: boolean;
}): Promise<KnowledgeNetworkType.Detail> => {
  const { knIds, mode, includeDetail, include_statistics } = val;
  return Request.get<KnowledgeNetworkType.Detail>(`${baseUrl}/${knIds.join(',')}`, { include_detail: !!includeDetail, mode, include_statistics });
};

// 删除业务知识网络
export const deleteNetwork = (knIds: string[]): Promise<any> => {
  return Request.delete(`${baseUrl}/${knIds.join(',')}`);
};

export default {
  queryNetworks,
  createNetwork,
  updateNetwork,
  detailNetwork,
  deleteNetwork,
};
