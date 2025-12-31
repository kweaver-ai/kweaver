import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form, Select } from 'antd';
import { queryType as QUERY_TYPE } from '@/pages/MetricModel/type';
import { dslFormulaDefault } from './dslFormula';
import IndexModelFromItem from './IndexModelFromItem';
import SelectDataView from './SelectDataView';
import VegaModelFromItem from './VegaModelFromItem';

const MetricTypeAtomic = (props: any) => {
  const { form } = props;

  const dataViewId = Form.useWatch('dataViewId', form); // 数据来源
  const queryType = Form.useWatch('queryType', form); // 查询语言

  useEffect(() => {
    if (!dataViewId) return;
    if (dataViewId.length === 0) form.setFieldValue('queryType', undefined);
    if (dataViewId[0]?.queryType === 'SQL') {
      form.setFieldValue('queryType', 'sql');
    } else {
      if (queryType === 'sql') form.setFieldValue('queryType', undefined);
    }
  }, [JSON.stringify(dataViewId)]);

  /** 是存在数据来源 */
  const hasDataViewId = !!dataViewId && dataViewId?.length !== 0;
  /** 是否是 vega 数据源 */
  const isVegaType = dataViewId?.[0]?.queryType === 'SQL' || dataViewId?.[0]?.type === 'vega_logic_view';

  return (
    <div>
      {/* 数据来源 */}
      <Form.Item
        name="dataViewId"
        label={intl.get('MetricModel.dataSources')}
        rules={[{ required: true, message: intl.get('MetricModel.dataSourcesCannotNull') }]}
      >
        <SelectDataView />
      </Form.Item>
      {/* 查询语言 */}
      <Form.Item name="queryType" label={intl.get('MetricModel.queryType')} rules={[{ required: true, message: intl.get('MetricModel.queryTypeCannotNull') }]}>
        <Select
          disabled={!hasDataViewId || isVegaType}
          placeholder={hasDataViewId ? intl.get('Global.pleaseSelect') : intl.get('MetricModel.selectDataSourceFirst')}
          options={
            isVegaType
              ? [{ value: 'sql', label: 'SQL' }]
              : [
                  { value: QUERY_TYPE.Promql, label: 'PromQL' },
                  { value: QUERY_TYPE.Dsl, label: 'DSL' },
                ]
          }
          onChange={(key: any) => {
            if (key === QUERY_TYPE.Dsl) form.setFieldValue('formula', dslFormulaDefault);
            if (key === QUERY_TYPE.Promql) form.setFieldValue('formula', undefined);
          }}
        />
      </Form.Item>
      {isVegaType ? <VegaModelFromItem form={form} dataViewId={dataViewId} /> : <IndexModelFromItem form={form} />}
    </div>
  );
};

export default MetricTypeAtomic;
