const K = 1000;
const M = 1000000;

const UNIT = { K, M };

/** 格式化 tokens
 * @param {Number} number
 * @param {String} unit
 */
export const formatTokens = (number: number, unit?: 'K' | 'M'): number => {
  if (!number) return 0;
  if (!unit) unit = 'K';
  const base = UNIT[unit];
  const split = unit === 'K' ? 2 : 4;
  return Number((number / base).toFixed(split));
};
