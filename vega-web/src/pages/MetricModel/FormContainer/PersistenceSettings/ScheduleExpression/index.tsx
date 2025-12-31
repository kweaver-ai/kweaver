/** 执行频率 */
import { useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Radio } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import ARInputNumberUnit from '@/components/ARInputNumberUnit';
import { CronSelect } from '@/components/CronSelect';
import { SCHEDULE_TYPE } from '@/hooks/useConstants';
import styles from './index.module.less';

const ScheduleExpression = ({ scheduleType }: any): JSX.Element => {
  const [type, setType] = useState(scheduleType || SCHEDULE_TYPE.FIX_RATE);

  const renderTabs = (options: any): JSX.Element[] => {
    return options.map((item: any) => {
      return (
        item.title && (
          <Form.Item key={item.title} name="expressionType" label={item.title} style={{ marginBottom: 12 }} initialValue={item.value} required>
            <Radio.Group key={item.title} value={item.value} onChange={item.onChange}>
              {item.options.map((opt: any) => (
                <Radio.Button key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
        )
      );
    });
  };

  const config = [
    {
      title: intl.get('MetricModel.persistenceTaskSchedule'),
      value: type,
      onChange: (e: RadioChangeEvent): void => setType(e.target.value),
      options: [
        { label: intl.get('Global.fixRate'), value: SCHEDULE_TYPE.FIX_RATE },
        { label: intl.get('MetricModel.cronExpress'), value: SCHEDULE_TYPE.CRON },
      ],
    },
  ];

  return (
    <div className={styles['schedule-wrapper']}>
      {renderTabs(config)}
      {type === SCHEDULE_TYPE.FIX_RATE && (
        <Form.Item
          name="fixExpression"
          preserve={true}
          className={styles['expression-wrapper']}
          extra={
            <span className="g-c-text-sub" style={{ fontSize: 12 }}>
              {intl.get('Global.fixRateTip')}
            </span>
          }
          rules={[{ required: type === SCHEDULE_TYPE.FIX_RATE, message: intl.get('MetricModel.scheduleIsEmpty') }]}
        >
          <ARInputNumberUnit textBefore={intl.get('Global.every')} min={1} />
        </Form.Item>
      )}
      {type === SCHEDULE_TYPE.CRON && (
        <Form.Item
          name="cronExpression"
          preserve={true}
          className={styles['expression-wrapper']}
          extra={<div className="g-c-text-sub" style={{ fontSize: 12 }} dangerouslySetInnerHTML={{ __html: intl.get('Global.cronTip') }}></div>}
          rules={[{ required: type === SCHEDULE_TYPE.CRON, message: intl.get('MetricModel.scheduleIsEmpty') }]}
        >
          <CronSelect inputProps={{ style: { width: 300 } }} />
        </Form.Item>
      )}
    </div>
  );
};

export default ScheduleExpression;
