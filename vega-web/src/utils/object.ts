/**
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
    } else {
      // 合并属性
      const existingItem = map.get(uniqueKey);
      Object.assign(existingItem, item);
    }
  }
  return Array.from(map.values());
}

export { deduplicateObjects };
