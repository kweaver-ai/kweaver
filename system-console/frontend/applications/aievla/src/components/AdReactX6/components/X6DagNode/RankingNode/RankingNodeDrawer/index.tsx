import './style.less';
import AdDrawer from '@/components/AdDrawer';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { Divider, Switch, Tooltip } from 'antd';
import { getAllDatasetMetricNode, getAllTaskNode } from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigGraph/ConfigGraph/assistant';
import { Node } from '@antv/x6';
import MetricTree from './MetricTree';
import IconFont from '@/components/IconFont';

const RankingNodeDrawer = ({ node, editData, graph }: any) => {
  const allTaskNode = getAllTaskNode(graph);
  const allDatasetMetricNode = getAllDatasetMetricNode(graph);
  const nodeData = node.getData();
  const rankingData = nodeData.rankingData;
  const readOnly = nodeData.readOnly;

  const renderAverageRow = () => {
    return (
      <div className='ad-align-center ad-h-100 ad-pl-3 ad-pr-3'>
        <Switch
          disabled={readOnly}
          size='small'
          checked={rankingData.configIsAverage}
          onChange={checked => {
            let averageTaskId: string[] = [...rankingData.averageTaskId];
            if (checked) {
              // 总开关开启，自动把任务里面的开关打开 （只有一个数据集的任务，任务的average固定为false,故要过滤掉只有一个数据集的任务）
              averageTaskId = allTaskNode
                .filter(taskNode => {
                  const datasetNodeForTask = allDatasetMetricNode.filter(node => node.getData().dataset.taskNodeId === taskNode.id);
                  return datasetNodeForTask.length > 1;
                })
                .map(taskNode => taskNode.id);
            }
            node.updateData({
              rankingData: {
                ...rankingData,
                configIsAverage: checked,
                averageTaskId,
              },
            });
          }}
        />
      </div>
    );
  };

  const renderTaskAverageRow = (taskNode: Node, datasetMetricNodes: Node[]) => {
    const taskNodeId = taskNode.id;
    const dom = datasetMetricNodes.map(datasetMetricNode => {
      const datasetNodeId = datasetMetricNode.id;
      const datasetNodeData = datasetMetricNode.getData().dataset;
      const metricNodeData = datasetMetricNode.getData().metric;
      const metricData = rankingData.leaderboard_items[datasetNodeId];
      if (metricData) {
        const firstIndex = metricData.indexOf('_');
        const metric_id = metricData.substring(0, firstIndex);
        const output = metricData.substring(firstIndex + 1);
        const allIndicatorData = metricNodeData.allIndicatorData;
        return (
          <div className='ad-align-center ad-w-100' key={datasetNodeId}>
            <span>{datasetNodeData.name}</span>
            <IconFont style={{ fontSize: 12 }} className='ad-ml-1 ad-mr-1 ad-c-subtext' type='icon-lujing' />
            <span className='ad-flex-item-full-width ad-ellipsis' title={`${allIndicatorData[metric_id]}: ${output}`}>
              {allIndicatorData[metric_id]}: {output}
            </span>
          </div>
        );
      }
    });
    return (
      <div className='ad-align-center ad-h-100 ad-pl-3'>
        <Switch
          size='small'
          disabled={readOnly || rankingData.configIsAverage}
          checked={rankingData.averageTaskId.includes(taskNodeId)}
          onChange={checked => {
            let newAverageTaskId = [...rankingData.averageTaskId];
            if (checked) {
              newAverageTaskId.push(taskNodeId);
            } else {
              newAverageTaskId = newAverageTaskId.filter((id: string) => id !== taskNodeId);
            }
            node.updateData({
              rankingData: {
                ...rankingData,
                averageTaskId: newAverageTaskId,
              },
            });
          }}
        />
        {dom.length !== 0 && (
          <>
            <Divider type='vertical' />
            <div className='ad-flex-item-full-width '>{dom}</div>
          </>
        )}
      </div>
    );
  };

  const renderTaskRow = (taskNode: Node) => {
    const taskNodeId = taskNode.id;
    const datasetMetricNodes = allDatasetMetricNode.filter(datasetMetricNode => {
      const datasetMetricNodeData = datasetMetricNode.getData();
      return datasetMetricNodeData.dataset.taskNodeId === taskNodeId;
    });
    return (
      <>
        {datasetMetricNodes.length > 1 && (
          <div style={{ minHeight: 45 }} className={classNames('ad-flex ad-align-center ad-border-b ad-pl-3 ad-pr-3')}>
            <div style={{ width: 160 }} className=''>
              {intl.get('benchmark.config.divideEqually')}
            </div>
            <div style={{ minHeight: 45 }} className='ad-flex-item-full-width ad-align-center ad-border-l ad-h-100 ad-pt-3 ad-pb-3'>
              {renderTaskAverageRow(taskNode, datasetMetricNodes)}
            </div>
          </div>
        )}
        {datasetMetricNodes.map((datasetNode, index) => {
          const datasetNodeId = datasetNode.id;
          const datasetNodeData = datasetNode.getData().dataset;
          const metricNodeData = datasetNode.getData().metric;
          return (
            <div
              key={datasetNodeId}
              style={{ minHeight: 45 }}
              className={classNames('ad-flex ad-w-100 ad-pl-3 ad-pr-3', {
                'ad-border-b': datasetMetricNodes.length - 1 !== index,
              })}
            >
              <div style={{ width: 160 }} className='ad-align-center ad-required'>
                <div title={datasetNodeData.name} className='ad-ellipsis'>
                  {datasetNodeData.name}
                </div>
              </div>
              <div className='ad-flex-item-full-width ad-border-l ad-align-center'>
                <MetricTree metricNodeData={metricNodeData} node={node} graph={graph} datasetNodeId={datasetNodeId} rankingData={rankingData} />
              </div>
            </div>
          );
        })}
      </>
    );
  };
  const dataSource = [
    {
      label: intl.get('benchmarkTask.rank'),
      value: <div className='ad-c-text-lower ad-align-center ad-pl-3 ad-pr-3 ad-h-100'>{intl.get('benchmark.config.displayParam')}</div>,
    },
    {
      label: intl.get('benchmarkTask.algorithm'),
      value: <div className='ad-c-text-lower ad-align-center ad-pl-3 ad-pr-3 ad-h-100'>{intl.get('benchmark.config.displayParam')}</div>,
    },
    {
      label: intl.get('benchmarkTask.algType'),
      value: <div className='ad-c-text-lower ad-align-center ad-pl-3 ad-pr-3 ad-h-100'>{intl.get('benchmark.config.displayParam')}</div>,
    },
    {
      label: intl.get('benchmarkTask.publisher'),
      value: <div className='ad-c-text-lower ad-align-center ad-pl-3 ad-pr-3 ad-h-100'>{intl.get('benchmark.config.displayParam')}</div>,
    },
    {
      label: intl.get('benchmarkTask.publishDate'),
      value: <div className='ad-c-text-lower ad-align-center ad-pl-3 ad-pr-3 ad-h-100'>{intl.get('benchmark.config.displayParam')}</div>,
    },
    {
      label: (
        <span className='ad-align-center'>
          {intl.get('benchmark.config.divideEqually')}
          <Tooltip className='ad-ml-1 ad-c-subtext' title={intl.get('benchmark.config.totalAverageTip')} placement='top'>
            <IconFont type='icon-wenhao' />
          </Tooltip>
        </span>
      ),
      value: renderAverageRow(),
    },
  ];
  allTaskNode.forEach((item: Node) => {
    const taskNodeData = item.getData();
    dataSource.push({
      label: taskNodeData.name,
      value: renderTaskRow(item),
    });
  });

  const clearConfig = () => {
    node.updateData({
      rankingData: {
        configIsAverage: false,
        averageTaskId: [],
        leaderboard_items: {},
      },
    });
  };

  return (
    <AdDrawer
      width={660}
      // width={360}
      className='RankingNodeDrawer'
      drag={{ maxWidth: 960 }}
      getContainer={document.querySelector('.BenchmarkConfigGraph') as HTMLElement}
      title={intl.get('benchmark.config.leaderboard')}
      subTitle={intl.get('benchmark.config.leaderboardSubTitle')}
      open
      extra={
        !readOnly && (
          <span
            style={{ fontWeight: 400 }}
            onClick={clearConfig}
            className={`${
              readOnly ? 'ad-c-watermark ad-not-allowed' : 'ad-c-text-lower ad-c-hover-color-deepens ad-pointer'
            } ad-ml-3 ad-align-center ad-font-14`}
          >
            <IconFont style={{ marginTop: -2 }} className='ad-mr-2' type='icon-quanbuyichu' />
            {intl.get('global.clearBtn')}
          </span>
        )
      }
    >
      <div className='ad-border RankingNodeDrawer-list'>
        {dataSource.map((item, index) => {
          return (
            <div
              key={index}
              className={classNames('ad-flex RankingNodeDrawer-list-item', {
                'ad-border-b': index !== dataSource.length - 1,
              })}
            >
              <div style={{ width: 112 }} className='ad-pl-3 ad-pr-3 ad-align-center'>
                <span className='ad-ellipsis ad-flex-item-full-width' title={item?.label || ''}>
                  {item.label}
                </span>
              </div>
              <div className='ad-flex-item-full-width ad-border-l'>{item.value}</div>
            </div>
          );
        })}
      </div>
    </AdDrawer>
  );
};

export default ({ open, ...restProps }: any) => {
  return open && <RankingNodeDrawer {...restProps} />;
};
