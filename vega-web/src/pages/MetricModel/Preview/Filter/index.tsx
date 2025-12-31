/** 数据预览*/
import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined } from '@ant-design/icons';
import { Radio, Select, Dropdown } from 'antd';
import _ from 'lodash';
import AddTag from '@/components/AddTag';
import AddTagBySort from '@/components/AddTagBySort';
import ResultFilter from '@/components/ResultFilter';
import DateRange from '@/components/TimeFilter/DateRange';
import QuickTags from '@/components/TimeFilter/QuickTags';
import { METRICS_OPTIONS, STEP_OPTIONS_DSL, STEP_OPTIONS_SQL } from '@/hooks/useConstants';
import arGuid from '@/utils/ar-guid';
import { deduplicateObjects } from '@/utils/common';
import { Text, Button, IconFont } from '@/web-library/common';
import UTILS from '@/web-library/utils';
import CustomMetrics from './CustomMetrics';
import styles from './index.module.less';

const Filter = (props: any) => {
  const { INIT_FILTER, source, loading, previewData, filter, stepsOptionsIsSql, SEARCH_TYPE, getData, onChangeFilter } = props;
  const { searchType, timeRange, step, list, analysisDimensions, havingCondition, orderByFields } = filter;
  const groupByFields = previewData?.formulaConfig?.groupByFieldsDetail || previewData?.groupByFieldsDetail || [];
  const analysisDimensionsOptions = previewData?.analysisDimensions;
  const groupByFieldsKV = { ..._.keyBy(groupByFields, 'name'), ..._.keyBy(analysisDimensionsOptions, 'name') };
  const [timeRangeType, setTimeRangeType] = useState<string>('quick'); // 时间范围变更类型
  const [metricsType, setMetricsType] = useState<number>(6); // 同环比
  const [openCustomMetrics, setOpenCustomMetrics] = useState(false);
  const [metricsOptions, setMetricsOptions] = useState<any>({
    1: METRICS_OPTIONS.YEAR_ON_YEAR,
    2: METRICS_OPTIONS.MONTH_ON_MONTH,
    3: METRICS_OPTIONS.QUARTER_ON_QUARTER,
    4: METRICS_OPTIONS.CUSTOM_DEFAULT,
    5: METRICS_OPTIONS.PROPORTION,
    6: METRICS_OPTIONS.NONE,
  }); // 同环比选项
  const [sortFieldList, setSortFieldList] = useState<any[]>([]);
  const [resultFilter, setResultFilter] = useState<boolean>(false); // 结果过滤开关

  const { keyOptions, valueOptions } = useMemo(() => {
    const valueOptions = new Map();
    const keyOptions = source?.reduce((prev: string[], { labels }: any) => {
      _.forEach(labels, (value = '--', key) => {
        !prev.includes(key) && prev.push(key);
        valueOptions.has(key) ? valueOptions.set(key, valueOptions.get(key).add(value)) : valueOptions.set(key, new Set([value]));
      });

      return prev;
    }, []);

    return { keyOptions, valueOptions };
  }, [JSON.stringify(source)]);

  useEffect(() => {
    if (previewData?.sortFieldList?.length) {
      setSortFieldList(previewData?.sortFieldList);
    }

    if (previewData?.id) {
      let sortList: any[] = [
        {
          displayName: intl.get('Global.value'),
          name: '__value',
          type: 'number',
        },
      ];
      const analysisDimensionsFilter = previewData?.analysisDimensions?.filter((item: any) => [analysisDimensions || []].includes(item.name)) || [];
      if (previewData?.metricType === 'atomic') {
        // 值+ 分组信息+选中的分析维度
        sortList.push(...groupByFields);
        sortList.push(...analysisDimensionsFilter);
        sortList = deduplicateObjects(sortList, 'name');
      } else {
        sortList.push(...analysisDimensionsFilter);
      }
      setSortFieldList(sortList);
    }
  }, [previewData, analysisDimensions]);

  /** 筛选条件变更 */
  const onChange = (key: string, value: any) => {
    const newFilter = _.cloneDeep(filter);
    newFilter[key] = value;
    onChangeFilter(newFilter);
  };

  /** 时间范围类型切换 */
  const onChangeRangeType = (key: string) => setTimeRangeType(key);

  /** 添加筛选条件 */
  const onAddList = () => {
    const newFilter = _.cloneDeep(filter);
    newFilter.list = [...newFilter.list, { id: arGuid(), selectValue: undefined, inputValue: undefined }];
    onChangeFilter(newFilter);
  };
  /** 删除筛选条件 */
  const onDelList = (i: any) => {
    const newFilter = _.cloneDeep(filter);
    newFilter.list = _.filter(newFilter.list, (_item: any, index) => index !== i);
    onChangeFilter(newFilter);
  };
  /** 筛选条件变更 */
  const onChangeList = (value: any, item: any, key: any) => {
    const newFilter = _.cloneDeep(filter);
    const newData = { ...item, [key]: value };
    newFilter.list = _.map(newFilter.list, (item: any) => (item.id === newData.id ? newData : item));
    onChangeFilter(newFilter);
  };

  /** 同环比变更 */
  const onChangeMetrics = (event: any) => {
    const value = event.target.value;
    setMetricsType(value);
    const metrics = metricsOptions[value];
    const newFilter = _.cloneDeep(filter);
    newFilter.metrics = metrics;
    onChangeFilter(newFilter);
  };

  /** 结果排序变更 */
  const onChangeResultSort = (value: any) => {
    const newFilter = _.cloneDeep(filter);
    newFilter.orderByFields = value;
    onChangeFilter(newFilter);
  };

  /** 结果过滤变更 */
  const onChangeResultFilter = (value: any) => {
    const newFilter = _.cloneDeep(filter);
    newFilter.havingCondition = value;
    onChangeFilter(newFilter);
  };

  const onOpenCustom = () => setOpenCustomMetrics(true);
  const onCloseCustom = () => setOpenCustomMetrics(false);
  const onSubmitCustom = (data: any) => {
    const newMetricsOptions = _.cloneDeep(metricsOptions);
    newMetricsOptions[4] = data;
    setMetricsOptions(newMetricsOptions);
    const newFilter = _.cloneDeep(filter);
    newFilter.metrics = data;
    setMetricsType(4);
    onChangeFilter(newFilter);
  };

  /** 重置 */
  const onReset = () => {
    setMetricsType(6);
    onChangeFilter(INIT_FILTER);
    setTimeout(() => {
      getData();
    }, 500);
  };

  return (
    <div className={styles['preview-filter-root']}>
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', paddingRight: 24 }}>
        {/* 查询类型变更 */}
        <div>
          <Text className={styles['search-label']}>{intl.get('Global.queryTypeLabel')}</Text>
          <Radio.Group
            value={searchType}
            block
            disabled={loading}
            optionType="button"
            options={[
              { value: SEARCH_TYPE.INSTANT, label: intl.get('Global.instant') },
              { value: SEARCH_TYPE.RANGE, label: intl.get('MetricModel.trendQuery') },
            ]}
            onChange={(event) => onChange('searchType', event.target.value)}
          />
        </div>
        {/* 时间范围变更  */}
        <div className="g-mt-3">
          <Text className={styles['search-label']}>{intl.get('MetricModel.timeRange')}</Text>
          <Radio.Group
            value={timeRangeType}
            options={[
              { value: 'quick', label: intl.get('Global.quickRange') },
              { value: 'custom', label: intl.get('MetricModel.customSelect') },
            ]}
            onChange={(event) => onChangeRangeType(event.target.value)}
          />
          <div className="g-mt-2">
            {timeRangeType === 'quick' && (
              <Dropdown
                trigger={['click']}
                destroyOnHidden
                popupRender={() => {
                  return (
                    <div className="g-dropdown-menu-root" style={{ width: 450 }}>
                      <QuickTags timeRange={timeRange} onFilterChange={(value: any) => onChange('timeRange', value)} />
                    </div>
                  );
                }}
              >
                <div className={styles['quick-tags']}>
                  {intl.get(`MetricModel.quickRangeTime.${timeRange.label}`) || intl.get('MetricModel.pleaseSelectTime')}
                </div>
              </Dropdown>
            )}
            {timeRangeType === 'custom' && <DateRange timeRange={timeRange} onFilterChange={(value: any) => onChange('timeRange', value)} />}
          </div>
        </div>

        {/* 趋势查询 - 步长变更 */}
        {searchType === SEARCH_TYPE.RANGE && (
          <div className="g-mt-3">
            <Text className={styles['search-label']}>{intl.get('MetricModel.step')}</Text>
            <Select
              value={step}
              className="g-w-100"
              placeholder={intl.get('Global.pleaseSelect')}
              options={
                (stepsOptionsIsSql
                  ? [...STEP_OPTIONS_SQL].map((item) => ({ value: item.value, label: intl.get(item.labelKey) }))
                  : [...STEP_OPTIONS_DSL].map((item) => ({ value: item.value, label: `${item.labelPrefix}${intl.get(item.labelKey)}` }))) as any
              }
              onChange={(value) => onChange('step', value)}
            />
          </div>
        )}

        {/* 分组字段 */}
        {groupByFields && (
          <div className="g-mt-3">
            <Text className={styles['search-label']}>{intl.get('MetricModel.groupField')}</Text>
            <AddTag options={groupByFields} value={groupByFields} canSelect={false} disabled={true} />
          </div>
        )}

        {/* 分析维度 */}
        {analysisDimensionsOptions && (
          <div className="g-mt-3">
            <Text className={styles['search-label']}>{intl.get('MetricModel.analysisDimension')}</Text>
            <Select
              className="g-w-100"
              mode="tags"
              allowClear
              value={analysisDimensions}
              placeholder={intl.get('Global.pleaseSelectOption')}
              options={_.map(analysisDimensionsOptions, (item) => {
                const icon = UTILS.formatIconByType(item?.type);
                return {
                  value: item.name,
                  label: (
                    <span>
                      <IconFont className="g-mr-1" type={icon} />
                      {item?.displayName}
                    </span>
                  ),
                };
              })}
              onChange={(value: any) => onChange('analysisDimensions', value)}
            />
          </div>
        )}

        {/* 筛选 */}
        <div className="g-mt-3">
          <Text className={styles['search-label']}>{intl.get('Global.filterCondition')}</Text>
          <div className={styles['condition-content']}>
            {_.map(list, (item, index) => {
              const { selectValue, inputValue } = item;
              return (
                <div key={index} className={styles['condition-content']}>
                  <Select
                    className={styles['condition-content-select']}
                    showSearch
                    defaultValue={selectValue}
                    placeholder={intl.get('Global.pleaseSelect')}
                    options={_.map(keyOptions, (item) => {
                      const label = groupByFieldsKV[item]?.displayName || item;
                      return { value: item, label };
                    })}
                    onSelect={(value): void => onChangeList(value, item, 'selectValue')}
                  />
                  <span className="g-ml-2 g-mr-2">{intl.get('Global.equal')}</span>
                  <Select
                    className={styles['condition-content-select']}
                    defaultValue={inputValue}
                    showSearch
                    placeholder={intl.get('Global.pleaseSelect')}
                    options={_.map([...(valueOptions.get(selectValue) || [])], (item) => ({ value: item, label: item }))}
                    onSelect={(value): void => onChangeList(value, item, 'inputValue')}
                  />
                  <Button.Icon size="small" icon={<CloseOutlined />} onClick={() => onDelList(index)} />
                </div>
              );
            })}
            <Button.Link className="g-mt-1" icon={<IconFont type="icon-add" />} onClick={onAddList}>
              {intl.get('MetricModel.addCondition')}
            </Button.Link>
          </div>
        </div>

        {/* 同环比 */}
        <div className="g-mt-3">
          <Text className={styles['search-label']}>{intl.get('MetricModel.sameRingRatio')}</Text>
          <Radio.Group
            value={metricsType}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            options={[
              { value: 1, label: intl.get('MetricModel.sameRatio') },
              { value: 2, label: intl.get('MetricModel.monthRingRatio') },
              { value: 3, label: intl.get('MetricModel.quarterRingRatio') },
              {
                value: 4,
                label: (
                  <Dropdown
                    open={openCustomMetrics}
                    destroyOnHidden
                    getPopupContainer={(triggerNode): HTMLElement => triggerNode.parentNode as HTMLElement}
                    popupRender={() => (
                      <CustomMetrics source={metricsOptions[4]} timeRange={timeRange} onCloseCustom={onCloseCustom} onSubmitCustom={onSubmitCustom} />
                    )}
                  >
                    <span
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onOpenCustom();
                      }}
                    >
                      {intl.get('MetricModel.customSameRingRatio')}
                    </span>
                  </Dropdown>
                ),
              },
              { value: 5, label: intl.get('MetricModel.proportion') },
              { value: 6, label: intl.get('MetricModel.notSet') },
            ]}
            onChange={onChangeMetrics}
          />
        </div>

        {/* 结果排序 */}
        {searchType === SEARCH_TYPE.INSTANT && (
          <div className="g-mt-3">
            <Text className={styles['search-label']}>{intl.get('MetricModel.resultSort')}</Text>
            <AddTagBySort value={orderByFields} options={sortFieldList} onChange={onChangeResultSort} />
          </div>
        )}

        {/* 结果过滤 */}
        {searchType === SEARCH_TYPE.INSTANT && (
          <div className="g-mt-3">
            <div className="g-flex-space-between">
              <Text className={styles['search-label']}>{intl.get('MetricModel.resultFilter')}</Text>
              {resultFilter && <Button.Link onClick={() => setResultFilter(false)}>{intl.get('Global.clearAll')}</Button.Link>}
            </div>
            {!resultFilter && (
              <Button.Link icon={<IconFont type="icon-add" />} onClick={() => setResultFilter(true)}>
                {intl.get('MetricModel.addLimit')}
              </Button.Link>
            )}
            {resultFilter && <ResultFilter layout="vertical" value={havingCondition} onChange={onChangeResultFilter} />}
          </div>
        )}
      </div>

      <div className={styles['filter-footer']}>
        <Button className="g-mr-2" type="primary" loading={loading} onClick={getData}>
          {intl.get('Global.query')}
        </Button>
        <Button onClick={onReset} disabled={loading}>
          {intl.get('Global.reset')}
        </Button>
      </div>
    </div>
  );
};

export default Filter;
