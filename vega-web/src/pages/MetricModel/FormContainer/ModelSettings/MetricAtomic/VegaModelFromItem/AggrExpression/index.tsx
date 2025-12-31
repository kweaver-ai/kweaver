import { useMemo } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Select } from '@/web-library/common';
import UTILS from '@/web-library/utils';

const AggrExpression = (props: any) => {
  const { value, onChange } = props;
  const { fields } = props;
  const { field, aggr } = value || {};

  const { optionsFields, optionsFieldsKV } = useMemo(() => {
    const optionsFields: any = [];
    const optionsFieldsKV: any = {};
    _.forEach(fields, (item) => {
      optionsFields.push({ value: item.name, label: item.displayName });
      optionsFieldsKV[item.name] = item;
    });
    return { optionsFields, optionsFieldsKV };
  }, [JSON.stringify(fields)]);

  const handleChange = (key: string) => (data: string) => {
    onChange({ ...value, [key]: data });
  };

  const optionsAggr: any = {
    string: [
      { value: 'count', label: intl.get('MetricModel.count') },
      { value: 'count_distinct', label: intl.get('MetricModel.countDistinct') },
    ],
    number: [
      { value: 'count', label: intl.get('MetricModel.count') },
      { value: 'count_distinct', label: intl.get('MetricModel.countDistinct') },
      { value: 'sum', label: intl.get('MetricModel.sum') },
      { value: 'max', label: intl.get('MetricModel.max') },
      { value: 'min', label: intl.get('MetricModel.min') },
      { value: 'avg', label: intl.get('MetricModel.avg') },
    ],
    date: [{ value: 'count', label: intl.get('MetricModel.count') }],
  };
  const fieldType = UTILS.formatType(optionsFieldsKV[field]?.type) || '';

  return (
    <div className="g-flex-align-center">
      <Select className="g-mr-4" value={field} options={optionsFields} placeholder={intl.get('Global.pleaseSelect')} onChange={handleChange('field')} />
      <Select value={aggr} disabled={!field} options={optionsAggr[fieldType]} placeholder={intl.get('Global.pleaseSelect')} onChange={handleChange('aggr')} />
    </div>
  );
};

export default AggrExpression;
