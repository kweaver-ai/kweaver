import intl from 'react-intl-universal';

import UTILS from '@/utils';
import locales from '@/locales';

// 初始化语言
const language = UTILS.SessionStorage.get('language') || 'zh-cn';
intl.init({ currentLocale: language, locales });

/**
 * 货币类型(美元|元)
 */
export const CURRENCY_TYPE: Record<number, string> = {
  0: '￥',
  1: '$',
};

export const CURRENCY_TEXT: Record<number, string> = {
  1: intl.get('modelQuota.dollar'),
  0: intl.get('modelQuota.yuan'),
};

/**
 * 金额(1-千 2-万 3-亿)
 */
export const PRICE_UNIT: Record<string, number> = {
  1: 1000,
  2: 10000,
  3: 100000000,
  4: 1000000,
  5: 10000000,
};

/**
 * 金额
 */
export const CURRENCY_UNIT: Record<number, any> = {
  1: intl.get('modelQuota.billion'),
  2: intl.get('modelQuota.tenThousand'),
  3: intl.get('modelQuota.yi'),
  4: intl.get('modelQuota.million'),
  5: intl.get('modelQuota.tenMillion'),
};

/**
 * 金额
 * 亿的key变为6，为了让单位按照大小顺序显示，但后端设计时亿的key为3，所以这里要前端换算一下
 */
export const CURRENCY_UNIT_KEY_CHANGE: Record<number, any> = {
  1: intl.get('modelQuota.billion'),
  2: intl.get('modelQuota.tenThousand'),
  4: intl.get('modelQuota.million'),
  5: intl.get('modelQuota.tenMillion'),
  6: intl.get('modelQuota.yi'),
};

/**
 * 单位换算
 */
export const TOKENS_UNIT: Record<string, number> = {
  thousand: 1000,
  million: 1000000,
};

/**
 * 单位换算文本
 */
export const TOKENS_UNIT_TO_TEXT: Record<string, string> = {
  thousand: `/${intl.get('modelQuota.thousand')} tokens`,
  million: `/${intl.get('modelQuota.million')} tokens`,
};
