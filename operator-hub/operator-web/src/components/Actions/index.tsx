import type React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from 'antd';
import { startTransition, useCallback, useState } from 'react';
import ActionsList from './ActionsList';
import { ActiveKeyTypeEnum } from './types';

const Actions: React.FC = () => {
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
      <ActionsList isPluginMarket={activeKey === ActiveKeyTypeEnum.Market ? true : false} activeKey={activeKey} />
    </div>
  );
};

export default Actions;
