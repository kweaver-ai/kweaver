/**
 * @description 数字输入框，加单位，可自定义单位选项, 可固定一个单位后缀 (新UI样式)
 * @author Shaonan.yuan
 * @date 2024/05/09
 */
import React, { useRef } from 'react';
import { Select, Space, InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import getLocaleValue from '@/utils/get-locale-value';
import commonStyles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';

export interface CompactValue {
  num?: number;
  unit?: string;
}

export interface UnitOption {
  label: string;
  value: string;
}

interface PropType extends Omit<InputNumberProps, 'value' | 'onChange'> {
  value?: string;
  initValue?: string;
  textBefore?: string;
  textAfter?: string;
  unitOptions?: Array<UnitOption>;
  onChange?: (value?: string) => void;
  unitType?: string;
  maxValue?: { value: number; unit: string };
  afterType?: 'select' | 'input';
  inputAfterWidth?: number;
  inputAfterValue?: string;
}

// 全部存储单位
const storageUnit = [
  { label: 'KB', value: 'kb' },
  { label: 'MB', value: 'mb' },
  { label: 'GB', value: 'gb' },
];

// 全部时间单位
export const timeUnit = [
  { label: getLocaleValue('seconds', { localeZh }, { localeEn }), value: 's' },
  { label: getLocaleValue('mins', { localeZh }, { localeEn }), value: 'm' },
  { label: getLocaleValue('hours', { localeZh }, { localeEn }), value: 'h' },
  { label: getLocaleValue('days', { localeZh }, { localeEn }), value: 'd' },
  { label: getLocaleValue('week', { localeZh }, { localeEn }), value: 'w' },
  { label: getLocaleValue('month', { localeZh }, { localeEn }), value: 'M' },
  { label: getLocaleValue('year', { localeZh }, { localeEn }), value: 'y' },
  ...storageUnit,
];

const TIME_VALUE: [number[], string[]] = [
  [1, 60, 60, 24, 7, 30 / 7],
  ['s', 'm', 'h', 'd', 'w', 'M'],
];

const InputNumberUnit: React.FC<PropType> = (props: PropType): JSX.Element => {
  const {
    unitType = 'tmhd',
    unitOptions,
    textBefore,
    textAfter,
    disabled = false,
    value,
    onChange,
    maxValue,
    initValue,
    afterType = 'select',
    inputAfterValue = 'GiB',
    inputAfterWidth,
    ...other
  } = props;
  // 初始化数值和单位
  const num = useRef<number>();
  const unit = useRef<string>();
  const selOptions = (unitOptions || timeUnit).filter((val) => unitType.includes(val.value)) ?? [];

  // 只有输入框后缀是下拉框才指定默认 单位值
  const defaultUnit = afterType === 'select' ? selOptions[0].value : '';
  const selOptionsValue = afterType === 'select' ? selOptions.map((val) => val.value) : '';

  // 当前值
  const curValue = value || initValue;

  // 首次加载单位不存在，默认第一个
  if (!unit.current) {
    unit.current = defaultUnit;
  }

  // 如果value不为空，对value处理值和单位拆分
  if (curValue && afterType !== 'input' && selOptionsValue.includes(curValue?.slice(-1))) {
    num.current = +curValue?.slice(0, -1);
    unit.current = curValue?.slice(-1);
  }

  if (typeof curValue === 'number' && afterType === 'input') {
    num.current = curValue;
  }

  const handleNumberChange = (v: any) => {
    num.current = v;
    if (afterType === 'input') {
      onChange && onChange(v);

      return;
    }
    if (v === null || v === undefined) {
      onChange && onChange(undefined);

      return;
    }

    onChange && onChange((num.current || 0) + (unit.current || ''));
  };

  const handleUnitChange = (v: any) => {
    unit.current = v;
    if (num.current === null || num.current === undefined) {
      onChange && onChange(undefined);

      return;
    }

    onChange && onChange(num.current + v);
  };

  // 转换时间最大值
  const getTimeMax = (value: any): number | undefined => {
    let index = TIME_VALUE[1].indexOf(value?.unit || '');

    if (index === -1) return undefined;
    const curUnitIndex = TIME_VALUE[1].indexOf(unit.current || '');
    let sum = value?.value || 1;

    while (curUnitIndex < index) {
      sum *= TIME_VALUE[0][index];
      index--;
    }

    while (curUnitIndex > index) {
      sum /= TIME_VALUE[0][index];
      index--;
    }

    return sum;
  };

  const max = unitType?.slice(0, 1) === 't' && afterType !== 'input' && maxValue ? getTimeMax(maxValue) : undefined;

  return (
    <Space.Compact>
      {textBefore ? <span className={commonStyles['text-front-item']}>{textBefore}</span> : null}

      <InputNumber className={commonStyles['input-width']} value={num.current} disabled={disabled} onChange={handleNumberChange} max={max} {...other} />

      {afterType === 'select' && (
        <Select
          value={unit.current}
          disabled={disabled}
          getPopupContainer={(triggerNode): any => triggerNode.parentNode}
          onChange={handleUnitChange}
          popupMatchSelectWidth={false}
        >
          {selOptions.map(({ label, value }) => (
            <Select.Option value={value} key={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      )}
      {afterType === 'input' && (
        <div className={commonStyles['text-read-only']} style={{ width: inputAfterWidth }}>
          {inputAfterValue}
        </div>
      )}
      {textAfter ? <span className={commonStyles['text-after-item']}>{textAfter}</span> : null}
    </Space.Compact>
  );
};

export default InputNumberUnit;
