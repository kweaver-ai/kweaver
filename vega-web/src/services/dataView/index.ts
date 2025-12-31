import _ from 'lodash';
import apiService from '@/utils/axios-http';
import Service from '@/utils/axios-http/service';
import { formatKeyOfObjectToCamel, formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import API from '@/services/api';
import Request from '@/services/request';
import DataViewType from './type';

/** 获取对象类类列表 */
const dataViewGet = async (data: any): Promise<DataViewType.DataViewGet_ResultType> => {
  return await Request.get(API.dataViewGet, data);
};

/** 获取数据视图详情 */
const dataViewGetDetail = async (id: string): Promise<DataViewType.DataViewGetDetail_ResultType> => {
  return await Request.get(API.getDataViewById(id));
};

const modelUrl = '/api/data-connection/v1';

// 获取视图分组信息
const getDatasource = async (params: any): Promise<any> => {
  return await Request.get(`${modelUrl}/datasource`, params);
};

// 查询excel 数据源
const getExcelFiles = async (fileName: string): Promise<{ data: string[] }> => {
  return await Request.get(`${modelUrl}/gateway/excel/files/${fileName}`, {}, { timeout: 60000 });
};

// 获取原子视图列表
const getAtomViewList = async ({
  excelFileName = '',
  dataSourceType,
  dataSourceId,
  offset,
  limit,
  sort = 'update_time',
  direction = 'desc',
  name = '',
  tag = '',
}: any): Promise<any> => {
  const fileName = excelFileName ? `&file_name=${excelFileName}` : '';
  const dataSourceTypeStr = dataSourceType ? `&data_source_type=${dataSourceType}` : '';
  const dataSourceIdStr = dataSourceId ? `&data_source_id=${dataSourceId}` : '';
  const res = await Request.get(
    `/api/mdl-data-model/v1/data-views?name_pattern=${encodeURIComponent(name)}&sort=${sort}&direction=${direction}&offset=${offset}&limit=${limit}&tag=${
      tag || ''
    }${fileName}${dataSourceTypeStr}${dataSourceIdStr}`
  );

  return res;
};

// 数据预览
const getViewDataPreview = async (ids: any, values: any): Promise<any> => {
  return await Request.post(`/api/mdl-uniquery/v1/data-views/${ids}?include_view=${true}`, formatKeyOfObjectToLine(values), {
    headers: { 'x-http-method-override': 'GET' },
  });
};

/** 获取数据视图列表 */
const { getDataList } = new Service(API.getDataView);

/** 通过 ID 获取数据视图详情 */
const getDataViewById = async (id: any): Promise<any> => {
  const res = await apiService.axiosGet(API.getDataViewById(id));
  if (res.code) return res;
  const result = _.map(res, (item) => formatKeyOfObjectToCamel(item));
  return result;
};

/** 获取数据视图分组 */
const getDataViewGroup = async () => {
  const params = { limit: -1 };
  const res = await apiService.axiosGet(API.getDataViewGroup, { params });
  return formatKeyOfObjectToCamel(res);
};

export default {
  dataViewGet,
  dataViewGetDetail,
  getDatasource,
  getExcelFiles,
  getAtomViewList,
  getViewDataPreview,
  getDataList,
  getDataViewById,
  getDataViewGroup,
};
