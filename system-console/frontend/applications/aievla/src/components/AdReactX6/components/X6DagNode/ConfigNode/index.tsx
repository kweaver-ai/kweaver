import React from 'react';
import './style.less';
import { Graph, Node } from '@antv/x6';
import IconFont from '@/components/IconFont';
import ConfigNodeForm from './ConfigNodeForm';

const ConfigNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeData = node?.getData();
  return (
    <>
      <div className='ad-x6-dag-node-right-port ad-w-100 ad-align-center ConfigNode' style={{ height: 48 }}>
        <IconFont border type={nodeData.icon} style={{ width: 24, height: 24, fontSize: 14, borderRadius: 6 }} />
        <span className='ad-ml-2 ad-flex-item-full-width ad-ellipsis' title={nodeData.name}>
          {nodeData.name}
        </span>
      </div>
      <ConfigNodeForm visible={!!nodeData.formVisible} node={node} graph={nodeData.graph as Graph} />
    </>
  );
};

export default ConfigNode;
