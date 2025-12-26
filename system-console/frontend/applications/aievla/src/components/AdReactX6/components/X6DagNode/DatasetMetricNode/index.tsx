import { Graph, Node } from '@antv/x6';
import './style.less';
import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import intl from 'react-intl-universal';
import { removeBenchmarkChildNode } from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigGraph/ConfigGraph/assistant';
import { Divider } from 'antd';
import DatasetNode from '../DatasetNode';
import MetricNode from '../IndicatorNode';

const DatasetMetricNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeData = node?.getData();
  const readOnly = nodeData.readOnly;
  const deleteNode = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('global.deleteTitle'),
      content: intl.get('benchmark.config.deleteDatasetNodeTip'),
    });
    if (isOk) {
      const graph = nodeData.graph as Graph;
      removeBenchmarkChildNode(node, graph);
      graph.removeNode(node);
    }
  };
  return (
    <div className='DatasetMetricNode ad-w-100 ad-x6-dag-node-left-port ad-x6-dag-node-right-port'>
      {!readOnly && (
        <div className='DatasetMetricNode-delete ad-pb-2'>
          <IconFont
            onClick={e => {
              e.stopPropagation();
              deleteNode();
            }}
            type='icon-lajitong'
          />
        </div>
      )}
      <DatasetNode {...props} />
      <Divider dashed style={{ margin: '12px 0' }}>
        <span className='ad-font-12 ad-c-text-lower'>{intl.get('benchmark.config.relationship')}</span>
      </Divider>
      <MetricNode {...props} />
    </div>
  );
};

export default DatasetMetricNode;
