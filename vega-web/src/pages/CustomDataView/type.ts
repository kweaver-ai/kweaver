/** 自定义视图 类型定义*/

export interface CustomDataViewContextType {
  currentSelectGroup: GroupType | undefined;
  setCurrentSelectGroup: (group: GroupType | undefined) => void;
  reloadGroup: boolean;
  setReloadGroup: (reload: boolean) => void;
}

export type GroupType = {
  id: string;
  name: string;
  data_view_count: number;
  update_time: string;
  builtin: boolean;
};

/** 类型定义*/
export enum queryType {
  Promql = 'promql',
  Dsl = 'dsl',
  Sql = 'sql',
}

export interface TFilter {
  name: string;
  value: any;
  // Enum: "in" "=" "!=" "range" "out_range" "like" "not_like" ">" ">=" "<" "<="
  operation: string;
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

export interface DataViewItem {
  id: string;
  name: string;
  metricType: string;
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

export enum DataViewOperateType {
  ADD = 'ADD',
  MERGE = 'MERGE',
  RELATION = 'RELATION',
  SQL = 'SQL',
  FORMAT = 'FORMAT',
  ZOOM_IN = 'ZOOM_IN',
  ZOOM_OUT = 'ZOOM_OUT',
  FIELD_PREVIEW = 'FIELD_PREVIEW',
}

export enum NodeType {
  VIEW = 'view',
  OUTPUT = 'output',
  MERGE = 'union',
  JOIN = 'join',
  SQL = 'sql',
}

export enum IconType {
  varchar = 'icon-dip-wenbenxing',
  int = 'icon-dip-zhengshuxing',
  timestamp = 'icon-dip-erjinzhi',
}
