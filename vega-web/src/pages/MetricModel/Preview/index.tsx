import { useState, useMemo, useEffect } from 'react';
import intl from 'react-intl-universal';
import { DoubleRightOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import _ from 'lodash';
import arGuid from '@/utils/ar-guid';
import api from '@/services/data-analysis/metric-model';
import { Button, Title } from '@/web-library/common';
import { queryType as QUERY_TYPE, METRIC_TYPE } from '../type';
import Filter from './Filter';
import { getStep } from './getStep';
import styles from './index.module.less';
import PreviewGraph from './PreviewGraph';
import PreviewTable from './PreviewTable';

export interface PreviewDataItem {
  id: string;
  labels: any;
  labelsKV: string[];
  growth_rates: number[];
  growth_values: number[];
  time: string;
  value: number | string;
  rowSpan?: number; // 合并行数
  number?: number;
  formatValue?: any;
}

export type PreviewData = PreviewDataItem[];

const SEARCH_TYPE = { INSTANT: 'instant', RANGE: 'range' };
const ERROR_VALUE = ['-Inf', '+Inf', 'NaN', null];

const Preview = (props: any) => {
  const { previewData } = props;
  const metricType = previewData?.metricType;
  const queryType = previewData?.queryType;

  const [isCollapse, setIsCollapse] = useState(false); // 查询配置是否展开
  const onChangeCollapse = () => setIsCollapse(!isCollapse);

  const _dayjs = dayjs();
  const stepsOptionsIsSql =
    queryType === QUERY_TYPE.Sql ||
    (queryType === QUERY_TYPE.Dsl && previewData.isCalendarInterval === 1) ||
    metricType === METRIC_TYPE.COMPOSITE ||
    metricType === METRIC_TYPE.DERIVED;
  const INIT_FILTER = {
    searchType: SEARCH_TYPE.INSTANT,
    timeRange: { label: 'last30Minutes', value: [_dayjs.subtract(30, 'm'), _dayjs], timeInterval: 30, timeUnit: 'm' },
    step: stepsOptionsIsSql ? 'day' : undefined,
    analysisDimensions: undefined,
    list: [{ selectValue: undefined, inputValue: undefined }],
    metrics: undefined,
    havingCondition: undefined,
    orderByFields: undefined,
  };
  const [filter, setFilter] = useState<any>(INIT_FILTER); // 筛选条件
  const [loading, setLoading] = useState(false); // loading
  const [source, setSource] = useState<any>([]); // 预览数据
  const [currentTabActive, setCurrentTabActive] = useState('table');
  const [pagination, setPagination] = useState({ size: 'small', pageSize: 10, current: 1, showQuickJumper: true });

  useEffect(() => {
    if (filter?.searchType === SEARCH_TYPE.INSTANT) setCurrentTabActive('table');
    getData();
  }, [filter?.searchType]);

  /** 筛选条件变更 */
  const onChangeFilter = (data: any) => setFilter(data);

  const transformData = (data: any): PreviewData => {
    const { datas = [] } = data;
    const result: PreviewDataItem[] = [];
    _.forEach(datas, (item: any, index: number) => {
      const { values = [], times = [], labels, growth_rates, growth_values } = item;
      const labelsKV = Object.keys(labels).map((i) => `${i}=${labels[i] || '--'}`);

      _.forEach(values, (d, i: number) => {
        result.push({
          id: arGuid(),
          labels,
          labelsKV,
          number: index + 1,
          time: times[i],
          value: ERROR_VALUE.includes(d) ? null : d,
          growth_rates: growth_rates?.[i],
          growth_values: growth_values?.[i],
          formatValue: d,
        });
      });
    });

    return result;
  };
  const getPreviewData = async (): Promise<PreviewData | undefined> => {
    const { searchType, timeRange, step, analysisDimensions, metrics, havingCondition, orderByFields } = filter;

    const instant = searchType === SEARCH_TYPE.INSTANT;
    const start = dayjs(timeRange.value[0]).valueOf();
    const end = dayjs(timeRange.value[1]).valueOf();
    const _step = step ? step : previewData.queryType !== 'sql' ? getStep(end - start, 710) : 'day'; // 动态步长只对 DSL，PromQL 生效
    const timeParams: any = instant ? { time: end, lookBackDelta: `${end - start}ms` } : { start, end, step: _step }; // 时间参数

    if (previewData?._previewId) {
      // 有预览 ID 的时候 -- 从列表进入预览
      const postData = { instant, ...timeParams };
      if (analysisDimensions) postData.analysisDimensions = analysisDimensions;
      if (metrics) postData.metrics = metrics;
      if (searchType === SEARCH_TYPE.INSTANT && havingCondition && havingCondition?.value) postData.havingCondition = havingCondition;
      if (searchType === SEARCH_TYPE.INSTANT && orderByFields) postData.orderByFields = orderByFields;
      const res = await api.fetchMetricPreviewData(postData, previewData?._previewId);
      if (!res?.code) return transformData(res);
    } else {
      // 无预览 ID 的时候 -- 从编辑页面进入预览
      const { metricType } = previewData;
      let postData = {
        metricType, // 指标类型
        instant, // 是否是即时查询
        ...(metrics ? { metrics } : {}), // 同环比、占比分析
        ...timeParams, // 时间参数
      };
      // 原子指标
      if (metricType === METRIC_TYPE.ATOMIC) {
        const {
          dataViewId,
          queryType,
          formula,
          measureField,
          conditionType,
          conditionStr,
          condition,
          aggrExpressionType,
          aggrExpressionStr,
          aggrExpression,
          groupByFields,
          dateField,
        } = previewData;

        const modelConfig: any = { formula: typeof formula === 'string' ? formula : JSON.stringify(formula) }; // 计算公式
        const modelVega: any = {
          ...(dateField ? { dateField } : {}), // 时间字段
          ...(analysisDimensions ? { analysisDimensions: _.map(analysisDimensions, (item: any) => item?.name || item) } : {}), // 分析维度
          formulaConfig: {
            ...(conditionType === 'conditionStr' ? { conditionStr } : { condition }), // 数据过滤
            ...(aggrExpressionType === 'aggrExpressionStr'
              ? { aggrExpressionStr }
              : { aggrExpression: { field: aggrExpression?.field, aggr: aggrExpression?.aggr } }), // 度量计算
            groupByFields, // 分组字段
          },
        };

        postData = {
          ...postData,
          dataSource: { id: dataViewId[0]?.id, type: dataViewId[0]?.queryType },
          queryType,
          measureField,
          ...(queryType !== QUERY_TYPE.Sql ? modelConfig : modelVega),
        };
      }
      // 衍生指标
      if (metricType === METRIC_TYPE.DERIVED) {
        const { dataViewId, conditionType, conditionStr, dateCondition, businessCondition } = previewData;
        postData = {
          ...postData,
          formulaConfig: {
            dependMetricModel: { id: dataViewId[0].id, name: dataViewId[0].name }, // 原子指标
            ...(conditionType === 'conditionStr' ? { conditionStr } : { dateCondition, businessCondition }), // 数据过滤
          },
        };
        if (analysisDimensions) postData.analysisDimensions = analysisDimensions; // 分析维度
      }
      // 复合指标
      if (metricType === METRIC_TYPE.COMPOSITE) {
        const { formula } = previewData;
        postData = { ...postData, formula };
        if (analysisDimensions) postData.analysisDimensions = analysisDimensions; // 分析维度
      }
      if (searchType === SEARCH_TYPE.INSTANT && havingCondition && havingCondition?.value) postData.havingCondition = havingCondition;
      if (searchType === SEARCH_TYPE.INSTANT && orderByFields) postData.orderByFields = orderByFields;
      const res = await api.fetchMetricPreviewData(postData);
      if (!res?.code) return transformData(res);
    }
  };

  /** 获取数据 */
  const getData = async () => {
    setLoading(true);
    try {
      const result = await getPreviewData();
      setLoading(false);
      setSource(result);
    } catch (error) {
      setLoading(false);
    }
  };

  /** 切换 table 页面 */
  const onChangePagination = (data: any) => setPagination(data);

  const searchCondition = useMemo(() => {
    return (filter?.list || []).reduce((prev: string[], { selectValue, inputValue }: any) => {
      selectValue && inputValue && !prev?.includes(`${selectValue}=${inputValue}`) && prev.push(`${selectValue}=${inputValue}`);
      return prev;
    }, []);
  }, [JSON.stringify(filter?.list)]);
  const tableDataSource = useMemo(() => {
    const filterData = _.filter(source, (v: any) => _.every(searchCondition, (val: any) => v.labelsKV.includes(val)));
    const result = filterData.reduce((prev: PreviewDataItem[], data: PreviewDataItem, index: any) => {
      const { number } = data;
      let rowSpan = 1;
      const _index = index % pagination.pageSize; // 当前页数的index
      const currentPage = Math.floor(index / pagination.pageSize) + 1; // 当前页数

      // 当前行的number与前一行相同就合并到前一行
      if (_index !== 0 && number === filterData[index - 1].number) {
        rowSpan = 0;
      } else {
        const len = Math.min(currentPage * pagination.pageSize, source.length); // 当前页的最后一个
        // 循环到当前页结束
        for (let i = index + 1; i < len; i++) {
          if (number !== filterData[i]?.number) break;
          rowSpan++;
        }
      }

      prev.push({ ...data, rowSpan });

      return prev;
    }, []);

    return result;
  }, [JSON.stringify(searchCondition), pagination.pageSize, source]);

  return (
    <div className={styles['metric-preview-root']}>
      <div className={classNames(styles['metric-preview-container'], { [styles['width-full']]: isCollapse })}>
        {filter.searchType === SEARCH_TYPE.RANGE && (
          <div style={{ marginTop: -16 }}>
            <Tabs
              defaultActiveKey="table"
              items={[
                { key: 'table', label: intl.get('MetricModel.table') },
                { key: 'graph', label: intl.get('MetricModel.trendChart') },
              ]}
              onChange={(key) => setCurrentTabActive(key)}
            />
            {currentTabActive === 'graph' && <PreviewGraph loading={loading} sourceData={tableDataSource} pagination={pagination} />}
          </div>
        )}
        {currentTabActive === 'table' && (
          <PreviewTable
            loading={loading}
            filter={filter}
            previewData={previewData}
            dataSource={tableDataSource}
            pagination={pagination}
            onChangePagination={onChangePagination}
          />
        )}
      </div>
      <div className={classNames(styles['metric-preview-setting'], { [styles['metric-preview-setting-collapse']]: isCollapse })}>
        <div className={styles['metric-preview-setting-title']}>
          <Title className={classNames({ 'g-mt-9': isCollapse })}>{intl.get('MetricModel.queryConfiguration')}</Title>
          <Button.Icon icon={<DoubleRightOutlined className={classNames({ 'g-rotate-180': isCollapse })} />} onClick={onChangeCollapse} />
        </div>
        <Filter
          INIT_FILTER={INIT_FILTER}
          source={source}
          loading={loading}
          previewData={previewData}
          filter={filter}
          stepsOptionsIsSql={stepsOptionsIsSql}
          SEARCH_TYPE={SEARCH_TYPE}
          getData={getData}
          onChangeFilter={onChangeFilter}
        />
      </div>
    </div>
  );
};

export default Preview;
