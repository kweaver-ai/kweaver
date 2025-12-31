export function isEmptyExceptZero(value: any): boolean {
  // 1. 处理 undefined/null → 空
  if (value === undefined || value === null) {
    return true;
  }

  // 2. 处理 NaN → 空（注意：NaN !== NaN，需用 isNaN 判断）
  if (Number.isNaN(value)) {
    return true;
  }

  // 3. 处理字符串：空字符串'' → 空；'0'/'  '/其他 → 非空
  if (typeof value === 'string') {
    return value.trim() === '';
  }

  // 4. 处理数字：仅 0 → 非空；其他数字正常判断（如 Infinity 算非空）
  if (typeof value === 'number') {
    return false; // 数字0直接返回false（非空），其他数字也返回false
  }

  // 5. 处理布尔值：false 默认为非空（可选调整）
  if (typeof value === 'boolean') {
    return false;
  }

  // 6. 处理数组：长度为0 → 空
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // 7. 处理纯对象：无自身可枚举属性 → 空（排除 Date/RegExp 等特殊对象）
  if (typeof value === 'object' && value.constructor === Object) {
    return Object.keys(value).length === 0;
  }

  // 8. 其他类型（如 Date/RegExp/函数等）→ 非空
  return false;
}

/**
 * 过滤对象中值为空的字段（空值：null、undefined、空字符串）
 * @param {Object} obj - 源对象
 * @returns {Object} 过滤后的新对象
 */
const filterEmptyFields = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};
  // 遍历对象自身属性（排除原型链属性）
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // 保留非空值（排除 null、undefined、空字符串）
      if (!(value === null || value === undefined || value === '')) {
        result[key] = value;
      }
    }
  }
  return result;
};

export default {
  filterEmptyFields,
};
/*
 * 对象数组根据指定的key属性值去重
 * @param arr 要去重的对象数组
 * @param key 用于去重的属性名
 * @returns 去重后的对象数组
 */
function deduplicateObjects(arr: any[], key: string) {
  const map = new Map();
  for (const item of arr) {
    const uniqueKey = item[key];
    if (!map.has(uniqueKey)) {
      map.set(uniqueKey, item);
    }
  }
  return Array.from(map.values());
}

export { deduplicateObjects };
