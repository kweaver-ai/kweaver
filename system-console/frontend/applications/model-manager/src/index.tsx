import './public-path';
import ReactDOM from 'react-dom/client';

import UTILS from './utils';
import '@/styles/reset.less';
import '@/styles/global.less';
import 'react-resizable/css/styles.css';
import { baseConfig } from '@/services/request';
import App from './pages/router';

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

let root: any;
const render = (props: any) => {
  const container = document.getElementById('mf-model-manager-root');
  if (!container) return;

  UTILS.SessionStorage.set('quotaTip', true); //
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

  render({});
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
  render(props);
}
export async function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}
