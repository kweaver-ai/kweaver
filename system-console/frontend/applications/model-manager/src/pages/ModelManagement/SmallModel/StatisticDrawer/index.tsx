import { useState } from 'react';
import { Tabs, type TabsProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { Button, Drawer } from '@/common';

import BasicInformation from './BasicInformation';
import UsageStatistics from './UsageStatistics';

const StatisticDrawer = (props: any) => {
  const { open, source = {}, onTest: props_onTest, onOk, onCancel } = props;
  const [fetching, setFetching] = useState(false);

  const { model_name } = source || {};

  const items: TabsProps['items'] = [
    {
      key: 'basic-information',
      label: <span className='g-ml-3'>基本信息</span>,
      children: <BasicInformation sourceData={{ ...source, ...source?.model_config }} onOk={onOk} onTest={props_onTest} />,
    },
    // { key: 'performance-monitoring', label: <span>性能监控</span>, children: <div>性能监控</div> },
    { key: 'usage-statistics', label: <span>用量统计</span>, children: <UsageStatistics /> },
  ];

  /** 测试连接 */
  const onTest = async (data: any) => {
    try {
      setFetching(true);
      await props_onTest({ model_id: data?.model_id });
      setFetching(false);
    } catch (_error) {
      setFetching(false);
    }
  };

  return (
    <Drawer title='模型监控' width={800} open={open} onClose={onCancel}>
      <div className='g-border g-border-radius g-flex-space-between' style={{ height: 48, padding: '8px 20px' }}>
        <div className='g-flex' title={model_name}>
          <div className=' g-ellipsis-1'>{model_name}</div>
        </div>
        <Button.Link disabled={fetching} icon={fetching ? <LoadingOutlined /> : null} onClick={() => onTest(source)}>
          测试连接
        </Button.Link>
      </div>
      <Tabs
        className='g-mt-2 '
        items={items}
        size='small'
        defaultActiveKey='basic-information'
        style={{ height: 'calc(100% - 128px)' }}
        indicator={{ align: 'center', size: origin => origin + 24 }}
      />
    </Drawer>
  );
};

export default StatisticDrawer;
