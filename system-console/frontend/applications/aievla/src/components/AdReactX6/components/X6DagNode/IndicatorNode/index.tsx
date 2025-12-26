import intl from 'react-intl-universal';
import { Graph, Node } from '@antv/x6';
import { Tooltip } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import IndicatorForm from './IndicatorForm';

import './style.less';

const IndicatorNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeData = node?.getData();
  const metricData = nodeData.metric;
  const readOnly = nodeData.readOnly;
  const getIndicatorName = (id: string) => {
    return metricData.allIndicatorData[id] ?? id;
  };

  const openForm = () => {
    node.setData({
      metric: { ...metricData, formVisible: true },
      dataset: { ...nodeData.dataset, formVisible: false },
    });
  };

  const removeIndicator = (id: string) => {
    const ids = metricData.metricIdList as string[];
    node.updateData({
      metric: { ...metricData, metricIdList: ids.filter(item => item !== id) },
    });
  };

  return (
    <>
      <div onClick={openForm} className='ad-x6-dag-indicator-node ad-w-100'>
        <span className='ad-align-center'>
          <IconFont border type='icon-color-zbk-13C2C2' style={{ width: 24, height: 24, fontSize: 14, borderRadius: 6 }} />
          <span className='ad-ml-2 ad-flex-item-full-width' title={intl.get('benchmark.config.indicator')}>
            {intl.get('benchmark.config.indicator')}
          </span>
          {metricData.error[node.id] && (
            <Tooltip placement='top' title={metricData.error[node.id]}>
              <IconFont style={{ fontSize: 18 }} type='graph-warning1' className='ad-c-error ad-ml-1' />
            </Tooltip>
          )}
        </span>
        {metricData.metricIdList.map((id: string) => (
          <div key={id} className='ad-w-100 ad-x6-dag-indicator-item ad-align-center ad-mt-2 ad-pointer'>
            <div className='ad-w-100 ad-ellipsis ad-flex-item-full-width'>{getIndicatorName(id)}</div>
            {!readOnly && (
              <Format.Button
                onClick={e => {
                  e.stopPropagation();
                  removeIndicator(id);
                }}
                type='icon'
                size='small'
                className='ad-x6-dag-indicator-item-delete ad-c-watermark'
                style={{ fontSize: 14 }}
              >
                <IconFont type='icon-shibai' />
              </Format.Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <div className='ad-x6-dag-indicator-item ad-center ad-mt-2 ad-c-text-lower ad-pointer'>
            <IconFont className='ad-c-watermark' type='icon-mouse_add' style={{ fontSize: 12 }} />
            <span style={{ fontSize: 12 }} className='ad-ml-1'>
              {intl.get('benchmark.config.addMetric')}
            </span>
          </div>
        )}
      </div>
      <IndicatorForm visible={!!metricData.formVisible} node={node} graph={nodeData.graph as Graph} />
    </>
  );
};

export default IndicatorNode;
