import React, { useEffect, useState } from 'react';
import AdTreeSelect from '@/components/AdTreeSelect';
import intl from 'react-intl-universal';
import { Graph, Node } from '@antv/x6';
import { AdTreeDataNode, adTreeUtils } from '@/utils/handleFunction';
import { getOutputByIndicatorIds } from '@/services/benchmark';
import NoDataBox from '@/components/NoDataBox';
import emptyImg from '@/assets/images/empty.svg';

export type MetricTreeProps = {
  datasetNodeId: string;
  graph: Graph;
  node: Node;
  rankingData: any;
  metricNodeData: any;
};
const MetricTree: React.FC<MetricTreeProps> = props => {
  const { datasetNodeId, metricNodeData, node, rankingData } = props;
  const [treeProps, setTreeProps] = useState({
    treeData: [] as AdTreeDataNode[],
    loadedKeys: [] as string[],
    expandedKeys: [] as string[],
  });
  const inputValue = rankingData.leaderboard_items[datasetNodeId] || undefined;
  const nodeData = node.getData();
  const readOnly = nodeData.readOnly;

  useEffect(() => {
    getTreeDataByDatasetNodeId(datasetNodeId);
    initTreeSelectValue();
  }, []);

  const initTreeSelectValue = () => {
    const inputValue = rankingData.leaderboard_items[datasetNodeId];
    if (inputValue) {
      const [metricId] = inputValue.split('_');
      const metricIdList = metricNodeData.metricIdList;
      if (!metricIdList.includes(metricId)) {
        node.updateData({
          rankingData: {
            ...rankingData,
            leaderboard_items: {
              ...rankingData.leaderboard_items,
              [datasetNodeId]: '',
            },
          },
        });
      }
    }
  };

  const getTreeDataByDatasetNodeId = (datasetNodeId: string) => {
    const metricIdList = metricNodeData.metricIdList;
    const allIndicatorData = metricNodeData.allIndicatorData;
    const metricList = metricIdList.map((id: string) => ({
      name: allIndicatorData[id],
      key: id,
    }));
    const treeRootNodeData = adTreeUtils.createAdTreeNodeData(metricList, {
      isLeaf: false,
      selectable: false,
    });
    if (inputValue) {
      const firstIndex = inputValue.indexOf('_');
      const key = inputValue.substring(0, firstIndex);
      setTreeProps(prevState => ({
        ...prevState,
        expandedKeys: [key],
      }));
      onLoadData({ key, keyPath: [key] } as any, treeRootNodeData);
    } else {
      setTreeProps(prevState => ({
        ...prevState,
        treeData: treeRootNodeData,
      }));
    }
    return [];
  };

  const onLoadData = (treeNode: AdTreeDataNode, treeDataSource: any = treeProps.treeData) => {
    return new Promise<any>(async resolve => {
      const data = await getOutputByIndicatorIds([treeNode.key as string]);
      if (data) {
        const outputData = data[treeNode.key]?.map((item: any) => ({
          ...item,
          key: `${treeNode.key}_${item.name}`,
        }));
        const nodeData = adTreeUtils.createAdTreeNodeData(outputData, {
          isLeaf: true,
          parentKey: treeNode.key as string,
          keyPath: treeNode.keyPath,
        });
        const newTreeData = adTreeUtils.addTreeNode(treeDataSource, nodeData);
        setTreeProps(prevState => ({
          ...prevState,
          treeData: newTreeData,
          loadedKeys: [...prevState.loadedKeys, treeNode.key as string],
        }));
      }
      resolve(undefined);
    });
  };

  return (
    <div className='MetricTree ad-w-100'>
      <AdTreeSelect
        disabled={readOnly}
        status={nodeData.error[datasetNodeId] ? 'error' : undefined}
        placeholder={intl.get('benchmark.config.outMetricPlaceholder')}
        bordered={false}
        style={{ width: '100%' }}
        treeData={treeProps.treeData}
        treeLoadedKeys={treeProps.loadedKeys}
        treeExpandedKeys={treeProps.expandedKeys}
        onTreeExpand={(expandedKeys: any) => {
          setTreeProps(prevState => ({
            ...prevState,
            expandedKeys,
          }));
        }}
        loadData={onLoadData as any}
        value={inputValue}
        onChange={value => {
          const errorData = { ...nodeData.error };
          delete errorData[datasetNodeId];
          node.updateData({
            rankingData: {
              ...rankingData,
              leaderboard_items: {
                ...rankingData.leaderboard_items,
                [datasetNodeId]: value,
              },
            },
            error: errorData,
          });
        }}
        notFoundContent={<NoDataBox imgSrc={emptyImg} desc={intl.get('benchmark.config.noMetric')} />}
      />
    </div>
  );
};

export default MetricTree;
