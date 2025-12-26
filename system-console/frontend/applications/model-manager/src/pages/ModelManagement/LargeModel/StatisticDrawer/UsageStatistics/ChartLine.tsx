import { useRef, useEffect } from 'react';
import _ from 'lodash';
import * as echarts from 'echarts';

interface ChartLineProps {
  sourceData?: number[];
}

const DATA = [
  { time: '2025-05-25', input: 3245, output: 3658 },
  { time: '2025-05-26', input: 3092, output: 3492 },
  { time: '2025-05-27', input: 3276, output: 3684 },
  { time: '2025-05-28', input: 3158, output: 3563 },
  { time: '2025-05-29', input: 2967, output: 3368 },
  { time: '2025-05-30', input: 2884, output: 3289 },
  { time: '2025-05-31', input: 3125, output: 3521 },
  { time: '2025-06-01', input: 3298, output: 3695 },
  { time: '2025-06-02', input: 3456, output: 3857 },
  { time: '2025-06-03', input: 3672, output: 4075 },
  { time: '2025-06-04', input: 3521, output: 3923 },
  { time: '2025-06-05', input: 3415, output: 3817 },
  { time: '2025-06-06', input: 3298, output: 3692 },
  { time: '2025-06-07', input: 3176, output: 3571 },
  { time: '2025-06-08', input: 3038, output: 3435 },
  { time: '2025-06-09', input: 2867, output: 3268 },
  { time: '2025-06-10', input: 3054, output: 3452 },
  { time: '2025-06-11', input: 3186, output: 3587 },
];

const ChartLine = (props: ChartLineProps) => {
  const { sourceData = DATA } = props;
  const container = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>();

  useEffect(() => {
    if (!container.current) return;
    if (!chartInstance.current) chartInstance.current = echarts.init(container.current);

    const option = constructData();
    chartInstance.current.setOption(option);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [sourceData]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) chartInstance.current.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const constructData = () => {
    const seriesData: any = { input: [], output: [] };
    _.forEach(sourceData, (item: any) => {
      seriesData.input.push(item?.input);
      seriesData.output.push(item?.output);
    });

    const result: any = {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, left: 'center', itemGap: 20, itemWidth: 10, itemHeight: 0, data: ['Input Tokens', 'Output Tokens'] },
      grid: { top: 10, left: 0, right: 6, bottom: 40, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: _.map(sourceData, (item: any) => item.time) },
      yAxis: [{ type: 'value' }],
      series: [
        { name: 'Input Tokens', type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData.input },
        { name: 'Output Tokens', type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData.output },
      ],
    };

    return result;
  };

  return <div ref={container} style={{ width: '100%', height: '100%' }}></div>;
};

export default ChartLine;
