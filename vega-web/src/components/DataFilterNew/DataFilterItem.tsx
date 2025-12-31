/*
 * @Description: 数据过滤项
 * @Author: coco.chen
 * @Date: 2023-08-07 11:00:07
 */
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Input, Select } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import ObjectSelector from '@/components/ObjectSelector';
import getLocaleValue from '@/utils/get-locale-value';
import DateBefore from './components/DateBefore';
import DateBetween from './components/DateBetween';
import DateCurrent from './components/DateCurrent';
import NumberItem from './components/NumberItem';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import { Item } from './type';

export const defaultTypeOption = {
  number: ['==', '!=', '<', '<=', '>', '>=', 'in', 'not_in'],
  string: ['==', '!=', 'empty', 'not_empty', 'in', 'not_in'],
  boolean: ['true', 'false'],
  date: [],
};

const typeLabels: any = {
  number: '数值',
  string: '字符串',
  boolean: '布尔',
  date: '时间类型',
};

// 右侧值为数组的操作符
const aryOperation = ['in', 'not_in', 'contain', 'not_contain'];

interface DataFilterItemProps {
  objectOptions: any[];
  disabled?: boolean;
  value: Item;
  onChange: (Item: any) => void;
  transformType?: (string: any) => string;
  typeOption?: { [key: string]: string[] };
}

interface ObjectType {
  id: string;
  name: string;
  data_properties: Array<{
    name: string;
    display_name: string;
    type: string;
  }>;
}

const DataFilterItem = forwardRef(
  ({ objectOptions, value, disabled = false, transformType, typeOption = defaultTypeOption, onChange }: DataFilterItemProps, ref) => {
    // 对象类
    const [objectTarget, setObjectTarget] = useState<ObjectType | undefined>(undefined);

    // 构建属性选项
    const fields = useMemo(() => {
      const dataProperties = objectTarget?.data_properties.map((property: any) => ({
        ...property,
        formateTypeLabel: typeLabels[transformType?.(property.type) || property.type] || '',
      }));
      return _.groupBy(dataProperties || [], 'formateTypeLabel');
    }, [objectTarget?.data_properties]);

    const [fieldType, formatType] = useMemo(() => {
      const fieldType = objectTarget?.data_properties.find((property: any) => property.name === value.field)?.type || '';
      const formatType = transformType?.(fieldType) || fieldType;

      return [fieldType, formatType];
    }, [value]);

    useImperativeHandle(ref, () => ({ validate: () => false }));

    /** 更换对象类 */
    const handleChangeObject = (val: string, objectTarget: ObjectType): void => {
      if (value.object_type_id !== val) {
        // 清空属性、操作符、值
        onChange({ ...value, object_type_id: val, operation: undefined, field: undefined, value: undefined });
      } else {
        onChange({ ...value, object_type_id: val });
      }

      setObjectTarget(objectTarget);
    };

    /** 更换属性 */
    const handleChangeField = (val: any): void => {
      const type = objectTarget?.data_properties.find((property: any) => property.name === val)?.type || '';
      const formatType = transformType?.(type) || type;

      onChange({
        ...value,
        operation: typeOption[formatType].includes(value?.operation) ? value.operation : typeOption[formatType][0],
        field: val,
        value: type !== fieldType ? undefined : value?.value,
      });
    };

    /** 更换操作符 */
    const handleChangeOperation = (val: any): void => {
      const newData: any = { ...value, operation: val, value: undefined };
      if (val === 'true') newData.value = true;
      if (val === 'false') newData.value = false;
      onChange(newData);
    };

    /** 更新属性值 */
    const handleValueChange = (val: any): void => {
      onChange({ ...value, value: val });
    };

    /** input 值变化 */
    const handleStringValueChange = (e: any): void => {
      onChange({ ...value, value: e.target.value });
    };

    const renderItem = (formatType: string, operation: any): JSX.Element => {
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
        return <NumberItem value={value} disabled={disabled} validateValueError={() => {}} onChange={onChange} />;
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

    const hasValue =
      formatType !== 'date' && value.operation !== 'exist' && value.operation !== 'not_exist' && value.operation !== 'not_empty' && value.operation !== 'empty';

    return (
      <div className={classNames(styles['filter-item'])}>
        <div className={styles['object-col']}>
          <ObjectSelector objectOptions={objectOptions} value={value.object_type_id} onChange={handleChangeObject} disabled={disabled} />
        </div>
        <div className={classNames(styles['field-col'])}>
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
                  return { value: name, label: display_name };
                }),
              };
            })}
          />
        </div>

        {
          /** 日期类型，屏蔽操作符 */
          formatType !== 'date' && (
            <div className={classNames(styles['operation-col'])}>
              <Select
                value={value?.operation}
                disabled={disabled}
                placeholder="请选择"
                onChange={handleChangeOperation}
                options={_.map(typeOption[formatType], (item) => ({ value: item, label: getLocaleValue(item, { localeZh }, { localeEn }) }))}
              />
            </div>
          )
        }

        {hasValue && <div className={styles['value-col']}>{renderItem(formatType, value.operation)}</div>}
      </div>
    );
  }
);

export default DataFilterItem;
