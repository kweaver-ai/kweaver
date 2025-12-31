import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import intl from 'react-intl-universal';
import { PlayCircleOutlined } from '@ant-design/icons';
import { Graph, Node, Path, Edge } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Dropdown } from 'antd';
import classnames from 'classnames';
import { NODE_TYPE_ICON_MAP } from '@/hooks/useConstants';
import { nanoId } from '@/utils/dataView';
import HOOKS from '@/hooks';
import { NodeType } from '@/pages/CustomDataView/type';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

export interface NodePosition {
  x: number;
  y: number;
}

export interface X6CanvasRef {
  // 放大画布
  zoomIn: () => void;
  // 缩小画布
  zoomOut: () => void;
  // 居中内容
  centerContent: () => void;
  // 格式化节点位置
  formatPosition: () => void;
}

export interface X6CanvasProps {
  /** 节点数据列表 */
  nodes?: any[];
  /** 节点删除回调函数 */
  onNodeRemove?: (node: Node) => void;
  /** 边删除回调函数 */
  onEdgeRemove?: (edge: Edge) => void;
  /** 节点选择回调函数 */
  onNodeSelect?: (node: Node) => void;
  /** 节点连接回调函数 */
  onEdgeConnect?: (edge: Edge) => void;
  /** 节点预览回调函数 */
  onNodePreview?: (node: Node) => void;
}

const GraphBox = forwardRef<X6CanvasRef, X6CanvasProps>((props, ref) => {
  const { nodes, onNodeSelect, onNodeRemove, onEdgeConnect, onEdgeRemove, onNodePreview } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph>();
  const { modal } = HOOKS.useGlobalContext();

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    centerContent: () => {
      graphRef.current?.centerContent();
      graphRef.current?.zoomToFit({ maxScale: 1 });
    },
    zoomIn: () => {
      graphRef.current?.zoom(0.2);
    },
    zoomOut: () => {
      graphRef.current?.zoom(-0.2);
    },
    formatPosition: () => {
      if (!nodes || nodes.length === 0) {
        return;
      }
      nodes.forEach((item: any) => {
        const node = graphRef.current?.getCellById(item.id);
        node?.setProp('position', item.position);
      });
    },
  }));

  //  自定义节点
  const CustomNode = ({ node, graph }: { node: Node; graph: Graph }) => {
    const { type: nodeType, label, selected = false, input_nodes = [], title = '', node_status = '' } = node.prop('data');

    const iconType = NODE_TYPE_ICON_MAP[nodeType as keyof typeof NODE_TYPE_ICON_MAP] || 'icon-dip-color-shitusuanzi';

    const handleSelectNode = () => {
      onNodeSelect?.(node);
    };

    const handleDeleteNode = () => {
      modal.confirm({
        title: intl.get('CustomDataView.GraphBox.confirmDeleteNode'),
        content: intl.get('CustomDataView.GraphBox.deleteNodeWarning'),
        okText: intl.get('Global.ok'),
        onOk: () => {
          graph.removeNode(node);
        },
      });
    };

    const menuItem = () => {
      if (nodeType === NodeType.OUTPUT) {
        return [];
      }
      return [
        {
          label: <span onClick={handleDeleteNode}>{intl.get('Global.delete')}</span>,
          key: 'delete',
        },
      ];
    };

    const nodeContent = () => {
      switch (nodeType) {
        case NodeType.VIEW:
          return (
            <>
              {label ? (
                <div className={styles['custom-node-content']} onClick={handleSelectNode}>
                  <div className={styles['custom-node-content-name']}>
                    <IconFont type={iconType} style={{ fontSize: '20px' }} />
                    <div className={styles['custom-node-content-name-text']}>{label}</div>
                  </div>
                </div>
              ) : (
                <div
                  className={styles['custom-node-content']}
                  onClick={() => {
                    onNodeSelect?.(node);
                  }}
                >
                  <div className={styles['custom-node-content-choose']}>
                    <IconFont type="icon-dip-add" style={{ fontSize: '14px' }} />
                    <div>{intl.get('CustomDataView.GraphBox.selectDataView')}</div>
                  </div>
                </div>
              )}
            </>
          );
        default:
          return (
            <>
              {input_nodes.length > 0 ? (
                <div className={styles['custom-node-content']} onClick={handleSelectNode}>
                  {input_nodes.map((item: any, index: number) => (
                    <IconFont key={index} type={iconType} style={{ fontSize: '20px' }} />
                  ))}
                </div>
              ) : (
                <div className={styles['custom-node-content-empty']}>{intl.get('CustomDataView.GraphBox.pleaseSelectReferenceView')}</div>
              )}
            </>
          );
      }
    };

    return (
      <div
        className={classnames(
          styles['custom-node'],
          { [styles['custom-node-selected']]: selected },
          { [styles['custom-node-error']]: node_status === 'error' }
        )}
      >
        <div className={styles['custom-node-top-box']}>
          <div className={styles['custom-node-title-box']}>
            <IconFont type={iconType} style={{ fontSize: '32px' }} />
            <div className={styles['custom-node-title']}>{title}</div>
          </div>
          <div className={styles['custom-node-menu-item']} style={{ visibility: selected ? 'visible' : 'hidden' }}>
            <PlayCircleOutlined onClick={() => onNodePreview?.(node)} />
            <Dropdown
              menu={{
                items: menuItem(),
              }}
              trigger={['click']}
            >
              <IconFont type="icon-dip-gengduo" style={{ fontSize: '16px' }} />
            </Dropdown>
          </div>
        </div>
        {nodeContent()}
      </div>
    );
  };

  // 注册自定义节点
  register({
    shape: 'custom-react-node',
    width: 280,
    height: 108,
    component: CustomNode,
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              magnet: true,
              stroke: '#8f8f8f',
              r: 5,
            },
          },
        },

        out: {
          position: 'right',
          attrs: {
            circle: {
              magnet: true,
              stroke: '#8f8f8f',
              r: 5,
            },
          },
        },
      },
    },
  });

  // 自定义连接器
  const sceneConnector = (sourcePoint: NodePosition, targetPoint: NodePosition) => {
    const hgap = Math.abs(targetPoint.x - sourcePoint.x);
    const path = new Path();
    path.appendSegment(Path.createSegment('M', sourcePoint.x - 4, sourcePoint.y));
    path.appendSegment(Path.createSegment('L', sourcePoint.x + 6, sourcePoint.y));
    // 水平三阶贝塞尔曲线
    path.appendSegment(
      Path.createSegment(
        'C',
        sourcePoint.x < targetPoint.x ? sourcePoint.x + hgap / 2 : sourcePoint.x - hgap / 2,
        sourcePoint.y,
        sourcePoint.x < targetPoint.x ? targetPoint.x - hgap / 2 : targetPoint.x + hgap / 2,
        targetPoint.y,
        targetPoint.x - 6,
        targetPoint.y
      )
    );
    path.appendSegment(Path.createSegment('L', targetPoint.x + 2, targetPoint.y));
    return path.serialize();
  };

  // 自定义边配置
  const sceneEdgeConfig = {
    markup: [
      {
        tagName: 'path',
        selector: 'wrap',
        attrs: {
          fill: 'none',
          cursor: 'pointer',
          stroke: 'transparent',
          strokeLinecap: 'round',
        },
      },
      {
        tagName: 'path',
        selector: 'line',
        attrs: {
          fill: 'none',
          pointerEvents: 'none',
        },
      },
    ],
    connector: { name: 'curveConnector' },
    attrs: {
      wrap: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
      line: {
        connection: true,
        stroke: '#BFBFBF',
        strokeWidth: 1,
        targetMarker: {
          name: 'classic',
          size: 6,
        },
      },
    },
    zIndex: -1,
  };

  // 注册自定义连接器
  Graph.registerConnector('curveConnector', sceneConnector, true);

  // 注册自定义边
  Graph.registerEdge('data-scene-edge', { ...sceneEdgeConfig }, true);

  /**
   * 创建边
   * @param graph 图实例
   * @param sourceId 源节点id
   * @param targetId 目标节点id
   */
  const createEdge = (graph: Graph, config: { id: string; sourceId: string; targetId: string }) => {
    graph.addEdge({
      id: config.id,
      shape: 'data-scene-edge',
      source: {
        cell: config.sourceId,
        port: `${config.sourceId}-out`,
      },
      target: {
        cell: config.targetId,
        port: `${config.targetId}-in`,
      },
      zIndex: -1,
    });
  };

  /**
   * 创建节点
   * @param graph 图实例
   * @param config 节点配置
   * @param data_scope 节点数据
   */
  const createNode = (graph: Graph, config: { id: string; type: NodeType; position?: { x: number; y: number }; data?: any }, data_scope?: any) => {
    const node = graph.addNode({
      id: config.id,
      shape: 'custom-react-node',
      data: {
        id: config.id,
        type: config.type,
        label: data_scope?.config?.view?.name || '',
        ...config.data,
        ...data_scope,
      }, // 节点数据
      position: config.position ?? {
        x: 100,
        y: 100,
      },
    });
    switch (config.type) {
      case NodeType.VIEW:
        node?.addPort({
          id: `${node.id}-out`,
          group: 'out',
        });
        break;
      case NodeType.OUTPUT:
        node?.addPort({
          id: `${node.id}-in`,
          group: 'in',
        });
        break;
      default:
        node?.addPort({
          id: `${node.id}-in`,
          group: 'in',
        });
        node?.addPort({
          id: `${node.id}-out`,
          group: 'out',
        });
        break;
    }
    return node;
  };

  // 初始化画布
  useEffect(() => {
    const graph: Graph = new Graph({
      container: containerRef.current as HTMLDivElement,
      autoResize: true,
      panning: true,
      mousewheel: true,
      background: {
        color: '#f0f2f6',
      },
      scaling: {
        min: 0.5,
        max: 2,
      },
      grid: {
        visible: true,
        type: 'dot',
        args: [
          {
            color: '#AAA', // 主网格线颜色
          },
        ],
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'className',
          args: {
            className: 'x6-highlighted',
          },
        },
        magnetAvailable: {
          name: 'stroke',
          args: {
            padding: 0,
            attrs: {
              'stroke-width': 1,
              stroke: '#126ee3',
            },
          },
        },
      },
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        highlight: true,
        createEdge() {
          return graph?.createEdge({
            shape: 'data-scene-edge',
            zIndex: -1,
          });
        },
        // 连接桩校验
        validateConnection({ targetPort, sourcePort }) {
          // 只能从输出链接桩创建连接
          if (!sourcePort || !sourcePort.includes('out')) {
            return false;
          }
          // 只能连接到输入链接桩
          if (!targetPort || !targetPort.includes('in')) {
            return false;
          }
          return true;
        },
      },
    });

    if (graph) {
      graphRef.current = graph;

      // 初始化画布居中
      setTimeout(() => {
        graphRef.current?.centerContent();
        graphRef.current?.zoomToFit({ maxScale: 1 });
      }, 1000);

      // 边鼠标移入
      graph.on('edge:mouseover', ({ edge }) => {
        edge.addTools([
          {
            name: 'button-remove', // 工具名称
            args: { distance: '50%' },
          },
        ]);
        edge.attr('line/stroke', 'rgba(18,110,227,0.65)');
      });

      // 边鼠标移出
      graph.on('edge:mouseleave', ({ edge }) => {
        edge.removeTools();
        edge.attr('line/stroke', '#BFBFBF');
      });

      // 节点点击
      graph.on('node:click', ({ node }) => {
        setTimeout(() => {
          graph.getNodes().forEach((n) => {
            if (node.id !== n.id) {
              n.updateData({ ...n.data, selected: false });
            } else {
              n.updateData({ ...n.data, selected: true });
            }
          });
        }, 0);
      });

      // 连线变更
      graph.on('edge:connected', ({ edge }) => {
        onEdgeConnect?.(edge);
      });

      // 连线删除
      graph.on('edge:removed', ({ edge }) => {
        onEdgeRemove?.(edge);
      });

      // 节点删除
      graph.on('node:removed', ({ node }) => {
        onNodeRemove?.(node.data);
      });
    }
  }, []);

  // 节点和连线初始化
  useEffect(() => {
    if (graphRef.current && nodes) {
      const currentNodeIds = graphRef.current?.getNodes()?.map((item: any) => item.id) || [];
      const currentEdgeIds = graphRef.current?.getEdges()?.map((item: any) => item.source.cell + '-' + item.target.cell) || [];
      const removeNodeIds = currentNodeIds.filter((item: any) => !nodes.some((node: any) => node.id === item));

      if (removeNodeIds.length > 0) {
        graphRef.current?.removeCells(removeNodeIds);
      }

      if (nodes.length > 0) {
        nodes.forEach((item: any) => {
          // 创建节点
          if (!currentNodeIds.includes(item.id)) {
            createNode(graphRef.current!, { id: item.id, type: item.type, position: item.position }, item);
          } else {
            const node = graphRef.current?.getCellById(item.id);
            if (node) {
              node.replaceData({ ...node.data, ...item });
            }
          }
          // 创建边
          if (item.input_nodes?.length > 0) {
            item.input_nodes.forEach((inputNodeId: any) => {
              // 检查是否已存在边
              const existingEdge = currentEdgeIds.includes(inputNodeId + '-' + item.id);
              if (!existingEdge) {
                createEdge(graphRef.current!, { id: `edge_${nanoId()}`, sourceId: inputNodeId, targetId: item.id });
              }
            });
          }
        });
      }
    }
  }, [nodes]);

  return (
    <div className={styles['graph-box']}>
      <div ref={containerRef}></div>
    </div>
  );
});

export default GraphBox;
