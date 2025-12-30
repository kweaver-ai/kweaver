export enum ParamTypeEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
}

export interface ParamItem {
  name: string; // 参数名
  description: string; // 参数描述
  default?: string; // 参数默认值
  type: ParamTypeEnum; // 参数类型
  required: boolean; // 是否必填
  example?: object; // 参数示例
  enum?: Array<object>; // 参数枚举值
}
