import { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Node, Edge } from '@antv/x6';
import { message, Splitter } from 'antd';
import { DataViewQueryType, DataViewSource } from '@/components/CustomDataViewSource';
import { formatNodePosition, getTargetNodes, nanoId } from '@/utils/dataView';
import api from '@/services/customDataView/index';
import HOOKS from '@/hooks';
import { DataViewOperateType, NodeType } from '@/pages/CustomDataView/type';
import GraphBox from './GraphBox';
import styles from './index.module.less';
import OperateBox from './OperateBox';
import SettingForm from './SettingForm';
import { useDataViewContext } from '../context';

const DataViewSetting = () => {
  const { dataViewTotalInfo, setDataViewTotalInfo, selectedDataView, setSelectedDataView, previewNode, setPreviewNode } = useDataViewContext();
  const { NODE_TYPE_TITLE_MAP } = HOOKS.useConstants();
  const graphBoxRef = useRef<any>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [queryType, setQueryType] = useState<DataViewQueryType>(DataViewQueryType.SQL);

  const { getNodePreview } = HOOKS.useDataView({
    dataViewTotalInfo,
    setDataViewTotalInfo,
    setSelectedDataView,
    setPreviewNode,
  });

  // 初始化节点
  useEffect(() => {
    if (dataViewTotalInfo?.data_scope?.length > 0) {
      const nodesData: any[] = [];
      const edgesData: any[] = [];
      dataViewTotalInfo?.data_scope?.forEach((item: any) => {
        if (item.input_nodes?.length > 0) {
          item.input_nodes.forEach((inputNodeId: any) => {
            edgesData.push({
              id: `edge_${nanoId()}`,
              source: inputNodeId,
              target: item.id,
            });
          });
        }
        nodesData.push(item);
      });
      setNodes(nodesData);
    }
    setQueryType(dataViewTotalInfo?.query_type || DataViewQueryType.SQL);
  }, [dataViewTotalInfo]);

  // 处理视图操作
  const handleOperate = (type: string) => {
    switch (type) {
      case DataViewOperateType.ADD:
        // 新增视图
        setOpen(true);
        break;
      case DataViewOperateType.RELATION:
        // 新增关联
        handleAddNode(NodeType.JOIN);
        break;
      case DataViewOperateType.MERGE:
        // 新增合并
        handleAddNode(NodeType.MERGE);
        break;
      case DataViewOperateType.SQL:
        // 新增SQL
        handleAddNode(NodeType.SQL);
        break;
      case DataViewOperateType.FORMAT:
        // 格式化视图
        setDataViewTotalInfo((prev: any) => ({
          ...prev,
          data_scope: formatNodePosition(prev.data_scope),
        }));
        graphBoxRef.current?.formatPosition();
        graphBoxRef.current?.centerContent();
        break;
      case DataViewOperateType.ZOOM_IN:
        // 视图放大
        graphBoxRef.current?.zoomIn();
        break;
      case DataViewOperateType.ZOOM_OUT:
        // 视图缩小
        graphBoxRef.current?.zoomOut();
        break;

      default:
        break;
    }
    setSelectedDataView(null);
  };

  // 新增视图节点
  const handleAddNode = (type: NodeType, params: any = {}) => {
    if (!params) return;
    let title = params.title || NODE_TYPE_TITLE_MAP[type];
    const {
      config = {},
      position = { x: window.innerWidth / 2 - 140 + Math.random() * 20, y: window.innerHeight / 2 - 64 - Math.random() * 20 },
      output_fields = [],
    } = params;

    // 判断 title是否重名
    const isTitleExist = dataViewTotalInfo.data_scope.some((item: any) => item.title === title);
    if (isTitleExist) {
      title = `${title}_${nanoId()}`;
    }

    // 判断是否有初始化节点
    const initNode = dataViewTotalInfo.data_scope.find((item: any) => item.id === 'node-init');
    // 如果有初始化节点 则去掉初始化节点
    if (initNode && type === NodeType.VIEW) {
      dataViewTotalInfo.data_scope = dataViewTotalInfo.data_scope.filter((item: any) => item.id !== 'node-init');
    }

    const dataScope = {
      id: `node_${nanoId()}`,
      type,
      title,
      position,
      input_nodes: [],
      output_nodes: [],
      config: config,
      output_fields,
      node_status: 'error',
    };
    dataViewTotalInfo.data_scope.push(dataScope);

    setDataViewTotalInfo({ ...dataViewTotalInfo });
  };

  // 根据原子视图添加节点
  const handleChooseOk = (checkedList: any) => {
    if (checkedList?.length > 0) {
      const viewIds = checkedList.map((item: any) => item.id);
      api.getCustomDataViewDetails(viewIds, true).then((viewDetailList: any) => {
        if (viewDetailList?.length > 0) {
          viewDetailList.forEach((item: any, index: number) => {
            handleAddNode(NodeType.VIEW, {
              title: item.name,
              config: {
                view_id: item.id,
                filters: {},
                distinct: {
                  enable: false,
                  fields: [],
                },
                view: {
                  name: item.name,
                },
              },
              position: { x: 200, y: 20 + 148 * index + Math.random() * 20 },
              output_fields:
                item?.fields?.map((item: any) => ({
                  ...item,
                })) || [],
            });
          });
        }
      });
    }
  };

  // 删除视图节点
  const handleNodeRemove = (node: Node) => {
    setDataViewTotalInfo((prev: any) => ({
      ...prev,
      data_scope: prev.data_scope.filter((item: any) => item.id !== node.id),
    }));
  };

  // 处理节点选择
  const handleNodeSelect = (node: Node) => {
    if (!node) return;
    if (node.data?.type === NodeType.MERGE && node.data?.input_nodes.length < 2) {
      message.error(intl.get('CustomDataView.DataViewSetting.mergeNeedTwoNodes'));
      return;
    }
    if (node.data?.type === NodeType.JOIN && node.data?.input_nodes.length < 2) {
      message.error(intl.get('CustomDataView.DataViewSetting.relationNeedTwoNodes'));
      return;
    }
    if (node.data.id === 'node-init') {
      setOpen(true);
      return;
    }
    setSelectedDataView(node.data);
    setPreviewNode({});
  };

  // 处理节点连接
  const handleEdgeConnect = (edge: Edge) => {
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();

    if (targetNode && sourceNode) {
      const outputFields = sourceNode.data.output_fields || [];
      const outputNodes = sourceNode.data.output_nodes || [];
      const inputNodes = [...(targetNode?.data.input_nodes || [])];

      const nodeStatus = sourceNode?.data?.node_status;
      if (nodeStatus === 'error') {
        message.error(intl.get('CustomDataView.DataViewSetting.confirmPreviousNodeConfig'));
        edge.remove();
        return;
      }

      // 检查输出字段是否存在
      if (outputFields.length === 0) {
        message.error(intl.get('CustomDataView.DataViewSetting.configurePreviousNodeFields'));
        edge.remove();
        return;
      }

      if (outputNodes.length > 0) {
        message.error(intl.get('CustomDataView.DataViewSetting.nodeSupportOneOutput'));
        edge.remove();
        return;
      }
      if (!inputNodes.includes(sourceNode.data.id)) {
        inputNodes.push(sourceNode.data.id);
      } else {
        edge.remove();
      }

      // 输出视图只能一个输入
      if (targetNode.data.type === NodeType.OUTPUT) {
        if (inputNodes.length > 1) {
          message.error(intl.get('CustomDataView.DataViewSetting.outputViewOneInput'));
          edge.remove();
          return;
        }
      }

      // 关联节点最多2个输入
      if (targetNode.data.type === NodeType.JOIN && inputNodes.length > 2) {
        message.error(intl.get('CustomDataView.DataViewSetting.relationNodeTwoInputs'));
        edge.remove();
        return;
      }

      setDataViewTotalInfo((prev: any) => ({
        ...prev,
        data_scope:
          prev?.data_scope?.map((item: any) => {
            if (item.id === targetNode.data.id) {
              return {
                ...item,
                input_nodes: inputNodes,
              };
            }
            if (item.id === sourceNode.data.id) {
              return {
                ...item,
                output_nodes: [targetNode.data.id],
              };
            }
            return item;
          }) || [],
      }));
      setSelectedDataView(null);
    }
  };

  // 处理边删除
  const handleEdgeRemove = (edge: any) => {
    const sourceNodeId = edge.getSource().cell;
    const targetNodeId = edge.getTarget().cell;
    if (targetNodeId && sourceNodeId) {
      setDataViewTotalInfo((prev: any) => {
        const targetNodes = getTargetNodes(prev?.data_scope || [], sourceNodeId);

        return {
          ...prev,
          data_scope:
            prev?.data_scope?.map((item: any) => {
              return {
                ...item,
                input_nodes: item.id === targetNodeId ? item.input_nodes.filter((nodeId: any) => nodeId !== sourceNodeId) : item.input_nodes,
                output_fields: item.id === targetNodeId ? [] : item.output_fields,
                output_nodes: item.id === sourceNodeId ? [] : item.output_nodes,
                node_status: targetNodes.some((node: any) => node.id === item.id) ? 'error' : item?.node_status,
              };
            }) || [],
        };
      });
      setSelectedDataView(null);
    }
  };

  // 处理节点预览
  const handleNodePreview = async (node: Node) => {
    getNodePreview(node.data, true);
  };

  return (
    <div className={styles['setting-container']}>
      {/* 操作按钮 */}
      <OperateBox onOperate={handleOperate} />
      {/* 数据视图源选择器 */}
      <DataViewSource
        queryType={queryType}
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        onOk={(checkedList: any) => {
          handleChooseOk(checkedList);
          setOpen(false);
        }}
      />
      <Splitter layout="vertical" style={{ height: '100%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        <Splitter.Panel>
          <GraphBox
            ref={graphBoxRef}
            nodes={nodes}
            onNodeSelect={handleNodeSelect}
            onNodeRemove={handleNodeRemove}
            onEdgeConnect={handleEdgeConnect}
            onEdgeRemove={handleEdgeRemove}
            onNodePreview={handleNodePreview}
          />
        </Splitter.Panel>
        <Splitter.Panel size={!selectedDataView?.id ? '0' : '50%'}>
          <SettingForm type={selectedDataView?.type} />
        </Splitter.Panel>
        <Splitter.Panel size={!previewNode?.id ? '0' : '50%'}>
          <SettingForm type={DataViewOperateType.FIELD_PREVIEW} />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default DataViewSetting;
