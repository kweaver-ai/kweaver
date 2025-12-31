import OntologyObjectType from '../object/type';

namespace ConceptGroupType {
  // 概念分组基础信息接口
  export interface BasicInfo {
    id: string; // 概念分组ID
    name: string; // 概念分组名称
    tags?: string[]; // 标签
    comment?: string; // 备注
    icon?: string; // 图标
    color?: string; // 颜色
    detail?: string; // 描述（markdown）
    kn_id: string; // 业务知识网络ID
    branch: string; // 分支ID
    creator?: { id: string; name: string; type: string }; // 创建者
    create_time?: number; // 创建时间
    updater?: { id: string; name: string; type: string }; // 更新者
    update_time?: number; // 更新时间
  }

  // 创建概念分组请求体接口
  export type CreateRequest = BasicInfo;

  // 修改概念分组请求体接口
  export interface UpdateRequest {
    name?: string; // 概念分组名称
    tags?: string[]; // 标签
    comment?: string; // 备注
    icon?: string; // 图标
    color?: string; // 颜色
    detail?: string; // 描述（markdown）
  }

  // 概念分组详情响应接口
  export interface Detail extends BasicInfo {
    statistics?: {
      object_types_total?: number;
      relation_types_total?: number;
      action_types_total?: number;
    };
    object_types?: Array<OntologyObjectType.Detail>;
    relation_types?: Array<{ id: string; name: string; tags?: string[] }>;
    action_types?: Array<{ id: string; name: string; tags?: string[] }>;
  }

  // 查询概念分组列表参数接口
  export interface ListQuery {
    name_pattern?: string; // 根据名称模糊查询
    tag?: string; // 标签过滤
    sort?: 'update_time' | 'name'; // 排序类型
    direction?: 'asc' | 'desc'; // 排序方向
    offset?: number; // 开始响应的项目的偏移量
    limit?: number; // 每页最多可返回的项目数
  }

  // 概念分组列表响应接口
  export interface List {
    entries: Detail[];
    total_count: number;
  }

  // 添加对象类请求体接口
  export interface AddObjectTypesRequest {
    entries: Array<{ id: string }>;
  }
}

export default ConceptGroupType;
