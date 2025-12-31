import React, { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Graph } from '@antv/g6';
import { Empty } from 'antd';
import edgeApi from '@/services/edge';
import KnowledgeNetworkType from '@/services/Knowledge-network/type';
import objectApi from '@/services/object';
import OntologyObjectType from '@/services/object/type';
import '@/assets/iconfont/dip/iconfont.css';
import fonts from '@/assets/iconfont/dip/iconfont.json';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import styles from './index.module.less';

interface GraphNode {
  id: string;
  label: string;
  iconName: string;
  color: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

interface TProps {
  detail?: KnowledgeNetworkType.Detail;
  isPermission?: boolean;
}

const icons = fonts.glyphs.map((icon) => {
  return {
    name: fonts.css_prefix_text + icon.font_class,
    unicode: String.fromCodePoint(icon.unicode_decimal), // `\\u${icon.unicode}`,
  };
});

const getIcon = (type: string) => {
  const matchIcon = icons.find((icon) => {
    return icon.name === type;
  }) || { unicode: '', name: 'default' };
  console.log('matchIcon', matchIcon);
  return matchIcon.unicode;
};

const KnowledgeNetworkPreview: React.FC<TProps> = (props) => {
  const { detail } = props;
  const graphRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const knId = detail?.id || localStorage.getItem('KnowledgeNetwork.id')!;

  // 国际化文本
  const i18n = useMemo(
    () => ({
      unknown: intl.get('Global.unknown'),
      loading: intl.get('Global.loading'),
      noData: intl.get('Global.noData'),
      fetchNodesFailed: intl.get('KnowledgeNetwork.fetchNodesFailed'),
      fetchEdgesFailed: intl.get('KnowledgeNetwork.fetchEdgesFailed'),
      updateGraphFailed: intl.get('KnowledgeNetwork.updateGraphFailed'),
    }),
    []
  );

  // 获取节点数据
  const fetchNodes = async () => {
    if (!knId) return;

    try {
      const response = await objectApi.objectGet(knId, {
        limit: -1, // 增加节点数量上限
      });

      // 添加空值检查和默认值
      const nodeData: any[] =
        response?.entries?.map((item: OntologyObjectType.Detail) => ({
          id: item.id,
          type: 'circle', // 指定节点类型
          label: item.name || i18n.unknown,
          data: {
            label: item.name,
            color: item.color, // 保存原始颜色用于hover状态
            icon: item.icon,
          },
          style: {
            fill: item.color || '#f0f0f0',
            stroke: '#e8e8e8',
            lineWidth: 2,
            size: 32,
            labelText: item.name || i18n.unknown,
          },
        })) || [];

      setNodes(nodeData);
    } catch (error) {
      console.error(`${i18n.fetchNodesFailed}:`, error);
      // 在实际应用中可以添加用户友好的错误提示
      setNodes([]);
    }
  };

  // 获取边数据
  const fetchEdges = async () => {
    if (!knId) return;

    try {
      const response = await edgeApi.edgeGet(knId, {
        limit: -1, // 增加边数量上限
      });

      // 假设接口返回的数据格式需要转换，并进行空值检查
      const edgeData: GraphEdge[] =
        response?.entries?.map((item: any, index: number) => {
          const label = item.name?.length > 10 ? item.name?.substring(0, 10) + '...' : item.name;
          return {
            id: `edge-${index}`,
            source: item.source_object_type_id || item.source_object_type?.id,
            target: item.target_object_type_id || item.target_object_type?.id,
            data: {
              label: item.name,
            },
            style: {
              lineWidth: 1,
              stroke: '#e8e8e8',
              labelText: label,
              labelTextBaseline: 'bottom',
            },
          };
        }) || [];

      // 过滤掉无效的边（source或target不存在）
      const validEdges = edgeData.filter((edge) => edge.source && edge.target);

      setEdges(validEdges);
    } catch (error) {
      console.error(`${i18n.fetchEdgesFailed}:`, error);
      // 在实际应用中可以添加用户友好的错误提示
      setEdges([]);
    }
  };

  // 初始化图谱
  const initGraph = () => {
    if (!graphRef.current) return;

    const width = graphRef.current.clientWidth;
    const height = graphRef.current.clientHeight;

    // 创建G6实例 - 使用G6 5.x配置
    const graph = new Graph({
      container: graphRef.current,
      width,
      height,
      transforms: [
        {
          type: 'process-parallel-edges',
          mode: 'bundle', // 或 'merge'
          distance: 20, // 控制平行边之间的间距
        },
      ],
      // 交互行为配置
      behaviors: [
        {
          type: 'drag-element',
        },
        {
          type: 'drag-canvas',
        },
        {
          type: 'zoom-canvas',
        },
        {
          type: 'drag-node',
        },
      ],
      plugins: [
        {
          type: 'tooltip',
          getContent: (_e: unknown, item: any) => {
            return item[0].data?.label || i18n.unknown;
          },
        },
        {
          type: 'toolbar',
          position: 'right-bottom',
          getItems: () => [
            { id: 'zoom-in', value: 'zoom-in' },
            { id: 'zoom-out', value: 'zoom-out' },
            { id: 'auto-fit', value: 'auto-fit' },
          ],
          onClick: (value: string) => {
            // 处理按钮点击事件
            if (value === 'zoom-in') {
              graph.zoomBy(1.1);
            } else if (value === 'zoom-out') {
              graph.zoomBy(0.9);
            } else if (value === 'auto-fit') {
              graph.fitView();
            }
          },
          style: {
            padding: '6px',
            margin: '12px',
            borderRadius: 5,
            backgroundColor: '#fff',
          },
        },
      ],
      // 节点默认配置
      node: {
        type: 'circle',
        style: {
          stroke: '#fff',
          lineWidth: 2,
          labelFill: 'rgba(0, 0, 0, 0.8)',
          labelFontSize: 8,
          size: 32,
          // labelText: (model: any) => model.id || '未知',
          iconFontFamily: 'iconfont', // 对应 iconfont.css 中的 `font-family` 属性值
          iconFontSize: 14,
          iconText: (datum) => getIcon((datum.data?.icon as string) || ''), // 对应 iconfont.css 中的 `content` 属性值，注意加 `u`
          iconFill: '#fff',
        },
      },
      // 边默认配置
      edge: {
        // type: 'line',
        style: {
          endArrow: true,
          labelFill: 'rgba(0, 0, 0, 0.8)',
          labelFontSize: 8,
        },
      },
      // 布局配置
      layout: {
        type: 'force',
        preventOverlap: true,
        // distance: 1000,
        linkDistance: 220,
        // strength: 0.1,
        // edgeStrength: 0.2,
        // alphaDecay: 0.02,
        // velocityDecay: 0.4,
        // gravity: 0.1,
        // collisionRadius: 100,
        // damping: 0.9,
      },
      // G6 5.x 新配置
      autoFit: {
        type: 'view', // 替代fitView
      },
      zoomRange: [0.1, 5], // 替代minZoom/maxZoom
      animation: false, // 替代animate
      padding: [20, 20, 20, 20], // 替代fitViewPadding
    });

    graphInstanceRef.current = graph;
  };

  // 更新图谱数据
  const updateGraph = () => {
    if (!graphInstanceRef.current) return;

    try {
      // 处理节点数据，确保包含必要的属性，特别是图标
      // G6 5.x 格式：样式属性在style，数据属性在data
      const processedNodes = nodes;

      // 处理边数据，添加必要的样式和标签
      const processedEdges = edges;

      // 确保数据格式正确
      const data = {
        nodes: processedNodes,
        edges: processedEdges,
      };

      // 清理现有图形
      graphInstanceRef.current.clear();

      // 设置新数据（G6 5.x使用setData方法）
      graphInstanceRef.current.setData(data as any);
      graphInstanceRef.current.render();
    } catch (error) {
      console.error(`${i18n.updateGraphFailed}:`, error);
    }
  };

  // 响应窗口大小变化
  const handleResize = () => {
    if (!graphInstanceRef.current || !graphRef.current) return;

    const width = graphRef.current.clientWidth;
    const height = graphRef.current.clientHeight;

    // G6 5.x使用setSize替代changeSize
    graphInstanceRef.current.setSize(width, height);
  };

  useEffect(() => {
    initGraph();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphInstanceRef.current) {
        // G6 5.x中destroy方法仍然存在
        graphInstanceRef.current.destroy();
        graphInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchNodes(), fetchEdges()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [knId]);

  useEffect(() => {
    if (nodes.length > 0) {
      updateGraph();
    }
  }, [JSON.stringify(nodes), JSON.stringify(edges)]);

  return (
    <div className={styles.box}>
      <div
        ref={graphRef}
        className="graph-container"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {loading && (
          <div className="loading-overlay">
            <span>{i18n.loading}</span>
          </div>
        )}
        {!loading && nodes.length === 0 && edges.length === 0 && (
          <div className={styles.emptyState}>
            <Empty image={noSearchResultImage} description={i18n.noData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeNetworkPreview;
