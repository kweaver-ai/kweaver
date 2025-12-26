import BenchmarkConfigGraph from './BenchmarkConfigGraph';
import ConfigGraphContext from './ConfigGraphContext';

export default () => {
  return (
    <ConfigGraphContext>
      <BenchmarkConfigGraph />
    </ConfigGraphContext>
  );
};
