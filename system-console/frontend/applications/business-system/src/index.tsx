import './public-path';
import ReactDOM from 'react-dom/client';

import UTILS from './utils';
import '@/styles/reset.less';
import '@/styles/global.less';
import 'react-resizable/css/styles.css';

import { baseConfig } from '@/services/request';
import { prefixCls } from '@/variable';
import App from './pages/router';

/**
 * 项目初始化变量调整位置
 * 1、/public/index.html root的id
 * 2、/src/style/reset.less root的id、antd的table默认滚动条
 * 3、/src/variable 变量
 * 4、package.json 的 name
 */
const originalError = console.error;
console.error = (...args) => {
  if (args[0].includes('Warning: [antd: Menu] `children` is deprecated. Please use `items` instead.') && process.env.NODE_ENV === 'development') {
    return;
  }
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode') && process.env.NODE_ENV === 'development') {
    return; // 阻止输出警告
  }
  originalError(...args);
};

const init = async () => {
  try {
    console.log('aaa');
  } catch (error) {
    console.log('error: ...', error);
  }
};

let root: any;
const render = (props: any) => {
  const container = document.getElementById(`${prefixCls}-root`);
  if (!container) return;

  root = root || ReactDOM.createRoot(container);
  root.render(<App {...props} />);
};

if (!(window as any).__POWERED_BY_QIANKUN__) {
  // 这里是为了本地调试时，有一个session的key做占位用
  if (!UTILS.SessionStorage.get('language')) UTILS.SessionStorage.set('language', 'zh-cn');
  if (!UTILS.SessionStorage.get('token')) UTILS.SessionStorage.set('token', '');
  if (!UTILS.SessionStorage.get('studio.userid', true)) UTILS.SessionStorage.set('studio.userid', '', true);

  baseConfig.lang = UTILS.SessionStorage.get('language') || 'zh-cn';
  baseConfig.token = UTILS.SessionStorage.get('token') || '';
  baseConfig.userid = UTILS.SessionStorage.get('studio.userid', true) || '';

  init().finally(() => {
    render({});
  });
}

export async function bootstrap(props: any) {
  baseConfig.lang = props?.lang;
  baseConfig.token = props?.token?.getToken?.access_token;
  baseConfig.userid = props?.userid;
  baseConfig.refresh = props?.token?.refreshOauth2Token;
  UTILS.SessionStorage.set('language', props?.lang);
  UTILS.SessionStorage.set('token', props?.token?.getToken?.access_token);
}
export async function mount(props: any) {
  await Promise.resolve();
  init().finally(() => {
    render(props);
  });
}
export async function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}
