export type FieldType = 'date' | 'number' | 'boolean' | 'string';

export interface FieldList {
  originalName?: string;
  name: string;
  type: string;
  displayName?: string;
}

export interface PrimaryFilterItem {
  name?: string | undefined;
  field?: string;
  value?: any;
  operation?: string;
  valueFrom?: string;
  sub_conditions?: PrimaryFilterItem[];
}

export type PrimaryFilterValue = { sub_conditions: PrimaryFilterItem[]; operation?: LogicOperatorType };

export type DataFilterValue = PrimaryFilterValue | PrimaryFilterItem;

interface FilterProps<T> {
  value?: T;
  initValue?: T;
  defaultValue?: T;
  onChange?: (args: T) => void;
  transformType?: (string: any) => string; // 转换字段格式
  isValidateFieldRename?: boolean; // 是否校验字段重名
  required?: boolean; // 是否校验必填
  btnText?: string; // 添加按钮信息
  isHidden?: boolean; // 是否显示过滤条件
  disabled?: boolean; // 详情查看--禁用
  isFirst?: boolean; // 是否首次加载
  typeOption?: { [key: string]: string[] };
  isCollapse?: boolean; // 详情使用，开起收折
  isCollapseOpen?: boolean; // 详情使用，是否收折, 默认收起
  collapseLabel?: boolean; // 详情使用，收折标题
}

type LogicOperatorType = 'and' | 'or';

export type DataFilterItem = {
  operation: LogicOperatorType;
  sub_conditions: DataFilterItem[] | PrimaryFilterItem[];
};

export type DataFilterProps = {
  knId?: string;
  fieldList?: FieldList[];
  objectOptions?: any[];
  maxCount?: number[];
  level?: number;
  onDelete?: () => void;
} & FilterProps<PrimaryFilterItem>;

export interface Item {
  object_type_id: string;
  field: string;
  operation: string;
  valueFrom: string;
  value: any;
}
