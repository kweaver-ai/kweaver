import { useRef, useEffect } from 'react';
import _ from 'lodash';
import * as echarts from 'echarts';

interface ChartLineProps {
  title: string;
  style?: any;
  sourceData?: number[];
}

const ChartLine = (props: ChartLineProps) => {
  const { title, style, sourceData } = props;
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
    const xAxisData: string[] = [];
    const seriesData: number[] = [];
    _.forEach(sourceData, (item: any) => {
      xAxisData.push(item?.time);
      seriesData.push(item?.value);
    });
    _.reverse(xAxisData);
    _.reverse(seriesData);

    const result: any = {
      tooltip: { trigger: 'axis' },
      grid: { top: 10, left: 14, right: 34, bottom: 4, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: [{ type: 'value', scale: true }],
      series: [{ name: title, type: 'line', showSymbol: false, yAxisIndex: 0, data: seriesData }],
    };

    return result;
  };

  return <div ref={container} style={{ width: '100%', height: '100%', ...style }}></div>;
};

export default ChartLine;
