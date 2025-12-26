import _ from 'lodash';

/**
 * 父类勾选/取消勾选-其下子类key(只选择is_run=true)集合
 */
export const onHandleParentAndChildrenKeys = (treeData: any, info: any) => {
  let result: any = [];
  _.map(_.cloneDeep(treeData), (item: any) => {
    if (item.key === info.node.key) {
      result = [...result, item.key];
      _.map(item.children, (child: any) => {
        result = [...result, child.key];
      });
    }
  });
  return result;
};

/**
 * 子类勾选
 */
export const onHandleChildrenChecked = (treeData: any, info: any, filterCheckedKeysArr: any) => {
  const filterChildrenKeys = _.filter(
    _.cloneDeep(filterCheckedKeysArr),
    (item: any) => _.includes(item, '*') && info?.node?.key?.split('*')?.[0] === item?.split('*')?.[0],
  );

  let result: any = filterChildrenKeys;
  let reduceData: any = {};
  _.map(_.cloneDeep(treeData), (pre: any) => {
    reduceData[pre.key] = _.filter(_.cloneDeep(pre?.children), (child: any) => child?.is_run);
  });

  // 还要判断是否都被勾选，都被勾选此时父类也要勾选
  if (result?.length === reduceData?.[info?.node?.key?.split('*')?.[0]]?.length) {
    result = [...result, info?.node?.key?.split('*')?.[0]];
  }
  return result;
};

/**
 * 初始化进入-勾选数据整理
 */
export const onHandleInitializeCheckData = (treeDataResult: any, newTree: any, reduceData: any) => {
  // 判断父类下的孩子是否全部勾选，若全部勾选则父类也应勾选
  let checkedArr: any = []; // 开关开启
  let disableCheckbox: any = [];
  _.map(_.cloneDeep(newTree), (tree: any) => {
    // 1)此时孩子全部勾选，则将父类key值也存放到勾选的集合中
    if (reduceData?.[tree?.title]?.length && tree?.children?.length === reduceData?.[tree?.title]?.length) {
      checkedArr = [...checkedArr, tree?.key];
    }
    // 2)为空说明子类开关都关闭，此时父类的选择框应禁止
    if (_.isEmpty(reduceData?.[tree?.title])) {
      disableCheckbox = [...disableCheckbox, tree?.key];
    }
    // 3)孩子key值存放到勾选的集合中
    _.map(_.cloneDeep(tree.children), (t: any) => {
      if (t?.is_run) {
        checkedArr = [...checkedArr, t?.key];
      }
    });
    return tree;
  });

  const resultTreeData = _.map(_.cloneDeep(treeDataResult), (item: any) => {
    if (_.includes(disableCheckbox, item.key)) {
      item.disableCheckbox = true;
    }
    return item;
  });

  return { resultTreeData, checkedArr: [...new Set(checkedArr)] };
};

/**
 * 最外层全选开关勾选/取消勾选处理
 */
export const onHandleAllCheckSwitchOperate = (check: any, treeData: any) => {
  let checkedArr: any = [];
  const loop = (value: any) =>
    _.map(_.cloneDeep(value), (item: any) => {
      if (item?.children) {
        checkedArr = check ? [...checkedArr, item.key] : _.filter(_.cloneDeep(checkedArr), (checked: any) => checked !== item.key);

        loop(item.children);
        return;
      }

      checkedArr = check
        ? item.is_run
          ? [...checkedArr, item.key]
          : [...checkedArr]
        : _.filter(_.cloneDeep(checkedArr), (checked: any) => checked !== item.key);
    });

  loop(treeData);
  return checkedArr;
};
