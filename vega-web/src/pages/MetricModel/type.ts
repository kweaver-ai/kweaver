/** 指标类型 */
export enum METRIC_TYPE {
  ATOMIC = 'atomic', // 原子指标
  DERIVED = 'derived', // 衍生指标
  COMPOSITE = 'composite', // 复合指标
}

/** 类型定义*/
export enum queryType {
  Promql = 'promql',
  Dsl = 'dsl',
  Sql = 'sql',
}

export enum metricType {
  Atomic = 'atomic',
}

export interface TFilter {
  name: string;
  value: any;
  // Enum: "in" "=" "!=" "range" "out_range" "like" "not_like" ">" ">=" "<" "<="
  operation: string;
}
export interface TField {
  name: string;
  type: string;
}

export interface TTasks {
  isPersistenceConfig?: boolean; // 字段只作用前端, 是否开启持久化配置
  expressionType?: string; // 字段只作用前端, 同schedule.type
  id?: string;
  name: string;
  schedule: {
    type: string;
    // 'm' | 'h' | 'd'
    expression: string;
  };
  filters?: TFilter[];
  step: string;
  timeWindows?: string;
  indexBase: string;
  retraceDuration?: string;
  comment?: string;
}

export interface MetricModelItem {
  id: string;
  name: string;
  metricType: metricType;
  dataViewName: any; // 取全部json展示， 提交string （name）
  dataViewId: any; // 取全部json展示， 提交string （id）
  queryType: queryType;
  formula: string;
  dslFormula?: any;
  promqlFormula?: any;
  measureName: string; // 度量名称
  measureField: string; // 度量字段
  tags: string[];
  comment: string;
  updateTime: string;
  unitType: string;
  unit: string;
  tasks: TTasks;
  task: TTasks;
  groupName: string;
  createTime: string;
  builtin: boolean;
}

export type TBasicInfoData = Pick<MetricModelItem, 'name' | 'id' | 'tags' | 'comment' | 'groupName'>;
export type TModelData = Pick<
  MetricModelItem,
  'metricType' | 'dataViewId' | 'queryType' | 'measureField' | 'promqlFormula' | 'dslFormula' | 'unitType' | 'unit'
>;

export interface MetricModelList {
  entries: MetricModelItem[];
  totalCount: number;
}

export interface PreviewData {
  results: {
    labels: { name: string; value: string }[];
    data: { schema: { name: string; type: string }[]; values: [any, any][] };
  }[];
}

export type GroupType = {
  id: string;
  name: string;
  metric_model_count: number;
  comment: string;
  update_time: string;
  builtin: boolean;
};

/**
0: 创建中
1: 修改中
2: 删除中
3: 同步完成
4: 执行成功
5: 执行失败 */
export const persistenceTaskStatus: any = {
  0: 'addStatus',
  1: 'editStatus',
  2: 'deleteStatus',
  3: 'completeStatus',
  4: 'successStatus',
  5: 'errorStatus',
};
export const isPersistenceTaskStatus = (q: any): boolean => {
  const arr = [0, 1, 2, 3, 4, 5];

  if (arr.includes(q)) {
    return true;
  }

  return false;
};

export const getTaskStatus = (scheduleSyncStatus: any, executeStatus: any): string => {
  const first = [0, 1, 2];

  if (first.includes(scheduleSyncStatus) || (scheduleSyncStatus === 3 && executeStatus === 0)) {
    return scheduleSyncStatus;
  }

  return executeStatus;
};

export const persistenceTaskStatusColor = (q: any): string => {
  if (q === 5) {
    return 'rgb(246, 60, 70)';
  }
  if (q === 3 || q === 4) {
    return 'rgb(1, 200, 83)';
  }

  return 'rgba(0, 0, 0, 0.65)';
};

export const paginationDefault = {
  current: 1,
  pageSize: 20,
  total: 0,
  size: 'small',
  pageSizeOptions: ['10', '20', '50'],
  showSizeChanger: true,
  showQuickJumper: true,
};
export const queryTypeMap = {
  promql: 'PromQL',
  dsl: 'DSL',
};
