import _ from 'lodash';

const omitData = ['algorithm', 'algorithm_type', 'publish_time', 'publish_user', 'rank'];

/**
 * 表格数据添加id值
 */
export const onHandleTableId = (data: any, body: any) => {
  const total = data?.length;
  let result: any = [];
  result = _.map(_.cloneDeep(data), (item: any, index: number) => {
    const rank = body?.order === 'desc' ? (body.page - 1) * 50 + index + 1 : total - (body.page - 1) * 50 - index;
    return { ...item, rank };
  });
  if (body?.task_id) {
    result = onHandleTaskData(result);
  }
  return result;
};

/**
 * 判断子任务是否有数据返回，无数据则不在列表中显示
 */
export const onHandleTaskData = (data: any) => {
  let result: any = [];
  result = _.filter(data, (item: any) => !_.isEmpty(_.omit(item, omitData)));
  return result;
};

/**
 * 判断task的孩子列数
 */
export const onHandleTaskColumns = (columns: any) => {
  let childrenCount: number = 0;
  let isAverage = false;
  _.map(_.cloneDeep(columns), (item: any) => {
    if (item?.dataIndex !== 'average') {
      childrenCount += item?.children?.length;
    } else {
      isAverage = true;
    }
  });
  return { childrenCount, isAverage };
};

/**
 * 列宽根据task数动态调整
 */
export const onHandleColumnsWidth = (data: any) => {
  let result: any = {};
  result = (onHandleWidth(data?.isAverage) as any)[data?.columnsCount];
  return result;
};

const onHandleWidth = (isAverage: boolean) => ({
  1: isAverage ? 205 : 210,
  2: isAverage ? 200 : 195,
  3: isAverage ? 190 : 185,
  4: isAverage ? 180 : 175,
});

/**
 * 处理body
 */
export const onHandleBody = (tableState: any, state: any, isUpdate = false) => {
  let body = _.omit({ ...tableState, ...state }, !state?.algorithm_type ? ['name', 'algorithm_type', 'loading'] : ['name', 'loading']);
  if (isUpdate || body.task_id === -1) {
    body = _.omit(body, ['task_id']);
  }
  return body;
};
