import Request from '../request';
import OntologyObjectType from './type';

const baseUrl = '/api/ontology-manager/v1/knowledge-networks';

/* ==================== 对象类接口 ==================== */

/**
 * 1. 分页/过滤获取对象类列表
 * @param knId 业务知识网络 id
 * @param params 查询条件（模糊名、分页、排序等）
 */
export const objectGet = (knId: string, params?: OntologyObjectType.ListQuery): Promise<OntologyObjectType.ListObjectTypes> =>
  Request.get(`${baseUrl}/${knId}/object-types`, params);

/**
 * 2. 批量创建对象类
 * @param knId 业务知识网络 id
 * @param payload 对象类创建请求数组
 * @returns 返回新建对象类的 id 列表
 */
export const createObjectTypes = (knId: string, payload: OntologyObjectType.ReqObjectType[]): Promise<{ id: string }[]> =>
  Request.post(`${baseUrl}/${knId}/object-types`, { entries: payload });

/**
 * 3. 全量更新单个对象类
 * @param knId 业务知识网络 id
 * @param obId 对象类 id
 * @param payload 全量替换数据
 */
export const updateObjectType = (knId: string, obId: string, payload: OntologyObjectType.UpdateObjectType): Promise<void> =>
  Request.put(`${baseUrl}/${knId}/object-types/${obId}`, payload);

/**
 * 4. 批量获取对象类详情
 * @param knId 业务知识网络 id
 * @param obIds 对象类 id 数组
 * @param query include_detail 是否带回说明书
 */
export const getDetail = (knId: string, obIds: string[], query?: OntologyObjectType.DetailQuery): Promise<OntologyObjectType.Detail[]> =>
  Request.get<{ entries: OntologyObjectType.Detail[] }>(`${baseUrl}/${knId}/object-types/${obIds.join(',')}`, query).then((response) => response.entries);

/**
 * 5. 批量删除对象类
 * @param knId 业务知识网络 id
 * @param obIds 待删除对象类 id 数组
 */
export const deleteObjectTypes = (knId: string, obIds: string[]): Promise<void> => Request.delete(`${baseUrl}/${knId}/object-types/${obIds.join(',')}`);

/**
 * 获取算子列表
 * @param params 查询条件（模糊名、分页、排序等）
 */
export const getOperatorList = (params?: { page: number; page_size: number; execution_mode?: 'sync' | 'async' }): Promise<OntologyObjectType.OperatorList> =>
  Request.get(`/api/agent-operator-integration/v1/operator/market`, params);

/**
 * 获取指标模型列表
 * @param params 查询条件（模糊名、分页、排序等）
 */
export const getMetricModelList = (params?: OntologyObjectType.ListQuery): Promise<OntologyObjectType.MetricModelList> =>
  Request.get(`/api/mdl-data-model/v1/metric-models`, params);

/**
 * 获取指标模型维度字段
 * @param id 指标模型 id
 */
export const getMetricModelFields = (id: string): Promise<OntologyObjectType.MetricModelField[]> =>
  Request.get(`/api/mdl-uniquery/v1/metric-models/${id}/fields`);

/**
 * 获取小模型配置列表
 * @param params 查询条件（模糊名、分页、排序等）
 */
export const getSmallModelList = (params?: { page?: number; size?: number; model_name?: string }): Promise<OntologyObjectType.SmallModelList> =>
  Request.get(`/api/mf-model-manager/v1/small-model/list?model_type=embedding`, params);

/**
 * 对象属性索引配置
 * @param knId 业务知识网络 id
 * @param obId 对象类 id
 * @param payload 全量替换数据
 */
export const updateObjectIndex = (knId: string, obId: string, names: string[], payload: OntologyObjectType.DataProperty[]): Promise<void> =>
  Request.put(`${baseUrl}/${knId}/object-types/${obId}/data_properties/${names.join(',')}`, { entries: payload });

export default {
  objectGet,
  createObjectTypes,
  updateObjectType,
  getDetail,
  deleteObjectTypes,
  getOperatorList,
  getMetricModelList,
  getMetricModelFields,
  getSmallModelList,
  updateObjectIndex,
};
