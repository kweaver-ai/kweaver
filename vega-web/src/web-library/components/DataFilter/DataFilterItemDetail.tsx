import { useMemo, useEffect, useState } from 'react';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import classNames from './classNames';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import { FieldList, Item } from './type';
import { defaultTypeOption } from './utils';
import getLocaleValue from '../../utils/get-locale-value';

const cs = classNames.bind(styles);

// 右侧值为数组的操作符
const aryOperation = ['in', 'not_in', 'contain', 'not_contain'];
/**
 * 有效的值来源
 * @returns 常量  const ，value内容即需要比较的值
 * @returns 字段  field，value内容为字段名称，意思是比较两个字段的内容
 * @returns 用户 user，value内容为当前用户的某个属性字段，意思是取当前用户的某个属性字段的值作为比较的值
 */
const valueFroms = ['const'];

interface DataFilterItemProps {
  fieldList: FieldList[];
  value: Item;
  onChange: (Item: any) => void;
  transformType?: (type: string) => string;
  required: boolean;
  typeOption?: { [key: string]: string[] };
  disabled?: boolean;
}

const DataFilterItemDetail = ({ fieldList, value, onChange, transformType, typeOption = defaultTypeOption }: DataFilterItemProps): JSX.Element => {
  const fieldListFilter = (val: any): FieldList => {
    return fieldList?.filter((i) => (i.display_name && i.display_name === val) || i.name === val)[0];
  };
  const [fieldType, setFieldType] = useState(fieldListFilter(value.field)?.type);

  const formatType = useMemo(() => {
    return transformType ? transformType(fieldType || 'number') : fieldType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldType]);

  useEffect(() => {
    const type = fieldListFilter(value?.field)?.type;

    if (!type) {
      return;
    }

    const formatType = transformType && type ? transformType(type) : type;

    onChange({
      operation: typeOption[formatType].includes(value?.operation) ? value.operation : typeOption[formatType][0],
      field: value?.field,
      value: type === fieldType || !fieldType ? value?.value : undefined,
    });

    setFieldType(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fieldList)]);

  const renderItem = (formatType: any, val: any): JSX.Element => {
    const { operation } = val;

    if (operation === 'exist' || operation === 'not_exist' || operation === 'not_empty' || operation === 'empty') {
      return <></>;
    }
    let curVal = val.value;

    if (aryOperation.includes(operation)) {
      curVal = curVal?.map((value: any) => (
        <Tag className={styles.ellipsis} title={value} key={value}>
          {value}
        </Tag>
      ));
    }

    if (formatType === 'number' && (operation === 'range' || operation === 'out_range')) {
      return (
        <div className={styles['range-wrapper']}>
          <div className={cs('range-wrapper-item', 'detail-col')}>{value?.value[0]}</div>
          <span className={styles['split-space']}>-</span>
          <div className={cs('range-wrapper-item', 'detail-col')}>{value?.value[1]}</div>
        </div>
      );
    }

    if (formatType === 'date' && (operation === 'match' || operation === 'match_phrase')) {
      curVal = curVal ? dayjs(curVal).format('YYYY-MM-DD HH:mm:ss') : '';
    } else if (formatType === 'date') {
      curVal =
        value.value?.length === 2 ? `${dayjs(value.value[0]).format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs(value.value[1]).format('YYYY-MM-DD HH:mm:ss')}` : '';
    }

    return <div className={cs('detail-col')}>{curVal}</div>;
  };

  return (
    <div className={cs('filter-item')}>
      <div className={cs('field-col', 'detail-col')} title={value?.field}>
        {value?.field}
      </div>
      <div className={cs('operation-col', 'detail-col')}>{value?.operation ? getLocaleValue(value?.operation, { localeZh }, { localeEn }) : ''}</div>
      {value?.operation !== 'exist' && value?.operation !== 'not_exist' && value.operation !== 'not_empty' && value.operation !== 'empty' && (
        <div className={cs('operation-col', 'detail-col')}>{getLocaleValue(valueFroms[0], { localeZh }, { localeEn })}</div>
      )}
      <div className={cs('value-col')}>{renderItem(formatType, value)}</div>
    </div>
  );
};

export default DataFilterItemDetail;
