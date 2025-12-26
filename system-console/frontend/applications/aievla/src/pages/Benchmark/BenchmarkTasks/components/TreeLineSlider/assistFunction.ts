import _ from 'lodash';

import { onCheckInputFormat } from '@/utils/handleFunction/ValueFormat';

/**
 * 外部接入---校验填入名称是否重复
 */
export const onHandleNameIsRepeat = (updateTreeData: any, key: any) => {
  const nameReduce = onNameReduce(updateTreeData);
  const resultTree = _.map(_.cloneDeep(updateTreeData), (updateTree: any) => {
    if (updateTree?.error === '检测到重复的变量名称，请重新命名' && nameReduce?.[updateTree?.title]?.length === 1) {
      updateTree.error = '';
    }
    if (updateTree?.title && nameReduce?.[updateTree?.title]?.length > 1 && updateTree?.key === key) {
      updateTree.error = '检测到重复的变量名称，请重新命名';
    }
    return updateTree;
  });
  return resultTree;
};

const onNameReduce = (data: any) => {
  const result = _.reduce(
    _.cloneDeep(data),
    (pre: any, key: any) => {
      if (key?.title) {
        pre[key?.title] = [...(pre[key?.title] || []), key];
      }
      return pre;
    },
    {},
  );
  return result;
};

/**
 * 更新
 * @param findAgent // 当前选中Agent信息
 * @param algorithm_type
 * @param value // 选中/填入的值
 * @param key // 操作数据的key
 * @param type // 操作父类/孩子/开关
 * @param newKey // 选中数据的id值
 */
export const onUpdateTreeData = (treeData: any, findAgent: any, algorithm_type: number, value: any, key: any, type: string, newKey?: any) => {
  const isExternal = algorithm_type === 4;
  const isAgentType = algorithm_type === 6;

  let result: any = [];
  let slectedValue: any = [];
  result = _.map(_.cloneDeep(treeData), (item: any, index: number) => {
    switch (type) {
      case 'paTitle':
        if (key === item?.key) {
          item.title = value;
          item.id = newKey;
          item.noPermission = value ? item?.noPermission : '';
          item.error = onCheckInputFormat(value, isExternal ? ['required', 'max', 'normal'] : ['required']);
          // Agent填写选择数据的发布状态
          if (isAgentType) {
            item.config_type = findAgent?.statusPassing;
            item.id = findAgent?.id;
            item.status = findAgent?.status;
            item.version = findAgent?.version;
          }
        }

        // 除外部接入外(外部接入是填入不是选择)，保存已选择的下拉框数据
        // 用来判断当已无可选择数据时，不允许再添加
        if (!isExternal) {
          slectedValue = [...slectedValue, value];
        }
        break;
      case 'switch':
        item.children = _.map(_.cloneDeep(item?.children), (child: any) => {
          if (child?.key === key) {
            child.is_run = value;
          }
          return child;
        });
        break;
      case 'childTitle':
        item.children = _.map(_.cloneDeep(item?.children), (child: any) => {
          if (child?.key === key) {
            child = {
              ...child,
              ...value,
              childError: onCheckInputFormat(isExternal ? value?.url : value?.prompt_name, isExternal ? ['required', 'max', 'normal'] : ['required'], 255),
            };
          }
          // 大模型提示词选择联动
          if (algorithm_type === 1) {
            child = {
              ...child,
              ...value,
              childError: onCheckInputFormat(value?.prompt_name, ['required'], 150),
            };
          }
          return child;
        });
        break;
      default:
        break;
    }
    return item;
  });

  if (isExternal) {
    result = onHandleNameIsRepeat(result, key);
  }

  return result;
};
