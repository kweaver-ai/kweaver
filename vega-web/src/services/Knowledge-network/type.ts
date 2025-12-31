namespace KnowledgeNetworkType {
  // 查询业务知识网络列表的参数接口
  export interface ListQuery {
    name_pattern?: string; // 根据业务知识网络名称模糊查询，默认为空
    tag?: string;
    sort?: 'update_time' | 'kn_name'; // 排序类型，默认是update_time
    direction?: 'asc' | 'desc'; // 排序结果方向，默认desc
    offset?: number; // 开始响应的项目的偏移量，默认值0
    limit?: number; // 每页最多可返回的项目数，默认值10
  }

  // 创建新的业务知识网络的请求体接口
  export interface CreateRequest {
    id: string; // 业务知识网络ID，新建后不可修改
    name: string; // 业务知识网络名称
    tags: string[]; // 标签，用于业务标识
    comment?: string; // 备注
    branch: string; // 分支ID
    base_version: string; // 来源版本
  }

  // 修改业务知识网络的请求体接口
  export interface UpdateRequest {
    name?: string; // 业务知识网络名称
    tags?: string[]; // 标签，用于业务标识
    comment?: string; // 指标模型备注
  }

  // 业务知识网络详情响应接口
  export interface Detail {
    id: string; // 业务知识网络ID
    name: string; // 业务知识网络名称
    icon: string;
    color: string;
    tags: string[]; // 标签
    comment?: string; // 备注
    creator: {
      id: string;
      name: string;
      type: string;
    }; // 创建者
    create_time: number; // 创建时间
    updater?: {
      id: string;
      name: string;
      type: string;
    }; // 更新者
    update_time?: number; // 更新时间
    detail?: string; // 说明书的markdown文本内容
    operations: string[];
    statistics?: {
      object_types_total: number;
      relation_types_total: number;
      action_types_total: number;
      concept_groups_total: number;
    };
  }

  // 业务知识网络详情响应接口
  export interface List {
    entries: Detail[];
    total_count: number;
  }
}

export default KnowledgeNetworkType;
