import _ from 'lodash';
import intl from 'react-intl-universal';

import { Title } from '@/common';

import ChartLine from '../ChartLine';

const RateAndQps = (props: any) => {
  const { source } = props;
  const { trends, qps_data } = source || {};

  const constructData_rate = () => {
    const xAxisData: string[] = [];
    const seriesData: number[] = [];
    _.forEach(trends, (item: any) => {
      xAxisData.push(item?.date);
      seriesData.push(item?.avg_rate);
    });

    const result: any = {
      tooltip: { trigger: 'axis' },
      grid: { top: 10, left: 14, right: 34, bottom: 4, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: [{ type: 'value', scale: true }],
      series: [{ name: intl.get('modelStatistics.modelTokenRate'), type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData }],
    };

    return result;
  };
  const constructData_qps = () => {
    const xAxisData: string[] = [];
    const seriesData: number[] = [];
    _.forEach(qps_data, (item: any) => {
      xAxisData.push(item?.date);
      seriesData.push(item?.avg_qps);
    });

    const result: any = {
      tooltip: { trigger: 'axis' },
      grid: { top: 10, left: 36, right: 34, bottom: 4, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: [{ type: 'value', scale: true }],
      series: [{ name: intl.get('modelStatistics.modelQPS'), type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData }],
    };

    return result;
  };

  return (
    <div className='g-mt-6 g-flex-space-between'>
      <div className='g-w-100 g-border g-border-radius'>
        <Title block style={{ margin: '12px 16px' }}>
          {intl.get('modelStatistics.modelTokenRate')}
        </Title>
        <div className='g-m-3' style={{ height: 220 }}>
          <ChartLine depend={[trends]} constructData={constructData_rate} />
        </div>
      </div>
      <div style={{ minWidth: 16 }} />
      <div className='g-w-100 g-border g-border-radius'>
        <Title block style={{ margin: '12px 16px' }}>
          {intl.get('modelStatistics.modelQPS')}
        </Title>
        <div className='g-m-3' style={{ height: 220 }}>
          <ChartLine depend={[trends]} constructData={constructData_qps} />
        </div>
      </div>
    </div>
  );
};

export default RateAndQps;
