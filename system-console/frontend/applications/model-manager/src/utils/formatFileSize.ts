/**
 * 格式化文件大小
 * @param {Number} size
 * @return 1B, 1KB, 1MB, 1GB
 */
const formatFileSize = (size: number) => {
  if (typeof size !== 'number' || size === 0 || !size) return null;

  if (size < 1024) return `${size} B`;

  const sizeKB = Math.floor(size / 1024);
  if (sizeKB < 1024) return `${sizeKB} KB`;

  const sizeMB = Math.floor(sizeKB / 1024);
  if (sizeMB < 1024) return `${sizeMB} MB`;

  const sizeGB = Math.floor(sizeMB / 1024);
  return `${sizeGB} GB`;
};

export default formatFileSize;
