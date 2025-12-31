/**
 * 表格的操作条组件
 * 包含Button、Input、Select.LabelSelect、Dropdown(排序)、Button.Icon(刷新)元素
 * 其中Input、Dropdown(排序)、Button.Icon(刷新)元素为固定存在元素，所以通过props的{ nameConfig, sortConfig, onRefresh }来控制其行为
 * Button、Select.LabelSelect通过children来注入渲染
 * 其中Input、Select.LabelSelect需要指定key，并且通过props.initialFilter进行初始化，如有变化会通过props.onChange返回
 */
import React, { useMemo, useState, ReactElement, useCallback } from 'react';
import { RedoOutlined } from '@ant-design/icons';
import _ from 'lodash';
import styles from './index.module.less';
import Items from './Items';
import SortButton, { type SortButtonProps } from './SortButton';
import { Input, Button, IconFont, Select } from '../../index';

const useForceUpdate = () => {
  const [, setValue] = useState(0);
  return useCallback(() => {
    setValue((val: number) => (val + 1) % (Number.MAX_SAFE_INTEGER - 1));
  }, []);
};

type OperationProps = {
  children: React.ReactNode;
  isControlFilter?: boolean;
  showFilter?: boolean;
  nameConfig?: any;
  sortConfig?: SortButtonProps;
  initialFilter?: any;
  onChange?: (values: any) => void;
  onRefresh?: () => void;
};
const Operation: React.FC<OperationProps> = (props) => {
  const { children, nameConfig, sortConfig, initialFilter, onChange, onRefresh, showFilter: _showFilter = true, isControlFilter = false } = props;
  const { key: ncKey, placeholder: ncPlaceholder = '请输入名称' } = nameConfig || {}; // 这样是为了注入时避免key的二次传递

  const forceUpdate = useForceUpdate();
  const [page, setPage] = useState(0);
  const [showFilter, setShowFilter] = useState(_showFilter); // 是否显示筛选条
  const [filterValue, setFilterValue] = useState<string>('');
  const filterValues = React.useRef<any>({ [ncKey as string]: '', ...initialFilter });

  const handleChange = (key: string, value: string) => {
    filterValues.current[key] = value;
    onChange?.(filterValues.current);
    forceUpdate();
  };

  const onSearch = _.debounce((e) => {
    const value = e?.target?.value;
    setFilterValue(value);
    handleChange(ncKey || 'name', value);
  }, 300);

  const { buttonItems, filterItems } = useMemo(() => {
    const buttonItems: ReactElement[] = [];
    const filterItems: ReactElement[] = [];

    // 遍历子元素，筛选出 Button 组件和 Select 组件
    const _children = _.isArray(children) ? children : [children];
    _.forEach(_children as ReactElement[], (child: ReactElement) => {
      if (child?.type === Select.LabelSelect) {
        filterItems.push(child);
      } else {
        buttonItems.push(child);
      }
    });
    return { buttonItems, filterItems };
  }, [children]);

  // 为 select 组件添加 onChange 事件，统一处理 filter
  const filterElement = React.useMemo(() => {
    if (_.isEmpty(filterItems)) return null;
    return _.map(filterItems, (child: ReactElement) => {
      if (!React.isValidElement(child)) return child;

      const key = child.key || '';
      const childProps = (child as ReactElement).props;
      const enhancedProps: Record<string, any> = {};

      // 如果筛选条件里没有 Select 的初始值，把 Select 的第一个选线的值作为初始值
      if (!(key in filterValues.current)) filterValues.current[key] = childProps.options[0].value;

      enhancedProps.value = filterValues.current[key];
      enhancedProps.onChange = (value: string) => {
        childProps.onChange?.(value);
        enhancedProps.value = value;
        handleChange(key, value);
      };

      return React.cloneElement(child, enhancedProps);
    });
  }, [page, filterItems, JSON.stringify(filterValues.current)]);

  const filterLength = filterItems?.length || 0;
  const noFilter = filterLength === 0; // 没有筛选条件的时候
  const oneFilter = filterLength === 1; // 只有一个筛选条件的时候
  const moreFilter = filterLength > 1; // 有多个筛选条件的时候
  const hasSortButton = !_.isEmpty(sortConfig); // 是否展示排序按钮
  const hasRefreshButton = !!onRefresh; // 是否展示刷新按钮
  const pageSize = 3; // 每页展示的筛选条件数量

  return (
    <div>
      <div className={styles['table-operation-bar']}>
        <Items>{buttonItems}</Items>
        <div className="g-flex-center">
          {(oneFilter || noFilter) &&
            !isControlFilter && ( // 只有一个筛选条件或者没有筛选条件的时候
              <React.Fragment>
                <Input.Search allowClear style={{ width: 250, marginRight: noFilter ? 12 : 0 }} placeholder={ncPlaceholder} onChange={onSearch} />
                {!noFilter && <div className="g-ml-3 g-mr-3">{filterElement}</div>}
              </React.Fragment>
            )}
          {(moreFilter || isControlFilter) && ( // 有多个筛选条件的时候
            <Button.Icon
              title="展开"
              icon={<IconFont type="icon-dip-filter" />}
              style={{ backgroundColor: showFilter ? 'rgba(0,0,0,0.04)' : '#ffffff' }}
              onClick={() => setShowFilter(!showFilter)}
            />
          )}
          {hasSortButton && <SortButton {...sortConfig} />}
          {hasRefreshButton && (
            <Button.Icon
              title="刷新"
              icon={<RedoOutlined style={{ fontSize: 16, color: 'rgba(0, 0, 0, .5)', transform: 'rotate(-90deg)' }} />}
              onClick={() => onRefresh()}
            />
          )}
        </div>
      </div>
      {showFilter &&
        (moreFilter || isControlFilter) && ( // 有多个筛选条件的时候
          <div className={styles['table-operation-filter-bar']}>
            <div style={{ flex: 1 }}>
              <Input.Spell
                allowClear
                placeholder={ncPlaceholder}
                value={filterValue}
                prefix={<IconFont type="icon-dip-search" style={{ color: '#d9d9d9', paddingRight: 4 }} />}
                style={{ paddingLeft: 8, boxShadow: 'none', background: 'transparent', borderColor: 'transparent' }}
                onChange={onSearch}
              />
            </div>

            {filterElement?.length !== 0 && <Items>{filterElement?.slice(page * pageSize, (page + 1) * pageSize)}</Items>}
            {filterLength > pageSize && (
              <React.Fragment>
                <Button.Icon className="g-ml-2" icon={<IconFont type="icon-dip-left" />} disabled={page === 0} onClick={() => setPage(page - 1)} />
                <Button.Icon
                  icon={<IconFont type="icon-dip-right" />}
                  disabled={page === Math.floor(filterLength / pageSize)}
                  onClick={() => setPage(page + 1)}
                />
              </React.Fragment>
            )}
            <Button.Icon icon={<IconFont type="icon-dip-close" />} onClick={() => setShowFilter(false)} />
          </div>
        )}
    </div>
  );
};

export default Operation;
