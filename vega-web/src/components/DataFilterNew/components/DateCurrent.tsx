import { useEffect } from 'react';
import { Select } from '@/web-library/common';

const DateCurrent = (props: any) => {
  const { value, onChange } = props;

  useEffect(() => {
    if (!value) onChange('%Y-%m-%d');
  }, []);

  const options = [
    { value: '%Y', label: '年' },
    { value: '%Y-%m', label: '月' },
    { value: '%x-%v', label: '周' },
    { value: '%Y-%m-%d', label: '天' },
    { value: '%Y-%m-%d %H', label: '小时' },
    { value: '%Y-%m-%d %H:%i', label: '周分钟' },
  ];

  return <Select defaultValue="%Y-%m-%d" options={options} value={value} onChange={onChange} />;
};

export default DateCurrent;
