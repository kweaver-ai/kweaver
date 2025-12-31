namespace AtomDataViewType {
  export interface Data {
    id: string; // 视图唯一标识符
    name: string; // 视图显示名称
    technical_name: string; // 视图技术名称
    group_id: string; // 所属分组ID
    group_name: string; // 所属分组名称
    type: string; // 视图类型，如：atomic, composite
    query_type: string; // 查询类型，如：SQL
    tags: string[]; // 标签列表
    comment: string; // 视图描述信息
    builtin: boolean; // 是否为内置视图
    create_time: number; // 创建时间（时间戳）
    update_time: number; // 更新时间（时间戳）
    data_source_type: string; // 数据源类型
    data_source_id: string; // 数据源ID
    data_source_name: string; // 数据源名称
    file_name: string; // 文件名称（文件数据源）
    status: string; // 状态，如：no_change, changed等
    operations: string[]; // 操作权限列表，如：view_detail, create, modify等
    fields: Field[]; // 字段列表
    module_type: string; // 模块类型，值为data_view
    creator: string; // 创建人ID
    updater: string; // 更新人ID
    metadata_form_id: string; // 元数据表单ID
    primary_keys: string[]; // 主键字段列表
    sql_str: string; // SQL查询字符串
    excel_config?: {
      end_cell: string;
      has_headers: boolean;
      sheet: string;
      sheet_as_new_column: boolean;
      start_cell: string;
    };
  }

  export interface Field {
    name: string; // 字段名称
    type: string; // 字段数据类型，如：varchar, int, double等
    comment: string; // 字段描述信息
    display_name: string; // 字段显示名称
    original_name: string; // 字段原始名称
    data_length: number; // 数据长度
    data_accuracy: number; // 数据精度
    status: string; // 字段状态，如：new, existing等
    is_nullable: string; // 是否可为空，YES或NO
    business_timestamp: boolean; // 是否为业务时间戳
  }

  export interface List {
    entries: Data[]; // 数据视图列表
    total_count: number; // 总数量
  }

  export interface Group {
    id: string; // 分组唯一标识符
    name: string; // 分组名称
    builtin: boolean; // 是否为内置分组
    path: string; // 分组路径
    level: number; // 分组层级
    creator: string; // 创建人
    updater: string; // 更新人
    create_time: number; // 创建时间（时间戳）
    update_time: number; // 更新时间（时间戳）
    data_view_count: number; // 包含的视图数量
  }

  export interface BatchQueryParams {
    include_view?: boolean; // 是否包含视图详情，默认为true
  }

  export interface UpdateDataViewParams {
    name?: string; // 视图名称（可选）
    comment?: string; // 视图描述（可选）
    fields?: Field[]; // 字段列表（可选）
  }

  export interface QueryViewListParams {
    offset?: number; // 偏移量，默认0
    limit?: number; // 每页数量，默认10
    sort?: string; // 排序字段，默认name
    direction?: string; // 排序方向，asc或desc，默认asc
    keyword?: string; // 关键词搜索
    group_id?: string; // 分组ID过滤
    builtin?: boolean; // 是否内置过滤
    type?: string; // 视图类型过滤
    excel_file_name?: string; // Excel文件名过滤（Excel数据源）
    data_source_type?: string; // 数据源类型过滤
    data_source_id?: string; // 数据源ID过滤
  }
}

export default AtomDataViewType;
