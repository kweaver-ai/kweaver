import { CSSProperties, forwardRef, PropsWithChildren, useEffect, useImperativeHandle, useRef } from 'react';
import classnames from 'classnames';
import ReactDOM from 'react-dom/client';
import { Selection } from '@antv/x6-plugin-selection';
import { Cell, Edge, EdgeView, Graph as GraphX6, Markup, Node, NodeView } from '@antv/x6';
import type { Graph as IGraph } from '@antv/x6';

import HOOKS from '@/hooks';
import { stringSeparator1, stringSeparator2 } from '@/enums';

import { AdX6Edge, AdX6RelationEndNode, AdX6RelationStartNode } from '@/components/AdReactX6/utils/constants';

import X6LabelSelect from './components/X6LabelSelect/X6LabelSelect';
import X6StartPointPort from './components/X6StartPointPort/X6StartPointPort';

import registerX6Edges from './utils/registerX6Edge';
import registerX6Node from './utils/registerX6Node';
import registerX6Connector from './utils/registerX6Connector';
import registerX6PortLayout from './utils/registerX6PortLayout';
import AdX6ToolBar from './ToolBar/AdX6ToolBar/AdX6ToolBar';

import background_point from '@/assets/images/background_point.png';
import './style.less';

const { useDeepCompareEffect } = HOOKS;

const X6Types = ['erGraph', 'dagGraph'] as const;

export type X6Type = (typeof X6Types)[number];

interface AdReactX6Props {
  type?: X6Type; // X6图的类型
  className?: string;
  style?: CSSProperties;
  data?: Array<Node.Metadata | Edge.Metadata>; // X6数据源
  toolBar?: boolean; // 是否显示工具条
  readOnly?: boolean; // 只读模式
  background?: boolean; // 是否显示背景
  selectionConfig?: Selection.Options; // 框选配置

  // 边的事件
  onEdgeClick?: (graphX6: IGraph, params: EdgeView.EventArgs['edge:click']) => void; // 边的点击事件
  onEdgeDeleteBtnClick?: (graphX6: IGraph, edge: Edge<Edge.Properties>) => void; // 边上的删除按钮的点击事件
  onEdgeSelectedChange?: (graphX6: IGraph, selectedEdges: Edge[]) => void; // 边选中的值变化事件
  onEdgeConnected?: (graphX6: IGraph, edge: Edge<Edge.Properties>, edges: Edge<Edge.Properties>[]) => void; // 边创建完成的事件
  onEdgeRemoved?: (graphX6: IGraph, edge: Edge<Edge.Properties>) => void; // 边被移除事件
  onViewMounted?: (graphX6: IGraph) => void; // 节点挂载到画布中
  onEdgeLabelSelectChange?: (value: string, edge?: Edge<Edge.Properties>, graph?: IGraph) => void; // 边上面的下拉选择框的值变化事件
  // 节点事件
  onNodeClick?: (graphX6: IGraph, params: NodeView.EventArgs['node:click']) => void; // 节点的点击事件
  onNodeMouseUp?: (graphX6: IGraph, params: NodeView.EventArgs['node:mouseup']) => void; // 节点鼠标抬起事件
  onNodeSelected?: (selectedNode: Node) => void; // 节点的选中事件
  onNodeCancelSelected?: (unSelectedNode: Node) => void; // 节点的取消选中事件

  // 画布事件
  onBlankMouseUp?: (graphX6: IGraph) => void; // 画布鼠标抬起事件
  onBlankClick?: (graphX6: IGraph) => void; // 画布空白点击事件
  onRenderDone?: (graphX6: IGraph) => void; // 画布渲染完成事件

  onValidateMagnet?: (magnet: Element) => boolean;
  onValidateEdge?: (edge: Edge<Edge.Properties>) => boolean;
}

export interface X6RefProps {
  graphX6?: IGraph; // X6的实例
  getGraphInstance: () => IGraph; // 获取X6实例的函数
}

/**
 * antv x6 react 版本
 */
const AdReactX6 = forwardRef<X6RefProps, PropsWithChildren<AdReactX6Props>>((props, ref) => {
  const {
    className,
    style,
    // data = { nodes: [], edges: [] },
    data = [],
    type = 'erGraph',
    toolBar = true,
    readOnly = false,
    background = false,
    selectionConfig,
    onEdgeConnected,
    onEdgeSelectedChange,
    onEdgeRemoved,
    onViewMounted,
    onEdgeLabelSelectChange,
    onEdgeDeleteBtnClick,
    onNodeMouseUp,
    onBlankMouseUp,
    onValidateMagnet,
    onValidateEdge,
    onBlankClick,
    onRenderDone,
    onNodeClick,
    onNodeSelected,
    onNodeCancelSelected,
  } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphX6 = useRef<IGraph>(); // 储存x6的实例
  const x6GraphStateDataRef = useRef({
    selectedEdges: [] as Edge[], // 储存选中的边
  });

  useImperativeHandle(ref, () => ({
    graphX6: graphX6.current,
    getGraphInstance: () => graphX6.current!,
  }));

  useEffect(() => {
    mounted();
    return () => {
      unMount();
    };
  }, []);

  useDeepCompareEffect(() => {
    updateGraphX6Data();
  }, [data]);

  /**
   * 组件挂载
   */
  const mounted = () => {
    registerCustomElement();
    initX6Graph();
    handleBindEvents();
  };

  /**
   * 组件卸载
   */
  const unMount = () => {
    handleRemoveEvents();
    graphX6.current?.dispose();
  };

  /**
   * 绑定事件
   */
  const handleBindEvents = () => {
    graphX6.current?.on('edge:mouseenter', edgeMouseEnter);
    graphX6.current?.on('edge:mouseleave', edgeMouseLeave);
    graphX6.current?.on('edge:click', edgeClick);
    graphX6.current?.on('edge:connected', edgeConnected);
    graphX6.current?.on('edge:selected', edgeSelected);
    graphX6.current?.on('edge:unselected', edgeUnSelected);
    graphX6.current?.on('edge:removed', edgeRemoved);
    graphX6.current?.on('view:mounted', viewMounted);
    graphX6.current?.on('node:mouseup', nodeMouseUp);
    graphX6.current?.on('node:click', nodeClick);
    graphX6.current?.on('blank:mouseup', blankMouseUp);
    graphX6.current?.on('blank:click', blankClick);
    graphX6.current?.on('render:done', renderDone);
    graphX6.current?.on('node:selected', nodeSelected);
    graphX6.current?.on('node:unselected', nodeCancelSelected);
  };

  /**
   * 移除事件
   */
  const handleRemoveEvents = () => {
    graphX6.current?.off('edge:mouseenter', edgeMouseEnter);
    graphX6.current?.off('edge:mouseleave', edgeMouseLeave);
    graphX6.current?.off('edge:click', edgeClick);
    graphX6.current?.off('edge:connected', edgeConnected);
    graphX6.current?.off('edge:selected', edgeSelected);
    graphX6.current?.off('edge:unselected', edgeUnSelected);
    graphX6.current?.off('edge:removed', edgeRemoved);
    graphX6.current?.off('view:mounted', viewMounted);
    graphX6.current?.off('node:mouseup', nodeMouseUp);
    graphX6.current?.off('node:click', nodeClick);
    graphX6.current?.off('blank:mouseup', blankMouseUp);
    graphX6.current?.off('blank:click', blankClick);
    graphX6.current?.off('render:done', renderDone);
    graphX6.current?.off('node:selected', nodeSelected);
    graphX6.current?.off('node:unselected', nodeCancelSelected);
  };

  /** 画布节点选中事件 */
  const nodeSelected = ({ node }: Selection.EventArgs['node:selected']) => {
    onNodeSelected?.(node as Node);
  };

  /** 画布节点取消选中事件 */
  const nodeCancelSelected = ({ node }: Selection.EventArgs['node:unselected']) => {
    onNodeCancelSelected?.(node as Node);
  };

  /** 节点点击事件 */
  const nodeClick = (args: NodeView.EventArgs['node:click']) => {
    onNodeClick?.(graphX6.current!, args);
  };

  /**
   * 画布渲染完成事件
   */
  const renderDone = () => {
    onRenderDone?.(graphX6.current!);
  };

  /**
   * 画布空白点击事件
   */
  const blankClick = () => {
    onBlankClick?.(graphX6.current!);
  };

  /**
   * 画布空白区域的鼠标抬起事件
   */
  const blankMouseUp = () => {
    onBlankMouseUp?.(graphX6.current!);
  };

  /**
   * 节点鼠标抬起事件
   */
  const nodeMouseUp = (args: NodeView.EventArgs['node:mouseup']) => {
    onNodeMouseUp?.(graphX6.current!, args);
  };

  /**
   * 节点挂载到视图上
   */
  const viewMounted = () => {
    onViewMounted && onViewMounted(graphX6.current!);
  };

  /**
   * 边移除事件
   */
  const edgeRemoved = ({ edge, options }: any) => {
    onEdgeRemoved?.(graphX6.current!, edge);
  };

  const edgeMouseEnter = ({ edge }: EdgeView.EventArgs['edge:mouseenter']) => {
    const edgeData = edge.getData();
    if (edgeData?.deleteBtnVisible !== false && !readOnly) {
      // hover 边的时候添加 边的 删除按钮
      edge.addTools([
        {
          name: 'button-remove',
          args: {
            distance: -40,
            onClick({ cell }: any) {
              graphX6.current?.removeCell(cell);
              onEdgeDeleteBtnClick?.(graphX6.current!, cell);
            },
          },
        },
      ]);
    }

    // 高亮边的起始和终点节点
    const sourceNode = edge.getSourceCell();
    const sourceCellPortId = edge.getSourcePortId();
    const targetNode = edge.getTargetCell();
    const targetCellPortId = edge.getTargetPortId();
    sourceNode?.updateData({
      hoveField: sourceCellPortId?.includes(stringSeparator2) ? sourceCellPortId?.split(stringSeparator2)[1] : sourceCellPortId?.split(stringSeparator1)[1],
    });
    targetNode?.updateData({
      hoveField: targetCellPortId?.includes(stringSeparator2) ? targetCellPortId?.split(stringSeparator2)[1] : targetCellPortId?.split(stringSeparator1)[1],
    });
  };

  const edgeMouseLeave = ({ edge }: EdgeView.EventArgs['edge:mouseleave']) => {
    // 离开 边的时候移除 边的 删除按钮
    if (edge.hasTool('button-remove')) {
      edge.removeTool('button-remove');
    }

    // 取消高亮边的起始和终点节点
    const sourceNode = edge.getSourceCell();
    const targetNode = edge.getTargetCell();
    sourceNode?.updateData({ hoveField: '' });
    targetNode?.updateData({ hoveField: '' });
  };

  const edgeClick = ({}: EdgeView.EventArgs['edge:click']) => {};

  /**
   * 边连接完成事件
   * @param edge
   */
  const edgeConnected = (params: EdgeView.EventArgs['edge:connected']) => {
    const { edge } = params;
    const allEdges = graphX6.current?.getEdges() ?? [];
    onEdgeConnected?.(graphX6.current!, edge, allEdges);
  };

  /**
   * 边选中事件
   */
  const edgeSelected = ({ edge }: { edge: Edge }) => {
    // console.log(edge, '选中的边');
    x6GraphStateDataRef.current.selectedEdges.push(edge);
    edgeSelectedChange();
  };

  /**
   * 边取消选中事件
   */
  const edgeUnSelected = ({ edge }: { edge: Edge }) => {
    // console.log(edge, '取消选中的边');
    x6GraphStateDataRef.current.selectedEdges = x6GraphStateDataRef.current.selectedEdges.filter(item => item.id !== edge.id);
    edgeSelectedChange();
  };

  /**
   * 边选中的值变化事件
   */
  const edgeSelectedChange = () => {
    // console.log(x6GraphStateDataRef.current.selectedEdges, '选中的边值变化事件');
    onEdgeSelectedChange?.(graphX6.current!, x6GraphStateDataRef.current.selectedEdges);
  };

  /**
   * 注册自定义元素 （边 节点, 连接桩布局 等）
   */
  const registerCustomElement = () => {
    registerX6Connector(); // 注册自定义连接器（也可以称之为线的形状）
    registerX6Edges(); // 注册自定义边
    registerX6PortLayout(); // 注册自定义节点身上的连接桩位置
    registerX6Node(type); // 注册自定义节点身上的连接桩名称
  };

  /**
   * 实例化X6
   */
  const initX6Graph = () => {
    (window as any).__x6_instances__ = [];
    graphX6.current = new GraphX6({
      container: containerRef.current!,
      async: false, // 变为同步渲染，addNode 之后 立即 addEdges 边的位置不会出现偏移
      panning: true,
      mousewheel: true,
      highlighting: {
        magnetAdsorbed: { name: 'stroke', args: { padding: 4, attrs: { stroke: '#126EE3', strokeWidth: 1 } } },
      },
      autoResize: true,
      scaling: { min: 0.05, max: 4 },
      // 连线交互
      connecting: {
        snap: true,
        highlight: true,
        // 路由是对连接线的进一步处理
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        allowMulti: 'withPort',
        connectionPoint: 'anchor', // 保证边不会沿着连接桩的边界运动
        // 点击 magnet=true 的元素时触发, 决定会不会拉出一条线
        validateMagnet({ magnet }) {
          if (readOnly) return false;
          if (onValidateMagnet) return onValidateMagnet(magnet);
          return true;
        },
        // 校验边是否生效，不生效生成的边会消失
        validateEdge({ edge }) {
          if (onValidateEdge) return onValidateEdge(edge);
          return true;
        },
        createEdge({ sourceMagnet, sourceView, sourceCell }: any) {
          const sourceNodeConfigData = sourceCell.toJSON();
          if ([AdX6RelationStartNode, AdX6RelationEndNode].includes(sourceNodeConfigData.shape)) {
            return graphX6.current?.createEdge({
              attrs: { line: { stroke: '#126EE3', strokeDasharray: '5 5' } },
              zIndex: -1,
              label: { position: 0.5 },
              defaultLabel: {
                markup: Markup.getForeignObjectMarkup(),
                attrs: { fo: { width: 90, height: 24, x: -30, y: -15 } },
              },
            });
          }
          return graphX6.current?.createEdge({
            shape: AdX6Edge,
            attrs: { line: { stroke: '#126EE3', strokeDasharray: '5 5' } },
            zIndex: -1,
          });
        },
      },
      // 边的文本标签渲染完成之后的回调
      // @ts-ignore
      onEdgeLabelRendered: args => {
        const { selectors, edge } = args;
        const edgeJson = edge.toJSON();
        const content = selectors.foContent as HTMLDivElement;
        if (edgeJson.defaultLabel) {
          const labelType: string = edgeJson.defaultLabel.type ?? 'select';
          if (content) {
            if (labelType === 'select') {
              ReactDOM.createRoot(content).render(
                <X6LabelSelect disabled={readOnly} onChange={onEdgeLabelSelectChange} graphX6={graphX6.current} edge={edgeJson} />,
              );
            }
            if (labelType === 'custom') {
              const labelNode = edgeJson.defaultLabel.labelNode;
              ReactDOM.createRoot(content).render(labelNode);
            }
          }
        }
        if (edgeJson.labels && edgeJson.labels.length > 0) {
          edgeJson.labels.forEach((label: any) => {
            const labelType: string = label.type;
            if (labelType === 'custom') {
              const labelNode = label.labelNode;
              ReactDOM.createRoot(content).render(labelNode);
            }
          });
        }
      },
      // 连接桩渲染完成之后的回调
      onPortRendered: args => {
        const selectors = args.contentSelectors;
        const container = selectors && selectors.foContent;
        if (container) {
          ReactDOM.createRoot(container as Element).render(<X6StartPointPort />);
        }
      },
    });

    const selectConfigOptions = selectionConfig || {};
    graphX6.current?.use(new Selection({ enabled: true, ...selectConfigOptions }));
    (window as any).__x6_instances__.push(graphX6.current);
  };

  /**
   * 更新 图X6数据
   */
  const updateGraphX6Data = () => {
    const cells: Cell[] = [];
    data.forEach(item => {
      if (item.shape.startsWith('ad-x6-') && item.shape.endsWith('-node')) {
        cells.push(graphX6.current?.createNode(item) as Node);
      } else {
        cells.push(graphX6.current?.createEdge(item) as Edge);
      }
    });
    graphX6.current?.resetCells(cells);
  };
  const prefixCls = 'ad-x6';

  return (
    <div
      className={`${prefixCls}-wrapper ${prefixCls}-${type}`}
      style={{ width: '100%', height: '100%', backgroundImage: background ? `url(${background_point})` : 'unset' }}
    >
      <div ref={containerRef} className={classnames(prefixCls, className)} style={style} />
      {toolBar && graphX6.current && <AdX6ToolBar style={{ bottom: 89, right: 38 }} graph={graphX6.current} />}
    </div>
  );
});

export default AdReactX6;
