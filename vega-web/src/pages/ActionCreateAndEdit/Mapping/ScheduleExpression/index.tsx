/** 执行频率 */
import { useState } from 'react';
import intl from 'react-intl-universal';
import { QuestionCircleFilled } from '@ant-design/icons';
import { Form, Radio, Tooltip, Row, Col } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import ARInputNumberUnit from '@/components/ARInputNumberUnit';
import { CronSelect } from '@/components/CronSelect';
import HOOKS from '@/hooks';
import styles from './index.module.less';

export enum ScheduleType {
  FIX_RATE = 'FIX_RATE',
  CRON = 'CRON',
}

const ScheduleExpression = ({ scheduleType }: any): JSX.Element => {
  const { SCHEDULE_TYPE_OPTIONS } = HOOKS.useConstants();
  const [type, setType] = useState(scheduleType || ScheduleType.FIX_RATE);

  const renderTabs = (item: any) => {
    return (
      <Col span={7}>
        <Form.Item name="schedule.type" style={{ marginBottom: 12 }} initialValue={item.value}>
          <Radio.Group value={item.value} onChange={item.onChange}>
            {item.options.map((opt: any) => {
              const tips: string[] = opt.tip.split('<br/>');
              return (
                <Radio.Button key={opt.value} value={opt.value} style={{ minWidth: 116, cursor: 'pointer' }}>
                  <span className="g-flex">
                    {opt.label}
                    <Tooltip
                      title={
                        <>
                          {tips.map((tip) => (
                            <div key={tip}>{tip}</div>
                          ))}
                        </>
                      }
                    >
                      <QuestionCircleFilled style={{ fontSize: 12 }} className="g-c-watermark g-ml-1" />
                    </Tooltip>
                  </span>
                </Radio.Button>
              );
            })}
          </Radio.Group>
        </Form.Item>
      </Col>
    );
  };

  const config = {
    value: type,
    onChange: (e: RadioChangeEvent): void => setType(e.target.value),
    options: SCHEDULE_TYPE_OPTIONS,
  };

  return (
    <Row>
      {renderTabs(config)}

      <Col span={7}>
        {type === ScheduleType.FIX_RATE && (
          <Form.Item name="schedule.FIX_RATE.expression" preserve={true} className={styles['expression-wrapper']} wrapperCol={{ span: 6 }}>
            <ARInputNumberUnit textBefore={intl.get('Global.every')} min={1} placeholder={intl.get('Global.placeholder')} style={{ minWidth: 120 }} />
          </Form.Item>
        )}
        {type === ScheduleType.CRON && (
          <Form.Item name="schedule.CRON.expression" preserve={true} className={styles['expression-wrapper']} wrapperCol={{ span: 6 }}>
            <CronSelect inputProps={{ style: { width: 300 } }} />
          </Form.Item>
        )}
      </Col>
    </Row>
  );
};

export default ScheduleExpression;
