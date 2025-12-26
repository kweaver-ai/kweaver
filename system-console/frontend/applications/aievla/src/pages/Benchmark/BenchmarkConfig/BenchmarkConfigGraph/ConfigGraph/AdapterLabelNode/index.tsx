import { useState } from 'react';
import classNames from 'classnames';
import { Edge, Graph } from '@antv/x6';

import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import IconFont from '@/components/IconFont';

import { highlightFullPathByNode } from '../assistant';

import badgeImg from '@/assets/images/badge.svg';
import badgeActiveImg from '@/assets/images/badgeActive.svg';
import './style.less';

type AdapterLabelNodeProps = {
  edgeId: string;
  onClick?: (edge: Edge) => void;
  graph?: Graph;
};
const AdapterLabelNode = (props: AdapterLabelNodeProps) => {
  const { graph, edgeId, onClick } = props;
  const [edgeData, setEdgeData] = useState<any>({});

  useDeepCompareEffect(() => {
    let edge: Edge;
    if (graph) {
      edge = graph.getCellById(edgeId) as Edge;
      getEdgeData(edge);
      edge?.on('change:data', () => getEdgeData(edge));
    }
    return () => {
      edge?.off('change:data');
    };
  }, [graph]);

  const getEdgeData = (edge: Edge) => {
    const edgeData = edge.getData();
    setEdgeData(edgeData);
  };
  const prefixCls = 'AdapterLabelNode';
  return (
    <div
      className={classNames(prefixCls, 'ad-center ad-pointer', {
        [`${prefixCls}-highlight`]: edgeData?.highlight,
      })}
      onClick={() => {
        const edge = graph!.getCellById(edgeId) as Edge;
        const sourceNode = edge.getSourceNode()!;
        highlightFullPathByNode(sourceNode, graph!);
        onClick?.(edge);
      }}
    >
      <IconFont type='icon-adapter' style={{ fontSize: 16 }} />
      <span className='ad-ml-2'>Adapter</span>
      <img src={edgeData.adapterList?.length > 0 ? badgeActiveImg : badgeImg} className={`${prefixCls}-sign`} />
    </div>
  );
};

export default AdapterLabelNode;
