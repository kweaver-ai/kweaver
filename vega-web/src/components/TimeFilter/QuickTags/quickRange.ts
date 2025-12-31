import dayjs from 'dayjs';

// 构造快速选择的时间
const quickRange = [
  {
    section: 'section1',
    span: 8,
    list: [
      { label: 'last5Minutes', value: [dayjs().subtract(5, 'm'), dayjs()], timeInterval: 5, timeUnit: 'm' },
      { label: 'last15Minutes', value: [dayjs().subtract(15, 'm'), dayjs()], timeInterval: 15, timeUnit: 'm' },
      { label: 'last30Minutes', value: [dayjs().subtract(30, 'm'), dayjs()], timeInterval: 30, timeUnit: 'm' },
      { label: 'last1Hour', value: [dayjs().subtract(1, 'h'), dayjs()], timeInterval: 1, timeUnit: 'h' },
      { label: 'last4Hours', value: [dayjs().subtract(4, 'h'), dayjs()], timeInterval: 4, timeUnit: 'h' },
      { label: 'last6Hours', value: [dayjs().subtract(6, 'h'), dayjs()], timeInterval: 6, timeUnit: 'h' },
      { label: 'last12Hours', value: [dayjs().subtract(12, 'h'), dayjs()], timeInterval: 12, timeUnit: 'h' },
      { label: 'last24Hours', value: [dayjs().subtract(24, 'h'), dayjs()], timeInterval: 24, timeUnit: 'h' },
    ],
  },
  {
    section: 'section2',
    span: 8,
    list: [
      { label: 'last3Days', value: [dayjs().subtract(3, 'd'), dayjs()], timeInterval: 3, timeUnit: 'd' },
      { label: 'last7Days', value: [dayjs().subtract(7, 'd'), dayjs()], timeInterval: 7, timeUnit: 'd' },
      { label: 'last15Days', value: [dayjs().subtract(15, 'd'), dayjs()], timeInterval: 15, timeUnit: 'd' },
      { label: 'last1Month', value: [dayjs().subtract(1, 'M'), dayjs()], timeInterval: 1, timeUnit: 'M' },
      { label: 'last3Month', value: [dayjs().subtract(3, 'M'), dayjs()], timeInterval: 3, timeUnit: 'M' },
      { label: 'last6Month', value: [dayjs().subtract(6, 'M'), dayjs()], timeInterval: 6, timeUnit: 'M' },
      { label: 'last1Year', value: [dayjs().subtract(1, 'y'), dayjs()], timeInterval: 1, timeUnit: 'Y' },
      { label: 'last5Years', value: [dayjs().subtract(5, 'y'), dayjs()], timeInterval: 5, timeUnit: 'Y' },
    ],
  },
  {
    section: 'section3',
    span: 8,
    list: [
      { label: 'today', value: [dayjs().startOf('d'), dayjs().endOf('d')], timeInterval: 'now', timeUnit: 'd' },
      { label: 'yesterday', value: [dayjs().subtract(1, 'd').startOf('d'), dayjs().subtract(1, 'd').endOf('d')], timeInterval: 'last', timeUnit: 'd' },
      { label: 'thisWeek', value: [dayjs().startOf('w'), dayjs().endOf('w')], timeInterval: 'now', timeUnit: 'W' },
      { label: 'lastWeek', value: [dayjs().subtract(1, 'w').startOf('w'), dayjs().subtract(1, 'w').endOf('w')], timeInterval: 'last', timeUnit: 'W' },
      { label: 'thisMonth', value: [dayjs().startOf('M'), dayjs().endOf('M')], timeInterval: 'now', timeUnit: 'M' },
      { label: 'lastMonth', value: [dayjs().subtract(1, 'M').startOf('M'), dayjs().subtract(1, 'M').endOf('M')], timeInterval: 'last', timeUnit: 'M' },
      { label: 'thisYear', value: [dayjs().startOf('y'), dayjs().endOf('y')], timeInterval: 'now', timeUnit: 'Y' },
      { label: 'lastYear', value: [dayjs().subtract(1, 'y').startOf('y'), dayjs().subtract(1, 'y').endOf('y')], timeInterval: 'last', timeUnit: 'Y' },
    ],
  },
];

export default quickRange;
