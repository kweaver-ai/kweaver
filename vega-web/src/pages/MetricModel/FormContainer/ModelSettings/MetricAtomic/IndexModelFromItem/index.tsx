/**  指标模型配置表单 */
import React from 'react';
import intl from 'react-intl-universal';
import { Form, Input } from 'antd';
import JsonCodeInput from '@/components/JsonCodeInput';
import { HELP_DOC_LINKS } from '@/hooks/useConstants';
import { queryType as QUERY_TYPE } from '@/pages/MetricModel/type';
import { Button } from '@/web-library/common';
import { dslFormulaDefault } from '../dslFormula';
import styles from './index.module.less';

const IndexModelFromItem = (props: any) => {
  const { form } = props;

  const queryType = Form.useWatch('queryType', form); // 查询语言

  /** 是否存在查询语言 */
  const hasQueryType = !!queryType;

  return (
    <div className={styles['model-settings-index-form-item-root']}>
      {!hasQueryType && (
        <Form.Item
          name="formula"
          label={intl.get('MetricModel.formula')}
          extra={
            <span className={styles['form-item-tip']}>
              {intl.get('MetricModel.formulaTip')}
              <Button.Link href={HELP_DOC_LINKS.METRIC_FORMULA} target="_blank" style={{ fontSize: 12 }}>
                {intl.get('MetricModel.learnMore')}
              </Button.Link>
            </span>
          }
          rules={[{ required: true, message: intl.get('MetricModel.formulaCannotNull') }]}
        >
          <Input.TextArea rows={1} disabled={true} placeholder={intl.get('MetricModel.selectQueryLanguageFirst')} />
        </Form.Item>
      )}
      {hasQueryType && queryType === QUERY_TYPE.Promql && (
        // 计算公式
        <Form.Item
          name="formula"
          label={intl.get('MetricModel.formula')}
          extra={
            <span className={styles['form-item-tip']}>
              {intl.get('MetricModel.formulaTip')}
              <Button.Link href={HELP_DOC_LINKS.METRIC_FORMULA} target="_blank" style={{ fontSize: 12 }}>
                {intl.get('MetricModel.learnMore')}
              </Button.Link>
            </span>
          }
          rules={[{ required: true, message: intl.get('MetricModel.formulaCannotNull') }]}
        >
          <Input.TextArea rows={15} placeholder={intl.get('MetricModel.formulaCase')} />
        </Form.Item>
      )}
      {hasQueryType && queryType === QUERY_TYPE.Dsl && (
        <React.Fragment>
          {/* 计算公式 */}
          <Form.Item
            name="formula"
            initialValue={dslFormulaDefault}
            label={intl.get('MetricModel.formula')}
            extra={
              <span className={styles['form-item-tip']}>
                {intl.get('MetricModel.formulaTip')}
                <Button.Link href={HELP_DOC_LINKS.METRIC_FORMULA} target="_blank" style={{ fontSize: 12 }}>
                  {intl.get('MetricModel.learnMore')}
                </Button.Link>
              </span>
            }
            rules={[
              {
                required: true,
                validator: (_: any, value: any) => {
                  if (!value) return Promise.reject(new Error(intl.get('MetricModel.formulaCannotNull')));
                  if (value && typeof value === 'string') return Promise.reject(new Error(intl.get('MetricModel.jsonError')));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <JsonCodeInput style={{ height: 400 }} />
          </Form.Item>
          {/* 度量字段 */}
          <Form.Item
            name="measureField"
            label={intl.get('MetricModel.metric')}
            extra={
              <span className={styles['form-item-tip']}>
                {intl.get('MetricModel.measureFieldTip')}
                <Button.Link href={HELP_DOC_LINKS.MEASURE_FIELD} target="_blank" style={{ fontSize: 12 }}>
                  {intl.get('MetricModel.learnMore')}
                </Button.Link>
              </span>
            }
            rules={[{ required: true, message: intl.get('MetricModel.metricIsEmpty') }]}
          >
            <Input autoComplete="off" aria-autocomplete="none" placeholder={intl.get('MetricModel.pleaseInputInfo')} />
          </Form.Item>
        </React.Fragment>
      )}
    </div>
  );
};

export default IndexModelFromItem;
