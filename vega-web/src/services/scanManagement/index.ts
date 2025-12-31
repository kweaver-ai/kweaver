import request from '../request';
import ScanTaskType from './type';

// 基础URL
const baseURL = '/api/data-connection/v1/metadata';
// Excel相关接口基础URL
const excelBaseURL = '/api/data-connection/v1/gateway/excel';

/**
 * 1. 元数据扫描 - 创建扫描任务
 * @param params 扫描任务参数
 * @returns 扫描任务创建结果
 */
export const createScanTask = (params: ScanTaskType.ScanRequest) => {
  const obj = {
    ...params,
    use_default_template: true, // 是否使用默认模板
    field_list_when_change: [], // 字段比对规则
    use_multi_threads: true, // 是否采用多线程
    tables: params.tables || [], // 表列表
  };
  return request.post<ScanTaskType.ScanResponse>(`${baseURL}/scan`, obj);
};

/**
 * 1. 元数据扫描 - 批量创建扫描任务
 * @param params 扫描任务参数
 * @returns 扫描任务创建结果
 */
export const batchCreateScanTask = (params: ScanTaskType.ScanRequest[]) => {
  const obj = params.map((item) => ({
    ...item,
    use_default_template: true, // 是否使用默认模板
    field_list_when_change: [], // 字段比对规则
    use_multi_threads: true, // 是否采用多线程
    tables: item.tables || [], // 表列表
  }));
  return request.post<ScanTaskType.ScanResponse>(`${baseURL}/scan/batch`, obj);
};

/**
 * 2. 获取指定任务的扫描中间&结果状态
 * @param taskId 任务ID
 * @returns 任务状态信息
 */
export const getScanTaskStatus = (taskId: string) => {
  return request.get<ScanTaskType.TaskStatusResponse>(`${baseURL}/scan/status/${taskId}`);
};

/**
 * 3. 获取指定任务的指定表的扫描状态
 * @param params 查询参数
 * @returns 表状态列表
 */
export const getScanTaskTableStatus = (params: { id: string; type: string[] }) => {
  return request.post<ScanTaskType.TableStatusResponse>(`${baseURL}/scan/status`, params);
};

/**
 * 4. 对指定任务的指定表的进行扫描重试
 * @param params 重试参数
 * @returns 重试结果
 */
export const retryScanTask = (params: ScanTaskType.RetryRequest) => {
  return request.post<ScanTaskType.RetryResponse>(`${baseURL}/scan/retry`, params);
};

/**
 * 5. 获取所有的扫描任务列表
 * @param params 分页查询参数
 * @returns 扫描任务列表
 */
export const getScanTaskList = (params: ScanTaskType.PageQueryParams) => {
  const curSort = params.sort || 'start_time';
  const queryParams = {
    sort: curSort,
    direction: params.direction || 'desc',
    limit: params.limit || -1,
    keyword: params.keyword,
    offset: params.offset || 0,
    ds_id: params.ds_id,
    status: !params.status || params.status === 'all' ? '' : params.status,
    ...params.filters,
  };
  return request.get<ScanTaskType.ScanTaskListResponse>(`${baseURL}/scan`, queryParams);
};

/**
 * 6. 获取指定数据源的所有表
 * @param params 查询参数
 * @returns 表列表
 */
export const getDataSourceTables = (id: string, params?: ScanTaskType.PageQueryParams) => {
  return request.get<ScanTaskType.TableListResponse>(`${baseURL}/data-source/${id}`, params);
};

/**
 *  获取指定任务id下的table的扫描信息
 * @param taskId 任务id
 * @returns 表列表
 */
export const getScanTaskInfo = (taskId: string, params?: ScanTaskType.ScanTaskInfoParams) => {
  return request.get<ScanTaskType.ScanTaskInfoResponse>(`${baseURL}/scan/info/${taskId}`, params);
};

/**
 * 7. 获取指定表下的所有列
 * @param tableId 表ID
 * @param params 查询参数
 * @returns 列列表
 */
export const getTableColumns = (tableId: string, params?: ScanTaskType.PageQueryParams) => {
  return request.get<ScanTaskType.ColumnListResponse>(`${baseURL}/table/${tableId}`, params);
};

/**
 * 8. 创建Excel表
 * @param params 创建Excel表参数
 * @returns 创建结果
 */
export const createExcelTable = (params: ScanTaskType.CreateExcelTableRequest) => {
  return request.post<ScanTaskType.ExcelTableResponse>(`${excelBaseURL}/table`, params);
};

/**
 * 9. 删除Excel表
 * @param tableId 表ID
 * @returns 删除结果
 */
export const deleteExcelTable = (tableId: string) => {
  return request.delete<ScanTaskType.ExcelTableResponse>(`${excelBaseURL}/table/${tableId}`);
};

/**
 * 10. 查询Excel字段列表
 * @param params 查询参数
 * @returns 字段列表
 */
export const getExcelColumns = (params: ScanTaskType.GetExcelColumnsRequest) => {
  return request.post<ScanTaskType.ExcelColumnsResponse>(`${excelBaseURL}/columns`, params, { timeout: 60000 });
};

/**
 * 11. 查询Excel文件sheet列表
 * @param catalog 数据源
 * @param fileName 文件名
 * @returns sheet列表
 */
export const getExcelSheets = (catalog: string, fileName: string) => {
  return request.get<ScanTaskType.ExcelSheetListResponse>(
    `${excelBaseURL}/sheet`,
    {
      catalog,
      file_name: fileName,
    },
    { timeout: 60000 }
  );
};

/**
 * 12. 查询Excel文件列表
 * @param catalog 数据源
 * @returns 文件列表
 */
export const getExcelFiles = (catalog: string) => {
  return request.get<ScanTaskType.ExcelFileListResponse>(`${excelBaseURL}/files/${catalog}`, {}, { timeout: 60000 });
};

export default {
  createScanTask,
  batchCreateScanTask,
  getScanTaskStatus,
  getScanTaskTableStatus,
  retryScanTask,
  getScanTaskList,
  getDataSourceTables,
  getTableColumns,
  createExcelTable,
  deleteExcelTable,
  getExcelColumns,
  getExcelSheets,
  getExcelFiles,
};
