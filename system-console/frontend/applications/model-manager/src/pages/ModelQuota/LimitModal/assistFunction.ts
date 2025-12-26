import _ from 'lodash';
import intl from 'react-intl-universal';

import { PRICE_UNIT, TOKENS_UNIT } from '@/enums/amount_currency';
import { limitDecimals, onHandleInt } from '../assistFunction';

/**
 * 判断输入框填入是否正确
 */
export const onIsError = (source: any) => {
  let error = false;
  _.map(_.cloneDeep(source), (item: any) => {
    if (item?.error?.tokens || item?.error?.referprice) {
      error = true;
    }
  });
  return error;
};

/**
 * tokens单位换算
 */
export const onGetUnit = (data: any, type?: string) => {
  let result: any = 0;
  if (type === 'in' || data?.type === 'in') {
    result = PRICE_UNIT[Number(type === 'in' ? data?.num_type?.[0] : data?.num_type)];
  } else {
    result = PRICE_UNIT[Number(type === 'out' ? data?.num_type?.[1] : data?.num_type)];
  }
  return result;
};

/**
 * tokens单位更改 预估总金额计算
 */
export const onCalculateForecast = (data: any, type: string, tokensUnit: string) => {
  const result: any = { in: 0, out: 0 };

  // 不区分输入输出
  if (type === 'noDistinction') {
    _.map(_.cloneDeep(data), (item: any, index: number) => {
      result[index === 0 ? 'in' : 'out'] = onHandleForecastResult(item, tokensUnit);
    });
  } else {
    const dataSourceDependIndex = data[type === 'in' ? 0 : 1];
    result[type] = onHandleForecastResult(dataSourceDependIndex, tokensUnit);
  }
  return result;
};

/**
 * 预估总金额统一处理
 */
const onHandleForecastResult = (dataSourceIndex: any, tokensUnit: string) => {
  let result = 0;
  const isNull = _.isNull(dataSourceIndex?.tokens) || _.isNull(dataSourceIndex?.referprice);
  result =
    ((onHandleInt(dataSourceIndex?.tokens) || 0) * onGetUnit(dataSourceIndex) * (onHandleInt(dataSourceIndex?.referprice) || 0)) / TOKENS_UNIT[tokensUnit];
  const carryProcessing = limitDecimals(result, 2, true, true);
  return isNull ? null : carryProcessing;
};

/**
 * 打开弹窗后-tokens数量和单价赋值
 */
export const onHandleInputOutputData = (data?: any) => {
  const inputTokens = data?.input_tokens || 9999;
  const outputTokens = data?.output_tokens || 9999;
  const inputReferprice = data?.referprice_in || 0;
  const outputReferprice = data?.referprice_out || 0;
  const tokensSingleUnit = data?.price_type?.[0] || 'thousand';
  // 进入后输入输出保存的小数位数要做处理
  const inputTotalCalculator = (data?.input_tokens * onGetUnit(data, 'in') * inputReferprice) / TOKENS_UNIT[tokensSingleUnit];
  const inputTotal = limitDecimals(inputTotalCalculator, 2);
  const outputTotalCalculator = (data?.output_tokens * onGetUnit(data, 'out') * outputReferprice) / TOKENS_UNIT[tokensSingleUnit];
  const outputTotal = limitDecimals(outputTotalCalculator, 2);
  return { inputTokens, outputTokens, inputReferprice, outputReferprice, tokensSingleUnit, inputTotal, outputTotal };
};

/**
 * 打开弹窗后-表格数据展示
 */
export const onHandleTableData = (modelSelect: any, data?: any) => {
  const { inputTokens, outputTokens, inputReferprice, outputReferprice, inputTotal, outputTotal } = onHandleInputOutputData(data);
  const common = {
    id: 1,
    tokens: inputTokens,
    referprice: inputReferprice,
    forecast: inputTotal || 0,
    error: { tokens: false, referprice: false },
    num_type: data?.num_type?.[0] ? `${data?.num_type?.[0]}` : '3',
    type: 'in',
  };
  const dataSourceHandle = modelSelect
    ? [{ ...common, inputOutput: intl.get('modelQuota.inAndOut') }]
    : [
        { ...common, inputOutput: intl.get('modelQuota.in') },
        {
          id: 2,
          inputOutput: intl.get('modelQuota.out'),
          tokens: outputTokens,
          referprice: outputReferprice,
          forecast: outputTotal || 0,
          num_type: data?.num_type?.[1] ? `${data?.num_type?.[1]}` : '3',
          type: 'out',
        },
      ];
  return dataSourceHandle;
};

/**
 * 失焦后表格数据更新
 */
export const onHandleBlurTableData = (dataSource: any, record: any, singleTokens: string) => {
  const newBlurTableData = _.map(_.cloneDeep(dataSource), (item: any) => {
    const isEmpty = _.includes([0, '0'], item?.referprice);
    if (record?.id === item?.id && item?.tokens && item?.referprice) {
      const price = isEmpty ? '0' : (parseFloat(item?.tokens) * onGetUnit(item) * (parseFloat(item?.referprice) || 0)) / TOKENS_UNIT[singleTokens];

      item.forecast = isEmpty
        ? '0'
        : _.includes(`${price}`, '.')
          ? onHandleInt(price)
              ?.toFixed(2)
              ?.replace(/(\.\d*[^0])0*$/, '$1') // 小数点后2位
          : `${price}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')?.replace(/(\.\d*[^0])0*$/, '$1');
    }
    if ((!item?.referprice && !isEmpty) || !item?.tokens) {
      item.forecast = null;
    }
    return item;
  });
  return newBlurTableData;
};

/**
 * 判断数据是否为null
 */
export const onHandleIsNull = (data: any[]) => {
  let isNull = false;
  let allCalculate: any = 0;
  _.map(_.cloneDeep(data), (item: any) => {
    if (_.isNull(item)) {
      isNull = true;
    }
    allCalculate += onHandleInt(item);
  });

  return isNull ? '' : allCalculate;
};
