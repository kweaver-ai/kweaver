import { useEffect } from 'react';
import { Space, InputNumber } from 'antd';
import { Select } from '@/web-library/common';

const DateBefore = (props: any) => {
  const { value, onChange } = props;

  useEffect(() => {
    if (!value) onChange([1, 'millisecond']);
  }, []);

  const options = [
    { value: 'millisecond', label: '毫秒' },
    { value: 'second', label: '秒' },
    { value: 'minute', label: '分钟' },
    { value: 'hour', label: '小时' },
    { value: 'day', label: '天' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' },
    { value: 'quarter', label: '季度' },
    { value: 'year', label: '年' },
  ];

  return (
    <Space.Compact>
      <InputNumber placeholder="请填写" min={0} value={value?.[0]} onChange={(data) => onChange([data, value?.[1]])} />
      <Select defaultValue="millisecond" options={options} value={value?.[1]} onChange={(data) => onChange([value?.[0], data])} />
    </Space.Compact>
  );
};

export default DateBefore;
