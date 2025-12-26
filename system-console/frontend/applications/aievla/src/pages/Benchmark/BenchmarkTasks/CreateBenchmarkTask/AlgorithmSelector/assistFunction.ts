import _ from 'lodash';
import { getParam } from '@/utils/handleFunction';

/**
 * 获取当前存在数据的最大id值+1最为新添加数据的id
 */
export const onGetTheMaxId = (addTreeData: any) => {
  const action = getParam('action');
  const keysArr = _.map(_.cloneDeep(addTreeData), (item: any) =>
    action === 'create'
      ? parseInt(item.key)
      : _.includes(item.key, '/')
        ? parseInt(item.key?.split('/')?.[item.key?.split('/')?.length - 1])
        : parseInt(item.key),
  );
  const newKey = (_.max(keysArr) || 0) + 1;
  return newKey;
};
