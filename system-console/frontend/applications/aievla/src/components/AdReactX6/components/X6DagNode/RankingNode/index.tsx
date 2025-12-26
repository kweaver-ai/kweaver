import React from 'react';
import './style.less';
import { Graph, Node } from '@antv/x6';
import RankingNodeDrawer from './RankingNodeDrawer';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import _ from 'lodash';

const RankingNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeData = node?.getData();
  return (
    <>
      <div className='ad-w-100 ad-align-center RankingNode ad-x6-dag-node-left-port' style={{ height: 48 }}>
        <IconFont border type='icon-bangdan-F759AB' style={{ width: 24, height: 24, fontSize: 14, borderRadius: 6 }} />
        <span className='ad-ml-2 ad-flex-item-full-width ad-ellipsis' title={'average'}>
          {intl.get('benchmark.config.leaderboard')}
        </span>
        {!_.isEmpty(nodeData.error) && (
          <Tooltip placement='top' title={intl.get('benchmark.config.outMetricRequireTip')}>
            <IconFont style={{ fontSize: 18 }} type='graph-warning1' className='ad-c-error ad-ml-2' />
          </Tooltip>
        )}
      </div>
      <RankingNodeDrawer open={!!nodeData.formVisible} node={node} graph={nodeData.graph as Graph} />
    </>
  );
};

export default RankingNode;
