/*
 * @Description: 转换对象key的结构
 * @Author: Tyrone
 * @Date: 2022-05-13 15:22:32
 */

/**
 * @description 将字段名中带有_下划线的字段替换为驼峰格式：ingest_id => ingestId
 * @param {string} field 要替换的字段
 * @returns {string} 字符串
 */
export const fieldToCamel = (field: string): string => field?.replace(/_[a-z]/g, ($) => $.charAt(1).toUpperCase());

/**
 * @description 将驼峰字段转换为后端需要的下划线格式： ingestIdName => injest_id_name
 * @param {string} field 要替换的字段
 * @returns {string} 字符串
 */
export const formatCamelToLine = (field: string): string => field.replace(/[A-Z]/g, ($) => `_${$.toLowerCase()}`);

/**
 * @description 将对象中的key替换为驼峰格式
 * @param {object} data 要替换的对象
 * @returns {object} 转换后的对象
 */
const formatKeyOfObjectToCamel = (data: { [key: string]: any }): { [key: string]: any } => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  let res: any = {};

  if (data instanceof Array) {
    res = [];
  }

  for (const key in data) {
    if (data[key] !== undefined) {
      const camelKey = fieldToCamel(key); // 替换

      res[camelKey] = formatKeyOfObjectToCamel(data[key]);
    }
  }

  return res;
};

/**
 * @description 将对象中的驼峰key替换成后端需要的下划线key
 * @param {object} data 转换的对象
 * @returns {object} 对象
 */
const formatKeyOfObjectToLine = (data: { [key: string]: any }): { [key: string]: any } => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  let res: any = {};

  if (data instanceof Array) {
    res = [];
  }

  for (const key in data) {
    if (data[key] !== undefined) {
      const underlineKey = formatCamelToLine(key); // 替换

      res[underlineKey] = formatKeyOfObjectToLine(data[key]);
    }
  }

  return res;
};

export { formatKeyOfObjectToCamel, formatKeyOfObjectToLine };
