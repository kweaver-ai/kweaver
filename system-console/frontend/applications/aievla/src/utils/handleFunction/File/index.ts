/**
 * 将blob数据下载到本地
 */
export const downloadFileByBlob = (data: Blob, fileName: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(data);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};
