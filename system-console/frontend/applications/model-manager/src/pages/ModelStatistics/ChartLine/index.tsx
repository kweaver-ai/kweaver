import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

interface ChartLineProps {
  style?: any;
  depend?: any[];
  constructData: any;
}

const ChartLine = (props: ChartLineProps) => {
  const { style, depend, constructData } = props;
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
  }, depend);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) chartInstance.current.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={container} style={{ width: '100%', height: '100%', ...style }}></div>;
};

export default ChartLine;
