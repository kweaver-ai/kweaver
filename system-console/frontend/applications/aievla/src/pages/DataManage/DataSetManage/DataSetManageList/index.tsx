import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import classNames from 'classnames';

import DataSetHeader from './Header';
import DataSetTab from './DataSetTab';

import { getParam } from '@/utils/handleFunction';

import { dataSetGetById } from '@/services/dataSet';

import './style.less';

export interface DataSetManageListProps {
  key?: string;
  children?: React.ReactNode;
  onOk: Function;
  setIsPrevent: any;
  isChange: any;
  setIsChange: any;
  isConfigChange: any;
  setIsConfigChange: any;
}

const DataSetManageList = forwardRef((props: DataSetManageListProps, ref) => {
  const prefixCls = 'dataSet-config-manage-content-root';
  const { onOk, setIsPrevent, isChange, setIsChange, isConfigChange, setIsConfigChange } = props;
  const [info, setInfo] = useState({
    name: '',
    color: 'icon-color-sjj-FADB14',
    exp_permission: 0,
    description: '',
    create_user: '',
    create_time: '',
    update_user: '',
    update_time: '',
  });
  const DataSetTabRef = useRef<any>(null);

  const { _dataSet: ds_id } = getParam(['name', 'action', '_dataSet']);

  useImperativeHandle(ref, () => ({
    resetVersionDes,
    saveCurDes,
  }));

  useEffect(() => {
    setTimeout(async () => {
      try {
        const res = await dataSetGetById(ds_id);
        setInfo(res);
      } catch (err) {
        // console.log('err');
      }
    }, 0);
  }, []);

  const refreshInfo = async () => {
    try {
      const res = await dataSetGetById(ds_id);
      setInfo(res);
    } catch (err) {}
  };

  const resetVersionDes = () => {
    DataSetTabRef.current?.resetVersionDes();
  };

  const saveCurDes = () => {
    DataSetTabRef.current?.saveCurDes();
  };

  return (
    <div className={classNames(prefixCls)}>
      <div style={{ padding: '0px', height: '100%' }}>
        <DataSetHeader info={info} />
        <DataSetTab
          info={info}
          onOk={onOk}
          setIsPrevent={setIsPrevent}
          isChange={isChange}
          setIsChange={setIsChange}
          refreshInfo={refreshInfo}
          isConfigChange={isConfigChange}
          setIsConfigChange={setIsConfigChange}
          ref={DataSetTabRef}
        />
      </div>
    </div>
  );
});

export default DataSetManageList;
