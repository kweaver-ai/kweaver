import intl from 'react-intl-universal';
import ActionType from '@/services/action/type';
import OntologyObjectType from '@/services/object/type';
import TaskType from '@/services/task/type';
import type { MenuProps } from 'antd';

/**
 * 国际化常量 Hook
 * 直接返回国际化配置对象
 */
export const useConstants = () => {
  // Task 排序菜单项
  const TASK_MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'time_cost', label: intl.get('Task.sortByDuration') },
    { key: 'create_time', label: intl.get('Global.sortByCreateTimeLabel') },
    { key: 'finish_time', label: intl.get('Global.sortByFinishTimeLabel') },
  ];

  // Task Detail 排序菜单项
  const TASK_DETAIL_MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'time_cost', label: intl.get('Task.sortByDuration') },
    { key: 'start_time', label: intl.get('Global.sortByStartTimeLabel') },
    { key: 'finish_time', label: intl.get('Global.sortByFinishTimeLabel') },
  ];

  // KnowledgeNetwork 排序菜单项(使用 Global 通用字段)
  const KN_MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByName') },
    { key: 'update_time', label: intl.get('Global.sortByUpdateTime') },
  ];

  // Object 排序菜单项(使用 Global 通用字段)
  const OBJECT_MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByName') },
    { key: 'update_time', label: intl.get('Global.sortByUpdateTime') },
  ];

  const JOB_TYPE_LABELS: Record<TaskType.JobType, string> = {
    [TaskType.JobType.full]: intl.get('Task.buildTypeFull'),
    [TaskType.JobType.incremental]: intl.get('Task.buildTypeIncremental'),
  };

  const JOB_TYPE_OPTIONS = [
    { value: '', label: intl.get('Global.all') },
    { value: TaskType.JobType.full, label: JOB_TYPE_LABELS[TaskType.JobType.full] },
    { value: TaskType.JobType.incremental, label: JOB_TYPE_LABELS[TaskType.JobType.incremental] },
  ];

  const TASK_STATE_LABELS: Record<TaskType.StateEnum, string> = {
    [TaskType.StateEnum.pending]: intl.get('Global.statusPending'),
    [TaskType.StateEnum.running]: intl.get('Global.statusRunning'),
    [TaskType.StateEnum.completed]: intl.get('Global.statusCompleted'),
    [TaskType.StateEnum.failed]: intl.get('Global.statusFailed'),
    [TaskType.StateEnum.canceled]: intl.get('Global.statusCanceled'),
  };

  const TASK_STATE_OPTIONS = [
    { value: '', label: intl.get('Global.all') },
    { value: TaskType.StateEnum.pending, label: TASK_STATE_LABELS[TaskType.StateEnum.pending] },
    { value: TaskType.StateEnum.running, label: TASK_STATE_LABELS[TaskType.StateEnum.running] },
    { value: TaskType.StateEnum.completed, label: TASK_STATE_LABELS[TaskType.StateEnum.completed] },
    { value: TaskType.StateEnum.failed, label: TASK_STATE_LABELS[TaskType.StateEnum.failed] },
    { value: TaskType.StateEnum.canceled, label: TASK_STATE_LABELS[TaskType.StateEnum.canceled] },
  ];

  // Task Detail 概念类型标签
  const CONCEPT_TYPE_LABELS: Record<TaskType.conceptTypeEnum, string> = {
    [TaskType.conceptTypeEnum.object]: intl.get('Task.objectClass'),
  };

  // Task Detail 概念类型选项
  const CONCEPT_TYPE_OPTIONS = [
    { value: '', label: intl.get('Global.all') },
    { value: TaskType.conceptTypeEnum.object, label: CONCEPT_TYPE_LABELS[TaskType.conceptTypeEnum.object] },
  ];

  // ObjectCreateAndEdit - LogicAttribute 值来源选项
  const VALUE_FROM_OPTIONS = [
    { label: intl.get('Object.fixedValue'), value: ActionType.ValueFrom.Const },
    { label: intl.get('Global.dataProperty'), value: ActionType.ValueFrom.Property },
    { label: intl.get('Object.dynamicInput'), value: ActionType.ValueFrom.Input },
  ];

  // ObjectCreateAndEdit - LogicAttribute 逻辑属性类型选项
  const LOGIC_ATTR_TYPE_OPTIONS = [
    { label: intl.get('Object.metric'), value: OntologyObjectType.LogicAttributeType.METRIC },
    { label: intl.get('Object.operator'), value: OntologyObjectType.LogicAttributeType.OPERATOR },
  ];

  // ObjectCreateAndEdit - LogicAttribute 操作符类型选项
  const OPERATOR_TYPE_OPTIONS = [
    { label: intl.get('Global.equal'), value: '==', type: 'string,number' },
    { label: intl.get('Global.notEqual'), value: '!=', type: 'string,number' },
    { label: intl.get('Global.lessThan'), value: '<', type: 'number' },
    { label: intl.get('Global.lessThanOrEqual'), value: '<=', type: 'number' },
    { label: intl.get('Global.greaterThan'), value: '>', type: 'number' },
    { label: intl.get('Global.greaterThanOrEqual'), value: '>=', type: 'number' },
  ];

  // ObjectCreateAndEdit - LogicAttribute 字段类型输入映射
  const FIELD_TYPE_INPUT = {
    number: ['integer', 'unsigned integer', 'float', 'decimal', 'timestamp'],
    boolean: ['boolean'],
  };

  // Action 排序菜单项
  const ACTION_MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByName') },
    { key: 'update_time', label: intl.get('Global.sortByUpdateTime') },
  ];

  // Action 行动类型标签
  const ACTION_TYPE_LABELS: Record<string, string> = {
    add: intl.get('Global.add'),
    modify: intl.get('Global.edit'),
    delete: intl.get('Global.delete'),
  };

  // ActionCreateAndEdit - 行动类型选项
  const ACTION_TYPE_OPTIONS = [
    { label: intl.get('Global.add'), value: 'add' },
    { label: intl.get('Global.edit'), value: 'modify' },
    { label: intl.get('Global.delete'), value: 'delete' },
  ];

  // ActionCreateAndEdit - 调度类型选项
  const SCHEDULE_TYPE_OPTIONS = [
    {
      label: intl.get('Global.fixRate'),
      value: 'FIX_RATE',
      tip: intl.get('Global.fixRateTip'),
    },
    {
      label: intl.get('Action.cronExpression'),
      value: 'CRON',
      tip: intl.get('Global.cronTip'),
    },
  ];

  // Edge 排序菜单项(使用 Global 通用字段)
  const EDGE_MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByName') },
    { key: 'update_time', label: intl.get('Global.sortByUpdateTime') },
  ];

  // EdgeCreateAndEdit - 关系关联类型选项
  const EDGE_CONNECTION_TYPE_OPTIONS = [
    { value: 'direct', label: intl.get('Edge.directConnection') },
    { value: 'data_view', label: intl.get('Edge.dataViewConnection') },
  ];

  // Object Detail - 属性类型选项
  const OBJECT_PROPERTY_TYPE_OPTIONS = [intl.get('Global.dataProperty'), intl.get('Object.logicProperty')];

  // Object Detail - 属性类型常量
  const OBJECT_PROPERTY_TYPES = {
    DATA_PROPERTY: intl.get('Global.dataProperty'),
    LOGIC_PROPERTY: intl.get('Object.logicProperty'),
  };

  // ObjectIndexSetting - 配置状态选项
  const OBJECT_INDEX_STATE_OPTIONS = [
    { label: intl.get('Global.all'), value: '' },
    { label: intl.get('Global.configured'), value: '1' },
    { label: intl.get('Global.notConfigured'), value: '0' },
    { label: '--', value: '2' },
  ];

  // ObjectIndexSetting - 分词器选项
  const TOKENIZER_OPTIONS = [
    { label: intl.get('Global.standardTokenizer'), value: 'standard' },
    { label: intl.get('Global.englishTokenizer'), value: 'english' },
    { label: intl.get('Global.ikMaxWordTokenizer'), value: 'ik_max_word' },
    { label: intl.get('Global.hanlpStandardTokenizer'), value: 'hanlp_standard' },
    { label: intl.get('Global.hanlpIndexTokenizer'), value: 'hanlp_index' },
  ];

  const CHANGE_TYPE_MAP = {
    new: intl.get('DataView.changeTypeNew'),
    modify: intl.get('DataView.changeTypeModify'),
    delete: intl.get('DataView.changeTypeDelete'),
    no_change: intl.get('DataView.changeTypeNoChange'),
  };

  const EXCEL_DATA_TYPES = [
    { value: 'bigint', label: intl.get('DataView.dataTypeInteger') },
    { value: 'double', label: intl.get('DataView.dataTypeDecimal') },
    { value: 'timestamp', label: intl.get('DataView.dataTypeDateTime') },
    { value: 'boolean', label: intl.get('DataView.dataTypeBoolean') },
    { value: 'varchar', label: intl.get('DataView.dataTypeString') },
  ];

  const NODE_TYPE_TITLE_MAP = {
    view: intl.get('CustomDataView.GraphBox.referenceView'),
    output: intl.get('CustomDataView.GraphBox.outputView'),
    join: intl.get('CustomDataView.GraphBox.dataJoin'),
    union: intl.get('CustomDataView.GraphBox.dataMerge'),
    sql: 'SQL',
  };

  return {
    TASK_MENU_SORT_ITEMS,
    TASK_DETAIL_MENU_SORT_ITEMS,
    JOB_TYPE_LABELS,
    JOB_TYPE_OPTIONS,
    TASK_STATE_LABELS,
    TASK_STATE_OPTIONS,
    CONCEPT_TYPE_LABELS,
    CONCEPT_TYPE_OPTIONS,
    KN_MENU_SORT_ITEMS,
    OBJECT_MENU_SORT_ITEMS,
    VALUE_FROM_OPTIONS,
    LOGIC_ATTR_TYPE_OPTIONS,
    OPERATOR_TYPE_OPTIONS,
    FIELD_TYPE_INPUT,
    ACTION_MENU_SORT_ITEMS,
    ACTION_TYPE_LABELS,
    ACTION_TYPE_OPTIONS,
    SCHEDULE_TYPE_OPTIONS,
    EDGE_MENU_SORT_ITEMS,
    EDGE_CONNECTION_TYPE_OPTIONS,
    OBJECT_PROPERTY_TYPE_OPTIONS,
    OBJECT_PROPERTY_TYPES,
    OBJECT_INDEX_STATE_OPTIONS,
    TOKENIZER_OPTIONS,
    CHANGE_TYPE_MAP,
    EXCEL_DATA_TYPES,
    NODE_TYPE_TITLE_MAP,
  };
};

// 数据库图标映射（不依赖 intl，可以直接导出）
export const DATABASE_ICON_MAP = {
  mysql: {
    outlinedName: 'icon-MySQL',
    coloredName: 'icon-dip-color-mysql-wubaisebeijingban',
    show: 'MySQL',
  },
  maria: {
    outlinedName: 'icon-MariaDB',
    coloredName: 'icon-dip-color-Mariadb-wubaisebeijingban',
    show: 'MariaDB',
  },
  postgresql: {
    outlinedName: 'icon-PostgreSQL',
    coloredName: 'icon-dip-color-postgre-wubaisebeijingban',
    show: 'PostgreSQL',
  },
  sqlserver: {
    outlinedName: 'icon-a-SQLServer',
    coloredName: 'icon-dip-color-a-sqlserver-wubaisebeijingban',
    show: 'SQL Server',
  },
  oracle: {
    outlinedName: 'icon-Oracle2',
    coloredName: 'icon-dip-color-oracle-wubaisebeijingban',
    show: 'Oracle',
  },
  'hive-hadoop2': {
    outlinedName: 'icon-Hive',
    coloredName: 'icon-dip-color-hive-wubaisebeijingban',
    show: 'Apache Hive(hadoop2)',
  },
  'hive-jdbc': {
    outlinedName: 'icon-Hive',
    coloredName: 'icon-dip-color-hive-wubaisebeijingban',
    show: 'Apache Hive',
  },
  hive: {
    outlinedName: 'icon-Hive',
    coloredName: 'icon-dip-color-hive-wubaisebeijingban',
    show: 'Apache Hive',
  },
  clickhouse: {
    outlinedName: 'icon-a-ClickHouse',
    coloredName: 'icon-dip-color-ClickHouse-wubaisebeijingban',
    show: 'ClickHouse',
  },
  doris: {
    outlinedName: 'icon-a-DORISHeise',
    coloredName: 'icon-dip-color-DORIS-wubaisebeijingban',
    show: 'Apache Doris',
  },
  hologres: {
    outlinedName: 'icon-holgres-heise',
    coloredName: 'icon-dip-color-hologres-caise',
    show: 'Holgres',
  },
  'inceptor-jdbc': {
    outlinedName: 'icon-inceptor-heise',
    coloredName: 'icon-dip-color-inceptor-caise',
    show: 'TDH inceptor',
  },
  opengauss: {
    outlinedName: 'icon-opengauss-heise',
    coloredName: 'icon-dip-color-opengauss-caise',
    show: 'OpenGauss',
  },
  gaussdb: {
    outlinedName: 'icon-gaussdb-heise',
    coloredName: 'icon-dip-color-gaussdb-caise',
    show: 'GaussDB',
  },
  dameng: {
    outlinedName: 'icon-dameng-heise',
    coloredName: 'icon-dip-color-dameng',
    show: 'DM',
  },
  excel: {
    outlinedName: 'icon-xls',
    coloredName: 'icon-dip-color-excel1',
    show: 'Excel',
  },
  mongodb: {
    outlinedName: 'icon-mongodb',
    coloredName: 'icon-dip-color-mongodb-caise',
    show: 'MongoDB',
  },
  kingbase: {
    outlinedName: 'icon-mongodb',
    coloredName: 'icon-dip-color-rendajincang',
    show: 'KingbaseES',
  },
  tingyun: {
    outlinedName: 'icon-dip-color-tingyun',
    coloredName: 'icon-dip-color-tingyun',
    show: '听云',
  },
  anyshare7: {
    outlinedName: 'icon-dip-color-AS',
    coloredName: 'icon-dip-color-AS',
    show: 'AnyShare 7.0',
  },
  maxcompute: {
    outlinedName: 'icon-dip-color-MaxCompute',
    coloredName: 'icon-dip-color-MaxCompute',
    show: 'MaxCompute',
  },
  opensearch: {
    outlinedName: 'icon-dip-color-Opensearch',
    coloredName: 'icon-dip-color-Opensearch',
    show: 'OpenSearch',
  },
  index_base: {
    outlinedName: 'icon-dip-suoyin',
    coloredName: 'icon-dip-suoyin',
    show: 'Index Base',
  },
} as const;

// 数据库类型列表
export const DATABASE_TYPES = [
  { olkConnectorName: 'postgresql', showConnectorName: 'PostgreSQL' },
  { olkConnectorName: 'sqlserver', showConnectorName: 'SQL Server' },
  { olkConnectorName: 'mysql', showConnectorName: 'MySQL' },
  { olkConnectorName: 'maria', showConnectorName: 'MariaDB' },
  { olkConnectorName: 'oracle', showConnectorName: 'Oracle' },
  { olkConnectorName: 'hive-hadoop2', showConnectorName: 'Apache Hive(hadoop2)' },
  { olkConnectorName: 'hive-jdbc', showConnectorName: 'Apache Hive' },
  { olkConnectorName: 'clickhouse', showConnectorName: 'ClickHouse' },
  { olkConnectorName: 'doris', showConnectorName: 'Apache Doris' },
  { olkConnectorName: 'hologres', showConnectorName: 'Hologres' },
  { olkConnectorName: 'inceptor-jdbc', showConnectorName: 'TDH inceptor' },
  { olkConnectorName: 'opengauss', showConnectorName: 'OpenGauss' },
  { olkConnectorName: 'gaussdb', showConnectorName: 'GaussDB' },
  { olkConnectorName: 'dameng', showConnectorName: 'DM' },
  { olkConnectorName: 'excel', showConnectorName: 'Excel' },
  { olkConnectorName: 'maxcompute', showConnectorName: 'MaxCompute' },
] as const;

// 表单配置常量
export const FORM_LAYOUT = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
  colon: false,
} as const;

// 分页配置常量
export const PAGINATION_DEFAULT: any = {
  current: 1,
  pageSize: 10,
  total: 0,
  size: 'small',
  pageSizeOptions: ['10', '20', '50'],
  showSizeChanger: true,
  showQuickJumper: true,
};

export const REQUIRED_META_FIELDS = [
  '@timestamp',
  '__data_type',
  '__index_base',
  '__write_time',
  '__id',
  '__tsid',
  '__routing',
  '__category',
  '__pipeline_id',
  'tags',
] as const;

// 节点类型图标映射
export const NODE_TYPE_ICON_MAP = {
  view: 'icon-dip-color-shitusuanzi',
  output: 'icon-dip-color-shuchushitu',
  union: 'icon-dip-color-shujuhebingsuanzi',
  join: 'icon-dip-color-shujuguanliansuanzi',
  sql: 'icon-dip-color-SQLsuanzi',
} as const;

// 标签页类型常量
export const METRIC_TAB_KEYS = {
  DETAIL: 'detail',
  PREVIEW: 'preview',
} as const;

// ID 校验正则：只能包含小写英文字母、数字、下划线、连字符，且不能以下划线和连字符开头
export const METRIC_ID_REGEX = /^(?!_)(?!-)[a-z0-9_-]+$/;

// 数据过滤初始值
export const INIT_FILTER = {
  field: undefined,
  value: null,
  operation: '==',
  valueFrom: 'const',
} as const;

// 帮助文档链接
export const HELP_DOC_LINKS = {
  METRIC_FORMULA: 'https://docs.aishu.cn/help/anyrobot-family-5/chuang-jian-zhi-biao-mo-xing_44243#calculate',
  MEASURE_FIELD: 'https://docs.aishu.cn/help/anyrobot-family-5/chuang-jian-zhi-biao-mo-xing_44243#field',
} as const;

// 模板替换正则
export const TEMPLATE_REGEX = /\{\{(.*?)\}\}/g;

// 调度类型枚举
export enum SCHEDULE_TYPE {
  FIX_RATE = 'FIX_RATE',
  CRON = 'CRON',
}

// 度量名称前缀
export const MEASURE_NAME_PREFIX = '__m.';

// 同环比配置选项
export const METRICS_OPTIONS = {
  YEAR_ON_YEAR: {
    type: 'sameperiod',
    sameperiod_config: { custom: false, method: ['growth_value', 'growth_rate'], offset: 1, time_granularity: 'year' },
  },
  MONTH_ON_MONTH: {
    type: 'sameperiod',
    sameperiod_config: { custom: false, method: ['growth_value', 'growth_rate'], offset: 1, time_granularity: 'month' },
  },
  QUARTER_ON_QUARTER: {
    type: 'sameperiod',
    sameperiod_config: { custom: false, method: ['growth_value', 'growth_rate'], offset: 1, time_granularity: 'quarter' },
  },
  CUSTOM_DEFAULT: {
    type: 'sameperiod',
    sameperiod_config: { custom: true, method: ['growth_value', 'growth_rate'], offset: 3, time_granularity: 'day' },
  },
  PROPORTION: { type: 'proportion' },
  NONE: undefined,
} as const;

// 步长选项 - DSL
export const STEP_OPTIONS_DSL = [
  { value: '5m', labelKey: 'Global.unitMinute', labelPrefix: '5' },
  { value: '10m', labelKey: 'Global.unitMinute', labelPrefix: '10' },
  { value: '15m', labelKey: 'Global.unitMinute', labelPrefix: '15' },
  { value: '20m', labelKey: 'Global.unitMinute', labelPrefix: '20' },
  { value: '30m', labelKey: 'Global.unitMinute', labelPrefix: '30' },
  { value: '1h', labelKey: 'Global.unitHour', labelPrefix: '1' },
  { value: '2h', labelKey: 'Global.unitHour', labelPrefix: '2' },
  { value: '3h', labelKey: 'Global.unitHour', labelPrefix: '3' },
  { value: '6h', labelKey: 'Global.unitHour', labelPrefix: '6' },
  { value: '12h', labelKey: 'Global.unitHour', labelPrefix: '12' },
  { value: '1d', labelKey: 'Global.unitDay', labelPrefix: '1' },
] as const;

// 步长选项 - SQL
export const STEP_OPTIONS_SQL = [
  { value: 'day', labelKey: 'Global.unitDay' },
  { value: 'week', labelKey: 'MetricModel.week' },
  { value: 'month', labelKey: 'MetricModel.month' },
  { value: 'quarter', labelKey: 'MetricModel.quarter' },
  { value: 'year', labelKey: 'MetricModel.year' },
] as const;

// 日期格式常量
export const DATE_FORMAT = {
  FULL_TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS',
  DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  DEFAULT: 'YYYY-MM-DD HH:mm:ss',
  SLASH: 'YYYY/MM/DD HH:mm:ss',
} as const;

export default useConstants;
