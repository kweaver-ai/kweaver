/** 时间段选择 */
import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'; // 日期格式化

const DateRange = (props: any) => {
  const { timeRange, onFilterChange } = props;
  const [timeValue, setTimeValue] = useState<any>([null, null]);

  useEffect(() => {
    if (timeRange?.label?.indexOf('-') < 0) {
      setTimeValue([null, null]);
    } else {
      setTimeValue([timeRange?.value?.[0], timeRange?.value?.[1]]);
    }
  }, [timeRange?.value?.[0], timeRange?.value?.[1]]);

  // 应用日期范围
  const applyDateRange = (date: any) => {
    const startTime = dayjs(date[0]).format(DATE_FORMAT);
    const endTime = dayjs(date[1]).format(DATE_FORMAT);

    const timeRange = { label: `${startTime} - ${endTime}`, value: date };
    setTimeValue(date);
    if (!!date[0] && !!date[1]) onFilterChange(timeRange);
  };

  return (
    <DatePicker.RangePicker
      value={timeValue}
      format={DATE_FORMAT}
      showTime
      allowClear
      placeholder={[intl.get('Global.startTime'), intl.get('Global.endTime')]}
      onOk={applyDateRange}
    />
  );
};

export default DateRange;
