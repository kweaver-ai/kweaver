/**  指标模型配置表单 */
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import intl from 'react-intl-universal';
import { Divider, Form, Select } from 'antd';
import DetailAndPreviewDrawer from '@/pages/MetricModel/DetailAndPreviewDrawer';
import { METRIC_TYPE } from '@/pages/MetricModel/type';
import { Button } from '@/web-library/common';
import styles from './index.module.less';
import MetricAtomic from './MetricAtomic';
import MetricComposite from './MetricComposite';
import MetricDerived from './MetricDerived';

const ConfigForm = forwardRef((props: any, ref) => {
  const [form] = Form.useForm();
  const { values, createType } = props;
  const [isDrawerShow, setDrawerShow] = useState(false);

  const OPTIONS = [
    {
      label: intl.get('MetricModel.numUnit'),
      options: [
        { value: 'none', label: intl.get('Global.empty'), type: 'numUnit' },
        { value: 'K', label: intl.get('Global.K'), type: 'numUnit' },
        { value: 'Mil', label: intl.get('Global.Mil'), type: 'numUnit' },
        { value: 'Bil', label: intl.get('Global.Bil'), type: 'numUnit' },
        { value: 'Tri', label: intl.get('Global.Tri'), type: 'numUnit' },
        { value: '%', label: intl.get('MetricModel.percent'), type: 'numUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.storeUnit'),
      name: 'storeUnit',
      options: [
        { value: 'Byte', label: 'Byte', type: 'storeUnit' },
        { value: 'KiB', label: 'KiB', type: 'storeUnit' },
        { value: 'MiB', label: 'MiB', type: 'storeUnit' },
        { value: 'GiB', label: 'GiB', type: 'storeUnit' },
        { value: 'TiB', label: 'TiB', type: 'storeUnit' },
        { value: 'PiB', label: 'PiB', type: 'storeUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.transmissionRate'),
      name: 'transmissionRate',
      options: [
        { value: 'B/s', label: 'B/s', type: 'transmissionRate' },
        { value: 'KiB/s', label: 'KiB/s', type: 'transmissionRate' },
        { value: 'MiB/s', label: 'MiB/s', type: 'transmissionRate' },
      ],
    },
    {
      label: intl.get('MetricModel.currencyUnit.index'),
      name: 'currencyUnit',
      options: [
        { value: 'Fen', label: intl.get('MetricModel.currencyUnit.fen'), type: 'currencyUnit' },
        { value: 'Jiao', label: intl.get('MetricModel.currencyUnit.jiao'), type: 'currencyUnit' },
        { value: 'CNY', label: intl.get('MetricModel.currencyUnit.cny'), type: 'currencyUnit' },
        { value: '10K_CNY', label: intl.get('MetricModel.currencyUnit.10K_cny'), type: 'currencyUnit' },
        { value: '1M_CNY', label: intl.get('MetricModel.currencyUnit.1M_cny'), type: 'currencyUnit' },
        { value: '100M_CNY', label: intl.get('MetricModel.currencyUnit.100M_cny'), type: 'currencyUnit' },
        { value: 'US_Cent', label: intl.get('MetricModel.currencyUnit.us_cent'), type: 'currencyUnit' },
        { value: 'USD', label: intl.get('MetricModel.currencyUnit.usd'), type: 'currencyUnit' },
        { value: 'EUR_Cent', label: intl.get('MetricModel.currencyUnit.eur_cent'), type: 'currencyUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.timeUnit.index'),
      name: 'timeUnit',
      options: [
        { value: 'ns', label: intl.get('MetricModel.timeUnit.ns'), type: 'timeUnit' },
        { value: 'μs', label: intl.get('MetricModel.timeUnit.μs'), type: 'timeUnit' },
        { value: 'ms', label: intl.get('MetricModel.timeUnit.ms'), type: 'timeUnit' },
        { value: 's', label: intl.get('MetricModel.timeUnit.s'), type: 'timeUnit' },
        { value: 'm', label: intl.get('MetricModel.timeUnit.m'), type: 'timeUnit' },
        { value: 'h', label: intl.get('MetricModel.timeUnit.h'), type: 'timeUnit' },
        { value: 'd', label: intl.get('MetricModel.timeUnit.d'), type: 'timeUnit' },
        { value: 'quarter', label: intl.get('MetricModel.timeUnit.quarter'), type: 'timeUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.percentageUnit.index'),
      name: 'percentageUnit',
      options: [
        { value: '%', label: intl.get('MetricModel.percentageUnit.percentile'), type: 'percentageUnit' },
        { value: '‰', label: intl.get('MetricModel.percentageUnit.thousandthPercentile'), type: 'percentageUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.countUnit.index'),
      name: 'countUnit',
      options: [
        { value: 'household', label: intl.get('MetricModel.countUnit.household'), type: 'countUnit' },
        { value: 'transaction', label: intl.get('MetricModel.countUnit.transaction'), type: 'countUnit' },
        { value: 'piece', label: intl.get('MetricModel.countUnit.piece'), type: 'countUnit' },
        { value: 'item', label: intl.get('MetricModel.countUnit.item'), type: 'countUnit' },
        { value: 'times', label: intl.get('MetricModel.countUnit.times'), type: 'countUnit' },
        { value: 'man_day', label: intl.get('MetricModel.countUnit.man_day'), type: 'countUnit' },
        { value: 'family', label: intl.get('MetricModel.countUnit.family'), type: 'countUnit' },
        { value: 'hand', label: intl.get('MetricModel.countUnit.hand'), type: 'countUnit' },
        { value: 'sheet', label: intl.get('MetricModel.countUnit.sheet'), type: 'countUnit' },
        { value: 'packet', label: intl.get('MetricModel.countUnit.packet'), type: 'countUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.weightUnit.index'),
      name: 'weightUnit',
      options: [
        { value: 'ton', label: intl.get('MetricModel.weightUnit.ton'), type: 'weightUnit' },
        { value: 'kg', label: intl.get('MetricModel.weightUnit.kg'), type: 'weightUnit' },
      ],
    },
    {
      label: intl.get('MetricModel.ordinalRankUnit.index'),
      name: 'ordinalRankUnit',
      options: [{ value: 'rank', label: intl.get('MetricModel.ordinalRankUnit.rank'), type: 'ordinalRankUnit' }],
    },
  ];

  useImperativeHandle(ref, () => ({ form }));

  const handleClickDataPreview = async (): Promise<void> => {
    form.validateFields().then(() => setDrawerShow(true));
  };

  const metricType = Form.useWatch('metricType', form); // 模型类型
  const dataViewId = Form.useWatch('dataViewId', form); // 数据来源

  /** 是存在数据来源 */
  const hasDataViewId = !!dataViewId && dataViewId?.length !== 0;

  return (
    <div className={styles['model-settings-root']}>
      <Form
        form={form}
        className={styles.form}
        layout="vertical"
        initialValues={{ metricType: createType, unitType: 'numUnit', unit: 'none', ...values, resultFilter: !!values?.havingCondition || false }}
      >
        {/* 指标类型 */}
        <Form.Item name="metricType" hidden />
        {/* 原子指标 */}
        {metricType === METRIC_TYPE.ATOMIC && <MetricAtomic form={form} />}
        {/* 衍生指标 */}
        {metricType === METRIC_TYPE.DERIVED && <MetricDerived form={form} />}
        {/* 复合指标 */}
        {metricType === METRIC_TYPE.COMPOSITE && <MetricComposite form={form} />}

        {(hasDataViewId || metricType === METRIC_TYPE.COMPOSITE) && (
          <React.Fragment>
            <Form.Item name="unitType" hidden />
            <Form.Item name="unit" label={intl.get('MetricModel.metricUnit')} rules={[{ required: true, message: intl.get('MetricModel.unitTip') }]}>
              <Select options={OPTIONS} onChange={(_value, data: any) => form.setFieldValue('unitType', data.type)} />
            </Form.Item>
          </React.Fragment>
        )}
        {(hasDataViewId || metricType === METRIC_TYPE.COMPOSITE) && (
          <React.Fragment>
            <Divider style={{ margin: '0px 0 24px' }} />
            <Button onClick={handleClickDataPreview}>{intl.get('Global.dataPreview')}</Button>
          </React.Fragment>
        )}
      </Form>

      {isDrawerShow && (
        <DetailAndPreviewDrawer
          onlyOneTab
          previewData={{ ...form.getFieldsValue(), isCalendarInterval: values?.isCalendarInterval }}
          initTabActiveKey="preview"
          onClose={() => setDrawerShow(false)}
        />
      )}
    </div>
  );
});

ConfigForm.displayName = 'ConfigForm';

export default ConfigForm;
