import _ from 'lodash';
import intl from 'react-intl-universal';

import { Title, Text } from '@/common';

import ChartLine from '../ChartLine';

const TimeConsuming = (props: any) => {
  const { source } = props;
  const { trends } = source || {};

  const constructData = () => {
    const xAxisData: string[] = [];
    const seriesData_totalTime: number[] = [];
    const seriesData_firstTime: number[] = [];
    _.forEach(trends, (item: any) => {
      xAxisData.push(item?.date);
      seriesData_totalTime.push(Number(item?.avg_total_time?.toFixed(4)));
      seriesData_firstTime.push(Number(item?.avg_first_time?.toFixed(4)));
    });

    const result: any = {
      tooltip: { trigger: 'axis' },
      grid: { top: 10, left: 14, right: 34, bottom: 24, containLabel: true },
      legend: {
        top: 200,
        itemGap: 20,
        data: [
          { name: intl.get('modelStatistics.modelCallTimeConsumption'), icon: 'rect' },
          { name: intl.get('modelStatistics.firstTokensTime'), icon: 'rect' },
        ],
      },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: [{ type: 'value' }],
      series: [
        { name: intl.get('modelStatistics.modelCallTimeConsumption'), type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData_totalTime },
        { name: intl.get('modelStatistics.firstTokensTime'), type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData_firstTime },
      ],
    };

    return result;
  };

  return (
    <div className='g-mt-6 g-border g-border-radius'>
      <div style={{ padding: '12px 16px' }}>
        <Title>{intl.get('modelStatistics.modelTimeAndFirstTime')}</Title>
        <Text className='g-c-text-sub' level={1}>
          {intl.get('modelStatistics.unitSeconds')}
        </Text>
      </div>
      <div className='g-m-3' style={{ height: 220 }}>
        <ChartLine depend={[trends]} constructData={constructData} />
      </div>
    </div>
  );
};

export default TimeConsuming;
