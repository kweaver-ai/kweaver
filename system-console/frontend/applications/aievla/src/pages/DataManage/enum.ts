import _ from 'lodash';
import locales from '@/locales';
import intl from 'react-intl-universal';
import { adCookie } from '@/utils/handleFunction';

const language = adCookie.get('anyDataLang') || 'zh-CN';
intl.init({ locales, currentLocale: language, warningHandler: () => '' });

export const CHECK = 'check';
export const CREATE = 'create';
export const EDIT = 'edit';
export const EDIT_FORM = 'editForm';

export type operationType = typeof CHECK | typeof CREATE | typeof EDIT | typeof EDIT_FORM;

import HELPER from '@/utils/helper';
import { getParam } from '@/utils/handleFunction';

export type DataSetItem = {
  id: string;
  name: string;
  description: string;
  color: string;
  size: number;
  create_user: string;
  create_time: string | number;
  update_user: string;
  update_time: string | number;
};

export const PAGE_SIZE = 10;

export const DESCEND = 'descend' as const;
export const ASCEND = 'ascend' as const;
export const sorter2sorter = (key: string) =>
  ({
    desc: 'descend',
    asc: 'ascend',
    ascend: 'asc',
    descend: 'desc',
  })[key] || key;

export const DATASET_STATE = {
  loading: false,
  page: 1,
  total: 0,
  searchTotal: 0,
  name: '',
};

export type DataSetState = typeof DATASET_STATE;

/**
 * 从路由获取
 */
export const getRememberParams = (data: DataSetItem) => {
  const _dataSet = data.id || getParam('_dataSet');
  const action = getParam('action');
  return HELPER.formatQueryString({ _dataSet, action });
};

/** 中英文数字及键盘上的特殊字符 */
const ONLY_KEYBOARD = /^[\s\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；。……：“”‘’（）｛｝《》【】～￥—· ]+$/;
// const ONLY_KEYBOARD = /[\s\u4e00-\u9fa5a-zA-Z0-9!-~？！，、；。……：“”‘’（）｛｝《》【】～￥—·]+$/;
/** 中英文数字及下划线 */
const ONLY_NORMAL_NAME = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/g;
/** 数据集-文件-文件夹-排除指定特殊字符 */
const ONLY_VALID_NAME = /^[^/\\\\:*?"<>|]+$/;
const ONLY_VALID_NAME_LEN = /^(?!.*[/\\:*?"<>|])(.{1,255})$/;

export { ONLY_KEYBOARD, ONLY_NORMAL_NAME, ONLY_VALID_NAME, ONLY_VALID_NAME_LEN };

export const DATASET_OUTPUT_PERMISSION = {
  all: 1,
  mine: 0,
};

export type formField = {
  name: string;
  description: string;
  permission: string;
  color: string;
};

export const UPLOAD_FILES_TYPE = '.json,.csv,.txt,.parquet,.jsonl';

export const charMap: Record<string, string> = {
  ',': intl.get('dataSet.comma'),
  ';': intl.get('dataSet.semicolon'),
  '\t': intl.get('dataSet.tabKey'),
  ' ': intl.get('dataSet.space'),
};

/**
 * 处理内置的分隔符
 * @param charMap
 * @param char
 * @returns
 */
export function charToString(charMap: Record<string, string>, char: string) {
  const preSetKeys = _.keys(charMap);
  if (preSetKeys.includes(char)) {
    return chatMapString(char);
    // return charMap[char];
  }
  return char;
}

export const chatMapString = (item: string) => {
  if (item === ',') {
    return intl.get('dataSet.comma');
  }
  if (item === ';') {
    return intl.get('dataSet.semicolon');
  }
  if (item === '\t') {
    return intl.get('dataSet.tabKey');
  }
  if (item === ' ') {
    return intl.get('dataSet.space');
  }
};
