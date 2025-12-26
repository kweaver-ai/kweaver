import _ from 'lodash';
import intl from 'react-intl-universal';

import { CURRENCY_TYPE, CURRENCY_TEXT, PRICE_UNIT, TOKENS_UNIT, TOKENS_UNIT_TO_TEXT } from '@/enums/amount_currency';

/**
 *参考单价处理
 */
export const onHandleSingle = (record: any) => {
  const common = (type: string) =>
    `${CURRENCY_TYPE[record?.currency_type]}${record?.[`referprice_${type}`]}${CURRENCY_TEXT[record?.currency_type]}${
      TOKENS_UNIT_TO_TEXT[record?.price_type?.[0]]
    }`;
  const inSingle = `${record?.billing_type === 1 ? `${intl.get('modelQuota.in')}：` : ''}${common('in')}`;
  const outSingle = `${record?.billing_type === 1 ? `${intl.get('modelQuota.out')}：` : ''}${common('out')}`;
  return { inSingle, outSingle };
};

/**
 * 预估总金额
 */
export const onTotalAmount = (record: any) => {
  // 总金额计算还要看一下
  const inputTokens = limitDecimals(onHandleInputOutputTokens(record, 'in'), 2, true);
  const outTokens = limitDecimals(onHandleInputOutputTokens(record, 'out'), 2, true);

  if (record?.billing_type === 0) {
    return _.includes(`${inputTokens}`, '.') && `${inputTokens}`?.split('.')[1]?.length > 2
      ? onHandleInt(inputTokens).toFixed(2)
      : `${inputTokens}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    const allPrice = onHandleInt(inputTokens) + onHandleInt(outTokens);
    return _.includes(`${allPrice}`, '.') && `${allPrice}`?.split('.')[1]?.length > 2
      ? allPrice.toFixed(2)
      : `${allPrice}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

/**
 * input | output tokens金额计算
 * @param record
 * @param type  // in | out
 */
const onHandleInputOutputTokens = (record: any, type: string) => {
  let resultTokens = 0;
  const inputOrOutputTokens = type === 'in' ? record?.input_tokens : record?.output_tokens;
  resultTokens =
    (inputOrOutputTokens * PRICE_UNIT[Number(record?.num_type?.[type === 'in' ? 0 : 1])] * parseFloat(record?.[`referprice_${type}`])) /
    TOKENS_UNIT[record?.price_type?.[0]];
  return resultTokens;
};

/**
 * 数字框输入数据处理及限制
 * @param value
 * @param decimals
 * @param noHandle 是否做处理 true-不做处理直接返回
 * @param isCarry 是否做小数进位处理 false-不做处理直接返回
 */
export const limitDecimals = (value: any, decimals = 4, _noHandle = false, isCarry = false): string => {
  let keepDecimals: any = '';
  (Array as any).from({ length: decimals }, (_: any, __: any) => {
    keepDecimals += '\\d';
  });
  if (value === null) return value;
  if (_.isNaN(value)) return '0';
  const isIncludeDot = `${value}`?.includes('.');
  if (isIncludeDot) {
    let result: any = 0;
    if (isCarry) {
      result = !onHandleInt(value) ? 0 : onHandleInt(value)?.toFixed(2);
    } else {
      const regParser = new RegExp(`^(\\-)*(\\d+)\\.(${keepDecimals}).*$`);
      result = `${value}`.replace(regParser, '$1$2.$3');
    }

    return result?.replace(/(\.\d*[^0])0*$/, '$1');
  }

  // 浮点数就不做每三个数字一分割了
  return isIncludeDot ? `${value}`?.replace(/(\.\d*[^0])0*$/, '$1') : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')?.replace(/(\.\d*[^0])0*$/, '$1');
};

/**
 * 类型转换，转换成浮点数或是整数，方便计算
 */
export const onHandleInt = (data: any) => {
  let result: any = data;
  if (typeof data === 'string') {
    if (_.includes(data, '.')) {
      result = parseFloat(data);
    } else {
      result = parseInt(data.replace(/,/g, ''), 10);
    }
  } else if (typeof data === 'number') {
    result = data;
  }
  // 出现NaN返回0
  return result === null ? result : _.isNaN(result) ? 0 : result;
};
