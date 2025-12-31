import _ from 'lodash';

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

const formatType = (type: any): any => {
  if (!type) return '';
  const value = type?.toLowerCase();

  if (_.includes(boolean, value)) return 'boolean';
  if (_.includes(date, value)) return 'date';
  if (_.includes(number, value)) return 'number';

  return 'string';
};

export default formatType;
