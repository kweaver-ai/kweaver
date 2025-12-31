namespace ActionType {
  // 行动类型枚举
  export enum ActionTypeEnum {
    Add = 'add',
    Modify = 'modify',
    Delete = 'delete',
  }

  // 排序类型枚举
  export enum SortEnum {
    UpdateTime = 'update_time',
    Name = 'name',
  }

  // 排序结果方向枚举
  export enum DirectionEnum {
    ASC = 'asc',
    DESC = 'desc',
  }

  // 行动类
  export interface ActionType {
    concept_type: 'action_type'; // 概念类型
    id: string; // 行动类ID
    name: string; // 行动类名称
    tags: string[]; // 标签（可以为空）
    comment: string; // 备注（可以为空）
    icon: string; // 图标
    color: string; // 颜色
    branch: string; // 分支ID
    kn_id: string; // 业务知识网络ID
    concept_groups: Array<{
      id: string; // 概念分组ID
      name: string; // 概念分组名称
    }>; // 概念分组
    action_type: ActionTypeEnum; // 行动类型
    object_type_id: string; // 行动类所绑定的对象类ID
    object_type_name: string; // 行动类所绑定的对象类名称
    condition: ActionCondition; // 行动条件
    affect: ActionAffect; // 行动影响
    action_source: ActionSource; // 数据来源
    parameters: ActionParamter[]; // 行动资源参数
    schedule: ActionSchedule; // 执行频率配置项;
    creator: {
      id: string;
      name: string;
      type: string;
    }; // 创建人ID
    create_time: number; // 创建时间
    updater?: {
      id: string;
      name: string;
      type: string;
    }; // 最近一次修改人
    update_time: number; // 最近一次更新时间
    detail?: string; // 说明书。按需返回，若指定了include_detail=true，则返回，否则不返回
  }

  // 获取行动类列表的请求体接口
  export interface GetActionTypesRequest {
    name_pattern?: string; // 根据名称模糊查询，默认为空
    sort?: SortEnum; // 排序类型，默认是update_time
    direction?: DirectionEnum; // 排序结果方向，可选asc、desc。 默认desc
    offset?: number; // 开始响应的项目的偏移量 范围需大于等于0，默认值0
    limit?: number; // 每页最多可返回的项目数； 分页可选1-1000，-1表示不分页； 默认值10
    tag?: string; // 根据标签精准查询，默认为空
    group_id?: string; // 按概念分组过滤
    action_type?: ActionTypeEnum; // 行动类型
    object_type_id?: string; // 绑定对象类
  }

  // 行动类列表响应接口
  export interface GetActionTypesResponse {
    entries: ActionType[]; // 条目列表
    total_count: number; // 总条数
  }

  // 行动条件
  export interface ActionCondition {
    object_type_id?: string; // 对象类ID。当时多个对象类的过滤时，需要把对象类ID带上，否则只要属性名属于对象类就会进行过滤。
    field?: string; // 字段名称，也即对象类的属性名称
    operation?: 'and' | 'or' | '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'range' | 'out_range' | 'exist' | 'not_exist'; // 操作符
    sub_conditions?: Array<object>; // 子过滤条件
    value?: any; // 字段值
    value_from?: 'const'; // 字段值来源，当前仅支持 "const"
  }

  // 概念分组
  export interface ConceptGroup {
    id: string; // 概念分组ID
    name: string; // 概念分组名称
  }

  // 行动影响
  export interface ActionAffect {
    comment?: string; // 影响描述
    object_type_id?: string; // 影响的对象类ID
    object_type?: {
      id: string; // 对象类id
      name: string; // 对象类名称
      icon: string; // 对象类图标
      color: string; // 对象类颜色
    };
  }

  // 行动工具来源
  export interface ActionSource {
    type: 'tool'; // 数据来源类型。tool代表工具
    box_id: string; // 工具箱id
    tool_id: string; // 工具id
  }

  export enum ValueFrom {
    Property = 'property',
    Input = 'input',
    Const = 'const',
  }

  // 行动资源参数
  export interface ActionParamter {
    name: string; // 参数名称
    value_from: ValueFrom; // 值来源
    value?: string; //参数值。value_from=property时，填入的是对象类的数据属性名称；value_from=input时，不设置此字段
  }

  export enum ActionScheduleTypeEnum {
    FixRate = 'FIX_RATE',
    Cron = 'CRON',
  }

  // 执行频率配置项
  export interface ActionSchedule {
    type: ActionScheduleTypeEnum; // 执行类型。枚举，支持配置固定频率(FIX_RATE)和配置crontab表达式（CRON）
    expression: string; // 执行表达式。1.固定频率指以固定周期执行持久化，frequency=< time_durations >，用一个数字，后面跟时间单位来定义。时间单位可以是如下之一：m - 分钟； h - 小时； d - 天
  }

  // 创建行动类的请求体接口
  export type CreateActionTypeRequest = Array<{
    id?: string; // 行动类ID
    name: string; // 行动类名称
    tags?: string[]; // 标签
    comment?: string; // 备注
    icon?: string; // 图标
    color?: string; // 颜色
    branch: string; // 分支ID
    concept_groups?: ConceptGroup[]; // 概念分组
    action_type: ActionTypeEnum; // 行动类型
    object_type_id: string; // 行动类所绑定的对象类ID
    condition?: ActionCondition; // 行动条件
    affect?: ActionAffect; // 行动影响
    action_source?: ActionSource; // 数据来源
    parameters?: ActionParamter[]; // 行动资源参数
    schedule?: ActionSchedule; //执行频率配置项
  }>;

  // 编辑行动类的请求体接口
  export interface EditActionTypeRequest {
    name: string; // 行动类名称
    tags?: string[]; // 标签
    comment?: string; // 备注
    icon?: string; // 图标
    color?: string; // 颜色
    branch: string; // 分支ID
    concept_groups?: ConceptGroup[]; // 概念分组
    action_type: ActionTypeEnum; // 行动类型
    object_type_id: string; // 行动类所绑定的对象类ID
    condition?: ActionCondition; // 行动条件
    affect?: ActionAffect; // 行动影响
    action_source?: ActionSource; // 数据来源
    parameters?: ActionParamter[]; // 行动资源参数
    schedule?: ActionSchedule; //执行频率配置项
  }
}

export default ActionType;
