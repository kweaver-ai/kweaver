import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Tabs } from 'antd';
import classnames from 'classnames';
import dataConnectApi from '@/services/dataConnect';
import DataConnectType from '@/services/dataConnect/type';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';
import ScanManagement from './ScanManagement';
import { dataBaseIconList } from './utils';
import DataConnect from './index';

// 默认激活的标签页
const DEFAULT_ACTIVE_TAB = 'connect';

// 数据库类型标识
const DATABASE_TYPE_EXCEL = '1';

const Doclib = () => {
  const [activeKey, setActiveKey] = useState(DEFAULT_ACTIVE_TAB);
  const [connectors, setConnectors] = useState<DataConnectType.Connector[]>([]);

  const getDataSourceConnectors = async (): Promise<void> => {
    const res = await dataConnectApi.getDataSourceConnectors();
    setConnectors(res.connectors);
  };

  const getTableType = (type: string, val: string): JSX.Element | string => {
    if (type === DATABASE_TYPE_EXCEL) {
      return (
        <>
          <IconFont type="icon-dip-table" /> {val}
        </>
      );
    }

    const cur = dataBaseIconList[type];

    if (cur) {
      return (
        <>
          <IconFont type={cur.coloredName} /> {val}
        </>
      );
    }

    return val;
  };

  useEffect(() => {
    getDataSourceConnectors();
  }, []);

  const tabItems = [
    {
      key: 'connect',
      label: intl.get('DataConnect.dataConnectManagement'),
      children: <DataConnect connectors={connectors} getTableType={getTableType} />,
    },
    {
      key: 'scan',
      label: intl.get('Global.scanManagement'),
      children: <ScanManagement connectors={connectors} getTableType={getTableType} />,
    },
  ];

  const onChange = (val: string) => {
    setActiveKey(val);
  };

  return (
    <div className={classnames('g-h-100', styles['tab-box'])}>
      <Tabs items={tabItems} activeKey={activeKey} onChange={onChange} destroyOnHidden />
    </div>
  );
};

export default Doclib;
