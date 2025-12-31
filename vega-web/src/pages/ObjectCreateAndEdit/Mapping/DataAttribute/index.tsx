import React, { useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { ReactFlow, addEdge, useNodesState, useEdgesState, Edge, Connection, applyNodeChanges, type OnNodesChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import OntologyObjectType from '@/services/object/type';
import HOOKS from '@/hooks';
import AttrForm from './attrForm';
import CustomEdge from './customEdge';
import CustomNode from './customNode';

// 节点类型映射
const nodeTypes = {
  customNode: CustomNode,
};

// 边类型映射
const edgeTypes = {
  customEdge: CustomEdge,
};

// 节点属性接口
// interface Attribute {
//     id: string;
//     name: string;
//     type: string;
// }

// 节点数据接口
// interface NodeData {
//     label: string;
//     attributes: Attribute[];
//     searchText: string;
// }

interface TProps {
  nodes: OntologyObjectType.TNode[];
  edges: OntologyObjectType.TEdge[];
  saveEdge: (edges: OntologyObjectType.TEdge[]) => void;
  openDataViewSource?: () => void;
}

const DataAttribute: React.FC<TProps> = ({ nodes: nodesProps, edges: edgesProps, saveEdge, openDataViewSource }) => {
  const { message } = HOOKS.useGlobalContext();
  // 初始化节点数据 - 节点A和节点B
  const [nodes, setNodes] = useNodesState<any>([]);

  // 初始化边数据和选中边状态
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [attrFormVisible, setAttrFormVisible] = useState(false);
  const [attrFormData, setAttrFormData] = useState<OntologyObjectType.Field>();

  const attrClick = (val: OntologyObjectType.Field) => {
    console.log(val, 'attrClick');
    setAttrFormVisible(true);
    setAttrFormData(val);
  };

  const attrFormCancel = () => {
    setAttrFormVisible(false);
  };

  useEffect(() => {
    saveEdge(edges as OntologyObjectType.TEdge[]);
  }, [JSON.stringify(edges)]);

  useEffect(() => {
    const newNodes = nodesProps.map((val) => ({
      ...val,
      data: {
        ...val.data,
        attrClick,
        openDataViewSource,
      },
    }));
    setNodes(newNodes as any);
    setTimeout(() => {
      setEdges(edgesProps);
    });
  }, [JSON.stringify(nodesProps), JSON.stringify(edgesProps)]);

  // 处理连接 - 确保属性之间只能有一条连接线，且只能从节点A连接到节点B
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceId = params.sourceHandle;
      const targetId = params.targetHandle;
      if (sourceId?.startsWith('data') && targetId?.startsWith('view')) {
        const exists = edges.some((edge) => edge.sourceHandle === sourceId || edge.targetHandle === targetId);
        const dataType = nodes
          .find((node) => node.id === params.source)
          .data.attributes.find((attr: { id: string | null; type: string }) => 'data-' + attr.id === params.sourceHandle)?.type;
        const viewType = nodes
          .find((node) => node.id === params.target)
          .data.attributes.find((attr: { id: string | null; type: string }) => 'view-' + attr.id === params.targetHandle)?.type;
        const equalType = dataType != viewType;
        if (!exists && !equalType) {
          setEdges((prev) =>
            addEdge(
              {
                ...params,
                id: `${sourceId.replace(/^data-/, '')}&&${targetId.replace(/^view-/, '')}`,
                type: 'customEdge',
                data: { deletable: true },
              },
              prev
            )
          );
        } else if (exists) {
          message.error(intl.get('Object.onlyOneConnection'));
        } else {
          message.error(intl.get('Object.attributeTypeInconsistent'));
        }
      }
    },
    [edges, setEdges]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes((nds): any => {
        console.log(nds, 'nds');

        const updatedNodes = applyNodeChanges(changes, nds);
        return updatedNodes.map((node) => ({
          ...node,
          type: node.type || 'customNode', // 确保 type 不为 undefined
        }));
      }),
    [setNodes]
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        // fitView
        onKeyDown={(e) => {
          if (e.target instanceof HTMLInputElement) {
            return;
          }
          // 检测到按下的是 Backspace 键时，阻止其默认行为
          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.stopPropagation(); // 阻止事件传播
            e.preventDefault(); // 阻止默认行为
          }
        }}
        fitViewOptions={{
          // padding: 50,
          minZoom: 1,
          maxZoom: 1,
        }}
      >
        {/* <Background variant={BackgroundVariant.Dots} gap={20} size={2} /> */}
      </ReactFlow>
      {attrFormVisible && <AttrForm data={attrFormData} onClose={attrFormCancel} />}
    </div>
  );
};

export default DataAttribute;
