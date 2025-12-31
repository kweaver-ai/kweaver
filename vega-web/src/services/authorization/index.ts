import API from '@/services/api';
import Request from '../request';

/** 获取资源操作 */
export type AuthorizationGetResourceType = { id: string; type: string }[];

const resourceTypes = [
  'knowledge_network',
  'metric_model',
  'objective_model',
  'event_model',
  'data_dict',
  'trace_model',
  'data_view',
  'vega_logic_view',
  'field_model',
  'index_base',
  'index_base_policy',
  'repository',
  'stream_data_pipeline',
  'data_connection',
];

const authorizationGetResourceType: any = async (data?: AuthorizationGetResourceType) => {
  const res = await Request.post(API.authorizationGetResourceType, { method: 'GET', resource_types: data || resourceTypes });

  return res;
};

export default {
  resourceTypes,
  authorizationGetResourceType,
};
