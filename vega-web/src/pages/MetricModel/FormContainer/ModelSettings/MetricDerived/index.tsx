import { useRef, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Switch, Radio, Input } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import AddTag from '@/components/AddTag';
import AddTagBySort from '@/components/AddTagBySort';
import ResultFilter from '@/components/ResultFilter';
import { INIT_FILTER } from '@/hooks/useConstants';
import { formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import api from '@/services/data-analysis/metric-model';
import { Text, Button, IconFont } from '@/web-library/common';
import DataFilter from '@/web-library/components/DataFilter';
import UTILS from '@/web-library/utils';
import styles from './index.module.less';
import SelectModel from './SelectModel';

const DATA_FILTER_DEFAULT_OPTION = {
  number: ['<', '<=', '>', '>=', '==', '!=', 'exist', 'not_exist', 'in', 'not_in'],
  string: ['==', '!=', 'like', 'not_like', 'prefix', 'not_prefix', 'exist', 'not_exist', 'in', 'not_in'],
  boolean: ['true', 'false', 'exist'],
  date: ['before', 'current', 'between'],
};

const MetricDerived = (props: any) => {
  const { form } = props;
  const dataFilterDateRef = useRef(null);
  const dataFilterBusinessRef = useRef(null);
  const [sortFieldList, setSortFieldList] = useState<any[]>([]);

  const resultFilter = Form.useWatch('resultFilter', form);
  const dataViewId = Form.useWatch('dataViewId', form); // 数据来源
  const dataFilter = Form.useWatch('dataFilter', form); // 数据过滤
  const conditionType = Form.useWatch('conditionType', form); // 数据过滤类型
  const dateCondition = Form.useWatch('dateCondition', form); // 时间限定
  const businessCondition = Form.useWatch('businessCondition', form); // 业务限定

  useEffect(() => {
    form.validateFields(['dataFilter_error_container']);
    form.setFieldValue('dateCondition_validate', dataFilterDateRef);
  }, [dateCondition]);
  useEffect(() => {
    form.validateFields(['dataFilter_error_container']);
    form.setFieldValue('businessCondition_validate', dataFilterBusinessRef);
  }, [businessCondition]);

  const hasDateCondition = !_.isEmpty(dateCondition);
  const hasBusinessCondition = !_.isEmpty(businessCondition);

  const dataSource = dataViewId?.[0] || {};
  const { analysisDimensions = [], fieldsMap = {} } = dataSource;
  const fields_map = formatKeyOfObjectToLine(fieldsMap);

  analysisDimensions.forEach((item: any) => {
    item.comment = fields_map[item.name]?.comment || '';
  });

  const getSortFieldList = async (dataViewId: any) => {
    if (_.isEmpty(dataViewId)) return;
    let ids: any = [];
    if (typeof dataViewId === 'string') {
      ids = [dataViewId];
    } else {
      ids = dataViewId?.map((item: any) => item.id) || [];
    }
    const resultList = await api.getMetricOrderFields(ids);
    const firstResult = resultList?.[0] || [];
    const fieldList = firstResult?.map((item) => ({ displayName: item.display_name, name: item.name, type: item.type, comment: item.comment })) || [];
    setSortFieldList(fieldList);
    form.setFieldValue('sortFieldList', fieldList);
  };

  const handleAddBtnClick = () => {
    // 添加结果排序列表
    getSortFieldList(dataViewId);
  };

  useEffect(() => {
    if (_.isEmpty(dataSource) || dataSource.__isEdit) return;

    form.setFieldValue('analysisDimensions', analysisDimensions);

    getSortFieldList(dataViewId);
  }, [JSON.stringify(dataViewId)]);

  const hasDataViewId = !!dataViewId && dataViewId?.length !== 0;
  const date_field = _.filter(analysisDimensions, (item) => UTILS.formatType(item.type) === 'date');
  const business_field = _.filter(analysisDimensions, (item) => UTILS.formatType(item.type) !== 'date');

  return (
    <div className={styles['model-setting-derived-root']}>
      {/* 数据来源 */}
      <Form.Item
        name="dataViewId"
        label={intl.get('MetricModel.dataSources')}
        rules={[{ required: true, message: intl.get('MetricModel.dataSourcesCannotNull') }]}
      >
        <SelectModel />
      </Form.Item>
      {/* 数据过滤 */}
      <Form.Item
        name="dataFilter"
        layout="horizontal"
        label={intl.get('Global.dataFilter')}
        initialValue="true"
        style={!!dataFilter ? { marginBottom: 0 } : {}}
      >
        <Switch disabled={!hasDataViewId} />
      </Form.Item>
      {dataFilter && (
        <Form.Item name="conditionType" initialValue="conditionStr" style={{ marginBottom: 0 }}>
          <Radio.Group
            disabled={!hasDataViewId}
            options={[
              { value: 'conditionStr', label: 'SQL' },
              { value: 'condition', label: intl.get('MetricModel.fieldLimit') },
            ]}
          />
        </Form.Item>
      )}
      {dataFilter && conditionType === 'conditionStr' && (
        <Form.Item name="conditionStr" rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}>
          <Input.TextArea disabled={!hasDataViewId} placeholder={intl.get('MetricModel.formulaTip3')} rows={4} />
        </Form.Item>
      )}
      {dataFilter && conditionType === 'condition' && (
        <div className={styles['condition-container']}>
          <Text className="g-mb-1">{intl.get('MetricModel.timeLimit')}：</Text>
          {!hasDateCondition && (
            <Button.Link icon={<IconFont type="icon-add" />} onClick={() => form.setFieldValue('dateCondition', INIT_FILTER)}>
              {intl.get('MetricModel.addLimit')}
            </Button.Link>
          )}
          <Form.Item name="dateCondition_validate" hidden />
          <Form.Item name="dateCondition" className={classNames(styles['condition-item'], { [styles['condition-item-hidden']]: !hasDateCondition })}>
            {hasDateCondition && (
              <DataFilter
                ref={dataFilterDateRef}
                fieldList={date_field}
                defaultValue={INIT_FILTER}
                typeOption={DATA_FILTER_DEFAULT_OPTION}
                transformType={UTILS.formatType}
                maxCount={[10, 10, 10]}
                level={3}
                isFirst
                isHidden
              />
            )}
          </Form.Item>
          <Text className="g-mb-1">{intl.get('MetricModel.businessLimit')}：</Text>
          {!hasBusinessCondition && (
            <Button.Link icon={<IconFont type="icon-add" />} onClick={() => form.setFieldValue('businessCondition', INIT_FILTER)}>
              {intl.get('MetricModel.addLimit')}
            </Button.Link>
          )}
          <Form.Item name="businessCondition_validate" hidden />
          <Form.Item name="businessCondition" className={classNames(styles['condition-item'], { [styles['condition-item-hidden']]: !hasBusinessCondition })}>
            {hasBusinessCondition && (
              <DataFilter
                ref={dataFilterBusinessRef}
                fieldList={business_field}
                defaultValue={INIT_FILTER}
                typeOption={DATA_FILTER_DEFAULT_OPTION}
                transformType={UTILS.formatType}
                maxCount={[10, 10, 10]}
                level={3}
                isFirst
                isHidden
              />
            )}
          </Form.Item>
          {/* 用来显示校验的 */}
          <Form.Item
            name="dataFilter_error_container"
            style={{ height: 0, margin: 0, position: 'absolute', bottom: 32, left: 0 }}
            rules={[
              {
                required: true,
                validator: () => {
                  const judging = dataFilter && conditionType === 'condition' && !dateCondition && !businessCondition;
                  if (judging) return Promise.reject(new Error(intl.get('MetricModel.dataFilteringCannotNull')));
                  return Promise.resolve();
                },
              },
            ]}
          />
        </div>
      )}
      <div style={{ clear: 'both' }} />

      <Form.Item name="sortFieldList" hidden />
      <Form.Item name="orderByFields" label={intl.get('MetricModel.resultSort')}>
        <AddTagBySort options={sortFieldList} onAddBtnClick={() => handleAddBtnClick()} />
      </Form.Item>
      <Form.Item
        name="resultFilter"
        layout="horizontal"
        label={intl.get('MetricModel.resultFilter')}
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
                  return Promise.reject(new Error(intl.get('MetricModel.pleaseSelectOperator')));
                }

                if (!value.value || (Array.isArray(value.value) && value.value.length === 0)) {
                  return Promise.reject(new Error(intl.get('MetricModel.pleaseInputFilterValue')));
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <ResultFilter />
        </Form.Item>
      )}

      <Form.Item name="analysisDimensions" label={intl.get('MetricModel.analysisDimension')}>
        <AddTag options={analysisDimensions} disabled={!hasDataViewId} />
      </Form.Item>
    </div>
  );
};

export default MetricDerived;
