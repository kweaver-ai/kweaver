import { DatePicker } from 'antd';

import { Select } from '@/common';

import ChartLine from './ChartLine';

import styles from './index.module.less';

const UsageStatistics = () => {
  return (
    <div className={styles['page-model-management-statistic-usage']}>
      <div className='g-flex-align-center'>
        <Select.LabelSelect
          key='model_type'
          label='类型'
          defaultValue='agent'
          style={{ width: 120 }}
          options={[
            { value: 'agent', label: 'data agent' },
            { value: 'operator-platform', label: '算子平台' },
            { value: 'prompt', label: '提示词' },
            { value: 'model-management', label: '模型工厂' },
          ]}
        />
        <div className='g-ml-4 g-flex-align-center'>
          <span className='g-mr-2'>时间范围</span>
          <DatePicker.RangePicker showTime />
        </div>
      </div>
      <div className='g-mt-5 g-border g-border-radius' style={{ padding: '20px 24px' }}>
        <div className='g-flex-space-between'>
          <div>
            <div>Tokens 消耗</div>
            <div className={styles['statistic-number']}>18.37</div>
          </div>
          <div>
            <div>Input Tokens 消耗</div>
            <div className={styles['statistic-number']}>18.37</div>
          </div>
          <div>
            <div>Output Tokens 消耗</div>
            <div className={styles['statistic-number']}>18.37</div>
          </div>
          <div>
            <div>单位</div>
            <div className={styles['switch-units']}>18.37</div>
          </div>
        </div>
        <div className='g-mt-5 g-mb-5 g-border-t' />
        <div style={{ width: 'calc(100% + 6px)', height: 300, borderRadius: 8 }}>
          <ChartLine />
        </div>
      </div>
    </div>
  );
};

export default UsageStatistics;
