import ActionType from '../action/type';

namespace OntologyObjectType {
  /* -------------------- 通用基础类型 -------------------- */

  /** 概念分组 */
  export interface ConceptGroup {
    id: string;
    name?: string;
  }

  /** 数据来源：目前仅支持数据视图 */
  export interface DataSource {
    type: 'data_view';
    id: string;
    name?: string; // 详情接口才会返回
  }

  /** 视图字段描述 */
  export interface ViewField {
    name: string;
    display_name?: string;
    type?: string;
    comment?: string;
  }

  /**
   * 分词器类型
   */
  export type TokenizerType = 'standard' | 'english' | 'ik_max_word' | 'hanlp_standard' | 'hanlp_index';

  /** 全文索引配置 */
  export interface FulltextConfig {
    analyzer: TokenizerType;
    field_keyword: boolean; // 是否保留原始字符串用于精确匹配
  }

  /** 向量索引配置 */
  export interface VectorConfig {
    dimension: number; // 向量维度
  }
  /** 索引配置 */
  export interface IndexConfig {
    keyword_config: {
      enabled: boolean;
      ignore_above_len: number;
    };
    fulltext_config: {
      enabled: boolean;
      analyzer: string;
    };
    vector_config: {
      enabled: boolean;
      model_id: string;
    };
  }

  /** 数据属性（schema 字段） */
  export interface DataProperty {
    name: string; // 字段英文名
    display_name: string; // 中文显示名
    original_name: string;
    type?: string; // 数据类型
    comment?: string;
    mapped_field?: ViewField; // 映射到数据视图的字段
    index?: boolean; // 是否开启索引
    fulltext_config?: FulltextConfig;
    vector_config?: VectorConfig;
    index_config?: IndexConfig;
  }

  export enum LogicAttributeType {
    METRIC = 'metric',
    OPERATOR = 'operator',
  }

  /** 逻辑来源：指标/算子 */
  export interface LogicSource {
    type: LogicAttributeType;
    id: string;
    name?: string;
  }

  /** 逻辑参数 */
  export interface Parameter {
    name: string;
    value_from: ActionType.ValueFrom;
    value?: string; // value_from === 'property' 时填写属性名
    operation?: string;
    type?: string;
    source?: string;
    description?: string;
    if_system_generate?: boolean;
    id: string;
  }

  /** 逻辑属性（计算列） */
  export interface LogicProperty {
    name: string;
    display_name?: string;
    type?: string;
    comment?: string;
    index?: boolean;
    data_source: LogicSource | null;
    parameters: Parameter[] | null;
  }

  export interface BasicInfo {
    name: string;
    tags?: string[];
    comment?: string;
    concept_groups?: ConceptGroup[]; // 所属概念分组 列表
    concept_groupIds?: string[]; // 所属概念分组 id 列表
    id: string; // 若不传，后端自动生成
    icon: string;
    color: string;
  }

  /* -------------------- 对象类相关 -------------------- */
  /** 创建对象类请求体 */
  export interface ReqObjectType extends BasicInfo {
    branch: string; // 所在分支
    base_branch?: string; // 来源分支（main 分支为空）
    data_source?: DataSource;
    data_properties: DataProperty[]; // 至少一个字段
    logic_properties?: LogicProperty[];
    primary_keys: string[]; // 主键字段名
    display_key: string; // 对象实例展示属性
    incremental_key: string; // 增量标识字段名
  }

  /** 更新对象类请求体（全量） */
  export type UpdateObjectType = ReqObjectType;

  /** 对象类详情返回 */
  export interface Detail extends ReqObjectType {
    concept_type: 'object_type';
    id: string;
    kn_id: string;
    creator: {
      id: string;
      name: string;
      type: string;
    };
    create_time: number;
    updater?: {
      id: string;
      name: string;
      type: string;
    };
    update_time: number;
    detail?: string; // 说明书（markdown），按需返回
    status?: {
      index_available: boolean;
      doc_count: number;
      incremental_key: string;
      incremental_value: string;
      index: string;
      storage_size: number;
      update_time: number;
    };
  }

  /** 列表返回包装 */
  export interface ListObjectTypes {
    entries: Detail[];
    total_count: number;
  }

  /* -------------------- 路由参数 / Query -------------------- */
  /** 列表查询 Query */
  export interface ListQuery {
    name_pattern?: string; // 模糊匹配名称
    sort?: 'update_time' | 'name';
    direction?: 'asc' | 'desc';
    offset?: number; // 分页偏移
    limit?: number; // 分页大小
    tag?: string; // 精确标签过滤
    group_id?: string; // 概念分组过滤
  }

  /** 路径参数：kn_id */
  export interface PathKnId {
    kn_id: string;
  }

  /** 路径参数：ob_id（单个） */
  export interface PathObId {
    ob_id: string;
  }

  /** 路径参数：ob_ids（批量） */
  export interface PathObIds {
    ob_ids: string[];
  }

  /** 详情 Query */
  export interface DetailQuery {
    include_detail?: boolean; // 是否返回说明书
  }

  export interface Field {
    name: string;
    type?: string;
    display_name: string;
    comment?: string;
    primary_key?: boolean;
    display_key?: boolean;
    incremental_key?: boolean;
    id?: string;
    displayNameAdd?: boolean;
    error: Record<string, string>;
  }

  export interface TNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    selected?: boolean;
    data: {
      label: string;
      bg: string;
      icon: string;
      attrClick?: (val: any) => void;
      openDataViewSource?: () => void;
      attributes: {
        name: string;
        display_name: string;
        type: string;
        comment?: string;
        mapped_field?: {
          name: string;
          display_name?: string;
          type?: string;
        };
      }[];
    };
  }

  export interface TEdge {
    id: string;
    type: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
  }

  export interface MetricModelItem {
    id: string;
    name: string;
    group_name: string;
    analysis_dimensions: {
      name: string;
      display_name: string;
      type: string;
    }[];
  }

  export interface MetricModelList {
    total_count: number;
    entries: MetricModelItem[];
  }

  export interface OperatorItem {
    name: string;
    operator_id: string;
    metadata: {
      api_spec: any;
    };
    execution_mode: 'sync' | 'async';
  }

  export interface OperatorList {
    data: OperatorItem[];
  }

  /** 指标模型维度字段 */
  export interface MetricModelField {
    name: string;
    display_name: string;
    type: string;
    comment?: string;
  }

  export interface SmallModelItem {
    model_id: string;
    model_name: string;
    batch_size: number;
    embedding_dim: number;
    max_tokens: number;
  }

  export interface SmallModelList {
    count: number;
    data: SmallModelItem[];
  }
}

export default OntologyObjectType;
