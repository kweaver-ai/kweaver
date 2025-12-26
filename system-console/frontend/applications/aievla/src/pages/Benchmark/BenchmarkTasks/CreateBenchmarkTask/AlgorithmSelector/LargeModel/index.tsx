import { useEffect, useState, useRef } from 'react';

import _ from 'lodash';
import { message } from 'antd';
import intl from 'react-intl-universal';

import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';

import * as servicesLLMModel from '@/services/llmModel';

import { MODEL_TYPE } from '../../../enums';
import { onGetTheMaxId } from '../assistFunction';
import TreeLineSlider from '../../../components/TreeLineSlider';

import './style.less';

const noExistErrorTip = intl.get('benchmarkTask.noExistErrorTip', {
  name: intl.get('benchmarkTask.LModelTwo'),
});
export default function LargeModel(props: any) {
  const { disabled, value, tasksArr, onChange, operateChange, algChange, onCancelLoading } = props;
  const [listData, setListData] = useState<any[]>([]);
  const [optionalList, setOptionalList] = useState<any[]>([]); // 下拉框可选列表
  const [selectedValueArr, setSelectedValueArr] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [isSelectedEmpty, setIsSelectedEmpty] = useState<any>(false);

  const defaultTreeData = [
    {
      title: '',
      key: 1,
      error: false,
      children: _.map(_.cloneDeep(tasksArr), (item: any) => ({
        title: item?.name,
        key: `1*${item?.id}`,
        is_run: true,
        prompt_name: '',
        prompt_id: '',
      })),
    },
  ];

  const [addTreeData, setAddTreeData] = useState<any[]>(value || defaultTreeData);
  const valueRef = useRef<any>(value || defaultTreeData);

  useDeepCompareEffect(() => {
    if (value) {
      setAddTreeData(value);
      onFilterSelected(listData, value);
      valueRef.current = value;
      return;
    }
    // 此时有可选数据
    if (!isSelectedEmpty) {
      valueRef.current = defaultTreeData;
      setAddTreeData(defaultTreeData);
    }
  }, [value]);

  useEffect(() => {
    getModelList();
    onChange(value || defaultTreeData);
  }, []);

  /** 获取大模型列表 */
  const getModelList: Function = async () => {
    setLoading(true);
    try {
      const param = { name: '', page: 1, rule: 'create_time', series: 'all', order: 'desc', size: 1000 };
      const result = (await servicesLLMModel.llmGetList(param)) || {};
      const listDataResult = [...(result?.data || [])];
      setIsSelectedEmpty(_.isEmpty(listDataResult));

      // 1.后端数据返回为空
      if (_.isEmpty(listDataResult)) {
        onHandleEmpty();
      } else {
        // 2.有可选
        onHandleSelectedList(listDataResult);
      }
    } catch (err: any) {
      onCancelLoading();
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
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
  };

  /**
   * 返回列表数据存在可选数据
   */
  const onHandleSelectedList = (listDataResult: any) => {
    // 列表只有一个数据则默认自动填充进去
    if (listDataResult?.length === 1 && !value) {
      onDefaultValue(listDataResult);
      return;
    }

    // 有多条可选数据
    setListData(listDataResult);
    onFilterSelected(listDataResult);
    const allIds = _.map(_.cloneDeep(listDataResult), (item: any) => item?.model_id);
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
  const onDefaultValue = (listDataResult: any) => {
    const updateTreeData = [
      {
        title: listDataResult?.[0]?.model_name,
        key: 1,
        id: listDataResult?.[0]?.model_id,
        error: false,
        children: _.map(_.cloneDeep(tasksArr), (item: any) => ({
          title: item?.name,
          key: `1*${item?.id}`,
          is_run: true,
        })),
      },
    ];
    setAddTreeData(updateTreeData);
    valueRef.current = updateTreeData;
    setSelectedValueArr([listDataResult?.[0]?.model_name]);
    onChange(updateTreeData);
    onCommonCancelLoading();
  };

  /**
   * 更新下拉框可选数据
   * @param sortedListData // Agent列表
   * @param newTreeData // 更新的树组件数据
   */
  const onFilterSelected = (sortedListData: any, newTreeData?: any) => {
    const allAlreadySelected = _.map(_.cloneDeep(newTreeData || addTreeData), (item: any) => item.title);
    const filterData = _.filter(_.cloneDeep(sortedListData), (item: any) => !_.includes(allAlreadySelected, item.model_name));
    setOptionalList(filterData);
    setLoading(false);
  };

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
    setAddTreeData(filterDeleteData);
    valueRef.current = filterDeleteData;
    onChange(filterDeleteData);
  };

  /**
   * 添加评估对象
   */
  const onAddEvaluationObject = () => {
    // 新添加数据提示词与之前已选择的提示词相同
    const ItemData = (value || defaultTreeData)?.[0]?.children?.[0];
    const isExist = ItemData?.prompt_id;
    // 为新添加的数据赋值---赋id值
    const newKey = onGetTheMaxId(addTreeData);
    const newChildren = _.map(_.cloneDeep(tasksArr), (item: any) => ({
      title: item?.name,
      key: `${newKey}*${item?.id}`,
      is_run: true,
      prompt_id: isExist ? ItemData?.prompt_id : '',
      prompt_name: isExist ? ItemData?.prompt_name : '',
    }));

    const newAddItem = { ...defaultTreeData?.[0], key: newKey, children: newChildren };
    const newTreeData = [...addTreeData, newAddItem];
    setAddTreeData(newTreeData);
    valueRef.current = newTreeData;
    operateChange();
    onChange(newTreeData);
  };

  const onUpdateSelected = (updateTreeData: any) => {
    onFilterSelected(listData, updateTreeData);
  };

  /**
   * loading关闭
   */
  const onCommonCancelLoading = () => {
    setLoading(false);
    onCancelLoading();
  };

  return (
    <div className='benchmark-task-largeModel-root ad-w-100'>
      <TreeLineSlider
        disabled={disabled}
        getListData={getModelList}
        treeData={valueRef.current}
        optionalList={optionalList}
        allListData={listData}
        onDelete={onDelete}
        onChange={onChange}
        loading={loading}
        operateChange={operateChange}
        algorithm_type={MODEL_TYPE.LLM}
        onUpdateSelected={onUpdateSelected}
        onAddEvaluationObject={onAddEvaluationObject}
        selectedValueArr={selectedValueArr}
        setSelectedValueArr={setSelectedValueArr}
        algChange={algChange}
        isSelectedEmpty={isSelectedEmpty}
      />
    </div>
  );
}
