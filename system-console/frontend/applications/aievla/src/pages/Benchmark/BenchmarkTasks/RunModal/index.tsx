import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Tree, Input, Checkbox } from 'antd';

import UniversalModal from '@/components/UniversalModal';

import CusInput from '../components/CusInput';
import { getAlgorithm, onHandleCommonFormat } from '@/pages/Benchmark/BenchmarkTasks/CreateBenchmarkTask/assistFunction';
import { onHandleParentAndChildrenKeys, onHandleAllCheckSwitchOperate, onHandleChildrenChecked, onHandleInitializeCheckData } from './assistFunction';

import './style.less';

const RunModal = (props: any) => {
  const { visible, record, onCancel, runTask } = props;
  const [isAllChecked, setIsAllChecked] = useState(false); // 选

  const [treeData, setTreeData] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<any[]>([]); // 勾选节点
  const [expandedKeys, setExpandedKeys] = useState<any[]>([]); // 展开节点

  const algorithmType = record?.record?.algorithm_type;
  const isLargeModalExternal = _.includes([1, 4], record?.record?.algorithm_type);

  useEffect(() => {
    if (visible) {
      getInitTask(record?.record);
    }
  }, [visible]);

  /** 获取任务详情 */
  const getInitTask = (record: any) => {
    // 后端返回数据整理成树组件需要的形式
    const treeDataResult = getAlgorithm(record?.algorithm_type, record?.algorithm);
    // checkedResult-勾选数据 & resultTreeData-更新后的树组件的数据
    const { checkedResult, resultTreeData } = onHandleCheckable(treeDataResult);
    setCheckedKeys(checkedResult);
    setTreeData(resultTreeData);
    // 树组件默认展开所有
    const allExpandedKeys = _.map(_.cloneDeep(resultTreeData), (item: any) => item?.key) || [];
    setExpandedKeys(allExpandedKeys);
  };

  /**
   * 弹窗进入-勾选数据判断
   */
  const onHandleCheckable = (treeDataResult: any) => {
    // 父类下所有已开启的子类(is_run为true--开关开启)
    let reduceData: any = {};
    const newTree = _.map(_.cloneDeep(treeDataResult), (pre: any) => {
      reduceData[pre.title] = _.filter(_.cloneDeep(pre?.children), (child: any) => {
        return child?.is_run;
      });
      pre.children = _.filter(_.cloneDeep(pre?.children), (child: any) => child?.is_run);
      return pre;
    });

    const { resultTreeData, checkedArr } = onHandleInitializeCheckData(treeDataResult, newTree, reduceData);
    onHandleIsAllChecked(newTree, checkedArr);

    return { checkedResult: checkedArr, resultTreeData };
  };

  /**
   * 判断是否全部勾选
   * @param treeDataResult // 当前treeData
   * @param checkedArr // 当前勾选的数据
   */
  const onHandleIsAllChecked = (treeDataResult: any, checkedArr: any) => {
    let allRunArr: any = []; // 开关开启的所有数据(包括父类)
    _.map(_.cloneDeep(treeDataResult), (pre: any) => {
      allRunArr = [...allRunArr, pre?.key];
      _.map(_.cloneDeep(pre?.children), (child: any) => {
        if (child?.is_run) {
          allRunArr = [...allRunArr, child.key];
        }
      });
    });

    // 判断是否全部勾选
    if (allRunArr?.length === checkedArr?.length) {
      setIsAllChecked(true);
    } else {
      setIsAllChecked(false);
    }
  };

  /**
   * 全选 | 全不选
   */
  const onCheckAll = (e: any) => {
    const check = e?.target?.checked;
    setIsAllChecked(check);
    const checkedArr = onHandleAllCheckSwitchOperate(check, treeData);
    const filterEmpty = _.filter(_.cloneDeep(checkedArr), (item: any) => item !== '');
    setCheckedKeys([...new Set(filterEmpty)]);
  };

  /**
   * 树控件-多选框变化
   * 当前树控件父子节点选中不关联，因此需手动判断父子节点关系
   */
  const onCheck = (checkedKeysArr: any, info: any) => {
    const checked = info?.checked;
    const filterCheckedKeysArr = onHandleCheckedKeys(checkedKeysArr, info, checked);
    const updateChecked = checked ? [...checkedKeys, ...filterCheckedKeysArr] : _.filter(checkedKeys, (item: any) => !_.includes(filterCheckedKeysArr, item));

    // 去重
    const removDuplicates = [...new Set(updateChecked)];
    setCheckedKeys(removDuplicates);
    onHandleIsAllChecked(treeData, removDuplicates);
  };

  /**
   * 判断父/子操作后，应当勾选/取消的key值
   */
  const onHandleCheckedKeys = (checkedKeysArr: any, info: any, checked: boolean) => {
    let filterCheckedKeysArr = checkedKeysArr?.checked;
    // 父类勾选操作
    if (!_.includes(info?.node?.key, '*')) {
      // if (!_.includes(info?.node?.key, '/')) {
      filterCheckedKeysArr = onHandleParentAndChildrenKeys(treeData, info);
    }

    // 子类勾选/取消--还要判断是否都被勾选，都被勾选此时父类也要勾选)
    if (_.includes(info?.node?.key, '*')) {
      // if (_.includes(info?.node?.key, '/')) {
      filterCheckedKeysArr = !checked
        ? [_.cloneDeep(info?.node?.key?.split('*')?.[0]), info?.node?.key]
        : // ? [_.cloneDeep(info?.node?.key?.split('/')?.[0]), info?.node?.key]
          onHandleChildrenChecked(treeData, info, filterCheckedKeysArr);
    }
    return filterCheckedKeysArr;
  };

  const titleRender = (node: any) => {
    const {
      key,
      title,
      error = false,
      childError = false,
      prompt_name = '', // 提示词名称(大模型)
      url = '', // (外部接入)
    } = node;
    return (
      <>
        {`${key}`?.split('*')?.[1] ? (
          // {`${key}`?.split('/')?.[1] ? (
          <div className='ad-align-center ad-mt-4'>
            <Input className={classNames({ 'ad-mr-3': isLargeModalExternal })} style={{ width: isLargeModalExternal ? 262 : 676 }} value={title} disabled />
            {algorithmType === 1 ? (
              <Input disabled={true} value={prompt_name} style={{ width: 402 }} />
            ) : algorithmType === 4 ? (
              <CusInput placeholder={intl.get('global.pleaseEnter')} value={url} inputWidth={402} error={childError} disabled={true} />
            ) : null}
          </div>
        ) : (
          <div className='ad-align-center'>
            {algorithmType === 4 ? (
              <CusInput placeholder={intl.get('global.pleaseEnter')} value={title} error={error} inputWidth={314} />
            ) : (
              <Input disabled={true} style={{ width: 314 }} value={title || undefined} />
            )}
          </div>
        )}
      </>
    );
  };

  /**
   * 确定
   */
  const onOk = () => {
    const updateTreeData = _.map(_.cloneDeep(treeData), (tree: any) => {
      if (tree?.children) {
        tree.children = _.map(tree.children, (child: any) => {
          child.is_run = _.includes(checkedKeys, child.key);
          return child;
        });
      }
      return tree;
    });
    const handleFormat = onHandleCommonFormat(updateTreeData, algorithmType);
    runTask(
      { algorithm: handleFormat?.result, algorithm_type: `${algorithmType}`, id: record?.record?.id },
      _.isEmpty(record?.data?.modelTokens) ? record?.data : '',
    );
  };

  return (
    <UniversalModal
      title={intl.get('benchmarkTask.runTasks')}
      className='benchmark-task-run-modal-root'
      visible={visible}
      onCancel={onCancel}
      width={800}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: () => onOk() },
      ]}
    >
      <Checkbox className='ad-mb-4' checked={isAllChecked} onChange={(e: any) => onCheckAll(e)}>
        {intl.get('global.checkAll')}
      </Checkbox>
      {_.map(treeData, (item: any) => (
        <Tree
          className='ad-mb-5'
          showLine
          treeData={[item]}
          titleRender={titleRender}
          expandedKeys={expandedKeys}
          defaultExpandAll={true}
          switcherIcon={false}
          checkable
          checkStrictly={true}
          checkedKeys={checkedKeys}
          onCheck={onCheck}
        />
      ))}
    </UniversalModal>
  );
};

export default (props: any) => (props?.visible ? <RunModal {...props} /> : null);
