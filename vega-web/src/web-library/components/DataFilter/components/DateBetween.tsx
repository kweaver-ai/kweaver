import { useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const DateBetween = (props: any) => {
  const { value, onChange } = props;

  useEffect(() => {
    if (!value) onChange([dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'), dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')]);
  }, []);

  return (
    <DatePicker.RangePicker
      showTime
      value={value ? [dayjs(value?.[0]), dayjs(value?.[1])] : undefined}
      onChange={(data: any) => {
        onChange([dayjs(data?.[0]).format('YYYY-MM-DD HH:mm:ss.SSS'), dayjs(data?.[1]).format('YYYY-MM-DD HH:mm:ss.SSS')]);
      }}
    />
  );
};

export default DateBetween;
