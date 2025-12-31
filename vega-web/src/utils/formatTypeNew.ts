import _ from 'lodash';

const boolean = ['boolean'];
const date = ['timestamp', 'datetime'];
const number = ['short', 'integer', 'long', 'float', 'double', 'decimal'];

const formatTypeNew = (type: any): any => {
  if (!type) return '';
  const value = type?.toLowerCase();

  if (_.includes(boolean, value)) return 'boolean';
  if (_.includes(date, value)) return 'date';
  if (_.includes(number, value)) return 'number';

  return 'string';
};

export default formatTypeNew;
