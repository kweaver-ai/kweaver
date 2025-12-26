import { useState } from 'react';
import _ from 'lodash';
import { Tabs, type TabsProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import ENUMS from '@/enums';
import { Button, Drawer } from '@/common';

import BasicInformation from './BasicInformation';
import UsageStatistics from './UsageStatistics';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

const StatisticDrawer = (props: any) => {
  const { open, source = {}, onTest: props_onTest, onOk, onCancel } = props;
  const [fetching, setFetching] = useState(false);

  const { model_name, model_series } = source || {};

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
    <Drawer title='模型统计' width={800} open={open} onClose={onCancel}>
      <div className='g-border g-border-radius g-flex-space-between' style={{ height: 48, padding: '8px 20px' }}>
        <div className='g-flex' title={model_name}>
          <img src={MODEL_ICON_KV[model_series]?.icon} className='g-mr-2' style={{ width: 24, height: 24 }} />
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
