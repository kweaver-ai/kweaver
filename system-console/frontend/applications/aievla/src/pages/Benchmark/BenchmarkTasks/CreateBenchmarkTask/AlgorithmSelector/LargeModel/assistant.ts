// 修改树

import _ from 'lodash';

/**
 * 更新树数据源
 */
export const updateTreeData = ({ treeDataSource, children, replaceKey }: any) => {
  const result = _.cloneDeep(treeDataSource);
  const loop = (data: any[]) => {
    data.forEach((node, index) => {
      if (typeof replaceKey === 'object' ? _.includes(replaceKey, node.key) : replaceKey === node.key) {
        node.children = children;
      } else {
        if (node.children && node.children.length > 0) {
          loop(node.children);
        }
      }
    });
  };
  loop(result);
  return result;
};

/**
 * 提示词搜索返回数据格式处理(便于树形结构展示)
 */
export const onHandlePromptItemTypes = (data: any) => {
  const result = _.reduce(
    _.cloneDeep(data),
    (pre: any, key: any) => {
      const newPromptItemTypes = _.map(_.cloneDeep(pre?.[key.prompt_item_id]?.prompt_item_types), (item: any) => item.id) || [];

      // 不存在则添加，存在不添加 避免重复添加
      let allPromptItemTypes: any = pre?.[key.prompt_item_id]?.prompt_item_types || [];
      if (!_.includes(newPromptItemTypes, key.prompt_item_type_id)) {
        allPromptItemTypes = [{ name: key.prompt_item_type, id: key.prompt_item_type_id }, ...(pre?.[key.prompt_item_id]?.prompt_item_types || [])];
      }

      pre[key.prompt_item_id] = {
        prompt_item_name: key.prompt_item_name,
        prompt_item_id: key.prompt_item_id,
        prompt_item_types: allPromptItemTypes,
      };
      return pre;
    },
    {},
  );

  return Object.values(result);
};

/**
 * 搜索到的内容默认全部展开
 */
export const onHandleExpandKeys = (data: any) => {
  let expandKeys: any = [];
  const loop = (value: any) => {
    _.map(_.cloneDeep(value), (item: any) => {
      expandKeys = [...expandKeys, _.includes(item.value, '-') ? item.value?.split('-')?.[0] : item.value];
      if (item.children) {
        loop(item.children);
      }
    });
  };

  loop(data);

  return [...new Set(expandKeys)];
};
