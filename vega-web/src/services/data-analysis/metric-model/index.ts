/** 指标模型接口 */
import _ from 'lodash';
import apiService from '@/utils/axios-http';
import { formatKeyOfObjectToCamel, formatKeyOfObjectToLine, formatCamelToLine } from '@/utils/format-objectkey-structure';
import { MetricModelList, MetricModelItem, queryType } from '@/pages/MetricModel/type';
import { transformData } from '../data-dict/transformData';

const url = '/api/mdl-data-model/v1/metric-models';

const getMetricModelList = async ({
  limit = -1,
  offset = 0,
  sort = 'update_time',
  direction = 'desc',
  namePattern = '',
  queryType = [],
  tag = '',
  groupId,
  metricType = '',
  simpleInfo = false,
}: any): Promise<MetricModelList> => {
  const groupIdVal = groupId === undefined || groupId === null ? '__all' : groupId || '';
  const res = await apiService.axiosGet(
    `${url}?name_pattern=${encodeURIComponent(namePattern)}&sort=${formatCamelToLine(sort)}&query_type=${queryType.join(
      ','
    )}&direction=${direction}&offset=${offset}&limit=${limit}&tag=${tag}&group_id=${groupIdVal}&simple_info=${simpleInfo}&metric_type=${metricType}`
  );

  return transformData(res);
};

const getMetricModelExportGroup = async (groupId: string): Promise<MetricModelList> => {
  const res = await apiService.axiosGet(`/api/mdl-data-model/v1/metric-model-groups/${groupId}/metric-models`);

  return transformData(res);
};

const getMetricModelById: any = async (id: any) => {
  const res = await apiService.axiosGet(`${url}/${id}`);
  const { formula, query_type: queryTypeValue, ...restValues } = res[0] || {};
  return res[0]
    ? {
        [`${queryTypeValue}Formula`]: queryTypeValue === queryType.Dsl ? JSON.parse(formula) : formula,
        queryType: queryTypeValue,
        formula,
        ...formatKeyOfObjectToCamel(restValues),
      }
    : {};
};

const getMetricModelByIds = async (ids: any): Promise<MetricModelItem[]> => {
  const res = await apiService.axiosGet(`${url}/${ids.join(',')}`);
  return res;
};

const createMetricModel = async (values: any): Promise<{ id: number }[]> => {
  const res = await apiService.axiosPost(url, [formatKeyOfObjectToLine(_.cloneDeep(values))]);
  return res || [];
};

const updateMetricModel = async (values: any, id: any): Promise<any> => {
  const res = await apiService.axiosPut(`${url}/${id}`, formatKeyOfObjectToLine(values));
  return res;
};

const batchCreateMetricModel = async (values: any, importMode?: string): Promise<any> => {
  const curUrl = importMode ? `${url}?import_mode=${importMode}` : url;
  const res = await apiService.axiosPostOverridePost(curUrl, values, {
    isNoHint: true,
  });

  return res;
};

const deleteMetricModel = async (id: any): Promise<any> => {
  const res = await apiService.axiosDelete(`${url}/${id}`);

  return res;
};

const fetchMetricPreviewData = async (values: any, id?: string): Promise<any> => {
  const previewUrl = id ? `/api/mdl-uniquery/v1/metric-models/${id}?include_model=true` : '/api/mdl-uniquery/v1/metric-model';
  const res = await apiService.axiosPostOverrideGet(previewUrl, {
    ...formatKeyOfObjectToLine(values),
  });

  return res;
};

const tagURL = 'api/mdl-data-model/v1/object-tags/';

const getAllTags = async (): Promise<any> => {
  const params = {
    name_pattern: '',
    sort: 'tag',
    direction: 'asc',
    limit: -1,
    offset: 0,
  };

  return await apiService.axiosGet(tagURL, { params });
};

const getMetricModelTags = async (): Promise<any> => {
  const params = {
    name_pattern: '',
    sort: 'tag',
    direction: 'asc',
    limit: -1,
    offset: 0,
    module: 'metric-model',
  };

  return await apiService.axiosGet(tagURL, { params });
};

/**
 * @description 获取日志分组下的字段信息
 * @param {*} id 日志分组id
 * @param {*} type 类型
 * @returns {*}
 */
const getFields = async (id: any) => {
  const res = await apiService.axiosGet(`manager/loggroup/${id}/allFields`);

  return res;
};

// --------------
// 分组相关接口
// --------------

const groupURL = '/api/mdl-data-model/v1/metric-model-groups';

const getGroupList = async () => {
  const params = {
    limit: -1, // 不分页
  };

  return await apiService.axiosGet(groupURL, { params });
};

const createGroup = async (name: string, comment = '') => {
  const data = {
    name,
    comment,
  };

  return await apiService.axiosPost(groupURL, data);
};

const updateGroup = async (groupId: any, name: string, comment = '') => {
  const data = {
    name,
    comment,
  };

  return await apiService.axiosPut(`${groupURL}/${groupId}`, data);
};

const deleteGroup = async (groupId: any, force: boolean) => {
  const params = {
    force,
  };

  return await apiService.axiosDelete(`${groupURL}/${groupId}`, { params });
};

const batchChangeMetricModelGroup = async (metricModelIds: Array<string>, groupName: string) => {
  const ids = metricModelIds.join();
  const data = {
    group_name: groupName,
  };

  return await apiService.axiosPut(`${url}/${ids}/attributes`, data);
};

type MetricOrderField = {
  display_name: string;
  name: string;
  type: string;
  comment: string;
};

const getMetricOrderFields = async (modelIds: string[]): Promise<MetricOrderField[][]> => {
  return await apiService.axiosGet(`${url}/${modelIds.join(',')}/order_fields`);
};

export default {
  getMetricModelList,
  getMetricModelExportGroup,
  fetchMetricPreviewData,
  getMetricModelById,
  getMetricModelByIds,
  createMetricModel,
  updateMetricModel,
  batchCreateMetricModel,
  deleteMetricModel,
  getAllTags,
  getMetricModelTags,
  getFields,
  getGroupList,
  createGroup,
  updateGroup,
  deleteGroup,
  batchChangeMetricModelGroup,
  getMetricOrderFields,
};
