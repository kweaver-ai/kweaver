import { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import UTILS from '@/utils';
import { Text, Select } from '@/common';

import ChartLine from '../ChartLine';

const TitleItem1 = (props: any) => {
  const { title, value, unit } = props;
  return (
    <div className='g-w-100 g-border g-border-radius' style={{ padding: '12px 16px' }}>
      <Text block>{title}</Text>
      <Text block level={6} strong={5}>
        {value}
        <Text className='g-ml-1 g-c-text-sub' level={1}>
          {unit}
        </Text>
      </Text>
    </div>
  );
};

const TitleItem = (props: any) => {
  const { title, value } = props;
  return (
    <div style={{ width: '20%' }}>
      <Text block>{title}</Text>
      {props.children || (
        <Text block level={6} strong={5}>
          {value}
        </Text>
      )}
    </div>
  );
};

const Summary = (props: any) => {
  const { source } = props;
  const { summary, trends } = source || {};
  const { total_usage, error_rate, avg_response_time, total_tokens, input_tokens, output_tokens } = summary || {};

  const [unit, setUnit] = useState<'K' | 'M'>('K');
  const UNIT_OPTIONS = [
    { value: 'K', label: intl.get('modelStatistics.thousandTokens') },
    { value: 'M', label: intl.get('modelStatistics.millionTokens') },
  ];

  const constructData = () => {
    const xAxisData: string[] = [];
    const seriesData_input: number[] = [];
    const seriesData_output: number[] = [];
    _.forEach(trends, (item: any) => {
      xAxisData.push(item?.date);
      seriesData_input.push(UTILS.formatTokens(item?.input_tokens, unit));
      seriesData_output.push(UTILS.formatTokens(item?.output_tokens, unit));
    });

    console.log('seriesData_output', { seriesData_input, seriesData_output });
    const result: any = {
      tooltip: { trigger: 'axis' },
      grid: { top: 10, left: 14, right: 34, bottom: 24, containLabel: true },
      legend: {
        top: 200,
        itemGap: 20,
        data: [
          { name: 'Input Tokens', icon: 'rect' },
          { name: 'Output Tokens', icon: 'rect' },
        ],
      },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: [{ type: 'value' }],
      series: [
        { name: 'Input Tokens', type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData_input },
        { name: 'Output Tokens', type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData_output },
      ],
    };

    return result;
  };

  return (
    <div>
      <div className='g-mt-6 g-flex-space-between'>
        <TitleItem1 title={intl.get('modelStatistics.usageCount')} value={total_usage} unit={intl.get('modelStatistics.once')} />
        <div style={{ minWidth: 16 }} />
        <TitleItem1 title={intl.get('modelStatistics.modelErrorRate')} value={Number(error_rate * 100).toFixed(4)} unit='%' />
        <div style={{ minWidth: 16 }} />
        <TitleItem1 title={intl.get('modelStatistics.modelAverageTime')} value={Number(avg_response_time).toFixed(2)} unit='s' />
        <div style={{ minWidth: 16 }} />
        <TitleItem1
          title={intl.get('modelStatistics.tokenConsumption')}
          value={UTILS.formatTokens(total_tokens, 'K')}
          unit={intl.get('modelStatistics.thousandTokens')}
        />
      </div>
      <div className='g-mt-4 g-border g-border-radius'>
        <div className='g-flex-align-center g-border-b' style={{ padding: '12px 16px' }}>
          <TitleItem title={intl.get('modelStatistics.tokenConsumption')} value={UTILS.formatTokens(total_tokens, unit) || '--'} />
          <TitleItem title='Input Tokens' value={UTILS.formatTokens(input_tokens, unit) || '--'} />
          <TitleItem title='Output Tokens' value={UTILS.formatTokens(output_tokens, unit) || '--'} />
          <TitleItem title={intl.get('global.unit')}>
            <Select value={unit} options={UNIT_OPTIONS} style={{ width: 150 }} onChange={value => setUnit(value)} />
          </TitleItem>
        </div>
        <div className='g-m-3' style={{ height: 220 }}>
          <ChartLine depend={[unit, source]} constructData={constructData} />
        </div>
      </div>
    </div>
  );
};

export default Summary;
