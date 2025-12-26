/**
 * 复制内容到剪贴板保留复制内容的格式
 * @param {String} str 文字内容
 */
const copyToBoardArea = (str: string) => {
  try {
    const input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = str;
    input.select();
    const isSuccess = document.execCommand('copy');
    document.body.removeChild(input);

    return isSuccess;
  } catch (_error) {
    return false;
  }
};

export default copyToBoardArea;
