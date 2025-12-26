import React, { useEffect, useState, useRef } from 'react';

import _ from 'lodash';

import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';

import { MODEL_TYPE } from '../../../enums';
import { onGetTheMaxId } from '../assistFunction';
import TreeLineSlider from '../../../components/TreeLineSlider';

import './style.less';
const ExternalAlg = (props: any) => {
  const { isValidate, disabled, value, tasksArr, onChange, operateChange, algChange, onCancelLoading } = props;

  const defaultTreeData = [
    {
      title: '',
      key: 1,
      error: false,
      children: _.map(_.cloneDeep(tasksArr), (item: any) => ({
        title: item?.name, // task名称
        key: `1*${item?.id}`,
        is_run: true,
        url: '', // 外部接入url值
      })),
    },
  ];

  const [addTreeData, setAddTreeData] = useState<any[]>(value || defaultTreeData);
  const valueRef = useRef<any>(value || defaultTreeData);

  useDeepCompareEffect(() => {
    if (value) {
      setAddTreeData(value);
      valueRef.current = value;
      return;
    }
    valueRef.current = defaultTreeData;
    setAddTreeData(defaultTreeData);
  }, [value]);

  useEffect(() => {
    valueRef.current = value || defaultTreeData;
    setAddTreeData(value || defaultTreeData);
    onCancelLoading();
    onChange(value || defaultTreeData);
  }, []);

  /**
   * 删除评估对象
   */
  const onDelete = (deleteData: any) => {
    let filterDeleteData: any = [];
    if (deleteData?.length === 0) {
      filterDeleteData = defaultTreeData;
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
    // 为新添加的数据赋值---赋id值
    const newKey = onGetTheMaxId(addTreeData);
    const newChildren = _.map(_.cloneDeep(tasksArr), (item: any) => ({
      title: item?.name,
      key: `${newKey}*${item?.id}`,
      is_run: true,
      url: '',
    }));

    const newAddItem = { ...defaultTreeData?.[0], key: newKey, children: newChildren };
    const newTreeData = [...addTreeData, newAddItem];
    setAddTreeData(newTreeData);
    valueRef.current = newTreeData;
    operateChange();
    onChange(newTreeData);
  };

  return (
    <div className='externalAlgTable' style={{ width: 630 }}>
      <TreeLineSlider
        disabled={disabled}
        treeData={valueRef.current}
        onDelete={onDelete}
        onChange={onChange}
        operateChange={operateChange}
        algorithm_type={MODEL_TYPE.EXTERNAL}
        onAddEvaluationObject={onAddEvaluationObject}
        algChange={algChange}
      />
    </div>
  );
};
export default ExternalAlg;
