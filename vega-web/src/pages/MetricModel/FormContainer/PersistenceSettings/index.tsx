import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Switch, Select, Modal } from 'antd';
import _ from 'lodash';
import { MEASURE_NAME_PREFIX, METRIC_ID_REGEX } from '@/hooks/useConstants';
import fullTip from '@/assets/images/fullTip.svg';
import { Input } from '@/web-library/common';
import { getDataPoint, getIntlValues, getNewStr, stepList } from '../utils';
import styles from './index.module.less';
import ScheduleExpression from './ScheduleExpression';
import SelectIndexView from './SelectIndexView';
import TimeWindows from './TimeWindows';
import TracingDuration from './TracingDuration';
import { queryType } from '../../type';

const PersistenceSettings = forwardRef((props: any, ref): JSX.Element => {
  const [form] = Form.useForm();
  const { values, basicInfoId, modelData, isTask, onChangeId } = props;
  const [openID, setOpenID] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({ form }));

  useEffect(() => {
    if (values) {
      form.setFieldsValue({ isPersistenceConfig: values.isPersistenceConfig });
      setTimeout(() => form.setFieldsValue(values));
    }
  }, [values]);

  const isPersistenceConfig = Form.useWatch('isPersistenceConfig', form);
  const formName = Form.useWatch('name', form);
  const formTimeWindows = Form.useWatch('timeWindows', form);
  const formSteps = Form.useWatch('steps', form);

  useEffect(() => {
    if (isPersistenceConfig && !basicInfoId) setOpenID(true);
  }, [isPersistenceConfig, basicInfoId]);

  const handleID = (): void => {
    form.validateFields(['customId']).then(async (values: any) => {
      if (values.customId) {
        onChangeId(values.customId);
        setOpenID(false);
      }
    });
  };

  if (modelData?.metricType === 'derived' || modelData?.metricType === 'composite') {
    return (
      <div className="g-h-100 g-flex-column-center">
        <img src={fullTip} style={{ width: 200 }} />
        <div className="g-mt-6">{intl.get('MetricModel.currentModelNoPersistenceConfig')}</div>
      </div>
    );
  }

  return (
    <div className={styles['persistence-settings-root']}>
      <Form
        form={form}
        className={styles.form}
        layout="vertical"
        initialValues={{
          isPersistenceConfig: false,
          cronExpression: '0 * * * * ?',
        }}
      >
        <Form.Item
          name="isPersistenceConfig"
          label={intl.get('MetricModel.persistenceConfig')}
          valuePropName="checked"
          extra={<span className={styles['form-item-tip']}>{intl.get('Global.persistenceConfigTip')}</span>}
        >
          <Switch />
        </Form.Item>
        {isPersistenceConfig && (
          <React.Fragment>
            {/* 持久化任务名称 */}
            <Form.Item
              name="name"
              label={intl.get('MetricModel.persistenceTaskName')}
              extra={
                <span className={styles['form-item-tip']}>
                  {basicInfoId
                    ? getIntlValues(intl.get('MetricModel.persistenceTaskNameTip'), {
                        name: formName,
                        measureName: MEASURE_NAME_PREFIX + basicInfoId,
                      })
                    : getIntlValues(intl.get('MetricModel.persistenceTaskNameCustomTip'), {
                        name: formName,
                      })}
                </span>
              }
              rules={[{ max: 40, message: intl.get('Global.nameCannotOverFourty') }]}
            >
              <Input autoComplete="off" aria-autocomplete="none" placeholder={intl.get('Global.pleaseInput')} />
            </Form.Item>
            {/* 备注 */}
            <Form.Item name="comment" label={intl.get('Global.comment')}>
              <Input.TextArea rows={4} maxLength={255} />
            </Form.Item>
            {/* 时间窗口 */}
            {modelData?.queryType !== queryType.Promql && (
              <Form.Item
                name="timeWindows"
                label={intl.get('MetricModel.persistenceTaskTimeWindows')}
                extra={
                  <span className={styles['form-item-tip']}>
                    {basicInfoId
                      ? getIntlValues(
                          intl.get('MetricModel.timeWindowsTip'),
                          { timeWindows: formTimeWindows, measureName: MEASURE_NAME_PREFIX + basicInfoId },
                          intl.get('MetricModel.or')
                        )
                      : getIntlValues(intl.get('MetricModel.timeWindowsCustomTip'), { timeWindows: formTimeWindows }, intl.get('MetricModel.or'))}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    validator: (_: any, value: any) => {
                      if (!value || (value && value.length === 0)) return Promise.reject(new Error(intl.get('MetricModel.windowsTypeCannotNull')));
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <TimeWindows />
              </Form.Item>
            )}
            {/* 持久化步长 */}
            <Form.Item
              name="steps"
              label={intl.get('MetricModel.persistenceTaskStep')}
              extra={
                <span className={styles['form-item-tip']}>
                  {basicInfoId
                    ? getIntlValues(
                        intl.get('MetricModel.persistenceTaskStepTip'),
                        { step: formSteps, measureName: MEASURE_NAME_PREFIX + basicInfoId },
                        intl.get('MetricModel.or')
                      )
                    : getIntlValues(intl.get('MetricModel.persistenceTaskStepCustomTip'), { step: formSteps }, intl.get('MetricModel.or'))}
                </span>
              }
              rules={[
                {
                  required: true,
                  validator: (_: any, value: any) => {
                    if (!value || value?.length === 0) return Promise.reject(new Error(intl.get('MetricModel.persistenceTaskStepCannotNull')));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Select mode="multiple" options={_.map(stepList, (item) => ({ value: item, label: getNewStr(item) }))} />
            </Form.Item>
            {/* 追溯时长 */}
            <Form.Item
              name="retraceDuration"
              label={intl.get('MetricModel.persistenceTaskRetraceDuration')}
              extra={<span className={styles['form-item-tip']}>{intl.get('MetricModel.retraceDurationTip')}</span>}
              rules={[
                {
                  validator: (_: any, value: any) => {
                    if (value && (value.includes('h') || value.includes('d'))) {
                      const { dataPoint, minStep } = getDataPoint(formSteps, value);
                      if (dataPoint > 10000) {
                        const str = { x: getNewStr(value), y: getNewStr(minStep), z: dataPoint };
                        return Promise.reject(new Error(intl.get('MetricModel.retraceDurationIsMax', str)));
                      }
                      return Promise.resolve();
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <TracingDuration type="hour" disabled={isTask} />
            </Form.Item>
            {/* 执行频率 */}
            <ScheduleExpression form={form} scheduleType={values?.expressionType} />
            {/* 索引库 */}
            <Form.Item
              name="indexBase"
              label={intl.get('Global.indexBase')}
              preserve={true}
              initialValue={[]}
              extra={<span className={styles['form-item-tip']}>{intl.get('MetricModel.indexBaseTip')}</span>}
              rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}
            >
              <SelectIndexView />
            </Form.Item>
          </React.Fragment>
        )}
        {isPersistenceConfig && openID && (
          <Modal
            getContainer={() => document.getElementById('vega-root') as HTMLElement}
            title={intl.get('MetricModel.customIdTitle')}
            open={openID}
            onOk={handleID}
            onCancel={() => setOpenID(false)}
          >
            <Form.Item
              name="customId"
              label="ID"
              colon={false} // 不显示 label 后面的冒号
              extra={
                <span className="g-c-text-sub" style={{ marginBottom: 12 }}>
                  {intl.get('MetricModel.customIdTip')}
                </span>
              }
              rules={[
                {
                  validator: (_: any, value: string) => {
                    if (value && value.length > 40) return Promise.reject(new Error(intl.get('Global.idMaxLength')));
                    // 正则规则：id只能包含小写英文字母、数字、下划线、连字符，且不能以下划线和连字符开头
                    if (value && !METRIC_ID_REGEX.test(value)) return Promise.reject(new Error(intl.get('Global.idSpecialVerification')));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input autoComplete="off" aria-autocomplete="none" placeholder={intl.get('Global.pleaseInput')} />
            </Form.Item>
          </Modal>
        )}
      </Form>
    </div>
  );
});

export default PersistenceSettings;
