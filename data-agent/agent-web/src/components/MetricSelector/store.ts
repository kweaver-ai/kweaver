import { createContext, useContext } from 'react';
import intl from 'react-intl-universal';
import { makeAutoObservable } from 'mobx';
import { noop } from 'lodash';
import { type MetricModalGroupType, type MetricModelType } from '@/apis/data-model';
import { MetricConstants } from './types';

const defaultAllMetricGroup = {
  id: '__all',
  name: '所有指标模型',
};

export class MetricSelectorStore {
  // 所有指标模型组
  allMetricGroup = {
    ...defaultAllMetricGroup,
    name: intl.get('dataAgent.allIndicatorModels'),
  };
  selectedGroup: MetricModalGroupType | undefined = undefined; // 选择的分组
  selectedMetrics: MetricModelType[] = []; // 选中的指标数组

  constructor() {
    makeAutoObservable(this);
    // 自动将:
    // - 属性转为 observable
    // - 方法转为 action
    // - getter 转为 computed
  }

  // 全部分组的指标模型数量是否设置过
  get isAllMetricGroupSetted() {
    return MetricConstants.MetricModelCount in this.allMetricGroup;
  }

  // 设置selectedGroup
  setSelectedGroup(group: MetricModalGroupType) {
    this.selectedGroup = group;
  }

  // 设置selectedMetrics
  setSelectedMetrics(metrics: MetricModelType[]) {
    this.selectedMetrics = metrics;
  }

  // 增加selectedMetric
  appendSelectedMetric(metric: MetricModelType) {
    this.selectedMetrics = [...this.selectedMetrics, metric];
  }

  // 移除selectedMetric
  removeSelectedMetric(metric: MetricModelType) {
    this.selectedMetrics = this.selectedMetrics.filter(item => item.id !== metric.id);
  }

  // 更新所有指标模型组信息
  updateAllMetricGroup(updates: Record<MetricConstants.MetricModelCount, number>) {
    this.allMetricGroup = {
      ...this.allMetricGroup,
      ...updates,
    };
  }
}

export const MetricSelectorContext = createContext({
  allMetricGroup: defaultAllMetricGroup,
  selectedGroup: undefined,
  selectedMetrics: [],
  isAllMetricGroupSetted: false,
  setSelectedGroup: noop,
  setSelectedMetrics: noop,
  appendSelectedMetric: noop,
  removeSelectedMetric: noop,
  updateAllMetricGroup: noop,
});

export const useMetricSelectorStore = () => useContext(MetricSelectorContext);
