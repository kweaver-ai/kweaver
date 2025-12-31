import Request from '../request';
import DataConnectType from './type';

const baseUrl = '/api/data-connection/v1/datasource';
const connectorsUrl = '/api/data-connection/v1/datasource/connectors';

// 获取数据源列表
export const getDataSourceList = (params: {
  offset?: number;
  limit?: number;
  sort?: string;
  direction?: string;
  keyword?: string;
  type?: string;
}): Promise<DataConnectType.List> => {
  const curSort = params.sort || 'updated_at';
  const queryParams = {
    sort: curSort,
    direction: params.direction || 'desc',
    limit: params.limit || -1,
    offset: params.offset || 0,
    keyword: params.keyword,
    type: params.type === 'all' ? '' : params.type,
  };

  return Request.get<DataConnectType.List>(baseUrl, queryParams);
};

// 根据ID获取数据源详情
export const getDataSourceById = async (id: string): Promise<DataConnectType.Data> => {
  const res = await Request.get<DataConnectType.Data>(`${baseUrl}/${id}`);
  const newRes = {
    ...res,
    deployMethod: res.bin_data.replica_set ? 1 : 0,
    authMethod: res.bin_data.token ? 1 : 0,
  };
  return newRes;
};

// 获取数据源连接器列表
export const getDataSourceConnectors = (): Promise<DataConnectType.Connectors> => {
  return Request.get<DataConnectType.Connectors>(connectorsUrl);
};

// 创建数据源
export const createDataSource = (data: Partial<DataConnectType.Data>): Promise<{ id: number }[]> => {
  return Request.post<{ id: number }[]>(baseUrl, data);
};

// 更新数据源
export const updateDataSource = (id: string, data: Partial<DataConnectType.Data>): Promise<any> => {
  return Request.put<any>(`${baseUrl}/${id}`, data);
};

// 测试数据源连接
export const postTestConnect = (data: Partial<DataConnectType.Data>): Promise<{ id: number }[]> => {
  return Request.post<{ id: number }[]>(`${baseUrl}/test`, data);
};

// 删除数据源
export const deleteDataSource = (ids: string[]): Promise<any> => {
  return Request.delete<any>(`${baseUrl}/${ids.join(',')}`);
};

// 根据名称获取数据源
export const getDataSourceByName = (name: string): Promise<any> => {
  return Request.get<any>(`${baseUrl}?name=${name}`);
};

export default {
  getDataSourceList,
  getDataSourceById,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  getDataSourceConnectors,
  getDataSourceByName,
  postTestConnect,
};
