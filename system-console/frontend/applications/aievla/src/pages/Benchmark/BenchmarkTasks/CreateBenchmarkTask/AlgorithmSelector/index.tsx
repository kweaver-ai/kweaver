import ExternalAlg from './ExternalAlg';
import LargeModel from './LargeModel';
import Agent from './Agent';

import { MODEL_TYPE } from '@/pages/Benchmark/BenchmarkTasks/enums';

const AlgorithmSelector = (props: any) => {
  const { algType, saveAlgorithm, saveCustomData, ...others } = props;

  return (
    <div className='ad-w-100'>
      {/* Agent */}
      {algType === MODEL_TYPE.AGENT && <Agent {...others} />}
      {/* 大模型 */}
      {algType === MODEL_TYPE.LLM && <LargeModel {...others} />}
      {/* 外接模型 */}
      {algType === MODEL_TYPE.EXTERNAL && <ExternalAlg saveAlgorithm={saveAlgorithm} {...others} />}
    </div>
  );
};

export default AlgorithmSelector;
