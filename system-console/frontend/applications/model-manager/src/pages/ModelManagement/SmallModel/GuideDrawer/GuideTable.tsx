import { useMemo } from 'react';
import intl from 'react-intl-universal';

import { Button, Table } from '@/common';

export type GuideModalProps = {
  open: boolean;
  source: any;
  onCancel: () => void;
};

export const sourceData = () => {
  return [{ id: '1', arguments: 'base_url', value: 'https://{url}:8444/api/mf-model-api/v1/', required: true }];
};

const GuideTable: React.FC<{ dataSource: any }> = props => {
  const { dataSource } = props;

  const columns = useMemo(
    () => [
      {
        title: intl.get('ModelManagement.apiGuide.arguments'),
        dataIndex: 'arguments',
        width: 160,
        render: (_: any, data: any) => {
          return (
            <div>
              {data.arguments}
              {data.required && <span style={{ color: 'red', display: 'inline-block', marginLeft: 8 }}>*</span>}
            </div>
          );
        },
      },
      {
        title: intl.get('ModelManagement.apiGuide.value'),
        dataIndex: 'value',
        render: (_: any, data: any) => {
          if (data.onClock) {
            return <Button.Link onClick={data.onClock}>{data.value}</Button.Link>;
          } else {
            return (
              <div className='g-ps-r'>
                {data.value}
                <div style={{ top: -8, right: -8, position: 'absolute' }}>
                  <Button.Copy copyText={data.value} />
                </div>
              </div>
            );
          }
        },
      },
    ],
    [],
  );

  return (
    <div style={{ marginTop: 12 }}>
      <Table rowKey='id' size='small' bordered pagination={false} columns={columns} dataSource={dataSource} />
    </div>
  );
};

export default GuideTable;
