import React, { Fragment } from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import { useDynamicList } from 'ahooks';
import { Collapse } from 'antd';
import classNames from 'classnames';
import _classNames from './classNames';
import DataFilterItem from './DataFilterItemDetail';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';
import LogicalOperationDetail from './LogicalOperationDetail';
import { DataFilterProps, PrimaryFilterItem, PrimaryFilterValue, DataFilterValue } from './type';
import { transformType as defaultTransformType } from './utils';
import getLocaleValue from '../../utils/get-locale-value';

const cs = _classNames.bind(styles);

const MultistageFilter = ({
  defaultValue = {
    field: undefined,
    value: null,
    operation: '==',
    value_from: 'const',
  },
  value,
  level = 1,
  maxCount = [5],
  fieldList = [],
  transformType,
  typeOption,
  isCollapse,
  isCollapseOpen = false,
  collapseLabel,
  ...restProps
}: DataFilterProps): JSX.Element => {
  const getValue = (value: any): PrimaryFilterItem[] => (value as PrimaryFilterValue)?.sub_conditions || [value || defaultValue];

  const { list, remove, getKey, replace } = useDynamicList<DataFilterValue>(getValue(value));

  const RowItem = (item: any, index: any): React.ReactNode => {
    return (
      <Fragment key={`${getKey(index)}${level}`}>
        {!item.sub_conditions ? (
          <div className={styles['row-wrapper-detail']}>
            <DataFilterItem
              fieldList={[...fieldList, { name: '*', type: 'all Fields' }]}
              typeOption={typeOption}
              transformType={transformType || defaultTransformType}
              value={item}
              onChange={(val): void => {
                replace(index, { ...item, ...val });
              }}
              required
            />
          </div>
        ) : (
          <MultistageFilter
            level={level - 1}
            value={item}
            fieldList={[...fieldList, { name: '*', type: 'all Fields' }]}
            typeOption={typeOption}
            maxCount={maxCount}
            onChange={(value): void => {
              replace(index, value);
            }}
            onDelete={(): void => {
              remove(index);
            }}
            {...restProps}
          ></MultistageFilter>
        )}
      </Fragment>
    );
  };

  const isShow = !!value?.sub_conditions && list.length > 1;
  const isShowAdd = !!value?.sub_conditions && list.length > 1 && list.length < maxCount[level - 1];

  if (isCollapse) {
    return (
      <Collapse
        bordered={false}
        defaultActiveKey={isCollapseOpen ? ['filter'] : []}
        style={{ backgroundColor: 'transparent' }}
        className={styles['filter-transparent']}
        expandIcon={({ isActive }): JSX.Element => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      >
        <Collapse.Panel header={collapseLabel ?? getLocaleValue('filter', { localeZh }, { localeEn })} key="filter">
          <div className={cs({ 'logical-wrapper-detail': isShow })}>
            {isShow && (
              <LogicalOperationDetail className={classNames({ 'g-mb-5': isShowAdd })} value={(value as PrimaryFilterValue)?.operation}></LogicalOperationDetail>
            )}
            <div className={cs('filter-wrapper')}>{list.map((item, index) => RowItem(item, index))}</div>
          </div>
        </Collapse.Panel>
      </Collapse>
    );
  }

  return (
    <div className={cs({ 'logical-wrapper-detail': isShow })}>
      {isShow && (
        <LogicalOperationDetail className={classNames({ 'g-mb-5': isShowAdd })} value={(value as PrimaryFilterValue)?.operation}></LogicalOperationDetail>
      )}
      <div className={cs('filter-wrapper')}>{list.map((item, index) => RowItem(item, index))}</div>
    </div>
  );
};

export default MultistageFilter;
