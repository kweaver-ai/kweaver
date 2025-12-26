import React from 'react';
import './style.less';
import { Graph, Node } from '@antv/x6';
import IconFont from '@/components/IconFont';
import TaskNodeForm from './TaskNodeForm';
import { tipModalFunc } from '@/components/TipModal';
import intl from 'react-intl-universal';
import { removeBenchmarkChildNode } from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigGraph/ConfigGraph/assistant';

const TaskNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeData = node?.getData();
  const readOnly = nodeData.readOnly;
  return (
    <>
      <div className='ad-x6-dag-node-left-port ad-x6-dag-node-right-port ad-x6-dag-task-node ad-w-100 ad-space-between' style={{ height: 48 }}>
        <span className='ad-flex-item-full-width ad-align-center'>
          <IconFont border type='icon-pzrw-7863FF' style={{ width: 24, height: 24, fontSize: 14, borderRadius: 6 }} />
          <span className='ad-ml-2 ad-flex-item-full-width ad-ellipsis' title={nodeData.name}>
            {nodeData.name}
          </span>
        </span>
        {!readOnly && (
          <div className='ad-x6-dag-task-node-delete ad-pb-2'>
            <IconFont
              onClick={async e => {
                e.stopPropagation();
                const graph = nodeData.graph as Graph;
                graph.cleanSelection();
                const isOk = await tipModalFunc({
                  title: intl.get('global.deleteTitle'),
                  content: intl.get('benchmark.config.deleteTaskNodeTip'),
                });
                if (isOk) {
                  graph.cleanSelection();
                  removeBenchmarkChildNode(node, graph);
                  graph.removeNode(node);
                }
              }}
              type='icon-lajitong'
            />
          </div>
        )}
      </div>
      <TaskNodeForm visible={!!nodeData.formVisible} node={node} graph={nodeData.graph as Graph} />
    </>
  );
};

export default TaskNode;
