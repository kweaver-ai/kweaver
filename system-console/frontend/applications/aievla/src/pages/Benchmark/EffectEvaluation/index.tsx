import { useMemo, useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';
import { Tabs } from 'antd';

import Format from '@/components/Format';
import { getParam } from '@/utils/handleFunction';

import BenchmarkConfig from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigList'; // 配置列表
import BenchMarkTask from '@/pages/Benchmark/BenchmarkTasks';

const EffectEvaluation = () => {
  const history = useHistory();
  const location = useLocation();
  const { active = '1' } = getParam(['active']);
  const [activeKey, setActiveKey] = useState(active || '1');

  useEffect(() => {
    setActiveKey(active || '1');
  }, [active]);

  const items = useMemo(
    () => [
      { label: intl.get('benchmark.menu.evaluationRules'), key: '1' },
      { label: intl.get('benchmark.menu.performanceEvaluationTask'), key: '2' },
    ],
    [],
  );

  return (
    <div style={{ height: '100%', padding: '16px 24px' }}>
      <Format.Title style={{ marginBottom: 10 }}>{intl.get('benchmark.menu.effectEvaluation')}</Format.Title>
      <Tabs size='small' items={items} activeKey={activeKey} onChange={act => history.replace(`${location.pathname}?active=${act}`)} />

      {activeKey === '1' && <BenchmarkConfig />}
      {activeKey === '2' && <BenchMarkTask />}
    </div>
  );
};

export default EffectEvaluation;
