import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { useSetState } from 'ahooks';
import { InputNumber, Select, Space } from 'antd';

export interface TNumFix {
  num?: number;
  fix: 'm' | 'h' | 'd';
}
export const initNumFix: TNumFix = { num: undefined, fix: 'm' };

export const initNumFixHour: TNumFix = { num: undefined, fix: 'h' };

const TracingDuration = (props: any) => {
  const { value, onChange, type, disabled = false } = props;

  const init = type === 'hour' ? initNumFixHour : initNumFix;
  const [numFix, setNumFix] = useSetState<TNumFix>(type === 'hour' ? initNumFixHour : initNumFix);

  useEffect(() => {
    let fix: 'm' | 'h' | 'd' = 'm';

    if (!value) return setNumFix(init);
    if (value.includes('h')) fix = 'h';
    if (value.includes('d')) fix = 'd';
    const curNum = value.split(fix)[0] ?? 0;

    setNumFix({ num: +curNum, fix });
  }, [value]);

  const onNumChange = (field: 'fix' | 'num', val?: any) => {
    setNumFix((oldVal) => {
      const curVal = { ...oldVal, [field]: val };

      if (curVal.num) {
        onChange(curVal.num + curVal.fix);
      } else {
        onChange(undefined);
      }

      return curVal;
    });
  };

  /** 分钟: minuteTime  小时: hourTime  天: day */
  const timeHourTypes = [
    { label: intl.get('Global.unitHour'), value: 'h' },
    { label: intl.get('Global.unitDay'), value: 'd' },
  ];
  const timeTypes = [{ label: intl.get('Global.unitMinute'), value: 'm' }, ...timeHourTypes];
  return (
    <Space>
      <Space.Compact style={{ width: 300 }}>
        <InputNumber
          min={1}
          value={numFix.num}
          disabled={disabled}
          placeholder={intl.get('Global.pleaseInput')}
          style={{ width: '50%' }}
          onChange={(val) => onNumChange('num', val)}
        />
        <Select
          value={numFix.fix}
          disabled={disabled}
          placeholder={intl.get('Global.pleaseSelect')}
          options={type === 'hour' ? timeHourTypes : timeTypes}
          onChange={(val) => onNumChange('fix', val)}
        />
      </Space.Compact>
    </Space>
  );
};

export default TracingDuration;
