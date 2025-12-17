import type React from 'react';
import { Tabs } from 'antd';
import { startTransition, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LogicsList from './LogicsList';
import { ActiveKeyTypeEnum } from '../Actions/types';

const Logics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeKey, setActiveKey] = useState<string>(searchParams.get('activeKey') || ActiveKeyTypeEnum.Manage);
  const tabItems = [
    {
      label: '管理',
      key: ActiveKeyTypeEnum.Manage,
    },
    {
      label: '全部',
      key: ActiveKeyTypeEnum.Market,
    },
  ];
  const handleTabChange = useCallback((key: string) => {
    startTransition(() => {
      setActiveKey(key);
      // 更新 URL 参数
      searchParams.set('activeKey', key);
      setSearchParams(searchParams);
    });
  }, []);

  return (
    <div>
      <Tabs
        onChange={handleTabChange}
        type="card"
        items={tabItems}
        activeKey={activeKey}
        className="operator-content-tabs"
      />
      <LogicsList isPluginMarket={activeKey === ActiveKeyTypeEnum.Market ? true : false} activeKey={activeKey} />
    </div>
  );
};

export default Logics;
