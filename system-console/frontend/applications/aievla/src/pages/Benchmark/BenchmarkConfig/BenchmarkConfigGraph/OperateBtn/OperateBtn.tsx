import _ from 'lodash';
import intl from 'react-intl-universal';
import { Node } from '@antv/x6';
import { Divider, message } from 'antd';

import useAdHistory from '@/hooks/useAdHistory';
import { deleteFile, editBenchmarkConfig, publishBenchmarkConfig } from '@/services/benchmark';

import Format from '@/components/Format';
import { DeleteModal, tipModalFunc } from '@/components/TipModal';

import { useConfigGraphContext } from '../ConfigGraphContext';
import {
  generateBenchmarkEditConfigDataByX6Data,
  getAllDatasetMetricNode,
  getAllRankingNode,
  getAllTaskNode,
  removeBenchmarkChildNode,
} from '../ConfigGraph/assistant';

const OperateBtn = () => {
  const history = useAdHistory(); // 路由
  const {
    configGraphStore: { configData, graph, deleteAdapterFilePath },
    getLatestStore,
    setConfigGraphStore,
    refreshConfigData,
  } = useConfigGraphContext();
  const clearConfig = async () => {
    const isOk = await DeleteModal({
      isSingleDelete: true,
      currentDeleteName: configData?.name || '',
      currentDeleteType: intl.get('delete.config'),
    });
    if (isOk) {
      const node = graph!.getCellById(configData!.id as string);
      removeBenchmarkChildNode(node as Node, graph!);
    }
  };

  const validatorError = () => {
    let isError = false;
    if (graph) {
      const errorInfo: any = [];
      const allTaskNode = getAllTaskNode(graph);
      if (allTaskNode.length === 0) {
        message.error(intl.get('benchmark.config.noConfigNodeTips'));
        return true;
      }

      // 校验数据集节点错误
      const allDatasetMetricNode = getAllDatasetMetricNode(graph);
      if (allDatasetMetricNode.length === 0) {
        message.error(intl.get('benchmark.config.noConfigNodeTips'));
        return true;
      }
      allDatasetMetricNode.forEach(datasetMetricNode => {
        const datasetNodeErrorData: any = {};
        const metricNodeErrorData: any = {};

        const datasetNodeId = datasetMetricNode.id;
        const datasetData = datasetMetricNode.getData().dataset;
        const metricData = datasetMetricNode.getData().metric;
        const datasetList = datasetData.datasetList;
        if (_.isEmpty(datasetList)) {
          datasetNodeErrorData[datasetNodeId] = intl.get('benchmark.config.datasetConfigTips');
        } else {
          Object.keys(datasetList).forEach(dataset_id => {
            const datasetFileData = datasetList[dataset_id];
            if (!datasetFileData || datasetFileData.length === 0) {
              datasetNodeErrorData[datasetNodeId] = intl.get('benchmark.config.datasetConfigTips');
            } else {
              datasetFileData.forEach((datasetFileItem: any) => {
                if (datasetFileItem.input.length === 0 || datasetFileItem.output.length === 0) {
                  datasetNodeErrorData[datasetFileItem.doc_id] = intl.get('benchmark.config.datasetErrorTip');
                }
              });
            }
          });
        }
        if (!_.isEmpty(datasetNodeErrorData)) {
          datasetMetricNode.updateData({
            dataset: { ...datasetData, error: datasetNodeErrorData },
          });
          isError = true;
        }

        // 校验指标错误
        if (metricData.metricIdList.length === 0) {
          metricNodeErrorData[datasetNodeId] = intl.get('benchmark.config.indicatorConfigTips');
        }
        if (!_.isEmpty(metricNodeErrorData)) {
          datasetMetricNode.updateData({
            metric: { ...metricData, error: metricNodeErrorData },
          });
          isError = true;
        }
      });

      // 校验榜单节点的错误
      const allRankingNode = getAllRankingNode(graph);
      if (allRankingNode.length === 0) {
        errorInfo.push('没有榜单节点');
        isError = true;
      }
      const targetRankingNode = allRankingNode[0];
      const targetRankingNodeData = targetRankingNode.getData();
      const rankingNodeErrorData: any = {};
      // 每一个数据集必须要配置leaderboard_item
      const allDatasetNodeIds = allDatasetMetricNode.map(datasetNode => datasetNode.id);
      allDatasetNodeIds.forEach(datasetNodeId => {
        if (!targetRankingNodeData.rankingData.leaderboard_items[datasetNodeId]) {
          rankingNodeErrorData[datasetNodeId] = intl.get('benchmark.config.outMetricRequireTip');
        }
      });
      if (!_.isEmpty(rankingNodeErrorData)) {
        targetRankingNode.updateData({ error: rankingNodeErrorData });
        isError = true;
      }
      if (isError) {
        message.error(intl.get('benchmark.config.saveErrorTips'));
      }
    }
    return isError;
  };

  const save = _.debounce(async (publish = false) => {
    const { graph } = getLatestStore();
    if (publish) {
      if (validatorError()) return;
    }
    const newConfigData = generateBenchmarkEditConfigDataByX6Data(graph!);
    const data = await editBenchmarkConfig(configData!.id as string, newConfigData);
    if (data) {
      if (deleteAdapterFilePath.length > 0) {
        const deleteFileReq = deleteAdapterFilePath.map(filePath => deleteFile(filePath, false));
        await Promise.all(deleteFileReq);
        setConfigGraphStore(preState => ({ ...preState, deleteAdapterFilePath: [] }));
      }
      if (publish) {
        const res = await publishBenchmarkConfig(configData!.id as string);
        if (res) {
          message.success(intl.get('global.publishing'));
          history.goBack();
        }
      } else {
        message.success(intl.get('benchmark.config.saveSuccess'));
        refreshConfigData(configData!.id as string);
      }
    }
  }, 300);

  return (
    <div className='OperateBtn'>
      <Format.Button onClick={clearConfig}>{intl.get('benchmark.config.clearConfig')}</Format.Button>
      <Divider className='ad-ml-4 ad-mr-4' type='vertical' />
      <Format.Button onClick={() => save(false)}>{intl.get('global.save')}</Format.Button>
      <Format.Button
        onClick={() => {
          tipModalFunc({
            title: intl.get('benchmark.config.publishConfigTitle'),
            content: intl.get('benchmark.config.publishConfigContent'),
            onOk: () => save(true),
          });
        }}
        className='ad-ml-3'
        type='primary'
      >
        {intl.get('global.publish')}
      </Format.Button>
    </div>
  );
};

export default OperateBtn;
