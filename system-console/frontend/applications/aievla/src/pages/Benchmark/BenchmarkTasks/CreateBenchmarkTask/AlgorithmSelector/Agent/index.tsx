import { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { getAgentList } from '@/services/agent';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';

import { MODEL_TYPE } from '../../../enums';
import TreeLineSlider from '../../../components/TreeLineSlider';
import { onGetTheMaxId } from '../assistFunction';

import './style.less';

const noExistErrorTip = intl.get('benchmarkTask.noExistErrorTip', { name: 'Agent' });
const Agent = (props: any) => {
  const { disabled, value, tasksArr, onChange, operateChange, algChange, onCancelLoading } = props;
  const [listData, setListData] = useState<any[]>([]); // Agent列表所有返回数据
  const [optionalList, setOptionalList] = useState<any[]>([]); // 下拉框可选列表
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedValueArr, setSelectedValueArr] = useState<any>([]);
  const [isSelectedEmpty, setIsSelectedEmpty] = useState<any>(false);

  const defaultTreeData = [
    {
      title: '',
      key: 1,
      error: false,
      config_type: '',
      status: '',
      version: '',
      children: _.map(_.cloneDeep(tasksArr), (item: any) => ({
        title: item?.name,
        key: `1*${item?.id}`,
        is_run: true,
      })),
    },
  ];

  const [addTreeData, setAddTreeData] = useState<any[]>(value || defaultTreeData);
  const valueRef = useRef<any>(value || defaultTreeData);

  useDeepCompareEffect(() => {
    if (value) {
      onCommonUpdateTreeData(value, false);
      onFilterSelected(listData, value);
      return;
    }

    // 此时有可选数据
    if (!isSelectedEmpty) {
      onCommonUpdateTreeData(defaultTreeData, false);
    }
  }, [value]);

  useDeepCompareEffect(() => {
    setAddTreeData(defaultTreeData);
  }, [tasksArr]);

  useEffect(() => {
    getListData();
    onChange(value || defaultTreeData);
  }, []);

  /**
   * 删除评估对象
   */
  const onDelete = (deleteData: any) => {
    let filterDeleteData: any = [];
    if (deleteData?.length === 0) {
      filterDeleteData = isSelectedEmpty ? undefined : defaultTreeData;
      setSelectedValueArr([]);
    } else {
      filterDeleteData = deleteData;
    }
    onCommonUpdateTreeData(filterDeleteData);
  };

  /**
   * 获取Agent列表
   */
  const getListData = async (searchValue = '') => {
    setLoading(true);
    const param: any = { page: 1, size: 1000, name: undefined };
    if (!!searchValue) param.name = searchValue;

    const result = await getAgentList(param);
    if (result) {
      const listData = result?.entries;

      // 1.无符合的数据
      if (_.isEmpty(listData)) {
        onHandleEmpty();
      } else {
        let reduceData: any = {};
        const newList: any = [];
        _.forEach(_.cloneDeep(listData), item => {
          newList.push(item);
          if (item.version !== 'v0' && item.status === 'unpublished') {
            newList.push({ ..._.cloneDeep(item), status: 'published' });
          }
        });

        _.map(newList, (item: any) => {
          let tag = '';
          let __showStatus = item.status;
          const statusCurrent = item.status;
          if (item.version === 'v0' && item.status === 'unpublished') {
            tag = intl.get('benchmarkTask.draft');
            __showStatus = 'draft';
          }
          if (item.version !== 'v0' && item.status === 'unpublished') {
            tag = intl.get('benchmarkTask.unpublishedChanges');
          }
          if (item.status === 'published') {
            tag = intl.get('benchmarkTask.published');
          }

          reduceData[`${item.id}/${statusCurrent}`] = {
            ...item,
            name: `${item.name}${tag ? `(${tag})` : ''}`,
            statusPassing: statusCurrent,
            __showStatus,
          };
        });
        onHandleSelectedList(Object.values(reduceData));
      }
    } else {
      onCommonCancelLoading(true);
    }
  };

  /**
   * 有符合选择的列表数据
   */
  const onHandleSelectedList = (filterListData: any) => {
    setIsSelectedEmpty(_.isEmpty(filterListData));
    setLoading(true);

    // 只有一条时满足条件时自动填充
    if (filterListData?.length === 1 && !value) return onDefaultValue(filterListData);

    // 除去已选择过的评估对象
    onFilterSelected(filterListData);
    setListData([...filterListData]);

    // 判断已保存的数据是否还存在在列表中，不能在则报错处理
    const allIds = _.map(_.cloneDeep([...filterListData]), (item: any) => item?.id);
    const newTableData = _.map(_.cloneDeep(valueRef.current), item => {
      item.noPermission = item?.id && !_.includes(allIds, item?.id) ? noExistErrorTip : '';
      return item;
    });
    onChange(newTableData);
    onCancelLoading();
  };

  /**
   * 当返回数据只有一条时满足条件时自动填充
   */
  const onDefaultValue = (sortedListData: any) => {
    const updateTreeData = [
      {
        title: sortedListData?.[0]?.name,
        key: 1,
        id: sortedListData?.[0]?.id,
        error: false,
        config_type: sortedListData?.[0]?.statusPassing,
        status: sortedListData?.[0]?.status,
        version: sortedListData?.[0]?.version,
        children: _.map(_.cloneDeep(tasksArr), (item: any) => ({
          title: item?.name,
          key: `1*${item?.id}`,
          is_run: true,
        })),
      },
    ];

    onCommonCancelLoading();
    setListData(sortedListData);
    setSelectedValueArr([sortedListData?.[0]?.name]);
    onCommonUpdateTreeData(updateTreeData);
  };

  /**
   * 更新树结构的数据
   */
  const onCommonUpdateTreeData = (updateTreeData: any, isChange = true) => {
    setAddTreeData(updateTreeData);

    valueRef.current = updateTreeData;
    if (isChange) {
      onChange(updateTreeData);
    }
  };

  /**
   * 返回列表数据为空时，无数据可选，此时以保存过的数据应当都提示(该Agent不存在)
   */
  const onHandleEmpty = () => {
    const newTableData = _.map(_.cloneDeep(valueRef.current), item => {
      item.noPermission = noExistErrorTip;
      return item;
    });
    onChange(newTableData);
    setListData([]);
    onCommonCancelLoading();
    setIsSelectedEmpty(true);
  };

  /**
   * 更新下拉框可选数据
   * @param sortedListData // Agent列表
   * @param newTreeData // 更新的树组件数据
   */
  const onFilterSelected = (sortedListData: any, newTreeData?: any) => {
    const allAlreadySelected = _.map(_.cloneDeep(newTreeData || addTreeData), (item: any) => item.title);
    const filterData = _.filter(_.cloneDeep(sortedListData), (item: any) => !_.includes(allAlreadySelected, item.name));
    setOptionalList(filterData);
    setLoading(false);
  };

  /**
   * 添加评估对象
   */
  const onAddEvaluationObject = () => {
    // 为新添加的数据赋值---赋id值
    const newKey = onGetTheMaxId(addTreeData);
    const newChildren = _.map(_.cloneDeep(tasksArr), (item: any) => ({
      title: item?.name,
      key: `${newKey}*${item?.id}`,
      is_run: true,
    }));
    const newAddItem = { ...defaultTreeData?.[0], key: newKey, children: newChildren };
    const newTreeData = [...addTreeData, newAddItem];
    onCommonUpdateTreeData(newTreeData);
    operateChange();
  };

  /**
   * loading关闭
   */
  const onCommonCancelLoading = (isSingleCancelEditingLoading = false) => {
    setLoading(false);
    onCancelLoading(isSingleCancelEditingLoading);
  };
  const onUpdateSelected = (updateTreeData: any) => {
    onFilterSelected(listData, updateTreeData);
  };

  return (
    <div className='ad-w-100 agentRoot'>
      <TreeLineSlider
        disabled={disabled}
        getListData={getListData}
        treeData={valueRef.current}
        optionalList={optionalList}
        allListData={listData}
        onDelete={onDelete}
        onChange={onChange}
        loading={loading}
        operateChange={operateChange}
        algorithm_type={MODEL_TYPE.AGENT}
        onUpdateSelected={onUpdateSelected}
        onAddEvaluationObject={onAddEvaluationObject}
        selectedValueArr={selectedValueArr}
        setSelectedValueArr={setSelectedValueArr}
        algChange={algChange}
        isSelectedEmpty={isSelectedEmpty}
      />
    </div>
  );
};

export default Agent;
