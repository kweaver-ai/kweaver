import dayjs from 'dayjs';
import { filter, indexOf } from 'lodash';
import { getCategories } from './categories';

function getDecimalsForValue(value: number): number {
  const log10 = Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  let dec = -log10 + 1;
  const range = Math.pow(10, -dec);
  const norm = value / range; // norm is between 1.0 and 10.0

  // special case for 2.5, requires an extra decimal
  if (norm > 2.25) {
    ++dec;
  }

  if (value % 1 === 0) {
    dec = 0;
  }

  const decimals = Math.max(0, dec);

  return decimals;
}

export function toFixed(value: number, decimals: any): string {
  if (value === null) {
    return '';
  }

  if (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY) {
    return value.toLocaleString();
  }

  if (decimals === null || decimals === undefined) {
    decimals = getDecimalsForValue(value);
  }

  const factor = decimals ? Math.pow(10, Math.max(0, decimals)) : 1;
  const formatted = String(Math.round(value * factor) / factor);

  return formatted;
}

export function toFixedUnit(unit: string, asPrefix?: boolean) {
  return (size: number, decimals: any) => {
    if (size === null) {
      return { text: '' };
    }
    const text = toFixed(size, decimals);
    if (unit) {
      if (asPrefix) {
        return { text, prefix: unit };
      }
      return { text, suffix: ` ${unit}` };
    }
    return { text };
  };
}

export function toFixedScaled(value: number, decimals: any, ext?: string) {
  return { text: toFixed(value, decimals), suffix: ext };
}

export function toPercentUnit(size: number, decimals: any) {
  if (size === null) {
    return { text: '' };
  }
  return { text: toFixed(100 * size, decimals), suffix: '%' };
}

/**
 * @description 自定义单位转换
 * @param {number[]} factorList 单位步长列表
 * @param {string[]} extArray 单位列表
 * @returns {function} 计算单位函数
 */
export function customUnits(factorList: number[], extArray: string[]) {
  return (size: number, decimals: any, curUnit: any, targetUnit: any) => {
    if (size === null) {
      return { text: '' };
    }
    const limit = extArray.length;
    const curUnitValue = ` ${curUnit === 'none' ? ' ' : curUnit}`;
    const curIndex = indexOf(extArray, curUnitValue);

    if (curIndex === -1) {
      return { text: size, suffix: curUnitValue };
    }

    let steps = indexOf(extArray, curUnitValue); // 用于记录当前单位索引

    if (targetUnit !== ' auto') {
      const targetIndex = indexOf(extArray, targetUnit);

      if (targetIndex >= curIndex) {
        while (steps < targetIndex) {
          steps++;
          size /= factorList[steps];
        }
      } else {
        while (steps > targetIndex) {
          size *= factorList[steps];
          steps--;
        }
      }

      return { text: toFixed(size, decimals), suffix: targetUnit };
    }

    while (Math.abs(size) < 1 && size !== 0) {
      if (steps === 0) {
        break;
      }
      size *= factorList[steps];
      steps--;
    }

    while (steps < limit - 1 && Math.abs(size) >= factorList[steps + 1] && size !== 0) {
      steps++;
      size /= factorList[steps];
    }

    return {
      text: toFixed(size, decimals),
      suffix: size === 0 ? curUnitValue : extArray[steps],
    };
  };
}

export function toSeconds(size: number, decimals: any) {
  if (size === null) {
    return { text: '' };
  }

  // If 0, use s unit instead of ns
  if (size === 0) {
    return { text: '0', suffix: ' s' };
  }

  if (Math.abs(size) < 60) {
    return { text: toFixed(size, decimals), suffix: ' s' };
  } else if (Math.abs(size) < 3600) {
    // Less than 1 hour, divide in minutes
    return toFixedScaled(size / 60, decimals, ' m');
  }

  return toFixedScaled(size / 3600, decimals, ' h');
}

export const dateTimeAsIso = (value: any) => ({ text: dayjs(parseInt(value, 10)).format('YYYY-MM-DD HH:mm:ss') });

export type FormattedValue = {
  text: string; // 值+单位
  data: number | null; // 数据值
  suffix: string | null; // 单位中文做了国际化
  originSuffix: string | null; // 原始英文
};

export function formattedValueToString(val: any): FormattedValue {
  return {
    text: `${val.prefix ?? ''}${val.text}${val.suffix ?? ''}`,
    data: Number(val.text),
    suffix: val.suffix,
    originSuffix: val.originSuffix,
  };
}

export const getValueFormat = (id?: string | null) => {
  if (!id) return toFixedUnit('');

  const fmt = filter(getCategories(), { id })[0]?.fn;

  return fmt;
};
