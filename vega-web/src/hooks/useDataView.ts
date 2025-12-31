import { useCallback } from 'react';
import { message } from 'antd';
import { getInputNodes, getTargetNodes, replaceObjectById } from '@/utils/dataView';
import api from '@/services/customDataView/index';
import { NodeType } from '@/pages/CustomDataView/type';

interface UseDataViewUpdateParams {
  dataViewTotalInfo: any;
  setDataViewTotalInfo: (data: any) => void;
  setSelectedDataView: (data: any) => void;
  setPreviewNode?: (data: any) => void;
}

/**
 * 自定义 hook，用于更新数据视图节点并设置相关节点状态
 * @param dataViewTotalInfo 数据视图总信息
 * @param setDataViewTotalInfo 设置数据视图总信息的函数
 * @param setSelectedDataView 设置选中数据视图的函数
 * @returns 返回更新数据视图的函数
 */
export const useDataView = ({ dataViewTotalInfo, setDataViewTotalInfo, setSelectedDataView, setPreviewNode }: UseDataViewUpdateParams) => {
  // 处理节点预览
  const getNodePreview = async (node: any, showPreview?: boolean) => {
    const inputNodes = getInputNodes(dataViewTotalInfo?.data_scope || [], node.id);
    const dataScope = [...inputNodes, node];

    if (node?.type !== NodeType.OUTPUT) {
      dataScope.push({
        id: 'node-output',
        title: '虚拟输出节点',
        type: NodeType.OUTPUT,
        config: {},
        input_nodes: [node.id],
        output_fields: node?.output_fields || [],
      });
    }
    try {
      const res = await api.getNodeDataPreview({
        limit: 100,
        offset: 0,
        type: 'custom',
        query_type: dataViewTotalInfo?.query_type || '',
        data_scope: dataScope || [],
      });
      if (res?.entries && res?.view?.fields) {
        if (showPreview) {
          setPreviewNode?.({
            id: node?.id,
            title: node?.title || '',
            dataSource: res?.entries || [],
            columns: res?.view?.fields || [],
          });
        }
        return {
          dataSource: res?.entries || [],
          columns: res?.view?.fields || [],
        };
      } else {
        message.error('配置错误，请确认配置参数');
        return null;
      }
    } catch (error) {
      console.error('获取节点预览数据失败', error);
      return null;
    }
  };

  /**
   * 更新数据视图节点并设置相关节点状态
   * @param newNodeData 新的节点数据
   * @param currentNodeId 当前节点ID
   */
  const updateDataViewNode = useCallback(
    async (newNodeData: any, currentNodeId: string, nodeType?: NodeType) => {
      // 节点预览,检查是否有正确输出字段
      const previewData = await getNodePreview(newNodeData);
      if (!previewData) {
        return;
      }
      // 如果是SQL节点，更新输出字段
      if (nodeType && nodeType === NodeType.SQL) {
        newNodeData.output_fields = previewData.columns;
      }

      // 获取当前节点的所有子节点
      const targetNodes = getTargetNodes(dataViewTotalInfo.data_scope, currentNodeId);

      // 设置所有子节点状态为 error
      dataViewTotalInfo.data_scope.forEach((item: any) => {
        if (targetNodes.some((node: any) => node.id === item.id)) {
          item.node_status = 'error';
          item.output_fields = [];
        }
      });

      // 替换当前节点数据
      replaceObjectById(dataViewTotalInfo.data_scope, newNodeData);

      // 更新数据视图总信息
      setDataViewTotalInfo({ ...dataViewTotalInfo });

      // 清除选中的数据视图
      setSelectedDataView(null);
    },
    [dataViewTotalInfo, setDataViewTotalInfo, setSelectedDataView]
  );

  const updateTargetNodeStatus = useCallback(
    (nodeId: string) => {
      // 获取当前节点的所有子节点
      const targetNodes = getTargetNodes(dataViewTotalInfo.data_scope, nodeId);
      // 设置所有子节点状态为 error
      dataViewTotalInfo.data_scope.forEach((item: any) => {
        if (targetNodes.some((node: any) => node.id === item.id)) {
          item.node_status = 'error';
        }
      });
      // 更新数据视图总信息
      setDataViewTotalInfo({ ...dataViewTotalInfo });
    },
    [dataViewTotalInfo]
  );

  return { updateDataViewNode, getNodePreview, updateTargetNodeStatus };
};

export default useDataView;
