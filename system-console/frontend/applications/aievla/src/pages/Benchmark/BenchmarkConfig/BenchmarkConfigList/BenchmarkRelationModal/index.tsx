import { useEffect, useState } from 'react';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import ADTable from '@/components/ADTable';
import type { TableColumnsType } from 'antd';
import { getBenchmarkConfigById } from '@/services/benchmark';
import { ViewBenchmarkConfigDataType } from '@/pages/Benchmark/BenchmarkConfig/types';
import { dataSetVersionListById } from '@/services/dataSet';
import './style.less';
import LoadingMask from '@/components/LoadingMask';

const BenchmarkRelationModal = ({ type, onClose, configId }: any) => {
  const [data, setData] = useState([]);
  const [versionObj, setVersionObj] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (configId) {
      getData();
    }
  }, [configId]);

  const getData = async () => {
    const data: ViewBenchmarkConfigDataType = await getBenchmarkConfigById(configId);
    if (data) {
      const dataSource: any = [];
      if (type === 'dataset') {
        const versionIds: string[] = [];
        data.task.forEach(taskItem => {
          taskItem.dataset.forEach(datasetItem => {
            Object.keys(datasetItem.dataset_list).forEach(dataset_id => {
              const [datasetId, versionId] = dataset_id.split('/');
              if (!versionIds.includes(versionId)) {
                versionIds.push(versionId);
              }
              dataSource.push({
                task: taskItem.name,
                dataset: datasetItem.dataset_list[dataset_id].name,
                id: taskItem.id + dataset_id,
                versionId,
              });
            });
          });
        });
        if (versionIds.length > 0) {
          const versionData = await dataSetVersionListById(versionIds);
          if (versionData) {
            setVersionObj(versionData.versions);
          }
        }
      }
      if (type === 'indicator') {
        data.task.forEach(taskItem => {
          taskItem.dataset.forEach(datasetItem => {
            datasetItem.metric.metric_list.forEach(indicatorItem => {
              dataSource.push({
                task: taskItem.name,
                indicator: indicatorItem.name,
                id: taskItem.id + indicatorItem.id,
              });
            });
          });
        });
      }
      setLoading(false);
      setData(dataSource);
    } else {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (type === 'dataset') {
      return intl.get('benchmark.config.relationDataSet');
    }
    return intl.get('benchmark.config.relationIndicator');
  };

  const getColumns = () => {
    const columns: TableColumnsType = [
      {
        title: intl.get('benchmark.config.relationTaskName'),
        dataIndex: 'task',
      },
    ];
    if (type === 'dataset') {
      columns.unshift({
        title: intl.get('benchmark.config.datasetName'),
        dataIndex: 'dataset',
        render: (value, record: any) => {
          return `${value}/${versionObj[record.versionId]}`;
        },
      });
    }
    if (type === 'indicator') {
      columns.unshift({
        title: intl.get('benchmark.indicator.name'),
        dataIndex: 'indicator',
      });
    }
    return columns;
  };

  return (
    <UniversalModal
      title={getTitle()}
      width={460}
      visible
      onCancel={() => {
        onClose();
      }}
      className='BenchmarkRelationModal'
    >
      {loading ? (
        <LoadingMask loading />
      ) : (
        <ADTable loading={loading} rowKey='id' showHeader={false} columns={getColumns()} dataSource={data} scroll={{ y: 240 }} />
      )}
    </UniversalModal>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <BenchmarkRelationModal {...restProps} />;
};
