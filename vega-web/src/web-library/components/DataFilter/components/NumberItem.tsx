import { memo } from 'react';
import { InputNumber } from 'antd';
import getLocaleValue from '../../../utils/get-locale-value';
import styles from '../index.module.less';
import localeEn from '../locale/en-US';
import localeZh from '../locale/zh-CN';
import { Item } from '../type';

const NumberItem = memo(
  ({
    value,
    onChange,
    disabled,
    validateValueError,
  }: {
    value: Item;
    onChange: (item: any) => void;
    validateValueError: (val: any) => void;
    disabled: boolean;
  }) => {
    const handleFromChange = (val: any): void => {
      validateValueError(val);
      onChange({
        ...value,
        value: {
          from: val,
          to: value.value?.to,
        },
      });
    };

    const handleValueChange = (val: any): void => {
      validateValueError(val);
      onChange({ ...value, value: val });
    };

    const handleToChange = (val: any): void => {
      validateValueError(val);
      onChange({
        ...value,
        value: {
          to: val,
          from: value.value?.from,
        },
      });
    };

    return (
      <>
        {value?.operation === 'range' || value?.operation === 'out_range' ? (
          <div className={styles['range-wrapper']}>
            <InputNumber
              value={value?.value?.from}
              onChange={handleFromChange}
              disabled={disabled}
              placeholder={getLocaleValue('pleaseInputValue', { localeZh }, { localeEn })}
            />
            <span className={styles['split-space']}>-</span>
            <InputNumber
              value={value?.value?.to}
              onChange={handleToChange}
              disabled={disabled}
              placeholder={getLocaleValue('pleaseInputValue', { localeZh }, { localeEn })}
            />
          </div>
        ) : (
          <InputNumber
            onChange={handleValueChange}
            value={value?.value}
            disabled={disabled}
            placeholder={getLocaleValue('pleaseInputValue', { localeZh }, { localeEn })}
          />
        )}
      </>
    );
  }
);

export default NumberItem;
