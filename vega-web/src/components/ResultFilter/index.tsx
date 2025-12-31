import { forwardRef, useMemo, useCallback, useImperativeHandle } from 'react';
import { MinusOutlined } from '@ant-design/icons';
import { InputNumber, Select } from 'antd';
import _ from 'lodash';
import getLocaleValue from '@/utils/get-locale-value';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';

interface ResultFilterProps {
  value?: {
    operation: string;
    value: any;
    field: string;
  };
  onChange?: (value: { operation: string; value: any; field: string }) => void;
  layout?: 'horizontal' | 'vertical';
}

const operateOption = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not_in', 'range', 'out_range'];

// 右侧值为数组的操作符
const aryOperation = ['in', 'not_in'];

// 右侧值为范围的操作符
const rangeOperation = ['range', 'out_range'];

const ResultFilter = forwardRef((props: ResultFilterProps, ref) => {
  const { value = { operation: '==', value: '', field: '__value' }, onChange, layout = 'horizontal' } = props;

  // 使用 useCallback 优化事件处理函数，避免不必要的重新创建
  const handleChangeOperation = useCallback(
    (e: string) => {
      onChange?.({ operation: e, value: '', field: value.field });
    },
    [onChange, value.value]
  );

  const handleValueChange = useCallback(
    (e: any) => {
      onChange?.({ operation: value.operation, value: e, field: value.field });
    },
    [onChange, value.operation]
  );

  // 校验函数，检查操作符和值是否都已填写
  const validate = useCallback(() => {
    // 如果没有选择操作符，则校验失败
    if (!value?.operation) {
      return false;
    }

    // 如果是数组类型的操作符，检查值是否为数组且不为空
    if (aryOperation.includes(value?.operation)) {
      return Array.isArray(value.value) && value.value.length > 0;
    }

    // 对于其他操作符，检查值是否不为空
    return value.value !== '' && value.value !== null && value.value !== undefined;
  }, [value]);

  useImperativeHandle(ref, () => ({
    validate,
  }));

  // 使用 useMemo 优化 ValueInput 组件，避免每次渲染都重新创建
  const ValueInput = useMemo(() => {
    if (!value?.operation) {
      return null;
    }

    if (aryOperation.includes(value?.operation)) {
      return (
        <Select
          style={{ width: '100%' }}
          mode="tags"
          value={!!value?.value ? value?.value : undefined}
          onChange={(e) => {
            const values = e
              .map((item: any) => {
                return Number.parseFloat(item);
              })
              .filter((item: any) => !isNaN(item));
            handleValueChange(values);
          }}
          placeholder={getLocaleValue('pleaseInputValue', { localeZh }, { localeEn })}
        />
      );
    } else if (rangeOperation.includes(value?.operation)) {
      return (
        <div className={styles['result-filter-range']}>
          <InputNumber
            value={value?.value?.[0]}
            onChange={(e) => {
              handleValueChange([e, ...(value?.value || []).slice(1)]);
            }}
            style={{ width: '50%' }}
          />
          <MinusOutlined style={{ color: 'rgba(0, 0, 0, 0.3)' }} />
          <InputNumber
            value={value?.value?.[1]}
            onChange={(e) => {
              handleValueChange([...(value?.value || []).slice(0, 1), e]);
            }}
            style={{ width: '50%' }}
          />
        </div>
      );
    } else {
      return (
        <InputNumber
          autoFocus
          style={{ width: '100%' }}
          value={value?.value}
          onChange={handleValueChange}
          placeholder={getLocaleValue('pleaseInputValue', { localeZh }, { localeEn })}
        />
      );
    }
  }, [value?.operation, value?.value, handleValueChange]);

  return layout === 'horizontal' ? (
    <div className={styles['result-filter-horizontal']}>
      <Select
        style={{ width: 160, flexShrink: 0 }}
        value={value?.operation}
        placeholder="请选择"
        onChange={handleChangeOperation}
        options={_.map(operateOption, (item) => ({ value: item, label: getLocaleValue(item, { localeZh }, { localeEn }) }))}
      />
      {ValueInput}
    </div>
  ) : (
    <div className={styles['result-filter-vertical']}>
      <Select
        style={{ width: '100%', marginBottom: 8 }}
        value={value?.operation}
        placeholder="请选择"
        onChange={handleChangeOperation}
        options={_.map(operateOption, (item) => ({ value: item, label: getLocaleValue(item, { localeZh }, { localeEn }) }))}
      />
      {ValueInput}
    </div>
  );
});

export default ResultFilter;
