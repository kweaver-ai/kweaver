import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { CaretRightOutlined } from '@ant-design/icons';
import { useAsyncEffect } from 'ahooks';
import { Collapse, Tag } from 'antd';
import _ from 'lodash';
import SERVICE from '@/services';
import DataFilterDetail from '@/web-library/components/DataFilter/indexDetail';
import styles from './index.module.less';

export const logWareHouseExpandData = (data: any) => {
  const { tags, filters, fields, dataSourceId, comment, groupName, id, dataScope } = data;

  return [
    { name: 'ID', content: id },
    { name: intl.get('Global.group'), content: groupName || '--' },
    { name: intl.get('Global.comment'), content: comment ? <span style={{ whiteSpace: 'pre-wrap' }}>{comment}</span> : '--' },
    { name: intl.get('Global.tag'), content: tags?.length ? tags.map((value: any, index: any) => <Tag key={index.toString()}>{value}</Tag>) : '--' },
    {
      content: filters ? (
        <DataFilterDetail isCollapse fieldList={fields} value={filters} maxCount={[10, 10, 10]} level={3} />
      ) : (
        `${intl.get('Global.filterCondition')}:  --`
      ),
    },
    {
      name: intl.get('MetricModel.dataSources'),
      content: (
        <Tag key={dataSourceId} title={dataSourceId}>
          {dataSourceId}
        </Tag>
      ),
    },
    { name: intl.get('MetricModel.fieldScope'), content: dataScope === 1 ? intl.get('MetricModel.allFields') : intl.get('MetricModel.partialFields') },
  ];
};

const DataViewDetail = (props: { dataSourceId?: string }) => {
  const { dataSourceId } = props;
  const [dataSource, setDataSource] = useState<any>();

  useAsyncEffect(async () => {
    if (dataSourceId) {
      const data = await getDataSourceById(dataSourceId);
      setDataSource(data);
    }
  }, [dataSourceId]);

  const getDataSourceById = async (id: any) => {
    const data = await SERVICE.dataView.getDataViewById(id);
    return data[0];
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

  if (!dataSourceId) return <></>;

  return (
    <Collapse
      className={styles['model-view-detail-collapse-root']}
      bordered={false}
      defaultActiveKey={dataSource?.id}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      items={[{ key: 'model-view', label: dataSource?.name ?? '', children: dataSource && expandRender(dataSource) }]}
    />
  );
};

export default DataViewDetail;
