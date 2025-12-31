import { useRef, useEffect } from 'react';
import intl from 'react-intl-universal';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import _ from 'lodash';
import { DATE_FORMAT } from '@/hooks/useConstants';

interface ChartLineProps {
  title: string;
  style?: any;
  sourceData?: any;
  pagination?: any;
}

const ChartLine = (props: ChartLineProps) => {
  const { style, sourceData, pagination } = props;
  const { pageSize, current } = pagination || {};

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
  }, [sourceData, pageSize, current]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) chartInstance.current.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const constructData = () => {
    const xAxisData: string[] = [];
    const seriesData: any[] = [];

    /** 计算当前页面数据，要计算前一页和后一页的合并掉的数据 */
    // const startIndex = (current - 1) * pageSize;
    // const endIndex = startIndex + pageSize;
    // const list: any = _.slice(sourceData, startIndex, endIndex);

    // const startItem = list[0];
    // const entItem = list[list.length - 1];
    // const length = sourceData?.length || 0;
    // const prevList = [];
    // const nextList = [];
    // let lessThanStart = true;
    // let greaterThanEnd = false;
    // for (let i = 0; i < length; i++) {
    //     const item: any = sourceData?.[i];
    //     if (item.id === startItem.id) lessThanStart = false;
    //     if (item.id === entItem.id) greaterThanEnd = true;
    //     if (lessThanStart && item.number === startItem.number) prevList.push(item);
    //     if (greaterThanEnd && item.number === entItem.number) nextList.push(item);
    // }

    /** 根据当前页面数据，构建图表的X轴和Y轴 */
    // const lineList = [...prevList, ...list, ...nextList];
    const lineList = sourceData;
    let currentNumber: any = lineList[0].number || 0; // 当前
    let seriesDataIndex = 0;
    const firstNumber = lineList[0].number || 0;
    _.forEach(lineList, (item: any) => {
      const number = item?.number;
      if (number === firstNumber) xAxisData.push(dayjs(item?.time).format(DATE_FORMAT.FULL_TIMESTAMP));

      if (seriesData[seriesDataIndex]) {
        seriesData[seriesDataIndex].data.push(item?.value);
      } else {
        seriesData.push({ name: `${intl.get('Global.number')}${number}`, type: 'line', showSymbol: false, yAxisIndex: 0, data: [item?.value] });
      }
      if (number !== currentNumber) {
        currentNumber = number;
        seriesDataIndex = seriesDataIndex + 1;
      }
    });

    const result: any = {
      tooltip: { trigger: 'axis' },
      grid: { top: 10, left: 80, right: 80, bottom: 66 },
      xAxis: { data: xAxisData, boundaryGap: false },
      yAxis: { scale: true },
      series: seriesData,
      dataZoom: [{ type: 'slider' }, { type: 'inside' }],
    };

    return result;
  };

  return <div ref={container} style={{ width: '100%', height: '100%', ...style }}></div>;
};

export default ChartLine;
