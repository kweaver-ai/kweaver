import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Edge, Graph, Markup, Node } from '@antv/x6';

import { stringSeparator1 } from '@/enums';
import { adX6EdgeLineColor } from '@/components/AdReactX6/utils/registerX6Edge';
import { X6DagNodeType } from '@/components/AdReactX6/components/X6DagNode/enum';
import { AdPortRectLeft, AdPortRectRight, AdX6DagNode, AdX6EdgeNoArrow } from '@/components/AdReactX6/utils/constants';

import {
  EditBenchmarkConfigDatasetType,
  EditBenchmarkConfigDataType,
  EditBenchmarkConfigTaskNodeType,
  ViewBenchmarkConfigDataType,
} from '@/pages/Benchmark/BenchmarkConfig/types';

/** 获取配置节点的初始位置信息 */
export const getConfigNodeInitPosition = () => {
  const dom = document.querySelector('.BenchmarkConfigGraph')!;
  const { height } = dom.getBoundingClientRect() || { height: 400 };
  return {
    x: 20,
    y: height / 2 - 24,
  };
};

/**
 * 获取节点子节点的位置信息
 * @param startNode
 * @param graph
 * @param dx 水平方向的间距
 * @param dy 垂直方向的间距
 */
export const getChildNodePosition = (startNode: Node, graph: Graph, dx = 100, dy = 100) => {
  // 找出画布中以startNode起始节点为起点的相关边的终点id集合
  const childIdList: string[] = [];
  graph.getEdges().forEach(edge => {
    const { source, target } = edge.toJSON();
    if (source.cell === startNode.id) {
      childIdList.push(target.cell);
    }
  });

  // 起点的宽和高
  const startNodeSize = startNode.getSize();
  const position = startNode.getPosition();
  // 获取起点的位置信息
  const startNodePosition = {
    x: position.x + startNodeSize.width,
    y: position.y,
  };
  let minX = Infinity;
  let maxY = -Infinity;
  graph.getNodes().forEach(graphNode => {
    if (childIdList.includes(graphNode.id)) {
      const nodePosition = graphNode.getPosition();
      const nodeSize = graphNode.getSize();
      // 找到所有节点中最左侧的节点的x坐标
      if (nodePosition.x < minX) {
        minX = nodePosition.x;
      }
      // 找到所有节点中最x下方的节点的y坐标
      if (nodePosition.y > maxY) {
        maxY = nodePosition.y + nodeSize.height;
      }
    }
  });

  return {
    x: minX !== Infinity ? minX : startNodePosition.x + dx,
    y: maxY !== -Infinity ? maxY + dy : startNodePosition.y,
  };
};

export const getAllConfigNode = (graph: Graph) => {
  return graph.getNodes().filter(node => node.getData().type === X6DagNodeType.configNode);
};

export const getAllDatasetMetricNode = (graph: Graph) => {
  return graph.getNodes().filter(node => node.getData().type === X6DagNodeType.datasetMetricNode);
};

export const getAllTaskNode = (graph: Graph) => {
  return graph.getNodes().filter(node => node.getData().type === X6DagNodeType.taskNode);
};

export const getAllAdapterEdge = (graph: Graph) => {
  return graph.getEdges().filter(edge => edge.getData().type === X6DagNodeType.adapterNode);
};

export const getAllRankingNode = (graph: Graph) => {
  return graph.getNodes().filter(node => node.getData().type === X6DagNodeType.rankingNode);
};

/**
 * 通过benchmark配置编辑数据生成X6图数据
 * 此步骤生成X6图数据的同时，将查看接口返回的数据格式，处理成编辑接口需要的数据格式，并分散到各个节点身上, 方便后续X6数据直接生成编辑接口需要的数据格式
 * @param configData
 * @param options
 */
export const generateX6DataByBenchmarkEditConfigData = (
  configData: EditBenchmarkConfigDataType,
  options: {
    graph: Graph;
    readOnly: boolean;
    addTaskNode?: any;
    updateConfigName?: any;
    addDatasetMetricNode?: any;
    getAllDataset?: any;
    allDatasetData?: any;
    allDatasetVersionData?: any;
    allIndicatorData?: any;
    updateDatasetVersionData: any;
    updateIndicatorData: any;
    adapterNode?: (edgeId: string, adapterList: string[]) => React.ReactNode;
  },
) => {
  const { graph, readOnly } = options;

  const configNodeId = configData!.id;
  const configNodeRightPortId = `${configNodeId}${stringSeparator1}right`;
  const configNode: Node.Metadata = {
    id: configNodeId,
    shape: AdX6DagNode,
    position:
      configData.x === undefined
        ? getConfigNodeInitPosition()
        : {
            x: configData.x,
            y: configData.y,
          },
    data: {
      readOnly,
      name: configData!.name,
      originalName: configData!.name,
      description: configData!.description,
      icon: configData!.color,
      type: X6DagNodeType.configNode,
      formVisible: false,
      graph,
      onAdd: (node: Node) => {
        options.addTaskNode?.(node);
      },
      updateConfigName: options.updateConfigName,
    },
    ports: [{ id: configNodeRightPortId, group: AdPortRectRight }],
  };

  const rankingNodeId = `${configNodeId}-ranking`;
  const rankingNodeLeftPortId = `${rankingNodeId}${stringSeparator1}left`;

  const takNodes: any = [];
  const datasetMetricNodes: any = [];
  const edges: any = [];
  const rankingData: any = {
    configIsAverage: configData.average, // 记录当前benchmark配置是否需要在榜单中展示均分
    averageTaskId: [], // 记录需要在榜单中展示均分的任务ID
    leaderboard_items: {} as any, // 记录需要在榜单中展示和计算均分的数据集的指标项。 key是数据集的id， value是数据集的leaderboard_item值
  };
  // console.log(configData, 'configData');
  configData!.task?.forEach(task => {
    const taskNodeId = task.id!;
    const taskNodeLeftPortId = `${taskNodeId}${stringSeparator1}left`;
    const taskNodeRightPortId = `${taskNodeId}${stringSeparator1}right`;
    takNodes.push({
      id: taskNodeId,
      shape: AdX6DagNode,
      position: { x: task.x, y: task.y },
      data: {
        readOnly,
        name: task.name,
        description: task.description,
        formVisible: false, // 控制表单是否显示
        type: X6DagNodeType.taskNode,
        graph,
        error: false, // 控制显示错误icon
        onAdd: (node: Node) => {
          options.addDatasetMetricNode?.(node);
        },
      },
      ports: [
        { id: taskNodeLeftPortId, group: AdPortRectLeft },
        { id: taskNodeRightPortId, group: AdPortRectRight },
      ],
    });
    edges.push({
      zIndex: 0,
      shape: AdX6EdgeNoArrow,
      source: {
        cell: configNodeId,
        port: configNodeRightPortId,
      },
      target: {
        cell: taskNodeId,
        port: taskNodeLeftPortId,
      },
      data: {
        deleteBtnVisible: false,
      },
    });
    if (task.average) {
      rankingData.averageTaskId.push(taskNodeId);
    }
    task.dataset?.forEach(dataset => {
      const datasetNodeId = dataset.dataset_config_id;
      const datasetNodeLeftPortId = `${datasetNodeId}${stringSeparator1}left`;
      const datasetNodeRightPortId = `${datasetNodeId}${stringSeparator1}right`;
      const new_dataset_list = _.cloneDeep(dataset.dataset_list);
      Object.keys(new_dataset_list).forEach(key => {
        new_dataset_list[key].forEach(item => {
          if (item.input.length === 0 || item.output.length === 0) {
            // @ts-ignore
            item.error = intl.get('benchmark.config.datasetErrorTip');
          }
        });
      });
      const metric = dataset.metric;
      datasetMetricNodes.push({
        id: datasetNodeId,
        shape: AdX6DagNode,
        position: { x: dataset.x, y: dataset.y },
        data: {
          readOnly,
          type: X6DagNodeType.datasetMetricNode,
          graph,
          dataset: {
            name: dataset.dataset_config_name,
            formVisible: false, // 控制表单是否显示
            datasetList: new_dataset_list,
            allDatasetData: options.allDatasetData,
            allDatasetVersionData: options.allDatasetVersionData,
            getAllDataset: options.getAllDataset,
            taskNodeId,
            updateDatasetVersionData: options.updateDatasetVersionData,
            error: {},
          },
          metric: {
            metricIdList: metric.metric_id_list,
            formVisible: false, // 控制表单是否显示,
            allIndicatorData: options.allIndicatorData,
            datasetNodeId,
            updateIndicatorData: options.updateIndicatorData,
            error: {},
          },
        },
        ports: [
          { id: datasetNodeLeftPortId, group: AdPortRectLeft },
          { id: datasetNodeRightPortId, group: AdPortRectRight },
        ],
      });

      edges.push({
        zIndex: 0,
        shape: AdX6EdgeNoArrow,
        source: {
          cell: taskNodeId,
          port: taskNodeRightPortId,
        },
        target: {
          cell: datasetNodeId,
          port: datasetNodeLeftPortId,
        },
        data: {
          deleteBtnVisible: false,
        },
      });

      const adapterEdgeId = `${datasetNodeId}-adapter`;
      edges.push({
        id: adapterEdgeId,
        zIndex: 0,
        shape: AdX6EdgeNoArrow,
        source: {
          cell: datasetNodeId,
          port: datasetNodeRightPortId,
        },
        target: {
          cell: rankingNodeId,
          port: rankingNodeLeftPortId,
        },
        data: {
          deleteBtnVisible: false,
          adapterList: metric.adapter_list,
          type: X6DagNodeType.adapterNode,
        },
        label: {
          type: 'custom',
          labelNode: options.adapterNode?.(adapterEdgeId, metric.adapter_list),
          markup: Markup.getForeignObjectMarkup(),
          attrs: {
            fo: {
              width: 104,
              height: 48,
              x: -52,
              y: -24,
            },
          },
          position: 0.5,
        },
      });

      rankingData.leaderboard_items[datasetNodeId!] = dataset.leaderboard_item;
    });
  });
  const getRankingNodePosition = () => {
    const position = { x: configData!.leaderboard_x, y: configData!.leaderboard_y };
    // 旧数据没有榜单节点  需要进行兼容
    if ((!configData.leaderboard_x || !configData.leaderboard_y) && datasetMetricNodes.length > 0) {
      let minX = Infinity;
      let maxY = -Infinity;
      datasetMetricNodes.forEach((datasetMetricNode: any) => {
        const nodePosition = datasetMetricNode.position;
        if (nodePosition.x < minX) {
          minX = nodePosition.x + 240 + 100;
        }
        if (nodePosition.y > maxY) {
          maxY = nodePosition.y;
        }
      });
      return {
        x: minX,
        y: maxY,
      };
    }
    return position;
  };
  const rankingNode: Node.Metadata = {
    id: rankingNodeId,
    shape: AdX6DagNode,
    position: getRankingNodePosition(),
    data: {
      readOnly,
      type: X6DagNodeType.rankingNode,
      graph,
      rankingData,
      formVisible: false, // 控制表单是否显示
      error: {},
    },
    ports: [{ id: rankingNodeLeftPortId, group: AdPortRectLeft }],
  };
  const cells = [configNode, ...takNodes, ...datasetMetricNodes, ...edges];
  if (datasetMetricNodes.length > 0) {
    cells.push(rankingNode);
  }
  return cells;
};

/**
 * 移除指定节点下面的所有子节点 （榜单节点会在所有指标节点被移除后  再被移除）
 * @param node 指定节点
 * @param graph
 */
export const removeBenchmarkChildNode = (node: Node, graph: Graph) => {
  const childNodeIdList: string[] = [];
  const allEdge = graph.getEdges();
  const loop = (startNode: Node) => {
    allEdge.forEach(edge => {
      const sourceNode = edge.getSourceNode()!;
      const targetNode = edge.getTargetNode()!;
      if (sourceNode.id === startNode.id) {
        const targetNodeData = targetNode.getData();
        if (!childNodeIdList.includes(targetNode.id) && targetNodeData.type !== X6DagNodeType.rankingNode) {
          childNodeIdList.push(targetNode.id);
        }
        loop(targetNode);
      }
    });
  };
  loop(node);
  if (childNodeIdList.length > 0) {
    graph.removeCells(childNodeIdList);
  }
  setTimeout(() => {
    const rankingNode = getAllRankingNode(graph)[0];
    if (rankingNode) {
      const edges = graph.getIncomingEdges(rankingNode);
      if (!edges || edges.length === 0) {
        graph.removeNode(rankingNode);
      }
    }
  }, 0);
};

/**
 * 根据当前X6图中的数据生成benchmark配置编辑接口需要的数据格式
 * @param graph
 */
export const generateBenchmarkEditConfigDataByX6Data = (graph: Graph, removeDocName: boolean = true) => {
  const configNode = getAllConfigNode(graph)[0];
  const allTaskNode = getAllTaskNode(graph);
  const allDatasetMetricNode = getAllDatasetMetricNode(graph);
  const allAdapterEdge = getAllAdapterEdge(graph);
  const rankingNode = getAllRankingNode(graph)[0];
  const rankingNodeData = rankingNode?.getData()?.rankingData;
  const configNodeData = configNode.getData();
  const configNodePosition = configNode.position();

  const task: EditBenchmarkConfigTaskNodeType[] = [];
  allTaskNode.forEach(taskNode => {
    const dataset: EditBenchmarkConfigDatasetType[] = [];
    allDatasetMetricNode.forEach(datasetMetricNode => {
      const datasetMetricNodeData = datasetMetricNode.getData();
      const datasetNodeData = datasetMetricNodeData.dataset;
      const metricNodeData = datasetMetricNodeData.metric;
      // 找到属于当前任务节点的数据集metric节点
      if (datasetNodeData.taskNodeId === taskNode.id) {
        const metric: any = {};
        metric.metric_id_list = metricNodeData.metricIdList;
        let adapter_list: string[] = [];
        allAdapterEdge.forEach(edge => {
          // 找到属于当前数据集节点的adapter边
          if (edge.id.startsWith(datasetMetricNode.id)) {
            const adapterEdgeData = edge.getData();
            adapter_list = adapterEdgeData.adapterList;
          }
        });
        metric.adapter_list = adapter_list;

        const dataset_list = _.cloneDeep(datasetNodeData.datasetList);
        if (removeDocName) {
          Object.keys(dataset_list).forEach(key => {
            dataset_list[key].forEach((item: any) => {
              delete item.doc_name;
            });
          });
        }
        const datasetNodePosition = datasetMetricNode.position();
        const datasetItem: EditBenchmarkConfigDatasetType = {
          dataset_config_id: datasetMetricNode.id,
          dataset_config_name: datasetNodeData.name,
          dataset_list,
          x: datasetNodePosition.x,
          y: datasetNodePosition.y,
          metric,
          leaderboard_item: rankingNode && (rankingNodeData.leaderboard_items[datasetMetricNode.id] || ''),
        };
        if (datasetMetricNode.id.startsWith(`dataset${stringSeparator1}`)) {
          delete datasetItem.dataset_config_id;
        }
        dataset.push(datasetItem);
      }
    });

    const taskNodeData = taskNode.getData();
    const taskNodePosition = taskNode.position();
    const taskItem: EditBenchmarkConfigTaskNodeType = {
      id: taskNode.id,
      name: taskNodeData.name,
      description: taskNodeData.description,
      x: taskNodePosition.x,
      y: taskNodePosition.y,
      dataset,
      average: rankingNode && rankingNodeData.averageTaskId.includes(taskNode.id),
    };
    if (taskNode.id.startsWith(`task${stringSeparator1}`)) {
      // 说明是前端临时生成的id，要移除掉
      delete taskItem.id;
    }
    task.push(taskItem);
  });

  const newConfigData: any = {
    name: configNodeData.name,
    description: configNodeData.description,
    x: configNodePosition.x,
    y: configNodePosition.y,
    task,
    color: configNodeData.icon,
    average: false,
  };

  if (rankingNode) {
    const rankingNodePosition = rankingNode.position();
    newConfigData.leaderboard_x = rankingNodePosition.x;
    newConfigData.leaderboard_y = rankingNodePosition.y;
    newConfigData.average = rankingNodeData.configIsAverage;
  }

  return newConfigData;
};

/**
 * 查看接口返回的数据转化为编辑接口需要数据格式
 */
export const generateBenchmarkEditConfigDataByViewConfigData = (configData: ViewBenchmarkConfigDataType): EditBenchmarkConfigDataType => {
  const task: EditBenchmarkConfigTaskNodeType[] = [];
  configData.task.forEach(taskItem => {
    const dataset: EditBenchmarkConfigDatasetType[] = [];
    taskItem.dataset.forEach(datasetItem => {
      const dataset_list: any = {};
      Object.keys(datasetItem.dataset_list).forEach(id => {
        dataset_list[id] = datasetItem.dataset_list[id].doc_list.map(docItem => ({
          doc_id: docItem.doc_id,
          doc_name: docItem.doc_name,
          input: docItem.input,
          output: docItem.output,
        }));
      });
      const datasetData = {
        dataset_config_id: datasetItem.dataset_config_id,
        dataset_config_name: datasetItem.dataset_config_name,
        dataset_list,
        x: datasetItem.x,
        y: datasetItem.y,
        metric: {
          metric_id_list: datasetItem.metric.metric_list.map(listItem => listItem.id),
          adapter_list: datasetItem.metric.adapter_list,
        },
        leaderboard_item: datasetItem.leaderboard_item,
      };
      dataset.push(datasetData);
    });
    const taskData = {
      id: taskItem.id,
      name: taskItem.name,
      description: taskItem.description,
      x: taskItem.x,
      y: taskItem.y,
      dataset,
      average: taskItem.average,
    };
    task.push(taskData);
  });
  const newConfigData: EditBenchmarkConfigDataType = {
    id: configData.id,
    name: configData.name,
    description: configData.description,
    x: configData.x,
    y: configData.y,
    task,
    leaderboard_x: configData.leaderboard_x,
    leaderboard_y: configData.leaderboard_y,
    color: configData.color,
    average: configData.average,
  };
  return newConfigData;
};

export const getLastNumberFromString = (str: string) => {
  const match = str.match(/\d+$/);
  if (!match) {
    return null;
  }
  return parseInt(match[0]);
};

export const highlightFullPathByNode = (node: Node, graph: Graph) => {
  // 用于存储路径的节点和边
  const pathNodes: Set<string> = new Set();
  const pathEdges: Set<string> = new Set();
  pathNodes.add(node.id);

  // 清除之前的高亮
  clearHighlight(graph);
  // 深度优先搜索（DFS）

  const loopFindParentNode = (node: Node) => {
    const incomeEdges = graph.getIncomingEdges(node) || [];
    if (incomeEdges.length > 0) {
      incomeEdges.forEach(edge => {
        if (!pathEdges.has(edge.id)) {
          pathEdges.add(edge.id);
        }
        const sourceNode = edge.getSourceNode();
        if (sourceNode && !pathNodes.has(sourceNode.id)) {
          pathNodes.add(sourceNode.id);
          loopFindParentNode(sourceNode);
        }
      });
    }
  };
  const loopFindAllChildNode = (node: Node) => {
    const outEdges = graph.getOutgoingEdges(node) || [];
    if (outEdges.length > 0) {
      outEdges.forEach(edge => {
        if (!pathEdges.has(edge.id)) {
          pathEdges.add(edge.id);
        }
        const targetNode = edge.getTargetNode();
        if (targetNode && !pathNodes.has(targetNode.id)) {
          pathNodes.add(targetNode.id);
          loopFindAllChildNode(targetNode);
        }
      });
    }
  };
  const dfs = (currentNode: Node) => {
    loopFindParentNode(currentNode);
    loopFindAllChildNode(currentNode);
  };

  // 开始DFS
  dfs(node);

  pathEdges.forEach(edgeId => {
    const edge = graph.getCellById(edgeId) as Edge;
    if (edge) {
      edge.toFront();
      edge.attr('line/stroke', '#000');
      edge.attr('line/strokeWidth', 2);
      if (edge.getData().type === X6DagNodeType.adapterNode) {
        edge.updateData({
          highlight: true,
        });
      }
    }
  });

  // 高亮路径上的节点和边
  pathNodes.forEach(nodeId => {
    const node = graph.getCellById(nodeId) as Node;
    if (node) {
      node.toFront();
      node.updateData({
        highlight: true,
      });
    }
  });
};

export const clearHighlight = (graph: Graph) => {
  const cells = graph.getCells();

  // 清除之前的高亮
  cells.forEach(cell => {
    if (cell.isNode()) {
      cell.updateData({
        highlight: false,
      });
    } else if (cell.isEdge()) {
      cell.attr('line/stroke', adX6EdgeLineColor);
      cell.attr('line/strokeWidth', 1);
      if (cell.getData().type === X6DagNodeType.adapterNode) {
        cell.updateData({
          highlight: false,
        });
      }
    }
  });
};
