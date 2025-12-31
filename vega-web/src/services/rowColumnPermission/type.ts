namespace RowColumnPermissionType {
  /**
   * 用户信息接口
   */
  export interface User {
    id: string; // 用户ID
    type: string; // 用户类型
    name: string; // 用户名称
  }

  /**
   * 行过滤条件接口
   */
  export interface RowFilter {
    field: string; // 过滤字段
    operation: string; // 操作符
    value_from: string; // 值来源
    value: any; // 过滤值
    sub_conditions?: any[]; // 子条件列表（可选）
  }

  /**
   * 行列规则接口
   */
  export interface Rule {
    id: string; // 规则唯一标识符
    name: string; // 规则名称
    view_id: string; // 视图ID
    view_name: string; // 视图名称
    tags: string[]; // 标签数组
    comment: string; // 规则描述
    create_time: number; // 创建时间（时间戳）
    update_time: number; // 更新时间（时间戳）
    creator: User; // 创建人信息
    updater: User; // 更新人信息
    fields: string[]; // 选中的字段列表
    row_filters: RowFilter; // 行过滤条件
    // 以下字段为可选字段
    visitor?: string; // 访问者
    from?: string; // 来自
    permission?: string; // 权限
    updated_by?: string; // 更新人（旧字段，兼容用）
    operations?: string[]; // 操作权限列表
    data_view_id?: string; // 关联的数据视图ID（旧字段，兼容用）
    rule_type?: string; // 规则类型
    rule_config?: any; // 规则配置详情（旧字段，兼容用）
  }

  export interface List {
    entries: Rule[]; // 规则列表
    total_count: number; // 总数量
  }

  export interface QueryParams {
    view_id?: string; // 视图ID
    offset?: number; // 偏移量，默认0
    limit?: number; // 每页数量，默认10
    sort?: string; // 排序字段
    direction?: string; // 排序方向，asc或desc
    keyword?: string; // 关键词搜索
  }

  /**
   * 创建行列规则参数接口
   */
  export interface CreateRuleParams {
    name: string; // 规则名称
    view_id: string; // 视图ID
    tags?: string[]; // 标签数组
    comment?: string; // 规则描述
    fields: string[]; // 选中的字段列表
    row_filters?: any; // 行过滤条件
  }
}

export default RowColumnPermissionType;
