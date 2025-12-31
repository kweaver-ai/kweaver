import dayjs from 'dayjs';
import Fields from '@/web-library/utils/fields';
import { DataFilterValue, FieldList } from './type';

// 包含like，not_like，regexp, 'not_empty', 'empty'这三种操作符的string类型
const stringFieldTypes = ['text', 'string', 'binary'];

export const transformType = (type: string): string => {
  if (Fields.DataType_Number_Types.includes(type)) {
    return 'number';
  }

  if (Fields.DataType_Date_Types.includes(type)) {
    return 'date';
  }

  if (type === 'all Fields') {
    return 'all Fields';
  }

  if (stringFieldTypes.includes(type)) {
    return 'textString';
  }

  return 'string';
};

export const transformOperation = (operation: string): string => {
  return operation === 'not_like' ? 'notLike' : operation;
};

export const findTypeByName = (name: string, fields: FieldList[]): string | undefined => {
  const field = fields.find((i: FieldList) => i.name === name);

  return field ? transformType(field.type) : undefined;
};

export const transformFilterFontToBack = (filters: any, fields: FieldList[]): any => {
  const { operation, field, valueFrom, value, sub_conditions } = filters;

  if (field) {
    const type = findTypeByName(field, fields);

    if ((operation === 'range' || operation === 'out_range') && type === 'number') {
      return {
        field,
        operation,
        valueFrom,
        value: [value.from, value.to],
      };
    }

    if ((operation === 'range' || operation === 'out_range') && type === 'date') {
      return {
        field,
        operation,
        valueFrom,
        value: [dayjs(value.value[0]).format('YYYY-MM-DDTHH:mm:ss.SSSZ'), dayjs(value.value[1]).format('YYYY-MM-DDTHH:mm:ss.SSSZ')],
      };
    }

    if ((operation === 'match' || operation === 'match_phrase') && type === 'date') {
      return {
        field,
        operation,
        valueFrom,
        value: dayjs(value).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      };
    }

    return {
      field,
      operation,
      valueFrom,
      value,
    };
  }

  return { operation, sub_conditions: sub_conditions?.map((item: any) => transformFilterFontToBack(item, fields)) };
};

export const transformFilterBackToFont = (filter: any, fields: any): DataFilterValue => {
  const { operation, value, field, valueFrom, sub_conditions } = filter;

  if (field) {
    let type = findTypeByName(field, fields);
    let val = value;

    // 当没有字段类型时，根据value的里面的值来转换格式，typeof value[0] ===number 推断类型为number
    // typeof value[0] ===string 推断类型为date
    if (!type && Array.isArray(value) && (operation === 'range' || operation === 'out_range')) {
      type = typeof value[0] === 'number' ? 'number' : 'date';
    }

    if ((operation === 'range' || operation === 'out_range') && type === 'number') {
      val = {
        from: value[0],
        to: value[1],
      };
    }

    if ((operation === 'match' || operation === 'match_phrase') && type === 'date') {
      val = dayjs(value);
    }

    if ((operation === 'range' || operation === 'out_range') && type === 'date') {
      val = {
        label: `${dayjs(value[0]).format('YYYY-MM-DD HH:mm:ss')} - ${dayjs(value[1]).format('YYYY-MM-DD HH:mm:ss')}`,
        value: [dayjs(value[0]), dayjs(value[1])],
      };
    }

    return { operation, value: val, field, valueFrom };
  }

  return { operation, sub_conditions: sub_conditions?.map((item: any) => transformFilterBackToFont(item, fields)) };
};
