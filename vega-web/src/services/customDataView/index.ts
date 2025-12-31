import apiService from '@/utils/axios-http';
import { formatCamelToLine, formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import { GroupType } from '@/pages/CustomDataView/type';
import { transformData } from '../data-analysis/data-dict/transformData';
import Request from '../request';

interface PaginationParams {
  limit?: number;
  offset?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

interface DataViewListParams extends PaginationParams {
  namePattern?: string;
  queryType?: string[];
  tag?: string;
  groupId?: string | null;
  simpleInfo?: boolean;
  type?: string;
}

interface AtomViewListParams extends PaginationParams {
  excelFileName?: string;
  dataSourceType?: string;
  dataSourceId?: string;
  name?: string;
  tag?: string;
  type?: string;
  queryType?: string;
}

// API URL 常量
const API_BASE_URL = '/api/mdl-data-model/v1';
const GROUP_API_URL = `${API_BASE_URL}/data-view-groups`;
const DATA_VIEW_API_URL = `${API_BASE_URL}/data-views`;
const TAG_API_URL = `${API_BASE_URL}/object-tags`;

/**
 * 构建查询参数字符串的工具函数
 * @param params 参数对象
 * @returns URL查询字符串
 */
const buildQueryString = (params: Record<string, any>): string => {
  const result: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        const arrayValue = value.map((item) => (typeof item === 'string' ? item : String(item))).join(',');
        result.push(`${key}=${arrayValue}`);
      } else {
        const stringValue = typeof value === 'string' ? value : String(value);
        result.push(`${key}=${stringValue}`);
      }
    }
  });

  return result.join('&');
};

/**
 * 构建完整的URL
 * @param baseUrl 基础URL
 * @param params 参数对象
 * @returns 完整的URL
 */
const buildUrl = (baseUrl: string, params: Record<string, any> = {}): string => {
  const queryString = buildQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// ==================== 数据视图分组相关接口 ====================

/**
 * 获取分组列表
 * @returns 分组列表数据
 */
const getGroupList = async (): Promise<{ entries: GroupType[]; total_count: number }> => {
  const params = {
    limit: -1, // 不分页
    builtin: false, // 不返回系统内置的指标模型
  };

  return await apiService.axiosGet(GROUP_API_URL, { params });
};

/**
 * 创建新分组
 * @param name 分组名称
 * @returns 创建结果
 */
const createGroup = async (name: string) => {
  const data = { name };
  return await apiService.axiosPost(GROUP_API_URL, data);
};

/**
 * 更新分组名称
 * @param id 分组ID
 * @param name 新名称
 * @returns 更新结果
 */
const updateGroup = async (id: string, name: string) => {
  const data = { name };
  return await apiService.axiosPut(`${GROUP_API_URL}/${id}`, data);
};

/**
 * 删除分组
 * @param id 分组ID
 * @param force 是否强制删除（同时删除分组下的视图）
 * @returns 删除结果
 */
const deleteGroup = async (id: string, force: boolean) => {
  const params = {
    delete_views: force,
  };
  return await apiService.axiosDelete(`${GROUP_API_URL}/${id}`, { params });
};

/**
 * 导出分组数据
 * @param id 分组ID
 * @returns 导出的数据
 */
const exportGroup = async (id: string): Promise<any> => {
  const res = await apiService.axiosGet(`${GROUP_API_URL}/${id}/data-views`);
  return transformData(res);
};

// ==================== 自定义数据视图相关接口 ====================

/**
 * 获取自定义数据视图列表
 * @param params 查询参数
 * @returns 数据视图列表
 */
const getCustomDataViewList = async (params: DataViewListParams): Promise<any> => {
  const {
    limit = -1,
    offset = 0,
    sort = 'update_time',
    direction = 'desc',
    namePattern = '',
    queryType = [],
    tag = '',
    groupId,
    simpleInfo = false,
    type = 'custom',
  } = params;

  // 处理groupId特殊值
  const groupIdVal = groupId === undefined || groupId === null ? '__all' : groupId || '';

  const queryParams = {
    name_pattern: namePattern,
    sort: formatCamelToLine(sort),
    query_type: queryType,
    direction,
    offset,
    limit,
    tag,
    group_id: groupIdVal,
    simple_info: simpleInfo,
    type,
  };

  const url = buildUrl(DATA_VIEW_API_URL, queryParams);
  const res = await apiService.axiosGet(url);
  return transformData(res);
};

/**
 * 创建自定义数据视图
 * @param data 视图数据
 * @param importMode 导入模式
 * @returns 创建结果
 */
const createCustomDataView = async (data: Record<string, any>, importMode?: string) => {
  const url = importMode ? `${DATA_VIEW_API_URL}?import_mode=${importMode}` : DATA_VIEW_API_URL;
  return await apiService.axiosPost(url, formatKeyOfObjectToLine(data));
};

/**
 * 更新自定义数据视图
 * @param id 视图ID
 * @param data 更新数据
 * @returns 更新结果
 */
const updateCustomDataView = async (id: string, data: Record<string, any>) => {
  return await apiService.axiosPut(`${DATA_VIEW_API_URL}/${id}`, formatKeyOfObjectToLine(data));
};

/**
 * 删除自定义数据视图
 * @param id 视图ID
 * @returns 删除结果
 */
const deleteCustomDataView = async (id: string) => {
  return await apiService.axiosDelete(`${DATA_VIEW_API_URL}/${id}`);
};

/**
 * 获取自定义数据视图详情
 * @param ids 视图ID数组
 * @param includeDataScopeViews 是否包含数据作用域视图
 * @returns 视图详情
 */
const getCustomDataViewDetails = async (ids: string[], includeDataScopeViews = false) => {
  const params = { include_data_scope_views: includeDataScopeViews };
  const url = buildUrl(`${DATA_VIEW_API_URL}/${ids.join(',')}`, params);
  return await apiService.axiosGet(url);
};

/**
 * 批量修改数据视图分组
 * @param ids 视图ID数组
 * @param groupName 新分组名称
 * @returns 修改结果
 */
const changeCustomDataViewGroup = async (ids: string[], groupName: string) => {
  return await apiService.axiosPut(`${DATA_VIEW_API_URL}/${ids.join(',')}/attrs/group_name`, { group_name: groupName });
};

// ==================== 数据源相关接口 ====================

/**
 * 获取数据源列表
 * @param params 查询参数
 * @returns 数据源列表
 */
const getDatasource = async (params: any): Promise<any> => {
  const url = buildUrl(`${API_BASE_URL}/data-sources`, params);
  return await apiService.axiosGet(url);
};

/**
 * 查询Excel数据源文件列表
 * @param fileName 文件名
 * @returns Excel文件列表
 */
const getExcelFiles = async (fileName: string): Promise<{ data: string[] }> => {
  return await apiService.axiosGet(`/api/vega-data-source/v1/excel/files/${fileName}`);
};

// ==================== 原子视图相关接口 ====================

/**
 * 获取原子视图列表
 * @param params 查询参数
 * @returns 原子视图列表
 */
const getAtomViewList = async (params: AtomViewListParams): Promise<any> => {
  const {
    excelFileName = '',
    dataSourceType,
    dataSourceId,
    offset = 0,
    limit = -1,
    sort = 'update_time',
    direction = 'desc',
    name = '',
    tag = '',
    type = 'atomic',
    queryType = '',
  } = params;

  const queryParams = {
    name_pattern: encodeURIComponent(name),
    sort,
    direction,
    offset,
    limit,
    tag: tag || '',
    file_name: excelFileName,
    data_source_type: dataSourceType,
    data_source_id: dataSourceId,
    type,
    query_type: queryType,
  };

  // 过滤掉空值参数
  const filteredParams = Object.entries(queryParams).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  const url = buildUrl(DATA_VIEW_API_URL, filteredParams);
  return await apiService.axiosGet(url);
};

// ==================== 数据预览相关接口 ====================

/**
 * 获取视图数据预览
 * @param ids 视图ID（单个或多个）
 * @param values 查询参数
 * @returns 预览数据
 */
const getViewDataPreview = async (ids: string | string[], values: Record<string, any>): Promise<any> => {
  const idStr = Array.isArray(ids) ? ids.join(',') : ids;
  const params = { include_view: true };
  const url = buildUrl(`/api/mdl-uniquery/v1/data-views/${idStr}`, params);
  const res = await Request.post(url, formatKeyOfObjectToLine(values), {
    headers: { 'x-http-method-override': 'GET' },
  });
  return res;
};

/**
 * 获取节点数据预览
 * @param values 查询参数
 * @returns 预览数据
 */
const getNodeDataPreview = async (values: Record<string, any>): Promise<any> => {
  const params = { include_view: false };
  const url = buildUrl(`/api/mdl-uniquery/v1/data-views`, params);
  return await apiService.axiosPostOverrideGet(url, formatKeyOfObjectToLine(values));
};

// ==================== 标签相关接口 ====================

/**
 * 获取标签列表
 * @returns 标签列表数据
 */
const getTagList = async (): Promise<any> => {
  const params = {
    sort: 'tag',
    direction: 'asc',
    limit: -1,
    module: 'metric-model',
  };
  return await apiService.axiosGet(TAG_API_URL, { params });
};

// ==================== 导出接口 ====================

/**
 * 自定义数据视图服务模块
 * 提供数据视图分组、自定义数据视图、数据源、原子视图、数据预览和标签相关的API接口
 */
export default {
  // 数据视图分组相关
  getGroupList,
  createGroup,
  updateGroup,
  deleteGroup,
  exportGroup,

  // 自定义数据视图相关
  getCustomDataViewList,
  createCustomDataView,
  updateCustomDataView,
  deleteCustomDataView,
  getCustomDataViewDetails,
  changeCustomDataViewGroup,

  // 数据源相关
  // getDatasource,
  // getExcelFiles,

  // 原子视图相关
  getAtomViewList,

  // 数据预览相关
  getViewDataPreview,
  getNodeDataPreview,

  // 标签相关
  getTagList,
};
