/** 权限服务 */
export const base_url_authorization = '/api/authorization/v1';
/** 本体引擎服务 */
export const base_url_knowledge = '/api/ontology-manager/v1/knowledge-networks';
/** 数据视图服务 */
export const base_url_mdl_data_model = '/api/mdl-data-model/v1';

const API = {
  authorizationGetResourceType: `${base_url_authorization}/resource-type-operation`,

  // 数据视图接口
  /** 获取数据视图列表 */
  getDataView: `${base_url_mdl_data_model}/data-views`,
  /** 获取数据视图分组 */
  dataViewGet: `${base_url_mdl_data_model}/data-sources`,
  /** 获取数据视图详情 */
  getDataViewById: (id: string) => `${base_url_mdl_data_model}/data-views/${id}`,
  /** 获取数据视图分组信息 */
  getDataViewGroup: `${base_url_mdl_data_model}/data-view-groups`,

  // 对象类接口
  /** 获取对象类列表 */
  objectGet: (knId: string) => `${base_url_knowledge}/${knId}/object-types`,

  // 关系类接口
  /** 创建关系类 */
  edgePost: (knId: string) => `${base_url_knowledge}/${knId}/relation-types`,
  /** 删除关系类 */
  edgeDelete: (knId: string, reIds: string) => `${base_url_knowledge}/${knId}/relation-types/${reIds}`,
  /** 修改关系类 */
  edgePut: (knId: string, rtId: string) => `${base_url_knowledge}/${knId}/relation-types/${rtId}`,
  /** 获取关系类列表 */
  edgeGet: (knId: string) => `${base_url_knowledge}/${knId}/relation-types`,
  /** 获取关系类详情 */
  edgeGetDetail: (knId: string, rtId: string) => `${base_url_knowledge}/${knId}/relation-types/${rtId}`,
};

export default API;
