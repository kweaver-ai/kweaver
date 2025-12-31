import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { CaretRightOutlined } from '@ant-design/icons';
import { useAsyncEffect } from 'ahooks';
import { Collapse, Tag } from 'antd';
import _ from 'lodash';
import api from '@/services/data-analysis/metric-model';
import styles from './index.module.less';

export const logWareHouseExpandData = (data: any) => {
  const { tags, dataSource, comment, groupName, id } = data;
  const dataSourceId = dataSource?.id;

  return [
    { name: 'ID', content: id },
    { name: intl.get('Global.group'), content: groupName || '--' },
    { name: intl.get('Global.comment'), content: comment ? <span style={{ whiteSpace: 'pre-wrap' }}>{comment}</span> : '--' },
    { name: intl.get('Global.tag'), content: tags?.length ? tags.map((value: any, index: any) => <Tag key={index.toString()}>{value}</Tag>) : '--' },
    {
      name: intl.get('MetricModel.dataSources'),
      content: (
        <Tag key={dataSourceId} title={dataSourceId}>
          {dataSourceId}
        </Tag>
      ),
    },
  ];
};

const MetricModelDetail = (props: any) => {
  const { dataSourceId } = props;
  const [dataSource, setDataSource] = useState<any>();

  useAsyncEffect(async () => {
    if (dataSourceId) {
      const data = await getDataSourceById(dataSourceId);
      setDataSource(data);
    }
  }, [dataSourceId]);

  const getDataSourceById = async (id: any) => {
    const data = await await api.getMetricModelById([id]);
    return data;
  };

  const expandRender = (record: any): React.ReactNode => {
    const data = logWareHouseExpandData(record);

    return (
      <div className="g-p-2">
        {_.map(data, (item: any, index) => {
          const { name, content } = item;
          return (
            <div key={index} className="g-p-1 g-ellipsis-1" style={{ flexBasis: '100%' }} title={content}>
              {!!name && <span>{name}：</span>}
              <span>{content || '--'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!dataSourceId) return null;

  return (
    <Collapse
      className={styles['model-metric-detail-collapse-root']}
      bordered={false}
      defaultActiveKey={dataSource?.id}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      items={[{ key: 'metric-detail', label: dataSource?.name ?? '', children: dataSource && expandRender(dataSource) }]}
    />
  );
};

export default MetricModelDetail;
