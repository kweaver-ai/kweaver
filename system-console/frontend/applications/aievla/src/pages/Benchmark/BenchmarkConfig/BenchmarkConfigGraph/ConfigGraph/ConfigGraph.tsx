import { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { v4 as generateUuid } from 'uuid';
import { Edge, Graph, Markup, Node } from '@antv/x6';
import { message } from 'antd';

import { stringSeparator1 } from '@/enums';
import { adCookie } from '@/utils/handleFunction';
import useLatestState from '@/hooks/useLatestState';
import { getIndicatorNameById } from '@/services/benchmark';
import { dataSetList, dataSetVersionListById } from '@/services/dataSet';

import AdReactX6 from '@/components/AdReactX6';
import { X6RefProps } from '@/components/AdReactX6/AdReactX6';
import { X6DagNodeType } from '@/components/AdReactX6/components/X6DagNode/enum';
import { AdPortRectLeft, AdPortRectRight, AdX6DagNode, AdX6EdgeNoArrow } from '@/components/AdReactX6/utils/constants';

import { useConfigGraphContext } from '../ConfigGraphContext';
// import ConfigTip from './ConfigTip';
import AdapterDrawer from './AdapterDrawer';
import AdapterLabelNode from './AdapterLabelNode';
import {
  clearHighlight,
  generateX6DataByBenchmarkEditConfigData,
  getAllConfigNode,
  getAllDatasetMetricNode,
  getAllRankingNode,
  getAllTaskNode,
  getChildNodePosition,
  getLastNumberFromString,
  highlightFullPathByNode,
} from './assistant';

import './style.less';

type GraphX6DataProps = Array<Node.Metadata | Edge.Metadata>;
const BenchmarkConfigGraph = ({ updateConfigName }: any) => {
  const {
    configGraphStore: { configData, readOnly },
    setConfigGraphStore,
  } = useConfigGraphContext();

  const x6Ref = useRef<X6RefProps | null>(null);
  const allDataset = useRef<any>([]);
  const allIndicator = useRef<any>({});
  const allDatasetVersion = useRef<any>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [graphData, setGraphData] = useState<GraphX6DataProps>([]);
  const [tipVisible, setTipVisible] = useState(adCookie.get('benchmarkConfigTip') !== 'false');
  const [graphRendered, setGraphRendered, getGraphRendered] = useLatestState<boolean>(false);
  const [adapterDrawer, setAdapterDrawer] = useState({ visible: false, edge: null as any });

  useEffect(() => {
    initX6Data();
  }, [configData]);

  useEffect(() => {
    if (graphRendered) {
      getAllIndicator();
      getAllDataset();
      getAllDatasetVersion();
    }
  }, [graphRendered]);

  useEffect(() => {
    if (graphRendered) {
      const graph = x6Ref.current!.getGraphInstance();
      const configNode = getAllConfigNode(graph);
      const { x } = configNode[0].position();
      if (tipVisible) if (x < 500) graph.translate(500, 0);
    }
  }, [graphRendered, tipVisible]);

  const initX6Data = () => {
    const graph = x6Ref.current!.getGraphInstance();
    const x6Data = generateX6DataByBenchmarkEditConfigData(configData!, {
      graph,
      readOnly,
      addTaskNode,
      addDatasetMetricNode,
      updateConfigName,
      getAllDataset,
      allDatasetData: allDataset.current,
      allDatasetVersionData: allDatasetVersion.current,
      allIndicatorData: allIndicator.current,
      updateDatasetVersionData,
      updateIndicatorData,
      adapterNode: edgeId => {
        return <AdapterLabelNode onClick={edge => openAdapterDrawer(edge)} edgeId={edgeId} graph={graph} />;
      },
    });
    setGraphData(x6Data);
  };

  /** 更新数据集版本数据源 */
  const updateDatasetVersionData = (data: any) => {
    allDatasetVersion.current = data;
  };

  /** 更新数据集版本数据源 */
  const updateIndicatorData = (data: any) => {
    allIndicator.current = data;
  };

  const openAdapterDrawer = (edge: Edge) => {
    setAdapterDrawer(prevState => ({ ...prevState, visible: true, edge }));
  };

  const closeAdapterDrawer = () => {
    setAdapterDrawer(prevState => ({ ...prevState, visible: false, edge: null }));
  };

  const getAllIndicator = async () => {
    const graph = x6Ref.current!.getGraphInstance();
    const nodes = getAllDatasetMetricNode(graph);
    let indicatorIds: string[] = [];
    nodes.forEach(node => {
      const nodeData = node.getData().metric;
      indicatorIds = [...indicatorIds, ...nodeData.metricIdList];
    });
    if (indicatorIds.length > 0) {
      const data = await getIndicatorNameById(indicatorIds);
      if (data) {
        allIndicator.current = data;
        nodes.forEach(node => {
          const metricData = node.getData().metric;
          node.updateData({ metric: { ...metricData, allIndicatorData: data } });
        });
      }
    }
  };

  const getAllDataset = async () => {
    const data = await dataSetList({ page: -1, rule: 'create_time', order: 'desc', query: '' } as any);
    if (data) {
      allDataset.current = data;
      const graph = x6Ref.current!.getGraphInstance();
      const nodes = getAllDatasetMetricNode(graph);
      nodes.forEach(node => {
        const datasetData = node.getData().dataset;
        node.updateData({ dataset: { ...datasetData, allDatasetData: data } });
      });
    }
  };

  const getAllDatasetVersion = async () => {
    const graph = x6Ref.current!.getGraphInstance();
    const nodes = getAllDatasetMetricNode(graph);
    const versionIds: string[] = [];
    nodes.forEach(datasetNode => {
      const datasetData = datasetNode.getData().dataset;
      Object.keys(datasetData.datasetList).forEach(key => {
        const [datasetId, versionId] = key.split('/');
        if (!versionIds.includes(versionId)) versionIds.push(versionId);
      });
    });
    if (versionIds.length > 0) {
      const data = await dataSetVersionListById(versionIds);
      if (data) {
        allDatasetVersion.current = data.versions;
        nodes.forEach(datasetNode => {
          const datasetData = datasetNode.getData().dataset;
          const datasetVersionId = Object.keys(datasetData.datasetList)[0];
          if (datasetVersionId) {
            const [datasetId, versionId] = datasetVersionId.split('/');
            let nodeError = '';
            if (data.versions[versionId] === 'KnBuilder.UserNoPermissionError') {
              nodeError = intl.get('benchmark.config.datasetNoPermission');
            }
            if (data.versions[versionId] === 'KnBuilder.DataSet.VersionNotFound') {
              nodeError = intl.get('benchmark.config.noDataset');
            }
            datasetNode.updateData({
              dataset: { ...datasetData, allDatasetVersionData: data.versions, error: { [datasetNode.id]: nodeError } },
            });
          }
        });
      }
    }
  };

  const addTaskNode = (parentNode: Node) => {
    const parentId = parentNode.id;
    const graph = x6Ref.current!.getGraphInstance();
    let count = 0;
    const taskNodes = getAllTaskNode(graph);
    const position = getChildNodePosition(parentNode, graph);
    const taskNodeId = `task${stringSeparator1}${generateUuid()}`;
    taskNodes.forEach(item => {
      const itemData = item.getData();
      const suffix = getLastNumberFromString(itemData.name);
      if (suffix && suffix > count) count = suffix;
    });
    const taskNodeConfig: Node.Metadata = {
      id: taskNodeId,
      shape: AdX6DagNode,
      position,
      data: {
        name: `${intl.get('benchmark.config.task')}${count + 1}`,
        icon: 'icon-pzrw-7863FF',
        formVisible: true, // 控制表单是否显示
        type: X6DagNodeType.taskNode,
        graph: x6Ref.current?.getGraphInstance(),
        error: false, // 控制显示错误icon
        onAdd: (node: Node) => {
          addDatasetMetricNode(node);
        },
      },
      ports: [
        { id: `${taskNodeId}${stringSeparator1}left`, group: AdPortRectLeft },
        { id: `${taskNodeId}${stringSeparator1}right`, group: AdPortRectRight },
      ],
    };
    const edge: Edge.Metadata = {
      zIndex: 0,
      shape: AdX6EdgeNoArrow,
      source: { cell: parentId, port: `${parentId}${stringSeparator1}right` },
      target: { cell: taskNodeId, port: `${taskNodeId}${stringSeparator1}left` },
      data: { deleteBtnVisible: false },
    };
    const taskNode = graph.addNode(taskNodeConfig);
    graph.addEdge(edge);
    graph.select(taskNode);
  };

  const addDatasetMetricNode = (taskNode: Node) => {
    const taskNodeId = taskNode.id;
    const graph = x6Ref.current!.getGraphInstance();
    const parentTaskNodeData = taskNode.getData();
    if (parentTaskNodeData.error) {
      message.error(intl.get('benchmark.config.taskErrorTip'));
      return;
    }

    let count = 0;
    // 获取当前任务节点下的所有数据集节点
    const allDatasetMetricNode = getAllDatasetMetricNode(graph).filter(item => {
      const itemData = item.getData();
      return itemData.dataset.taskNodeId === taskNodeId;
    });
    allDatasetMetricNode.forEach(item => {
      const itemData = item.getData();
      const suffix = getLastNumberFromString(itemData.dataset.name);
      if (suffix && suffix > count) count = suffix;
    });

    const position = getChildNodePosition(taskNode, graph);
    const datasetNodeId = `dataset${stringSeparator1}${generateUuid()}`;
    const datasetMetricNodeConfig: Node.Metadata = {
      id: datasetNodeId,
      shape: AdX6DagNode,
      position,
      data: {
        type: X6DagNodeType.datasetMetricNode,
        graph,
        dataset: {
          name: `${intl.get('dataSet.config.dataSet_')}${count + 1}`,
          formVisible: false, // 控制表单是否显示
          datasetList: {},
          allDatasetData: allDataset.current,
          allDatasetVersionData: allDatasetVersion.current,
          updateDatasetVersionData,
          getAllDataset,
          taskNodeId,
          error: {},
        },
        metric: {
          metricIdList: [],
          formVisible: false, // 控制表单是否显示
          allIndicatorData: allIndicator.current,
          datasetNodeId,
          updateIndicatorData,
          error: {},
        },
      },
      ports: [
        { id: `${datasetNodeId}${stringSeparator1}left`, group: AdPortRectLeft },
        { id: `${datasetNodeId}${stringSeparator1}right`, group: AdPortRectRight },
      ],
    };
    const edge: Edge.Metadata = {
      zIndex: 0,
      shape: AdX6EdgeNoArrow,
      source: { cell: taskNodeId, port: `${taskNodeId}${stringSeparator1}right` },
      target: { cell: datasetNodeId, port: `${datasetNodeId}${stringSeparator1}left` },
      data: { deleteBtnVisible: false },
    };
    const datasetMetricNode = graph.addNode(datasetMetricNodeConfig);
    graph.addEdge(edge);
    graph.select(datasetMetricNode);

    setTimeout(() => {
      addRankingNodeEdge(datasetMetricNode);
    }, 100);
  };

  const addRankingNodeEdge = (datasetMetricNode: Node) => {
    const datasetMetricNodeId = datasetMetricNode.id;
    const graph = x6Ref.current!.getGraphInstance();
    const nodes = getAllRankingNode(graph);
    const position = getChildNodePosition(datasetMetricNode, graph, 400);
    const rankingNodeId = `${configData?.id}-ranking`;
    const rankingNodeLeftPortId = `${rankingNodeId}${stringSeparator1}left`;
    if (nodes.length === 0) {
      const rankingNode: Node.Metadata = {
        id: rankingNodeId,
        shape: AdX6DagNode,
        position,
        data: {
          type: X6DagNodeType.rankingNode,
          graph,
          rankingData: { configIsAverage: false, averageTaskId: [], leaderboard_items: {} as any },
          formVisible: false, // 控制表单是否显示
          error: {},
        },
        ports: [{ id: rankingNodeLeftPortId, group: AdPortRectLeft }],
      };
      graph.addNode(rankingNode);
    } else {
      // 保证榜单节点在y方向相对于数据集Metric节点始终处于居中
      const allDatasetMetricNode = getAllDatasetMetricNode(graph);
      let totalY = 0;
      allDatasetMetricNode.forEach(node => {
        totalY += node.position().y;
      });
      // 更新榜单节点的位置
      const rankingNode = nodes[0];
      const { x } = rankingNode.position();
      rankingNode.position(x, totalY / allDatasetMetricNode.length);
    }
    const adapterEdgeId = `${datasetMetricNodeId}-adapter`;
    const edge: Edge.Metadata = {
      id: adapterEdgeId,
      zIndex: 0,
      shape: AdX6EdgeNoArrow,
      label: { position: 0.5 },
      source: { cell: datasetMetricNodeId, port: `${datasetMetricNodeId}${stringSeparator1}right` },
      target: { cell: rankingNodeId, port: rankingNodeLeftPortId },
      data: { deleteBtnVisible: false, adapterList: [], type: X6DagNodeType.adapterNode },
      defaultLabel: {
        type: 'custom',
        labelNode: <AdapterLabelNode onClick={edge => openAdapterDrawer(edge)} graph={graph} edgeId={adapterEdgeId} />,
        markup: Markup.getForeignObjectMarkup(),
        attrs: { fo: { width: 104, height: 48, x: -52, y: -24 } },
      },
    };
    graph.addEdge(edge);

    setTimeout(() => {
      highlightFullPathByNode(datasetMetricNode, graph);
    }, 0);
  };

  /** 画布渲染完成 */
  const onGraphRenderDone = (graph: Graph) => {
    if (!getGraphRendered()) {
      const rankingNode = getAllRankingNode(graph);
      if (rankingNode.length > 0) {
        setTimeout(() => {
          graph.centerContent();
        }, 150);
      }
      setGraphRendered(true);
    }
    setConfigGraphStore(preStore => ({ ...preStore, graph }));
  };

  const closeAllNodeDrawer = () => {
    const graph = x6Ref.current!.getGraphInstance();
    graph.getNodes().forEach(node => {
      const nodeData = node.getData();
      if (nodeData.type === X6DagNodeType.datasetMetricNode) {
        node.updateData({
          dataset: { ...nodeData.dataset, formVisible: false },
          metric: { ...nodeData.metric, formVisible: false },
        });
      } else {
        if (nodeData.formVisible) node.updateData({ formVisible: false });
      }
    });
  };

  /** 画布空白区域的点击事件 */
  const onBlankClick = () => {
    const graph = x6Ref.current!.getGraphInstance();
    closeAdapterDrawer();
    closeAllNodeDrawer();
    clearHighlight(graph);
  };

  const onNodeSelected = (selectedNode: Node) => {
    closeAdapterDrawer();
    closeAllNodeDrawer();
    const nodeData = selectedNode.getData();
    if ([X6DagNodeType.configNode, X6DagNodeType.taskNode, X6DagNodeType.rankingNode].includes(nodeData.type)) {
      selectedNode.setData({ formVisible: true });
    }
    const graph = x6Ref.current!.getGraphInstance();
    setTimeout(() => {
      highlightFullPathByNode(selectedNode, graph);
    }, 0);
  };

  const onNodeCancelSelected = (unSelectedNode: Node) => {
    const nodeData = unSelectedNode.getData();
    if (nodeData.type === X6DagNodeType.datasetMetricNode) {
      unSelectedNode.updateData({
        dataset: { ...nodeData.dataset, formVisible: false },
        metric: { ...nodeData.metric, formVisible: false },
      });
    }
    if ([X6DagNodeType.configNode, X6DagNodeType.taskNode, X6DagNodeType.rankingNode].includes(nodeData.type)) {
      unSelectedNode.setData({ formVisible: false });
    }
    const graph = x6Ref.current!.getGraphInstance();
    clearHighlight(graph);
  };

  const onEdgeSelectedChange = (graph: Graph, selectedEdges: Edge[]) => {
    if (selectedEdges.length === 0) {
      closeAdapterDrawer();
      clearHighlight(graph);
    }
    if (selectedEdges.length > 0) {
      const edgeData = selectedEdges[0].getData();
      if (edgeData.type !== X6DagNodeType.adapterNode) closeAdapterDrawer();
    }
  };

  return (
    <div ref={containerRef} className='ad-w-100 ad-h-100 BenchmarkConfigGraph'>
      {/* {!readOnly && <ConfigTip open={tipVisible} onChange={(visible: boolean) => setTipVisible(visible)} />} */}

      <AdReactX6
        ref={x6Ref}
        background
        type='dagGraph'
        data={graphData}
        onRenderDone={onGraphRenderDone}
        onBlankClick={onBlankClick}
        selectionConfig={{ multiple: false }}
        onNodeSelected={onNodeSelected}
        onNodeCancelSelected={onNodeCancelSelected}
        onEdgeSelectedChange={onEdgeSelectedChange}
        toolBar={false}
      />
      <AdapterDrawer visible={adapterDrawer.visible} edge={adapterDrawer.edge} readOnly={readOnly} />
    </div>
  );
};

export default BenchmarkConfigGraph;
