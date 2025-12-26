/** 下载文件\
 * @param fileName - 文件名称
 * @param type - 文件类型
 * @param text - 文件内容
 */
const downloadFile = (fileName: string, type: string, text: string) => {
  const url = window.URL || window.webkitURL || window;
  const blob = new Blob([text]);

  const link: any = document.createElement('a');
  link.href = url.createObjectURL(blob);
  link.download = fileName + '.' + type;
  link.click();

  link.remove();
};

export default downloadFile;
