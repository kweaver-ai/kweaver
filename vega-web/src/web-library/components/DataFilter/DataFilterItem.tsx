/*
 * @Description: 数据过滤项
 * @Author: coco.chen
 * @Date: 2023-08-07 11:00:07
 */
import { forwardRef, useImperativeHandle, useMemo, useEffect, useState } from 'react';
import { useUpdateEffect } from 'ahooks';
import { Input, Select } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import DateBefore from './components/DateBefore';
import DateBetween from './components/DateBetween';
import DateCurrent from './components/DateCurrent';
import NumberItem from './components/NumberItem';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import { FieldList, Item } from './type';
import { defaultTypeOption } from './utils';
import getLocaleValue from '../../utils/get-locale-value';

// 右侧值为数组的操作符
const aryOperation = ['in', 'not_in', 'contain', 'not_contain'];
/**
 * 有效的值来源
 * @returns 常量  const ，value内容即需要比较的值
 * @returns 字段  field，value内容为字段名称，意思是比较两个字段的内容
 * @returns 用户 user，value内容为当前用户的某个属性字段，意思是取当前用户的某个属性字段的值作为比较的值
 */
const valueForms = ['const'];

interface DataFilterItemProps {
  fieldList: FieldList[];
  value: Item;
  onChange: (Item: any) => void;
  transformType?: (string: any) => string;
  required: boolean;
  typeOption?: { [key: string]: string[] };
  disabled?: boolean;
}

const DataFilterItem = forwardRef(
  ({ value, fieldList, disabled = false, transformType, required: defaultRequired, typeOption = defaultTypeOption, onChange }: DataFilterItemProps, ref) => {
    const fieldListFilter = (val: any): FieldList => {
      return fieldList?.filter((i) => (i.name && i.name === val) || i.display_name === val)[0];
    };
    const [fieldType, setFieldType] = useState(fieldListFilter(value.field)?.type);

    const [errors, setErrors] = useState<{ name: string; value: string }>({ name: '', value: '' });

    const isEmpty = (value: any): boolean => (typeof value !== 'number' && !value) || (Array.isArray(value) && !value.length);

    const validateValue = (value: any, required = defaultRequired): { value?: string } => {
      const error: { value?: string } = {};

      if (required && (isEmpty(value) || (!Array.isArray(value) && typeof value === 'object' && !value.label && (isEmpty(value.from) || isEmpty(value.to))))) {
        error.value = getLocaleValue('valueCannotEmpty', { localeZh }, { localeEn });
      } else {
        error.value = '';
      }

      return error;
    };

    const validateField = (value: any, required = defaultRequired): { name?: string } => {
      const error: { name?: string } = {};

      if (!value && required) {
        error.name = getLocaleValue('fieldCannotEmpty', { localeZh }, { localeEn });
      } else if (value && !fieldList?.find((i) => (i.name || i.display_name) === value)) {
        error.name = getLocaleValue('fieldsNotExist', { localeZh }, { localeEn });
      } else {
        error.name = '';
      }

      return error;
    };

    const validate = (required: any): boolean => {
      const fieldError = validateField(value.field, required);
      const valueError = validateValue(value.value, required);

      // 存在和不存在, 值空, 值非空 没有 value 字段
      if (value.operation === 'exist' || value.operation === 'not_exist' || value.operation === 'not_empty' || value.operation === 'empty') {
        setErrors({ name: fieldError.name || '', value: '' });
        return !!fieldError?.name;
      }

      setErrors({ name: fieldError.name || '', value: valueError?.value || '' });

      return !!(fieldError?.name || valueError?.value);
    };

    const validateValueError = (val: any): void => {
      setErrors({ ...errors, ...validateValue(val) });
    };

    useImperativeHandle(ref, () => ({ validate }));

    const formatType = useMemo(() => {
      return transformType ? transformType(fieldType || 'number') : fieldType;
    }, [fieldType]);

    useUpdateEffect(() => {
      if ((formatType === 'number' && value?.value?.from) || (formatType === 'number' && (value?.operation === 'range' || value?.operation === 'out_range'))) {
        onChange({ ...value, value: null });
      }

      if (value?.field === undefined && value?.value === undefined) {
        setFieldType('number');
      }
    }, [value?.operation]);

    useEffect(() => {
      const type = fieldListFilter(value?.field)?.type;
      if (!type) return;

      const formatType = transformType && type ? transformType(type) : type;

      onChange({
        operation: typeOption[formatType].includes(value?.operation) ? value.operation : typeOption[formatType][0],
        field: value?.field,
        value: type === fieldType || !fieldType ? value?.value : undefined,
      });

      setFieldType(type);
    }, [JSON.stringify(fieldList)]);

    const handleChangeField = (val: any): void => {
      setErrors({ ...errors, ...validateField(val) });
      const type = fieldListFilter(val)?.type;
      const formatType = transformType ? transformType(type) : type;

      onChange({
        ...value,
        operation: typeOption[formatType].includes(value?.operation) ? value.operation : typeOption[formatType][0],
        field: val,
        value: type !== fieldType ? undefined : value?.value,
      });

      setFieldType(type);
    };

    const handleChangeOperation = (val: any): void => {
      const newData: any = { ...value, operation: val, value: undefined };
      if (val === 'true') newData.value = true;
      if (val === 'false') newData.value = false;
      onChange(newData);
      if (val === 'exist' || val === 'not_exist' || val === 'not_empty' || val === 'empty') {
        setErrors((item) => ({ ...item, value: '' }));
      }
    };

    const handleChangeValueFrom = (val: any): void => {
      onChange({ ...value, value_from: val });
    };

    const handleValueChange = (val: any): void => {
      setErrors({ ...errors, ...validateValue(val) });
      onChange({ ...value, value: val });
    };

    /** input 值变化 */
    const handleStringValueChange = (e: any): void => {
      setErrors({ ...errors, ...validateValue(e.target.value) });
      onChange({ ...value, value: e.target.value });
    };

    const fields = _.groupBy(fieldList || [], 'type');

    const renderItem = (formatType: any, operation: any): JSX.Element => {
      if (formatType === 'boolean') {
        return <></>;
      }
      if (operation === 'exist' || operation === 'not_exist' || operation === 'not_empty' || operation === 'empty') {
        return <></>;
      }

      if (aryOperation.includes(operation)) {
        return (
          <Select
            mode="tags"
            value={value.value ?? undefined}
            disabled={disabled}
            onChange={(value) => {
              if (formatType === 'number') {
                value = _.map(value, (item) => {
                  const match = item.match(/-?\d+(\.\d+)?/);
                  if (match) return Number.parseFloat(item);
                  return '';
                });
              }
              value = _.filter(value, (item) => !!item);
              handleValueChange(value);
            }}
          />
        );
      }

      if (formatType === 'number') {
        return <NumberItem value={value} disabled={disabled} validateValueError={validateValueError} onChange={onChange} />;
      }

      if (formatType === 'date' && operation === 'before') {
        return <DateBefore value={value.value ?? undefined} onChange={handleValueChange} />;
      }
      if (formatType === 'date' && operation === 'current') {
        return <DateCurrent value={value.value ?? undefined} onChange={handleValueChange} />;
      }
      if (formatType === 'date' && operation === 'between') {
        return <DateBetween value={value.value ?? undefined} onChange={handleValueChange} />;
      }

      return (
        <Input
          value={value?.value}
          disabled={disabled}
          onChange={handleStringValueChange}
          placeholder={getLocaleValue('pleaseInputValue', { localeZh }, { localeEn })}
        />
      );
    };

    const hasValue = value.operation !== 'exist' && value.operation !== 'not_exist' && value.operation !== 'not_empty' && value.operation !== 'empty';

    return (
      <div className={classNames(styles['filter-item'])}>
        <div className={classNames(styles['field-col'], { [styles['error-item']]: !!errors?.name })}>
          <Select
            showSearch
            value={value?.field}
            disabled={disabled}
            placeholder={getLocaleValue('pleaseSelectValue', { localeZh }, { localeEn })}
            getPopupContainer={(triggerNode): HTMLElement => triggerNode.parentNode as HTMLElement}
            onChange={handleChangeField}
            options={_.map(Object.keys(fields), (key) => {
              return {
                label: key,
                title: key,
                options: _.map(fields?.[key], (item) => {
                  const { name, display_name } = item;
                  return { value: name || display_name, label: display_name || name };
                }),
              };
            })}
          />
          {errors?.name ? <div className={styles['error-tip']}>{errors?.name}</div> : <></>}
        </div>
        <div className={classNames(styles['operation-col'])}>
          <Select
            value={value?.operation}
            disabled={disabled}
            placeholder="请选择"
            onChange={handleChangeOperation}
            options={_.map(typeOption[formatType], (item) => ({ value: item, label: getLocaleValue(item, { localeZh }, { localeEn }) }))}
          />
        </div>
        {hasValue && (
          <div className={classNames(styles['operation-col'])}>
            <Select
              value={valueForms[0]}
              disabled={disabled}
              onChange={handleChangeValueFrom}
              options={_.map(valueForms, (item) => ({ value: item, label: getLocaleValue(item, { localeZh }, { localeEn }) }))}
            />
          </div>
        )}
        {hasValue && (
          <div className={classNames(styles['value-col'], { [styles['error-item']]: !!errors?.value })}>
            {renderItem(formatType, value.operation)}
            {errors?.value ? <div className={styles['error-tip']}>{errors?.value}</div> : <></>}
          </div>
        )}
      </div>
    );
  }
);

export default DataFilterItem;
