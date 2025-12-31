/** 时间选择器 */
import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import dayjs from 'dayjs';
import TimeFilter from '@/components/TimeFilter';
import { IconFont } from '@/web-library/common';

export interface TimeRange {
  label: string;
  value: any;
  timeInterval: number;
  timeUnit: string;
}

interface Props {
  timeRange?: TimeRange;
  disabled?: boolean;
  style?: any;
  getTimeRange: (timeRange: any) => void;
}

const TimeSelectFilter = (props: Props): JSX.Element => {
  const { timeRange, disabled, style, getTimeRange } = props;

  const [visible, setVisible] = useState(false);
  const [timeValue, setTimeValue] = useState({ label: 'last1Hour', value: [dayjs().subtract(1, 'h'), dayjs()], timeInterval: 1, timeUnit: 'h' });

  useEffect(() => {
    timeRange ? JSON.stringify(timeRange) !== JSON.stringify(timeValue.value) && setTimeValue(timeRange) : getTimeRange(timeValue);
  }, [timeRange]);

  const changeTimeFilterVis = (): void => {
    setVisible(!visible);
  };

  const handleFilterChange = (timeRange: any): void => {
    setTimeValue(timeRange);
    setVisible(false);
    getTimeRange(timeRange);
  };

  const isTimeRange = timeValue.label.indexOf('-') > 0;

  return (
    <React.Fragment>
      <TimeFilter visible={visible} timeRange={timeValue} onFilterChange={handleFilterChange}>
        <Button style={{ width: isTimeRange ? 300 : 120, ...style }} disabled={disabled} onClick={changeTimeFilterVis}>
          {intl.get(`MetricModel.quickRangeTime.${timeValue.label}`) || timeValue.label}
          {timeValue.label ? <IconFont type="icon-clock" /> : <IconFont type="icon-clock" style={{ margin: 0 }} />}
        </Button>
      </TimeFilter>
    </React.Fragment>
  );
};

export default TimeSelectFilter;
