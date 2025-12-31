import { defaultsDeep } from 'lodash';
import { getIntl } from '../CronSelect';
import type { BaseDetailConfig, CronProps, Options } from './types';

/**
 * Cron表达式验证器
 * cron表达式由6个字段组成：秒、分、时、日、月、周（可选年）
 * 每个字段可以包含特定值、范围('-')、列表(',')、间隔('/')或通配符('*')
 * 这个验证器提供了一系列正则表达式，用于验证cron表达式的不同字段
 */
export enum CronFieldName {
  /** 秒 */
  SECOND = 'second',
  /** 分 */
  MINUTE = 'minute',
  /** 时 */
  HOUR = 'hour',
  /** 日 */
  DAY = 'day',
  /** 月 */
  MONTH = 'month',
  /** 周 */
  WEEK = 'week',
  /** （可选年） */
  YEAR = 'year',
}

type CronPatternDictionary = {
  [key in CronFieldName]: RegExp;
};

const cronRegexPatterns: CronPatternDictionary = {
  [CronFieldName.SECOND]: /^\*$|^\?$|(^([0-9]|[1-5][0-9])-([0-9]|[1-5][0-9])$)|(^([0-9]|[1-5][0-9])\/\d+$)|(^(([0-9]|[1-5][0-9]),)*([0-9]|[1-5][0-9])$)/,
  [CronFieldName.MINUTE]: /^\*$|^\?$|(^([0-9]|[1-5][0-9])-([0-9]|[1-5][0-9])$)|(^([0-9]|[1-5][0-9])\/\d+$)|(^(([0-9]|[1-5][0-9]),)*([0-9]|[1-5][0-9])$)/,
  [CronFieldName.HOUR]:
    /(^\*$)|^\?$|(^([0-9]|(1[0-9])|(2[0-3]))-([0-9]|(1[0-9])|(2[0-3]))$)|(^([0-9]|(1[0-9])|(2[0-3]))\/\d+$)|(^(([0-9]|(1[0-9])|(2[0-3])),)*([0-9]|(1[0-9])|(2[0-3]))$)/,
  [CronFieldName.DAY]:
    /^\*$|^\?$|(^([1-9]|[1-2][0-9]|3[0-1])-([1-9]|[1-2][0-9]|3[0-1])$)|(^([1-9]|[1-2][0-9]|3[0-1])\/\d+$)|(^(([1-9]|[1-2][0-9]|3[0-1]),)*([1-9]|[1-2][0-9]|3[0-1])$)/,
  [CronFieldName.MONTH]: /^\*$|(^([1-9]|1[0-2])-([1-9]|1[0-2])$)|(^([1-9]|1[0-2])\/\d+$)|(^(([1-9]|1[0-2]),)*([1-9]|1[0-2])$)/,
  [CronFieldName.WEEK]: /^\*$|^\?$|(^([1-7])-([1-7])$)|(^([1-7])#\d+$)|(^([1-7])L$)|(^(([1-7]),)*([1-7])$)/,
  [CronFieldName.YEAR]: /^\*$|^\?$|^((\d{4,4})(,?))+$|(^(\d{4,})(-|\/)(\d{4,}|\d{1,2}|)+$)/,
};

/**
 * 验证cron表达式字段
 * @param {string} value 需要验证的值
 * @param {CronFieldName} fieldName 字段名称（second, minute, hour, day, month, week, year）
 * @returns {boolean} 验证结果
 */
export function validateCronField(value: string, fieldName: CronFieldName): boolean {
  const regex = cronRegexPatterns[fieldName];

  if (!regex) {
    throw new Error(`未知的字段名称: ${fieldName}`);
  }

  return regex.test(value);
}

const baseDetailConfig: BaseDetailConfig = {
  visible: true,
  disabled: false,
  tooltip: '',
};

export const defaultValue: Options = {
  defaultTab: CronFieldName.MINUTE,
  minYear: 2000,
  maxYear: 2100,
  panelTitle: getIntl('pleaseSelect'),
  showPreviewValue: true,
  panesShow: {
    [CronFieldName.SECOND]: true,
    [CronFieldName.MINUTE]: true,
    [CronFieldName.HOUR]: true,
    [CronFieldName.DAY]: true,
    [CronFieldName.MONTH]: true,
    [CronFieldName.WEEK]: true,
    [CronFieldName.YEAR]: false,
  },
  panesDetailsOptions: {
    [CronFieldName.SECOND]: baseDetailConfig,
    [CronFieldName.MINUTE]: baseDetailConfig,
    [CronFieldName.HOUR]: baseDetailConfig,
    [CronFieldName.DAY]: baseDetailConfig,
    [CronFieldName.MONTH]: baseDetailConfig,
    [CronFieldName.WEEK]: baseDetailConfig,
    [CronFieldName.YEAR]: baseDetailConfig,
  },
  showFooter: true,
  onOkBtnProps: {},
};

/**
 * 获取 options 配置（带默认值）
 */
export const getOptionsWithDefaultValue = (options: CronProps['options']): Options => defaultsDeep(options, defaultValue);
