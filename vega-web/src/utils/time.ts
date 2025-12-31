/**
 * 将毫秒数转换为时分秒格式（HH:MM:SS）
 * @param {number} ms 总耗时（毫秒）
 * @returns {string} 格式化后的时分秒字符串
 */
export function formatMsToHMS(ms: number): string {
  // 处理负数情况
  if (ms < 0) {
    return '00:00:00';
  }

  // 转换为总秒数（忽略毫秒部分）
  const totalSeconds = Math.floor(ms / 1000);

  // 计算小时、分钟、秒
  const hours = Math.floor(totalSeconds / 3600);
  const remainingSeconds = totalSeconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  // 补零函数：确保数值为两位数
  const padZero = (num: number) => num.toString().padStart(2, '0');

  // 拼接为 HH:MM:SS 格式
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}
