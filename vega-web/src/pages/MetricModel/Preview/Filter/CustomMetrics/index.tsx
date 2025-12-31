/** 数据预览*/
import { useState } from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined } from '@ant-design/icons';
import { Space, Select, Checkbox, InputNumber } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { Title, Text, Button } from '@/web-library/common';
import styles from './index.module.less';

const CustomMetrics = (props: any) => {
  const { source, timeRange, onCloseCustom, onSubmitCustom } = props;

  const [data, setData] = useState(source);
  const [errorData, setErrorData] = useState<any>({});

  const { method, offset, time_granularity } = data.sameperiod_config || {};

  const checkboxOptions = [
    { label: intl.get('MetricModel.growthValue'), value: 'growth_value' },
    { label: intl.get('MetricModel.growthRate'), value: 'growth_rate' },
  ];

  /** 计算类型变更 */
  const onChangeCheckbox = (value: any) => {
    if (_.isEmpty(value)) {
      setErrorData({ method: intl.get('MetricModel.calculationTypeCannotBeEmpty') });
    } else {
      const newErrorData = _.cloneDeep(errorData);
      delete newErrorData.method;
      setErrorData(newErrorData);
    }
    const newData = _.cloneDeep(data);
    newData.sameperiod_config.method = value;
    setData(newData);
  };
  const handleWrapperClick = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
  };
  /** 偏移量变更 */
  const onChangeInput = (value: any) => {
    const newData = _.cloneDeep(data);
    newData.sameperiod_config.offset = value;
    setData(newData);
  };
  /** 时间粒度变更 */
  const onChangeSelect = (value: any) => {
    const newData = _.cloneDeep(data);
    newData.sameperiod_config.time_granularity = value;
    setData(newData);
  };

  /** 提交 */
  const onSubmit = () => {
    if (_.isEmpty(data?.sameperiod_config?.method)) return;
    onSubmitCustom(data);
    onCloseCustom();
  };

  const errorMethod = errorData?.method;

  return (
    <div className={styles['custom-metrics-root']}>
      <div className={styles['custom-metrics-header']}>
        <Title>{intl.get('MetricModel.customSameRingRatio')}</Title>
        <Button.Icon icon={<CloseOutlined />} onClick={onCloseCustom} />
      </div>
      <div className={styles['custom-metrics-item']}>
        <span className={styles['custom-metrics-item-colon']}>*</span>
        <Text>{intl.get('MetricModel.calculationType')}：</Text>
        <Checkbox.Group value={method} options={checkboxOptions} defaultValue={['growth_value', 'growth_rate']} onChange={onChangeCheckbox} />
        {errorMethod && <Text className={styles['custom-metrics-item-error']}>{errorMethod}</Text>}
      </div>
      <div className={styles['custom-metrics-item']}>
        <Text>{intl.get('MetricModel.dateTime')}：</Text>
        <span>{!!timeRange && dayjs(timeRange?.value?.[0]).format('YYYY-MM-DD')}</span>
        <span className="g-ml-2 g-mr-2">{intl.get('MetricModel.to')}</span>
        <span>{!!timeRange && dayjs(timeRange?.value?.[1]).format('YYYY-MM-DD')}</span>
      </div>
      <div className={styles['custom-metrics-time']}>
        <Text>{intl.get('MetricModel.relativeTime')}：</Text>
        <div>
          <div>
            <Space.Compact className="g-w-100">
              <div className={styles['relative-time-label']}>{intl.get('MetricModel.offset')}</div>
              <div style={{ width: '65%' }} onClick={handleWrapperClick}>
                <InputNumber className="g-w-100" value={offset} onChange={onChangeInput} />
              </div>
            </Space.Compact>
          </div>
          <div className="g-mt-4">
            <Space.Compact className="g-w-100">
              <div className={styles['relative-time-label']}>{intl.get('MetricModel.timeGranularity')}</div>
              <div style={{ width: '65%' }} onClick={handleWrapperClick}>
                <Select
                  className="g-w-100"
                  value={time_granularity}
                  options={[
                    { value: 'day', label: intl.get('Global.unitDay') },
                    { value: 'month', label: intl.get('MetricModel.month') },
                    { value: 'quarter', label: intl.get('MetricModel.quarter') },
                    { value: 'year', label: intl.get('MetricModel.year') },
                  ]}
                  getPopupContainer={(triggerNode): HTMLElement => triggerNode.parentNode as HTMLElement}
                  onChange={onChangeSelect}
                />
              </div>
            </Space.Compact>
          </div>
        </div>
        <div></div>
      </div>
      <div className={styles['custom-metrics-footer']}>
        <Button onClick={onCloseCustom}>{intl.get('Global.cancel')}</Button>
        <Button className="g-ml-2" type="primary" onClick={onSubmit}>
          {intl.get('Global.ok')}
        </Button>
      </div>
    </div>
  );
};

export default CustomMetrics;
