import { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import SERVICE from '@/services';

import { Drawer, Title, Text } from '@/common';

import ChartLine from './ChartLine';

const MonitorDrawer = (props: any) => {
  const { open, source = {}, onCancel } = props;
  const [data, setData] = useState<any>({});

  useEffect(() => {
    if (source?.model_id) getMonitorData();
  }, [source?.model_id]);

  const getMonitorData = async () => {
    try {
      const result = await SERVICE.llm.modelMonitorList({ model_id: source?.model_id });
      setData(result);
    } catch (error) {
      console.log('error', error);
    }
  };

  const DATA = [
    {
      key: 'average_first_token_time',
      title: intl.get('ModelManagement.monitorDrawer.initialSpeed'),
      describe: intl.get('ModelManagement.monitorDrawer.initialSpeedSub'),
    },
    {
      key: 'output_token_speed',
      title: intl.get('ModelManagement.monitorDrawer.outputSpeed'),
      describe: intl.get('ModelManagement.monitorDrawer.outputSpeedSub'),
    },
    {
      key: 'total_token_speed',
      title: intl.get('ModelManagement.monitorDrawer.tokenThroughput'),
      describe: intl.get('ModelManagement.monitorDrawer.tokenThroughputSub'),
    },
  ];

  return (
    <Drawer title={intl.get('ModelManagement.monitorDrawer.title')} width={800} open={open} onClose={onCancel}>
      {_.map(DATA, item => {
        const { key, title, describe } = item;
        return (
          <div key={key} className='g-border g-border-radius g-p-4 g-mb-5'>
            <Title className='g-mb-1'>{title}</Title>
            <Text className='g-mb-2 g-c-text-sub g-display-block'>{describe}</Text>
            <div style={{ height: 160 }}>
              <ChartLine title={title} style={{ marginLeft: -14 }} sourceData={data[key] || []} />
            </div>
          </div>
        );
      })}
    </Drawer>
  );
};

export default MonitorDrawer;
