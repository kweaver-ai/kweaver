import { Graph, Node } from '@antv/x6';
import { X6DagNodeType } from '@/components/AdReactX6/components/X6DagNode/enum';
import _ from 'lodash';
import { getAllDatasetMetricNode } from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigGraph/ConfigGraph/assistant';

/** 生成树节点数据格式 */
export const generateTreeNodeData = (
  dataSource: any,
  options: {
    parentKey?: string;
    isLeaf?: boolean;
    selectable?: boolean;
  } = { parentKey: '', isLeaf: false, selectable: true },
) => {
  const { parentKey, isLeaf, selectable } = options;
  return dataSource.map((item: any) => {
    return {
      // id: item.id,
      // pId: parentKey,
      value: item.id,
      title: item.name,
      label: item.label, // 回填到input框的内容
      children: [],
      sourceData: {
        ...item,
      },
      isLeaf,
      selectable,
      disabled: item.disabled ?? false,
    };
  });
};

export const updateTreeData = (list: any, key: string, children: any) =>
  list.map((node: any) => {
    if (node.value === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

/** 获取当前任务节点下所有已配置数据集以及版本id 返回格式 {数据集id: Array<版本id>} */
export const getConfigDatasetVersion = (graph: Graph, taskNodeId: string): Record<string, string[]> => {
  const datasetNodeTask = getAllDatasetMetricNode(graph).filter(node => node.getData().dataset.taskNodeId === taskNodeId);

  const objData: any = {};
  datasetNodeTask.forEach((node: Node) => {
    const datasetList = node.getData().dataset.datasetList;
    if (!_.isEmpty(datasetList)) {
      const datasetVersionId = Object.keys(datasetList)[0];
      const [datasetId, versionId] = datasetVersionId.split('/');
      if (objData[datasetId]) {
        objData[datasetId].push(versionId);
      } else {
        objData[datasetId] = [versionId];
      }
    }
  });
  return objData;
};
