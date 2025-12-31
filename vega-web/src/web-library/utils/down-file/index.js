/**
 * @description 导出文件
 * @param {*} content 文件内容
 * @param {*} name 文件名字
 * @param {*} type 文件类型 txt json csv
 *
 * @author tian.yuanfeng
 * @date 2019.03.13
 * @version 3.0.7
 */

export default function (content, name, type) {
  let blob;

  // 指定下载的文件类型
  switch (type) {
    case 'json':
      blob = new Blob([content]);
      break;
    default:
      blob = content;
  }
  if (window.navigator.msSaveOrOpenBlob) {
    navigator.msSaveBlob(blob, `${name}.${type}`);
  } else {
    const link = document.createElement('a');

    link.href = window.URL.createObjectURL(blob);
    link.download = `${name}.${type}`;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}
