import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { getHttpBaseUrl, getConfig } from '@/utils/http';

const initMonacoEditor = () => {
  const baseUrl = getHttpBaseUrl();
  const lang = getConfig('lang');
  // 避免向cdn请求资源
  loader.config({
    monaco,
    'vs/nls': {
      availableLanguages: { '*': lang === 'zh-cn' ? 'zh-cn' : lang === 'zh-tw' ? 'zh-tw' : 'en' }, // 国际化
    },
  });

  // 设置codicon字体(codicon字体文件的src，是在css中设置的，子应用不能在css中设置url，会导致路径不正确，所以需要在js中重新设置)
  loadAndApplyCodiconFont(baseUrl);
};

function loadAndApplyCodiconFont(baseUrl: string) {
  // 创建一个新的 FontFace 对象
  const font = new FontFace('codicon', `url(${baseUrl}/operator-web/public/fonts/codicon.ttf)`);

  // 加载字体
  font
    .load()
    .then(() => {
      // 字体加载成功后，将其添加到文档中
      document.fonts.add(font);
    })
    .catch(error => {
      // 处理字体加载失败的情况
      console.error('字体加载失败:', error);
    });
}

export { default as PythonEditor } from './PythonEditor';
export { default as JSONEditor } from './JSONEditor';
export { initMonacoEditor };
