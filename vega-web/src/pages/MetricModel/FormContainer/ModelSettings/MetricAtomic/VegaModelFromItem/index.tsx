/**  指标模型配置表单 */
import React, { useRef, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Switch, Radio, Input, Tooltip } from 'antd';
import _ from 'lodash';
import AddTag from '@/components/AddTag';
import AddTagBySort from '@/components/AddTagBySort';
import ResultFilter from '@/components/ResultFilter';
import { INIT_FILTER } from '@/hooks/useConstants';
import { IconFont, Select } from '@/web-library/common';
import DataFilter from '@/web-library/components/DataFilter';
import UTILS from '@/web-library/utils';
import AggrExpression from './AggrExpression';
import styles from './index.module.less';

const DATA_FILTER_DEFAULT_OPTION = {
  number: ['<', '<=', '>', '>=', '==', '!=', 'exist', 'not_exist', 'in', 'not_in'],
  string: ['==', '!=', 'like', 'not_like', 'prefix', 'not_prefix', 'exist', 'not_exist', 'in', 'not_in'],
  boolean: ['true', 'false', 'exist'],
  date: ['before', 'current', 'between'],
};

const VegaModelFromItem = (props: any) => {
  const { form, dataViewId } = props;
  const dataFilterRef = useRef(null);
  const [sortFieldList, setSortFieldList] = useState<any[]>([]);

  const resultFilter = Form.useWatch('resultFilter', form);
  const dataFilter = Form.useWatch('dataFilter', form);
  const conditionType = Form.useWatch('conditionType', form);
  const aggrExpressionType = Form.useWatch('aggrExpressionType', form);
  const condition = Form.useWatch('condition', form);
  const groupByFields = Form.useWatch('groupByFields', form);
  useEffect(() => {
    form.setFieldValue('condition_validate', dataFilterRef);
  }, [condition]);

  const dataSource = dataViewId?.[0] || {};
  useEffect(() => {
    if (_.isEmpty(dataSource) || dataSource.__isEdit) return;
    const fields = dataSource?.fields;

    if (conditionType === 'condition') form.setFieldValue('condition', false);
    if (aggrExpressionType === 'aggrExpression') form.setFieldValue('aggrExpression', undefined);
    form.setFieldValue('analysisDimensions', fields);
    form.setFieldValue('groupByFields', []);
    form.setFieldValue('dateField', undefined);
  }, [JSON.stringify(dataSource)]);

  const fields = (dataViewId?.[0] || {})?.fields;
  const optionsDate = _.map(
    _.filter(fields, (item) => UTILS.formatType(item.type) === 'date'),
    (item) => {
      return {
        value: item.name,
        title: item.displayName,
        label: (
          <React.Fragment>
            <div>{item.displayName}</div>
            <div className="g-c-text-sub">{item.name}</div>
          </React.Fragment>
        ),
      };
    }
  );

  useEffect(() => {
    const data = _.filter(fields, (item) => _.includes(groupByFields, item.name));
    form.setFieldValue('groupByFieldsDetail', data);
    const filedList = [
      {
        displayName: intl.get('MetricModel.value'),
        name: '__value',
        type: 'number',
      },
      ...data,
    ];
    setSortFieldList(filedList);
    form.setFieldValue('sortFieldList', filedList);
  }, [groupByFields]);

  return (
    <div className={styles['model-settings-vega-form-item-root']}>
      <Form.Item
        name="dataFilter"
        layout="horizontal"
        label={intl.get('Global.dataFilter')}
        initialValue="true"
        style={!!dataFilter ? { marginBottom: 0 } : {}}
      >
        <Switch />
      </Form.Item>
      {dataFilter && (
        <Form.Item name="conditionType" initialValue="conditionStr" style={{ marginBottom: 0 }}>
          <Radio.Group
            options={[
              { value: 'conditionStr', label: 'SQL' },
              { value: 'condition', label: intl.get('MetricModel.fieldLimit') },
            ]}
            onChange={(e) => {
              if (e.target.value === 'condition') {
                form.setFieldValue('condition', INIT_FILTER);
              }
            }}
          />
        </Form.Item>
      )}
      {dataFilter && conditionType === 'conditionStr' && (
        <Form.Item name="conditionStr" rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}>
          <Input.TextArea placeholder={intl.get('MetricModel.formulaTip2')} rows={4} />
        </Form.Item>
      )}

      {dataFilter && conditionType === 'condition' && (
        <React.Fragment>
          <Form.Item name="condition_validate" hidden />
          <Form.Item name="condition" className={styles['condition-item']} rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}>
            <DataFilter
              ref={dataFilterRef}
              fieldList={fields}
              required={true}
              typeOption={DATA_FILTER_DEFAULT_OPTION}
              transformType={UTILS.formatType}
              maxCount={[10, 10, 10]}
              level={3}
              isFirst
            />
          </Form.Item>
        </React.Fragment>
      )}
      <Form.Item
        name="aggrExpressionType"
        label={intl.get('MetricModel.metricCalculation')}
        initialValue="aggrExpressionStr"
        style={{ marginBottom: 0 }}
        rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}
      >
        <Radio.Group
          options={[
            { value: 'aggrExpressionStr', label: 'SQL' },
            { value: 'aggrExpression', label: intl.get('MetricModel.fieldAggregation') },
          ]}
        />
      </Form.Item>
      {aggrExpressionType === 'aggrExpressionStr' && (
        <Form.Item name="aggrExpressionStr" rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}>
          <Input.TextArea placeholder={intl.get('MetricModel.formulaTip3')} rows={4} />
        </Form.Item>
      )}
      {aggrExpressionType === 'aggrExpression' && (
        <Form.Item name="aggrExpression" rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}>
          <AggrExpression fields={fields} />
        </Form.Item>
      )}
      <Form.Item
        name="analysisDimensions"
        label={intl.get('MetricModel.analysisDimension')}
        // rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}
      >
        <AddTag options={fields} />
      </Form.Item>
      <Form.Item name="groupByFieldsDetail" hidden />
      <Form.Item
        name="groupByFields"
        label={intl.get('MetricModel.groupField')}
        // rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}
      >
        <AddTag options={fields} onlyKey />
      </Form.Item>

      <Form.Item name="sortFieldList" hidden />
      <Form.Item name="orderByFields" label={intl.get('MetricModel.resultSort')}>
        <AddTagBySort options={sortFieldList} />
      </Form.Item>

      <Form.Item
        name="resultFilter"
        layout="horizontal"
        label={
          <>
            <span>{intl.get('MetricModel.resultFilter')}</span>
            <Tooltip title={intl.get('MetricModel.havingTip')}>
              <IconFont type="icon-dip-about" style={{ marginLeft: 4, marginRight: 4, cursor: 'pointer' }} />
            </Tooltip>
          </>
        }
        initialValue={false}
        style={!!resultFilter ? { marginBottom: 0 } : {}}
      >
        <Switch />
      </Form.Item>
      {resultFilter && (
        <Form.Item
          name="havingCondition"
          rules={[
            {
              required: true,
              message: intl.get('Global.cannotBeNull'),
            },
            {
              validator: async (_, value) => {
                // 如果没有值，则校验失败
                if (!value || !value.operation) {
                  return Promise.reject(new Error(intl.get('Global.pleaseSelect')));
                }

                if (!value.value || (Array.isArray(value.value) && value.value.length === 0)) {
                  return Promise.reject(new Error(intl.get('Global.pleaseInput')));
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <ResultFilter />
        </Form.Item>
      )}

      <Form.Item name="dateField" label={intl.get('MetricModel.dateTimeIdentifier')}>
        <Select options={optionsDate} placeholder={intl.get('Global.pleaseSelect')} labelRender={(data: any) => data.title} />
      </Form.Item>
    </div>
  );
};

export default VegaModelFromItem;
