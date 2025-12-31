/** 数据预览*/
import { useMemo } from 'react';
import intl from 'react-intl-universal';
import { Spin, Table } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { DATE_FORMAT } from '@/hooks/useConstants';
import noData from '@/assets/images/no-data.svg';

const PreviewTable = (props: any) => {
  const { loading, filter, previewData, dataSource, pagination, onChangePagination } = props;
  const { metrics, analysisDimensions } = filter || {};

  const groupByFields = previewData?.formulaConfig?.groupByFieldsDetail || previewData?.groupByFieldsDetail;
  const analysisDimensionsOptions = previewData?.analysisDimensions;
  const groupByFieldsKV = { ..._.keyBy(groupByFields, 'name'), ..._.keyBy(analysisDimensionsOptions, 'name') };

  const { expandColumns } = useMemo(() => {
    const expandColumns: any = [];
    const keys = analysisDimensions || [];
    keys?.sort();
    _.forEach(keys, (key) => {
      expandColumns.push({
        title: groupByFieldsKV?.[key]?.displayName || key,
        dataIndex: key,
        render: (_value: any, data: any) => data.labels?.[key] || '--',
        onCell: (data: any) => {
          return { rowSpan: data.rowSpan, colSpan: 1 };
        },
      });
    });

    if (metrics) {
      const defaultGrowth = [
        { key: 'growth_values', label: intl.get('MetricModel.growth') },
        { key: 'growth_rates', label: intl.get('MetricModel.growthRate') },
      ];
      _.forEach(defaultGrowth, (item) => {
        const { key, label } = item;
        expandColumns.push({
          title: label,
          dataIndex: key,
          render: (value: any) => value || '--',
        });
      });
    }

    return { expandColumns };
  }, [dataSource]);

  const columns = [
    {
      title: intl.get('Global.number'),
      dataIndex: 'number',
      width: 80,
      render: (value: any) => {
        return value;
      },
      onCell: (data: any) => {
        return { rowSpan: data.rowSpan, colSpan: 1 };
      },
    },
    ...expandColumns,
    {
      title: intl.get('MetricModel.time'),
      dataIndex: 'time',
      width: 200,
      render: (text: any) => dayjs(text).format(DATE_FORMAT.FULL_TIMESTAMP),
    },
    {
      title: intl.get('MetricModel.val'),
      dataIndex: 'formatValue',
      width: 100,
      render: (value: any) => value || null,
    },
  ];

  return (
    <div>
      {dataSource.length ? (
        <Table
          size="small"
          bordered
          columns={columns}
          loading={loading}
          dataSource={dataSource}
          rowKey={(record: any) => record.id}
          scroll={{ x: 'max-content' }}
          pagination={pagination}
          onChange={onChangePagination}
        />
      ) : (
        <Spin spinning={loading}>
          <div className="g-flex-center g-c-text-sub" style={{ flexDirection: 'column', height: 100, marginTop: 12 }}>
            <img src={noData} />
            <div>{intl.get('Global.noData')}</div>
          </div>
        </Spin>
      )}
    </div>
  );
};

export default PreviewTable;
