/** 详情抽屉 */
import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Spin, Input, Tag, Divider } from 'antd';
import { DrawerProps } from 'antd/lib/drawer';
import classNames from 'classnames';
import dayjs from 'dayjs';
import _ from 'lodash';
import AddTag from '@/components/AddTag';
import JsonCodeInput from '@/components/JsonCodeInput';
import { formatKeyOfObjectToLine } from '@/utils/format-objectkey-structure';
import DataFilter from '@/web-library/components/DataFilter';
import { getNewStr, getNewStrAry } from '../FormContainer/utils';
import { queryType as QueryType, METRIC_TYPE, getTaskStatus, isPersistenceTaskStatus, persistenceTaskStatus, persistenceTaskStatusColor } from '../type';
import Collapse from './Collapse';
import DataViewDetail from './DataViewDetail';
import styles from './index.module.less';
import MetricModelDetail from './MetricModelDetail';

interface ContentItem {
  name?: string | JSX.Element;
  value?: string | JSX.Element | number;
  title?: string | JSX.Element;
  isOneLine?: boolean;
  content?: ContentItem[];
}

export interface DataItem {
  title: string;
  isOpen?: boolean;
  style?: object;
  content: ContentItem[];
}

// 包含抽屉的属性
export interface PropsType extends DrawerProps {
  data: DataItem[];
}

const Detail = (props: any) => {
  const { sourceData, loading } = props;
  const [data, setData] = useState<any>([]);

  useEffect(() => {
    if (sourceData?.id) getDetailData();
  }, [sourceData?.id]);

  /** 格式化基本配置数据 */
  const formatBasicData = (data: any) => {
    const { name, groupName, measureName, tags, comment, createTime, updateTime } = data;

    return {
      title: intl.get('Global.baseConfig'),
      content: [
        { name: intl.get('Global.name'), value: name },
        { name: 'ID', value: sourceData.id },
        { name: intl.get('Global.group'), value: groupName || '--' },
        { name: intl.get('MetricModel.measureName'), value: measureName },
        { name: intl.get('Global.tag'), value: Array.isArray(tags) && tags.length ? tags.map((i) => <Tag key={i}>{i}</Tag>) : '--' },
        { name: intl.get('Global.comment'), value: comment || '--' },
        { name: intl.get('Global.createTime'), value: createTime ? dayjs(createTime).format('YYYY-MM-DD HH:mm:ss') : '--' },
        { name: intl.get('Global.updateTime'), value: updateTime ? dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss') : '--' },
      ],
    };
  };

  /** 格式化模型配置数据 -- atomic 原子指标 */
  const format_atomic = (data: any) => {
    const { metricType, dataSource, queryType, formula, measureField, formulaConfig, analysisDimensions, unitType, unit, dateField, fieldsMap } = data;
    const fields_map = fieldsMap ? formatKeyOfObjectToLine(fieldsMap) : {};
    const measureFieldCol = queryType === QueryType.Dsl ? [{ name: intl.get('MetricModel.metric'), value: measureField }] : [];
    const formulaFieldCol =
      queryType === QueryType.Dsl || queryType === QueryType.Promql
        ? [
            {
              name: '',
              isOneLine: true,
              value: (
                <Collapse title={`${intl.get('MetricModel.formula')}:`}>
                  {queryType === QueryType.Dsl ? (
                    <JsonCodeInput value={JSON.parse(formula)} disabled></JsonCodeInput>
                  ) : (
                    <Input.TextArea value={formula} readOnly autoSize />
                  )}
                </Collapse>
              ),
            },
          ]
        : [];
    const queryTypeSqlCol: any = [];
    if (queryType === QueryType.Sql) {
      // 数据过滤
      if (formulaConfig?.conditionStr) {
        queryTypeSqlCol.push({
          name: '',
          isOneLine: true,
          value: (
            <Collapse title={`${intl.get('Global.dataFilter')}：`}>
              <Input.TextArea value={formulaConfig?.conditionStr} readOnly autoSize />
            </Collapse>
          ),
        });
      }
      if (formulaConfig?.condition) {
        queryTypeSqlCol.push({
          name: '',
          isOneLine: true,
          value: (
            <Collapse title={`${intl.get('Global.dataFilter')}：`}>
              <DataFilter disabled={true} fieldList={[]} defaultValue={formulaConfig?.condition} />
            </Collapse>
          ),
        });
      }
      // 度量计算
      if (formulaConfig?.aggrExpressionStr) {
        queryTypeSqlCol.push({
          name: '',
          isOneLine: true,
          value: (
            <Collapse title={`${intl.get('MetricModel.metricCalculation')}：`}>
              <Input.TextArea value={formulaConfig?.aggrExpressionStr} readOnly autoSize />
            </Collapse>
          ),
        });
      }
      if (formulaConfig?.aggrExpression) {
        queryTypeSqlCol.push({ name: intl.get('MetricModel.aggregationField'), value: formulaConfig?.aggrExpression?.field });
        queryTypeSqlCol.push({ name: intl.get('MetricModel.aggregationMethod'), value: formulaConfig?.aggrExpression?.aggr });
      }

      // 分析维度
      if (analysisDimensions) {
        queryTypeSqlCol.push({
          name: intl.get('MetricModel.analysisDimension'),
          isOneLine: true,
          value:
            analysisDimensions.length > 0 ? (
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                {_.map(analysisDimensions, (item, index) => (
                  <Tag key={index} style={{ marginBottom: 2 }} title={fields_map[item.name]?.comment || ''}>
                    {item.displayName}
                  </Tag>
                ))}
              </div>
            ) : (
              '--'
            ),
        });
      }
      // 分组字段
      if (formulaConfig?.groupByFieldsDetail) {
        queryTypeSqlCol.push({
          name: intl.get('MetricModel.groupField'),
          isOneLine: true,
          value:
            formulaConfig?.groupByFieldsDetail.length > 0 ? (
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                {_.map(formulaConfig?.groupByFieldsDetail, (item, index) => (
                  <Tag key={index} style={{ marginBottom: 2 }} title={fields_map[item.name]?.comment || ''}>
                    {item.displayName}
                  </Tag>
                ))}
              </div>
            ) : (
              '--'
            ),
        });
      }
      // 日期时间标识
      if (dateField) {
        queryTypeSqlCol.push({ name: intl.get('MetricModel.dateTimeIdentifier'), value: dateField });
      }
    }

    return {
      title: intl.get('MetricModel.modelConfig'),
      content: [
        { name: intl.get('MetricModel.metricType'), value: intl.get(`MetricModel.${metricType}`) || '--' },
        { name: intl.get('MetricModel.queryType'), value: queryType },
        { name: intl.get('Global.dataView'), value: <DataViewDetail dataSourceId={dataSource?.id} />, isOneLine: true },
        ...formulaFieldCol,
        ...measureFieldCol,
        ...queryTypeSqlCol,
        { name: intl.get('MetricModel.unit'), value: unit || '--' },
        { name: intl.get('MetricModel.unitType'), value: unitType || '--' },
      ],
    };
  };
  const format_derived = (data: any) => {
    const { metricType, formulaConfig, unit, analysisDimensions, unitType, fieldsMap } = data;
    const fields_map = fieldsMap ? formatKeyOfObjectToLine(fieldsMap) : {};
    const { dependMetricModel, conditionStr, dateCondition, businessCondition } = formulaConfig;
    const conditionStrCol = [];
    if (conditionStr) {
      conditionStrCol.push({
        name: '',
        isOneLine: true,
        value: (
          <Collapse title={`${intl.get('Global.dataFilter')}：`}>
            <Input.TextArea value={conditionStr} readOnly autoSize />
          </Collapse>
        ),
      });
    }
    const conditionCol = [];
    if (dateCondition || businessCondition) {
      conditionCol.push({
        name: intl.get('Global.dataFilter'),
        isOneLine: true,
        value: (
          <div>
            {dateCondition && (
              <Collapse className="g-mb-1" title={intl.get('MetricModel.timeLimit')}>
                <DataFilter disabled={true} fieldList={[]} defaultValue={dateCondition} />
              </Collapse>
            )}
            {businessCondition && (
              <Collapse title={intl.get('MetricModel.businessLimit')}>
                <DataFilter disabled={true} fieldList={[]} defaultValue={businessCondition} />
              </Collapse>
            )}
          </div>
        ),
      });
    }
    const analysisDimensionsCol = [];
    if (analysisDimensions && analysisDimensions?.length > 0) {
      analysisDimensionsCol.push({
        name: intl.get('MetricModel.analysisDimension'),
        isOneLine: true,
        value: (
          <AddTag
            options={analysisDimensions.map((item: any) => ({
              ...item,
              comment: fields_map[item.name]?.comment || '',
            }))}
            value={analysisDimensions}
            canSelect={false}
            disabled={true}
          />
        ),
      });
    }

    return {
      title: intl.get('MetricModel.modelConfig'),
      content: [
        { name: intl.get('MetricModel.metricType'), value: intl.get(`MetricModel.${metricType}`) || '--' },
        { name: intl.get('MetricModel.atomicMetric'), value: <MetricModelDetail dataSourceId={dependMetricModel?.id} />, isOneLine: true },
        { name: intl.get('MetricModel.unit'), value: unit || '--' },
        { name: intl.get('MetricModel.unitType'), value: unitType || '--' },
        ...conditionStrCol,
        ...conditionCol,
        ...analysisDimensionsCol,
      ],
    };
  };
  const format_composite = (data: any) => {
    const { metricType, formula, analysisDimensions, unit, unitType, fieldsMap } = data;
    const fields_map = fieldsMap ? formatKeyOfObjectToLine(fieldsMap) : {};
    const analysisDimensionsCol = [];
    if (analysisDimensions && analysisDimensions?.length > 0) {
      analysisDimensionsCol.push({
        name: intl.get('MetricModel.analysisDimension'),
        isOneLine: true,
        value: (
          <AddTag
            options={analysisDimensions.map((item: any) => ({
              ...item,
              comment: fields_map[item.name]?.comment || '',
            }))}
            value={analysisDimensions}
            canSelect={false}
            disabled={true}
          />
        ),
      });
    }
    // 复合表达式
    return {
      title: intl.get('MetricModel.modelConfig'),
      content: [
        { name: intl.get('MetricModel.metricType'), value: intl.get(`MetricModel.${metricType}`) || '--' },
        ...analysisDimensionsCol,
        { name: intl.get('MetricModel.compoundExpression'), isOneLine: true, value: <Input.TextArea value={formula} readOnly autoSize /> },
        { name: intl.get('MetricModel.unit'), value: unit || '--' },
        { name: intl.get('MetricModel.unitType'), value: unitType || '--' },
      ],
    };
  };
  /** 格式化模型配置数据 */
  const formatModelSettingData = (data: any) => {
    const metricType = data.metricType;
    if (metricType === METRIC_TYPE.ATOMIC) return format_atomic(data);
    if (metricType === METRIC_TYPE.DERIVED) return format_derived(data);
    if (metricType === METRIC_TYPE.COMPOSITE) return format_composite(data);
  };

  /** 格式持久化配置数据 */
  const formatPersistenceSettingData = (data: any) => {
    const { queryType, task } = data;
    let taskDetail: any = null;

    // 判断持久化配置是否存在， id为0表示不存在
    if (task?.id && task?.id !== '0') {
      const { name, scheduleSyncStatus, executeStatus, timeWindows, steps, retraceDuration, schedule, indexBaseName, comment: taskComment } = task;
      const curStatus = getTaskStatus(scheduleSyncStatus, executeStatus);

      taskDetail = [
        { name: intl.get('Global.name'), value: name || '--' },
        {
          name: intl.get('MetricModel.persistenceTaskStatus'),
          value: (
            <span style={{ color: persistenceTaskStatusColor(curStatus) }}>
              {isPersistenceTaskStatus(curStatus) ? intl.get(`MetricModel.${persistenceTaskStatus[curStatus]}`) : curStatus}
            </span>
          ),
        },
        { name: intl.get('Global.comment'), value: taskComment || '--' },
        {
          name: intl.get('MetricModel.persistenceTaskTimeWindows'),
          value: (
            <div className="g-ellipsis-1" style={{ width: 100 }} title={getNewStrAry(timeWindows)}>
              {getNewStrAry(timeWindows)}
            </div>
          ),
        },
        {
          name: intl.get('MetricModel.persistenceTaskStep'),
          value: (
            <React.Fragment>
              {getNewStrAry(steps)
                .split(',')
                .map((val) => (
                  <Tag key={val}>{val}</Tag>
                ))}
            </React.Fragment>
          ),
        },
        { name: intl.get('MetricModel.persistenceTaskRetraceDuration'), value: retraceDuration ? getNewStr(retraceDuration) : '--' },
        { name: intl.get('MetricModel.persistenceTaskSchedule'), value: getNewStr(schedule?.expression) },
        { name: intl.get('Global.indexBase'), value: indexBaseName },
      ];
      taskDetail =
        queryType === QueryType.Promql ? taskDetail.filter((val: any) => val.name !== intl.get('MetricModel.persistenceTaskTimeWindows')) : taskDetail;
    }

    return taskDetail;
  };

  const getDetailData = async () => {
    try {
      const data = [formatBasicData(sourceData), formatModelSettingData(sourceData)];
      const persistenceSettingData = formatPersistenceSettingData(sourceData);
      if (persistenceSettingData) {
        data.push({ title: intl.get('MetricModel.persistenceConfig'), content: persistenceSettingData });
      }

      setData(data);
    } catch (error) {}
  };

  const renderCollapseCard = (item: any, content: any) => {
    return item.title ? (
      <Collapse isOpen={item.isOpen} title={item.title} key={item.title}>
        {content}
      </Collapse>
    ) : (
      content
    );
  };

  return (
    <div className={styles['metric-detail-root']}>
      <Spin spinning={loading}>
        {_.map(data, (item: any, index: number) => {
          return renderCollapseCard(
            item,
            <React.Fragment>
              <div className={styles['metric-detail-content']}>
                {_.map(item.content, (contentItem: any, index: number) => {
                  return renderCollapseCard(
                    contentItem,
                    <div key={index.toString()} className={classNames(styles['config-item'], { 'g-w-100': contentItem.isOneLine })}>
                      {!!contentItem.name && <span>{contentItem.name}：</span>}
                      <div className={styles['config-item-value']} style={contentItem.isOneLine ? { width: 800, maxWidth: 800 } : {}}>
                        {contentItem.value}
                      </div>
                    </div>
                  );
                })}
              </div>
              {index !== data.length - 1 && <Divider style={{ margin: '16px 0' }} />}
            </React.Fragment>
          );
        })}
      </Spin>
    </div>
  );
};

export default Detail;
