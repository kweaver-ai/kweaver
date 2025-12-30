export interface BoxToolListResponse {
  box_id: string;
  status: 'unpublish' | 'published' | 'offline';
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  tools: ToolInfoNew[];
}

export interface ToolInfoNew {
  tool_id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled';
  metadata_type: 'openapi';
  metadata: OpenAPIStruct;
  quota_control?: QuotaControl;
  create_time: number;
  create_user: string;
  update_time: number;
  update_user: string;
  extend_info?: Record<string, any>;
}

export interface OpenAPIStruct {
  summary: string;
  path: string;
  method: string;
  description: string;
  server_url: string;
  api_spec: {
    parameters?: Array<{
      name: string;
      in: 'path' | 'query' | 'header' | 'cookie';
      description: string;
      required: boolean;
      schema: ParameterSchema;
    }>;
    request_body?: {
      description: string;
      required: boolean;
      content: Record<
        string,
        {
          schema: any;
          example: any;
        }
      >;
    };
    responses?: Record<
      string,
      {
        description: string;
        content: Record<
          string,
          {
            schema: any;
            example: any;
          }
        >;
      }
    >;
    schemas?: Record<string, ParameterSchema>;
    security?: Array<{
      securityScheme: 'apiKey' | 'http' | 'oauth2';
    }>;
  };
}

export interface ParameterSchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  format?: 'int32' | 'int64' | 'float' | 'double' | 'byte';
  example?: string;
}

export interface QuotaControl {
  quota_type: 'token' | 'api_key' | 'ip' | 'user' | 'concurrent' | 'rate_limit' | 'none';
  quota_value?: number;
  time_window?: {
    value: number;
    unit: 'second' | 'minute' | 'hour' | 'day';
  };
  overage_policy?: 'reject' | 'queue' | 'log_only';
  burst_capacity?: number;
}

export interface ToolListParams {
  page?: number;
  page_size?: number;
  sort_by?: 'create_time' | 'update_time' | 'name';
  sort_order?: 'asc' | 'desc';
  name?: string;
  status?: 'enabled' | 'disabled';
  user_id?: string;
  all?: boolean;
}

export interface GlobalToolListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  data: ToolInfoNew[];
}

export enum MetadataTypeEnum {
  OpenAPI = 'openapi',
  Function = 'function',
}

export interface FunctionExecuteRequest {
  code: string; // 函数代码
  event: object; // 函数事件参数
}
export interface FunctionExecuteResponse {
  stdout: string; // 标准输出
  stderr: string; // 标准错误输出
  result: object; // 函数执行结果
  metrics: object; // 函数执行指标
}
