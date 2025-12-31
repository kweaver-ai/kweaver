// @ts-nocheck
import { Select } from 'antd';
import { getIntl } from '../../CronSelect';

const weekOptions = {
  1: getIntl('SUN'),
  2: getIntl('MON'),
  3: getIntl('TUE'),
  4: getIntl('WED'),
  5: getIntl('THU'),
  6: getIntl('FRI'),
  7: getIntl('SAT'),
};

export { weekOptions as weekOptionsObj };

function WeekSelect(props): JSX.Element {
  return (
    <Select size="small" {...props}>
      {Object.entries(weekOptions).map(([weekCode, weekName]) => {
        return (
          <Select.Option key={weekCode} value={weekCode}>
            {weekName}
          </Select.Option>
        );
      })}
    </Select>
  );
}

export default WeekSelect;
