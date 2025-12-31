import Request from '../request';
import OntologyQuery from './type';

const baseUrl = '/api/ontology-query/v1/knowledge-networks/';

/**
 * 查对象实例（支持两种查询模式）
 * POST /api/ontology-query/v1/knowledge-networks/{kn_id}
 * @param knId 知识网络 ID
 * @param queryType 查询类型
 * @param data 请求体
 */
export const searchObjects = async (
  knId: OntologyQuery.KnowledgeNetworkID,
  queryType: OntologyQuery.QueryTypeEnum,
  data: OntologyQuery.ObjectQueryRequest
): Promise<OntologyQuery.SearchResponse> => Request.post(`${baseUrl}${knId}?query_type=${queryType}`, data, { headers: { 'X-HTTP-Method-Override': 'GET' } });

/**
 * 子图查询
 * POST /api/ontology-query/v1/knowledge-networks/{kn_id}/subgraph
 * @param knId 知识网络 ID
 * @param body 子图查询参数
 */
export const querySubgraph = async (knId: OntologyQuery.KnowledgeNetworkID, body: OntologyQuery.SubgraphQueryBody): Promise<OntologyQuery.SubgraphResponse> =>
  Request.post(`${baseUrl}${knId}/subgraph`, body, { headers: { 'X-HTTP-Method-Override': 'GET' } });

/**
 * 属性查询
 * POST /api/ontology-query/v1/knowledge-networks/{kn_id}/object-types/{ot_id}/properties/{property_names}
 * @param knId 知识网络 ID
 * @param otId 对象类 ID
 * @param propertyNames 属性名数组
 * @param body 查询参数
 */
export const queryProperties = async (
  knId: OntologyQuery.KnowledgeNetworkID,
  otId: OntologyQuery.ObjectTypeID,
  propertyNames: OntologyQuery.PropertyName[],
  body: OntologyQuery.PropertyQueryBody
): Promise<OntologyQuery.Object[]> =>
  Request.post(`${baseUrl}${knId}/object-types/${otId}/properties/${propertyNames.join(',')}`, body, { headers: { 'X-HTTP-Method-Override': 'GET' } });

/**
 * 获取指定对象类的对象实例（分页）
 * POST /api/ontology-query/v1/knowledge-networks/{kn_id}/object-types/{ot_id}
 * @param knId 知识网络 ID
 * @param otId 对象类 ID
 * @param body 分页及过滤参数condition
 * @param includeTypeInfo 是否返回对象类元信息
 * @param includeLogicParams 是否返回逻辑属性计算参数
 */
export const listObjects = async ({
  knId,
  otId,
  body,
  includeTypeInfo = false,
  includeLogicParams = false,
}: OntologyQuery.ListObjectsRequest): Promise<OntologyQuery.ObjectDataResponse> =>
  Request.post(`${baseUrl}${knId}/object-types/${otId}`, body, {
    params: { include_type_info: includeTypeInfo, include_logic_params: includeLogicParams },
    headers: { 'X-HTTP-Method-Override': 'GET' },
  });

/**
 * 行动查询
 * POST /api/ontology-query/v1/knowledge-networks/{kn_id}/action-types/{action_id}
 * @param knId 知识网络 ID
 * @param actionId 行动类 ID
 * @param body 行动参数
 */
export const queryAction = async (knId: OntologyQuery.KnowledgeNetworkID, actionId: string, body: any = {}): Promise<any> =>
  Request.post(`${baseUrl}${knId}/action-types/${actionId}`, body, { headers: { 'X-HTTP-Method-Override': 'GET' } });
