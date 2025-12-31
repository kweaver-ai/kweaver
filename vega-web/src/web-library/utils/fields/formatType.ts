import _ from 'lodash';
import Fields from './index';

/** 旧版数据类型 */
const boolean = ['true', 'false', 'boolean'];
const date = ['date', 'datetime', 'timestamp', 'time with time zone', 'timestamp with time zone'];
const number = [
  'number',
  'tinyint',
  'smallint',
  'integer',
  'int',
  'bigint',
  'real',
  'float',
  'double',
  'double precision',
  'decimal',
  'numeric',
  'dec',
  'long',
  'short',
  'byte',
  'half_float',
  'scaled_float',
  'unsigned_long',
];

/** 格式化数据类型 */
const formatType = (type: string) => {
  if (!type) return '';
  const value = type?.toLowerCase();
  // 新版类型
  const cur = Fields.DataType_All.find((item) => item.name === type)?.type;
  if (cur) return cur;
  // 旧版类型
  if (_.includes(boolean, value)) return 'boolean';
  if (_.includes(date, value)) return 'date';
  if (_.includes(number, value)) return 'number';

  return 'string';
};

const ICON_BY_TYPE: any = {
  date: 'icon-dip-riqixing',
  number: 'icon-dip-zhengshuxing',
  boolean: 'icon-dip-buerxing',
  string: 'icon-dip-wenbenxing',
};

/** 格式化数据类型的icon */
const formatIconByType = (type: string) => {
  return ICON_BY_TYPE[formatType(type)] || '';
};

export { formatType, formatIconByType };
