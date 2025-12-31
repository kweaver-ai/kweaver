// 定义扫描任务相关的类型
namespace ScanTaskType {
  // 扫描任务列表项
  export type Status = 'wait' | 'running' | 'success' | 'fail' | 'all';

  // 扫描请求参数
  export interface ScanRequest {
    scan_name: string; // 扫描任务名称
    type: number; // 扫描任务类型: 0 1 2 3中的一种
    ds_info: { ds_id: string; ds_type: string }; // 数据源信息
    use_default_template?: boolean; // 是否使用默认模板
    field_list_when_change?: string[]; // 字段比对规则
    use_multi_threads?: boolean; // 是否采用多线程
    cron_expression?: string; // 定时表达式：针对【定时扫描】
    tables?: string[]; // 当dsId=null的时候，说明需要对特定的表进行扫描
  }

  // 扫描任务创建响应
  export interface ScanResponse {
    id: string; // 扫描任务ID
    ds_id: string; // 数据源ID
    status: Status; // 扫描状态
  }

  // 任务处理信息
  export interface TaskProcessInfo {
    table_count: number; // 表总数
    success_count: number; // 成功数量
    fail_count: number; // 失败数量
  }

  // 任务结果信息
  export interface TaskResultInfo {
    table_count: number; // 表总数
    success_count: number; // 成功数量
    fail_count: number; // 失败数量
    fail_stage: number; // 失败阶段：1 表 2 字段
    error_stack: string; // 失败的错误消息
  }

  // 任务状态响应
  export interface TaskStatusResponse {
    id: string; // 扫描任务ID
    status: Status; // 扫描状态
    data: {
      task_process_info: TaskProcessInfo; // 中间信息
      task_result_info: TaskResultInfo; // 结果信息
    };
  }

  // 表状态信息
  export interface TableStatus {
    table_id: string; // 表ID
    table_name: string; // 表名称
    status: Status; // 扫描状态
    start_time: string; // 开始时间
  }

  // 表状态列表响应
  export interface TableStatusResponse {
    id: string; // 扫描任务ID
    tables: TableStatus[]; // 表状态列表
  }

  // 重试请求
  export interface RetryRequest {
    id: string; // 扫描任务ID
    tables: string[]; // 表的ID列表
  }

  // 重试响应
  export interface RetryResponse {
    id: string; // 扫描任务ID
    tables: Array<{
      table_id: string; // 表ID
      status: Status; // 扫描状态
    }>; // 重试结果列表
  }

  // 扫描任务列表项
  export interface ScanTaskItem {
    id: string; // 扫描任务ID
    name: string; // 扫描任务名称
    create_user: string; // 创建者名称
    scan_status: Status; // 扫描状态
    start_time: string; // 创建时间
    type: number; // 扫描任务类型: 0 1 2 3中的一种
    ds_type: string; // 数据源类型
    allow_multi_table_scan: boolean; // 是否支持多表扫描
    task_process_info: string; // 任务进行信息TaskProcessInfo
    task_result_info: string; // 任务结果信息TaskResultInfo
  }

  // 扫描任务列表响应
  export interface ScanTaskListResponse {
    total_count: number; // 总条数
    entries: ScanTaskItem[]; // 任务列表
  }

  // 表信息
  export interface TableInfo {
    id: string; // 表ID
    name: string; // 表名称
    create_time?: string; // 创建时间
    advanced_params: GetExcelColumnsRequest; // 高级参数
  }

  // 表列表响应
  export interface TableListResponse {
    total_count: number; // 总条数
    entries: TableInfo[]; // 表列表
  }

  // 列信息
  export interface ColumnInfo {
    id: string; // 列ID
    name: string; // 列名称
    comment: string; // 列注释
    type: string; // 列类型
  }

  // 列列表响应
  export interface ColumnListResponse {
    total_count: number; // 总条数
    entries: ColumnInfo[]; // 列列表
  }

  // 分页查询参数
  export interface PageQueryParams {
    limit?: number; // 每页大小，默认为0，查全部
    offset?: number; // 页码，默认0
    keyword?: string; // 查询关键字，模糊搜索
    sort?: string; // 排序字段
    direction?: string; // 排序方向，支持传值：asc/desc，默认desc
    name?: string; // 扫描任务名称模糊查询
    ds_id?: string; // 数据源ID
    status?: Status; // 扫描状态
    filters?: Record<string, any>; // 其他过滤条件
  }

  // 扫描任务信息请求参数
  export interface ScanTaskInfoParams {
    limit?: number; // 每页大小，默认为0，查全部
    offset?: number; // 页码，默认1
    keyword?: string; // 查询关键字，模糊搜索
    sort?: string; // 排序字段
    direction?: string; // 排序方向，支持传值：asc/desc，默认desc
    status?: Status; // 扫描状态
  }

  // 扫描任务信息响应
  export interface ScanTaskInfoResponseItem {
    task_id: string; // 扫描任务ID
    table_id: string; // 表ID
    table_name: string; // 表名称
    scan_status: Status; // 扫描状态
    start_time: string; // 开始时间
  }

  // 扫描任务信息响应
  export interface ScanTaskInfoResponse {
    total_count: number; // 总条数
    entries: ScanTaskInfoResponseItem[]; // 扫描任务信息列表
  }

  // Excel相关接口类型
  // 1. 创建Excel表请求参数
  export interface CreateExcelTableRequest {
    datasource_id: string; // 数据源id
    catalog: string; // 逻辑视图数据源（必须存在）
    file_name: string; // excel文件名
    table_name: string; // table_name规则：由小写字母，数字或者下划线以及中文字符组成的字符串
    sheet?: string; // sheet名称，多个sheet逗号隔开，默认"Sheet1,Sheet2"
    all_sheet?: boolean; // 是否加载所有sheet，默认false
    sheet_as_new_column?: boolean; // 是否把sheet当作一列，默认false
    start_cell: string; // 起始单元格
    end_cell: string; // 结束单元格
    has_headers?: boolean; // 是否首行作为列名，默认false
    columns: Array<{
      column: string; // 列名规则:不能使用 \ / : * ? " < > |，且不能使用大写字母，且长度不能超过100
      type: string; // 列类型
    }>; // 列配置
  }

  // 2. Excel表操作响应
  export interface ExcelTableResponse {
    tableId: string; // 表ID
    tableName: string; // 表名称
  }

  export interface Column {
    column: string; // 列名
    type: string; // 列类型
  }

  export interface ExcelColumnsResponse {
    data: Column[]; // 字段列表
  }

  // 3. 查询Excel字段列表请求参数
  export interface GetExcelColumnsRequest {
    id?: string; // 表ID
    create_time?: string; // 创建时间
    datasource_id?: string; // 数据源id
    catalog: string; // 数据源
    file_name: string; // 文件名
    sheet?: string; // 支持多个sheet,逗号隔开
    all_sheet?: boolean; // 是否加载所有sheet
    sheet_as_new_column?: boolean; // 是否把sheet当作一列
    start_cell: string; // 加载范围开始单元格，如A1
    end_cell: string; // 加载范围结束单元格，如C5
    has_headers?: boolean; // 首行是否为表头
  }

  // 4. Excel文件列表响应
  export interface ExcelFileListResponse {
    data: string[]; // 文件列表
    total: number; // 总数
  }

  // 5. Excel sheet列表响应
  export interface ExcelSheetListResponse {
    data: string[]; // sheet列表
    total: number; // 总数
  }
}

export default ScanTaskType;
