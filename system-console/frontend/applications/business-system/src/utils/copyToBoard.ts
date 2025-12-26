/**
 * 复制内容到剪贴板
 * @param {String} text 文字内容
 */
const copyToBoard = (text: string) => {
  if (navigator.clipboard) {
    try {
      navigator.clipboard.writeText(text);
    } catch (error) {
      console.log('copyToBoard:', error);
    }
  }

  if (typeof document.execCommand === 'function') {
    try {
      const input = document.createElement('textarea');
      input.style.cssText = 'position: absolute; left: -9999px; z-index: -1;';
      input.setAttribute('readonly', 'readonly');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      if (document.execCommand('copy')) document.execCommand('copy');
      document.body.removeChild(input);
    } catch (error) {}
  } else {
  }
};

export default copyToBoard;
