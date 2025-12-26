/** 默认图标 */
export const DEFAULT_ICON = 'icon-color-rw-126EE3';

export const TASK_ICON_LIST = [
  'icon-color-rw-FADB14',
  'icon-color-rw-FF8501',
  'icon-color-rw-F75959',
  'icon-color-rw-F759AB',
  'icon-color-rw-9254DE',
  'icon-color-rw-126EE3',
  'icon-color-rw-019688',
  'icon-color-rw-13C2C2',
  'icon-color-rw-52C41A',
  'icon-color-rw-8C8C8C',
];

export const ALG_TYPE: any = {
  大模型: 1,
  小模型: 2,
  自定义应用: 3,
  外部接入: 4,
  'Large Model': 1,
  'Small Model': 2,
  'Customised App': 3,
  'External Integration': 4,
};

export const ALGORITHM_TYPE_KEY: Record<any, any> = {
  1: 'model_id/model_name', // 大模型
  2: 'model_name', // 小模型
  3: 'customised_app_id/customised_app_name', // 自定义
  4: 'url/name', // 外部接入
  6: 'id/name', // Agent
};
