/** @Description: 多级过滤器 */

import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useDynamicList, useUpdateEffect } from 'ahooks';
import classNames from 'classnames';
import _ from 'lodash';
import { formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import DataFilterItem from './DataFilterItem';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import LogicalOperation from './LogicalOperation';
import { DataFilterProps, PrimaryFilterItem, PrimaryFilterValue, DataFilterValue } from './type';
import { transformType as defaultTransformType } from './utils';
import { Button, IconFont } from '../../common';
import getLocaleValue from '../../utils/get-locale-value';

const MultistageFilter = forwardRef((props: DataFilterProps, ref) => {
  const {
    value: valueProp,
    onChange,
    disabled = false,
    defaultValue = { field: undefined, value: null, operation: '==', value_from: 'const' },
    fieldList,
    typeOption,
    level = 1,
    maxCount = [5],
    btnText,
    transformType,
    required,
    isHidden = false,
    isFirst = false,
    onDelete,
  } = props;
  const value = formatKeyOfObjectToLine(valueProp || {});

  const getValue = (value: any): PrimaryFilterItem[] => (value as PrimaryFilterValue)?.sub_conditions || [value || defaultValue];

  const { list, remove, getKey, push, replace, resetList } = useDynamicList<DataFilterValue>(getValue(value));

  const filterRef = useRef<{ [key: string]: { validate: (required: any) => boolean } }>({});

  const validate = (required: any): boolean => {
    return Object.keys(filterRef.current)
      .map((key) => filterRef.current[key].validate(required))
      .some((value) => value === true);
  };

  useImperativeHandle(ref, () => ({ validate }));

  useEffect(() => {
    onProxyChange();
  }, [JSON.stringify(list)]);
  const onProxyChange = _.debounce(() => {
    onChange && onChange(list.length > 1 ? { ...value, sub_conditions: list } : list[0]);
    if (list.length === 1 && list[0]?.sub_conditions) resetList(list[0]?.sub_conditions);
  }, 100);
  useEffect(() => {
    if ((value as any) === false) {
      resetList(getValue([defaultValue]));
      if (onChange) onChange(list.length > 1 ? { ...value, sub_conditions: list } : list[0]);
    }
  }, [JSON.stringify(valueProp)]);

  useEffect(() => {
    return () => {
      filterRef.current = {};
    };
  }, [list.length]);

  useUpdateEffect(() => {
    validate(false);
  }, [JSON.stringify(fieldList)]);

  const RowItem = (item: any, index: any): React.ReactNode => {
    const hiddenDeleteButton = !isHidden && list.length === 1 && isFirst;
    const hiddenAddButton = (level <= 1 && !isFirst) || (isFirst && level === 1 && list.length > 1) || level === 0;
    return (
      <React.Fragment key={`${getKey(index)}${level}`}>
        {!item.sub_conditions ? (
          <div className={styles['row-wrapper']}>
            <DataFilterItem
              ref={(ref: any): void => {
                if (ref && filterRef.current) filterRef.current[getKey(index)] = ref;
              }}
              value={item}
              disabled={disabled}
              fieldList={fieldList}
              typeOption={typeOption}
              transformType={transformType || defaultTransformType}
              required
              onChange={(val) => replace(index, { ...item, ...val })}
            />
            {!disabled && (
              <div>
                <Button.Icon
                  className={classNames('g-ml-1', { 'g-display-none': hiddenDeleteButton })}
                  icon={<IconFont type="icon-delete1" style={{ fontSize: 16 }} />}
                  onClick={() => (list.length > 1 ? remove(index) : isHidden ? resetList([]) : onDelete && onDelete())}
                />
                <Button.Icon
                  className={classNames({ 'g-ml-1': hiddenDeleteButton, 'g-display-none': hiddenAddButton })}
                  icon={<IconFont type="icon-add" style={{ fontSize: 16 }} />}
                  onClick={() => replace(index, { operation: 'and', sub_conditions: [item, defaultValue] })}
                />
              </div>
            )}
          </div>
        ) : (
          <React.Fragment>
            <MultistageFilter
              ref={(ref: any): void => {
                if (ref && filterRef.current) filterRef.current[getKey(index)] = ref;
              }}
              value={item}
              onChange={(value: any) => replace(index, value)}
              disabled={disabled}
              defaultValue={defaultValue}
              fieldList={fieldList}
              typeOption={typeOption}
              level={level - 1}
              maxCount={maxCount}
              btnText={btnText}
              transformType={transformType}
              required={required}
              isHidden={isHidden}
              isFirst={isFirst}
              onDelete={(): void => remove(index)}
            />
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  const isShow = !!value?.sub_conditions && list.length > 1;
  const isShowAdd = !!value?.sub_conditions && list.length > 1 && list.length < maxCount[level - 1];
  const isShowHidden = list.length === 0 && isHidden;

  return (
    <div
      className={classNames({ [styles['logical-wrapper']]: isShow })}
      style={{ padding: 12, paddingBottom: 4, border: '1px solid rgba(0,0,0,.1)', borderRadius: 8 }}
    >
      {isShow && (
        <LogicalOperation
          className={classNames({ 'g-mb-5': isShowAdd })}
          onChange={(val) => {
            onChange && onChange({ ...(value as PrimaryFilterValue), operation: val });
          }}
          disabled={disabled}
          value={(value as PrimaryFilterValue)?.operation}
        />
      )}
      <div className={styles['filter-wrapper']}>
        {_.map(list, (item, index) => RowItem(item, index))}
        {(isShowAdd || isShowHidden) && !disabled ? (
          <Button.Link icon={<IconFont type="icon-add" />} onClick={() => push(defaultValue)}>
            {btnText || getLocaleValue('addFilter', { localeZh }, { localeEn })}
          </Button.Link>
        ) : null}
      </div>
    </div>
  );
});

export default MultistageFilter;
