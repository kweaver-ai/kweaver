/** 时间过滤器组件，用于全局筛选过滤数据 */
import { Tabs, Dropdown, TabsProps } from 'antd';
import dayjs from 'dayjs';
import DateRange from './DateRange';
import QuickTags from './QuickTags';

const TimeFilter = (props: any) => {
  const { placement, timeRange = { label: '最近24小时', value: [dayjs().subtract(24, 'h'), dayjs()] }, onFilterChange, children } = props;

  const items: TabsProps['items'] = [
    { key: 'quickSelect', label: '快速选择', children: <QuickTags timeRange={timeRange} onFilterChange={onFilterChange} /> },
    { key: 'dateRange', label: '时间段选择', children: <DateRange timeRange={timeRange} onFilterChange={onFilterChange} /> },
  ];

  const isQuickSelect = timeRange.label.indexOf('-') < 0;

  return (
    <Dropdown
      trigger={['click']}
      destroyOnHidden
      placement={placement || 'bottomLeft'}
      popupRender={() => (
        <div className="g-dropdown-menu-root" style={{ width: 450 }}>
          <Tabs size="small" defaultActiveKey={isQuickSelect ? 'quickSelect' : 'dateRange'} items={items}></Tabs>
        </div>
      )}
    >
      {children}
    </Dropdown>
  );
};

export default TimeFilter;
