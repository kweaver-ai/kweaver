import { useRef } from 'react';
import classNames from 'classnames';
import { Graph, Node } from '@antv/x6';

import IconFont from '@/components/IconFont';
import AdResizeObserver from '@/components/AdResizeObserver/AdResizeObserver';

import { X6DagNodeType } from './enum';
import TaskNode from './TaskNode';
import ConfigNode from './ConfigNode';
import RankingNode from './RankingNode';
import DatasetMetricNode from './DatasetMetricNode';

import './style.less';

const X6DagNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeConfig = node?.getData();
  const readOnly = nodeConfig.readOnly;
  const highlight = !!nodeConfig.highlight;
  const prefixCls = 'ad-x6-dag-node';
  const addDomRef = useRef<HTMLDivElement | null>(null);
  const renderContent = () => {
    if (nodeConfig.type === X6DagNodeType.configNode) {
      return <ConfigNode {...props} />;
    }
    if (nodeConfig.type === X6DagNodeType.taskNode) {
      return <TaskNode {...props} />;
    }
    if (nodeConfig.type === X6DagNodeType.rankingNode) {
      return <RankingNode {...props} />;
    }
    if (nodeConfig.type === X6DagNodeType.datasetMetricNode) {
      return <DatasetMetricNode {...props} />;
    }
  };

  const addClick = () => {
    nodeConfig.onAdd?.(node);
  };

  return (
    <AdResizeObserver
      onResize={({ width, height }) => {
        const graph = nodeConfig.graph as Graph;
        const zoom = graph.zoom();
        let widthNum = width;
        let heightNum = height;
        if (zoom !== 1) {
          widthNum = Math.floor(width / zoom);
          heightNum = Math.floor(height / zoom);
        }
        node.size({ width: widthNum, height: heightNum });
      }}
    >
      <div
        className={classNames(prefixCls, {
          [`${prefixCls}-highlight`]: highlight,
        })}
      >
        <div>{renderContent()}</div>
        {[X6DagNodeType.configNode, X6DagNodeType.taskNode].includes(nodeConfig.type) && !readOnly && (
          <div className={`${prefixCls}-add`} ref={addDomRef}>
            <IconFont onClick={addClick} className='ad-c-primary ad-pointer' style={{ fontSize: 16 }} type='icon-mouse_add' />
          </div>
        )}
      </div>
    </AdResizeObserver>
  );
};

export default X6DagNode;
