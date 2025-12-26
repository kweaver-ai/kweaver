import _ from 'lodash';
import intl from 'react-intl-universal';
import { PRICE_UNIT } from '@/enums/amount_currency';
import { onHandleInt } from '../assistFunction';

/**
 * 删除
 */
export const onDelete = (record: any, dataSource: any[], isSingle: any, disCount: any) => {
  let result = _.filter(_.cloneDeep(dataSource), (item: any) => item?.user_id !== record?.user_id);
  const input_tokens_remain = disCount?.input_tokens + (record?.input_tokens * PRICE_UNIT[record?.num_type?.[0]] || 0);
  const output_tokens_remain = disCount?.output_tokens + (record?.output_tokens * PRICE_UNIT[record?.num_type?.[1]] || 0);

  let newDisCount: any = {};
  if (isSingle) {
    newDisCount = { ...disCount, input_tokens: input_tokens_remain, output_tokens: output_tokens_remain };
  } else {
    newDisCount = { ...disCount, input_tokens: input_tokens_remain };
  }

  result = onHandleInputStatus(result, newDisCount);

  return { result, newDisCount };
};

/**
 * 可剩余分配额度为整数重新更新输入框的报错状态
 */
const onHandleInputStatus = (data: any, newDisCount: any) => {
  return _.map(_.cloneDeep(data), (item: any) => {
    if (newDisCount?.input_tokens >= 0) {
      item.input_status = '';
    }
    if (newDisCount?.output_tokens_remain >= 0) {
      item.output_status = '';
    }
    return item;
  });
};

/**
 * 保存时判断是否有为空数据
 */
export const onHandleIsEmpty = (data: any, type: number) => {
  let isEmpty = false;
  let result: any = [];
  if (type === 0) {
    result = _.map(_.cloneDeep(data), (item: any) => {
      if (!item?.input_tokens) {
        isEmpty = true;
        item.input_status = intl.get('global.noNull');
      }
      return item;
    });
  } else {
    result = _.map(_.cloneDeep(data), (item: any) => {
      if (!item?.input_tokens) {
        isEmpty = true;
        item.input_status = intl.get('global.noNull');
      }
      if (!item?.output_tokens) {
        isEmpty = true;
        item.output_status = intl.get('global.noNull');
      }
      return item;
    });
  }
  return { isEmpty, result };
};

/**
 * 操作时额度计算
 */
export const onCalculateOperate = (data: any, type: number, disCount: any) => {
  let allInputQuota: any = 0;
  let allOutputQuota: any = 0;
  if (type === 0) {
    _.map(_.cloneDeep(data), (item: any) => {
      allInputQuota += (item?.input_tokens || 0) * PRICE_UNIT[item?.num_type?.[0]];
    });
  } else {
    _.map(_.cloneDeep(data), (item: any) => {
      allInputQuota += (item?.input_tokens || 0) * PRICE_UNIT[Number(item?.num_type?.[0])];
      allOutputQuota += (item?.output_tokens || 0) * PRICE_UNIT[Number(item?.num_type?.[1])];
    });
  }
  return {
    inputQuota: disCount?.input_tokens_remain - allInputQuota,
    outputQuota: disCount?.output_tokens_remain - allOutputQuota,
  };
};

/**
 * 用户id
 */
export const onHandleIDS = (data: any) => _.map(_.cloneDeep(data), (item: any) => item?.user_id);

/**
 * 保存前-校验输入输出额度是否超出剩余额度
 */
export const onHandleCheckQuota = (tableRecord: any, disCountRef: any) => {
  const inputRemain = disCountRef?.current?.input_tokens < 0;
  const isSave = tableRecord?.billing_type === 0 ? inputRemain : inputRemain || disCountRef?.current?.output_tokens < 0;
  return isSave;
};

/**
 * 处理用户是否被添加(被添加添加参数isAdded)
 */
export const onHandleAdded = (tableDataRef: any, data: any) => {
  const allReadyAddedIds = onHandleIDS(tableDataRef?.current);
  let addedList: any = [];
  let filterNotAddedList: any = [];
  const isEmptyTableData = _.isEmpty(allReadyAddedIds);
  if (!isEmptyTableData) {
    _.map(_.cloneDeep(data), (item: any) => {
      if (_.includes(allReadyAddedIds, item?.account_id)) {
        item.isAdded = true;
        item.user_name = item?.username;
        item.user_id = item?.account_id;
        addedList = [...addedList, item];
      } else {
        filterNotAddedList = [...filterNotAddedList, item];
      }
    });
  }

  const result = _.map(_.cloneDeep(isEmptyTableData ? data : [...addedList, ...filterNotAddedList]), (item: any) => ({
    value: item?.username,
    label: item?.username,
    key: item?.account_id || item?.id,
  }));
  return result;
};

/**
 * 更新数据为空则传所有的
 */
export const onHandleUpdateEmpty = (data: any, tableRecord: any) => {
  const result = _.map(_.cloneDeep(data), (item: any) => {
    return {
      input_tokens: item?.input_tokens || undefined,
      output_tokens: item?.output_tokens || undefined,
      user_id: item?.user_id,
      num_type: item?.num_type,
      model_quota_id: item?.model_quota_id || tableRecord?.conf_id,
    };
  });
  return result;
};

/**
 * 分配的总金额
 */
export const onHandleIsAllCalculate = (tableData: any, tableRecord: any) => {
  let inputTotalDistribution = 0;
  let outputTotalDistribution = 0;

  _.map(_.cloneDeep(tableData), (item: any) => {
    inputTotalDistribution += item.input_tokens === null ? 0 : onHandleInt(item.input_tokens) * PRICE_UNIT[item.num_type?.[0]];
    if (tableRecord?.billing_type === 1) {
      outputTotalDistribution += item.output_tokens === null ? 0 : onHandleInt(item.output_tokens) * PRICE_UNIT[item.num_type?.[1]];
    }
  });
  return { inputTotalDistribution, outputTotalDistribution };
};

export const onUpdateTableDataBeyondError = (tableData: any, inputStatus: any, outputStatus: any, tableRecord: any) => {
  // 只去除超出范围的报错
  const result = _.map(_.cloneDeep(tableData), (item: any) => {
    if (inputStatus && _.includes([intl.get('modelQuota.beyondAll'), intl.get('modelQuota.beyondInput')], item.input_status)) item.input_status = '';
    if (outputStatus && tableRecord.billing_type === 1 && item.output_status === intl.get('modelQuota.beyondOutput')) item.output_status = '';
    return item;
  });
  return result;
};
