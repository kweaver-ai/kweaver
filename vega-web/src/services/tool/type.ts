namespace ToolType {
  // 获取工具箱列表的请求参数
  export interface GetToolBoxListRequest {
    page?: number; // 页码，默认1
    page_size?: number; // 每页数量，默认10
    status?: 'unpublish' | 'published' | 'offline'; // 查询状态
    name?: string; // 名称
    sort_by?: 'create_time' | 'updated_time' | 'name'; // 排序字段，默认create_time
    sort_order?: 'asc' | 'desc'; // 排序顺序
    all?: boolean; // 是否获取所有工具
  }

  // 获取工具箱内工具列表的请求参数
  export interface getToolListByBoxIdRequest {
    page?: number; // 页码，默认1
    page_size?: number; // 每页数量，默认10
    status?: 'enabled'; // 查询状态
    name?: string; // 名称
    sort_by?: 'create_time' | 'updated_time' | 'name'; // 排序字段
    sort_order?: 'asc' | 'desc'; // 排序顺序
    all?: boolean; // 是否获取所有工具箱
  }

  export interface searchToolRequest {
    sort_by?: 'create_time';
    sort_order?: 'desc';
    tool_name: string;
    status?: 'enabled';
    all?: boolean;
  }

  export type ToolBoxField =
    | 'box_name'
    | 'box_desc'
    | 'box_svc_url'
    | 'status'
    | 'category_type'
    | 'category_name'
    | 'is_internal'
    | 'source'
    | 'create_user'
    | 'update_user'
    | 'release_user'
    | 'tools';

  // 获取MCP市场列表的请求参数
  export interface GetMcpMarketListRequest {
    page?: number;
    page_size?: number;
    name?: string;
    status?: 'published';
  }

  // 获取MCP工具列表的请求参数
  export interface GetMcpToolsRequest {
    page?: number;
    page_size?: number;
    status?: 'enabled';
    all?: boolean;
  }
}

export default ToolType;
