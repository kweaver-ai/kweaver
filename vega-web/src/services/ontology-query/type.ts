import ObjectType from '../object/type';

namespace OntologyQuery {
  /* -------------------- 通用基础 -------------------- */
  /** 业务知识网络 ID */
  export type KnowledgeNetworkID = string;
  /** 对象类 ID */
  export type ObjectTypeID = string;
  /** 对象实例 ID */
  export type ObjectID = string;
  /** 属性名 */
  export type PropertyName = string;

  /* -------------------- 枚举 -------------------- */
  /** 查询类型 */
  export enum QueryTypeEnum {
    /** 基于路径查询终点对象 */
    RelationPath = 'relation_path',
    /** 基于起点查终点 */
    SourceTarget = 'source_target',
  }

  /** 路径方向 */
  export enum DirectionEnum {
    Forward = 'forward',
    Reverse = 'reverse',
    Bidirectional = 'bidirectional',
  }

  /* -------------------- 条件相关 -------------------- */
  /** 最原子过滤条件 */
  export interface BaseCondition {
    /** 对象类 ID */
    object_type_id: ObjectID;
    /** 字段名 */
    field: string;
    /** 操作符：in / match / match_phase / knn 等 */
    operation: string;
    /** 过滤值 */
    value: any;
    /** 值来源：const（常量） | input（输入） | property（属性） */
    value_from: 'const' | 'input' | 'property';
  }

  /** 条件组（支持嵌套 and/or） */
  export interface ConditionGroup {
    operation: 'and' | 'or';
    sub_conditions: (BaseCondition | ConditionGroup)[];
  }

  /* -------------------- 路径相关 -------------------- */
  /** 路径边 */
  export interface PathEdge {
    id: string;
    name: string;
    source: ObjectID;
    target: ObjectID;
  }

  /** 路径节点 */
  export interface PathNode {
    id: ObjectID;
    name: string;
  }

  /** 完整路径 */
  export interface Path {
    nodes: PathNode[];
    edges: PathEdge[];
    length: number;
  }

  /* -------------------- 请求体 -------------------- */
  /** 基于路径的查询参数 */
  export interface ObjectQueryBaseOnPath {
    concept_groups: string[];
    path: Path;
    condition: ConditionGroup;
  }

  /** 基于起点终点的查询参数 */
  export interface ObjectQueryBaseOnSourceTarget {
    concept_groups: string[];
    source_object_type_id: ObjectTypeID;
    target_object_type_id: ObjectTypeID;
    query_object_type_id: ObjectTypeID;
    path_max_length: number;
    direction: DirectionEnum;
    path_select_policy: string;
    condition: ConditionGroup;
  }

  export type ObjectQueryRequest = ObjectQueryBaseOnPath | ObjectQueryBaseOnSourceTarget;

  /* -------------------- 响应 -------------------- */
  /** 对象实例（键值对） */
  export interface Object {
    [key: string]: any;
  }

  /** 查询对象实例返回 */
  export type SearchResponse = Object[];

  /* -------------------- 子图查询 -------------------- */
  export interface SubgraphQueryBody {
    concept_groups: string[];
    source_object_type_ids: ObjectTypeID[];
    path_length: number;
    direction: DirectionEnum;
    path_select_policy: string;
    condition: ConditionGroup;
  }

  export interface SubgraphResponse {
    nodes: Object[];
    edges: Object[];
  }

  /* -------------------- 属性查询 -------------------- */
  export interface PropertyQueryBody {
    object_type_id: ObjectTypeID;
    property_name: PropertyName[];
    unique_identity: Array<Record<string, any>>;
    query_type: 'value' | 'calculate_params';
    dynamic_params?: Record<string, any>;
  }

  /* -------------------- 分页通用 -------------------- */
  export interface PageTurn {
    /** 翻页游标，首次请求可不传 */
    search_after?: string[];
    /** 每页条数 */
    limit?: number;
    /** 是否需要总条数 */
    need_total?: boolean;
    condition: ConditionGroup;
  }

  export interface ObjectDataResponse {
    object_type: ObjectType.ReqObjectType;
    datas: { [key: string]: any }[];
    total_count: number;
    search_after?: string[];
  }

  export interface ListObjectsRequest {
    knId: KnowledgeNetworkID;
    otId: ObjectTypeID;
    body?: PageTurn;
    includeTypeInfo?: boolean;
    includeLogicParams?: boolean;
  }
}

export default OntologyQuery;
